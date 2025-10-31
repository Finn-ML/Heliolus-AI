/**
 * Weighted Scoring Service
 * Calculates assessment scores using evidence tier multipliers and two-level weighting
 */

import { BaseService } from './base.service.js';
import { getMultiplier, getBestTier, EvidenceTier } from '../scoring/tier-multiplier.js';
import { requireValidWeights, sumWeights } from '../scoring/weight-calculator.js';
import { weightedSum, scaleScore } from '../scoring/score-aggregator.js';

// Type definitions for scoring results
export interface QuestionScore {
  answerId: string;
  questionId: string;
  rawQualityScore: number;
  evidenceTier: EvidenceTier;
  tierMultiplier: number;
  finalScore: number;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  score: number; // 0-5 scale
  scaledScore: number; // 0-100 scale
  questionScores: QuestionScore[];
  totalWeight: number;
}

export interface OverallScore {
  assessmentId: string;
  overallScore: number; // 0-100 scale
  riskBand: 'Low' | 'Medium' | 'High' | 'Critical';
  methodology: string;
  sectionScores: SectionScore[];
  calculatedAt: Date;
}

export type RiskBand = 'Low' | 'Medium' | 'High' | 'Critical';

export class WeightedScoringService extends BaseService {
  /**
   * Calculate the score for a single question based on answer and evidence
   * @param answerId - The ID of the answer to score
   * @returns Question score details
   */
  async calculateQuestionScore(answerId: string): Promise<QuestionScore> {
    try {
      // Fetch answer with related documents
      const answer = await this.prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          question: true,
          linkedDocuments: true,
        },
      });

      if (!answer) {
        throw this.createError('Answer not found', 404, 'ANSWER_NOT_FOUND');
      }

      // Extract evidence tiers from linked documents
      const evidenceTiers = answer.linkedDocuments
        .map(ld => ld.evidenceTier)
        .filter(tier => tier !== null) as string[];

      // Determine best evidence tier (highest quality)
      const bestTier = getBestTier(evidenceTiers);
      const tierMultiplier = getMultiplier(bestTier);

      // Get raw quality score (0-5 scale from AI)
      // If no score yet, treat as 0 (unanswered)
      const rawQualityScore = answer.rawQualityScore ?? 0;

      // Calculate final score with tier multiplier applied
      const finalScore = rawQualityScore * tierMultiplier;

      // Update answer record with calculated values
      await this.prisma.answer.update({
        where: { id: answerId },
        data: {
          evidenceTier: bestTier,
          tierMultiplier,
          finalScore,
        },
      });

      return {
        answerId: answer.id,
        questionId: answer.questionId,
        rawQualityScore,
        evidenceTier: bestTier,
        tierMultiplier,
        finalScore,
      };
    } catch (error) {
      this.logger.error('Error calculating question score', { answerId, error });
      throw error;
    }
  }

  /**
   * Calculate the score for a section based on weighted question scores
   * @param sectionId - The ID of the section
   * @param assessmentId - The ID of the assessment
   * @returns Section score details
   */
  async calculateSectionScore(sectionId: string, assessmentId: string): Promise<SectionScore> {
    try {
      // Fetch section with questions
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!section) {
        throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
      }

      // Handle empty section edge case
      if (section.questions.length === 0) {
        this.logger.warn('Empty section encountered', { sectionId, sectionTitle: section.title });
        return {
          sectionId,
          sectionName: section.title,
          score: 0,
          scaledScore: 0,
          questionScores: [],
          totalWeight: 0,
        };
      }

      // Validate question weights sum to 1.0
      const weights = section.questions.map(q => q.weight);
      requireValidWeights(weights, `Question weights in section "${section.title}"`);

      // Fetch all answers for this section's questions in this assessment
      const answers = await this.prisma.answer.findMany({
        where: {
          assessmentId,
          questionId: {
            in: section.questions.map(q => q.id),
          },
        },
        include: {
          linkedDocuments: true,
        },
      });

      // Calculate question scores
      const questionScores: QuestionScore[] = [];
      for (const question of section.questions) {
        const answer = answers.find(a => a.questionId === question.id);

        if (answer) {
          // Answer exists, calculate its score
          const questionScore = await this.calculateQuestionScore(answer.id);
          questionScores.push(questionScore);
        } else {
          // No answer for this question, treat as 0 with TIER_0
          questionScores.push({
            answerId: '', // No answer ID
            questionId: question.id,
            rawQualityScore: 0,
            evidenceTier: EvidenceTier.TIER_0,
            tierMultiplier: 0.6,
            finalScore: 0,
          });
        }
      }

      // Calculate weighted sum: Σ(finalScore × questionWeight)
      const finalScores = questionScores.map(qs => qs.finalScore);
      const score = weightedSum(finalScores, weights);

      // Scale to 0-100
      const scaledScore = scaleScore(score, 0, 5, 0, 100);

      return {
        sectionId,
        sectionName: section.title,
        score,
        scaledScore,
        questionScores,
        totalWeight: sumWeights(weights),
      };
    } catch (error) {
      this.logger.error('Error calculating section score', { sectionId, assessmentId, error });
      throw error;
    }
  }

  /**
   * Calculate the overall assessment score based on weighted section scores
   * @param assessmentId - The ID of the assessment
   * @returns Overall score details with risk band
   */
  async calculateOverallScore(assessmentId: string): Promise<OverallScore> {
    try {
      const startTime = Date.now();

      // Fetch assessment with template and all related data in one query
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          template: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      if (!assessment.template) {
        throw this.createError('Assessment template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      const sections = assessment.template.sections;

      // Handle edge case: no sections
      if (sections.length === 0) {
        this.logger.warn('Assessment has no sections', { assessmentId });
        return {
          assessmentId,
          overallScore: 0,
          riskBand: 'Critical',
          methodology: 'complete',
          sectionScores: [],
          calculatedAt: new Date(),
        };
      }

      // Validate section weights sum to 1.0
      const sectionWeights = sections.map(s => s.weight);
      requireValidWeights(sectionWeights, `Section weights in template "${assessment.template.name}"`);

      // Calculate score for each section
      const sectionScores: SectionScore[] = [];
      for (const section of sections) {
        const sectionScore = await this.calculateSectionScore(section.id, assessmentId);
        sectionScores.push(sectionScore);
      }

      // Calculate weighted overall score: Σ(sectionScore × sectionWeight)
      const sectionScoreValues = sectionScores.map(ss => ss.score);
      const weightedScore = weightedSum(sectionScoreValues, sectionWeights);

      // Scale to 0-100 range
      const overallScore = scaleScore(weightedScore, 0, 5, 0, 100);

      // Determine risk band
      const riskBand = this.determineRiskBand(overallScore);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      this.logger.info('Overall score calculated', {
        assessmentId,
        overallScore,
        riskBand,
        executionTime: `${executionTime}ms`,
        sectionCount: sections.length,
      });

      return {
        assessmentId,
        overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
        riskBand,
        methodology: 'complete',
        sectionScores,
        calculatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error calculating overall score', { assessmentId, error });
      throw error;
    }
  }

  /**
   * Determine risk band based on overall score
   * @param score - Overall score (0-100)
   * @returns Risk band classification
   */
  private determineRiskBand(score: number): RiskBand {
    if (score >= 80) {
      return 'Low';
    } else if (score >= 60) {
      return 'Medium';
    } else if (score >= 40) {
      return 'High';
    } else {
      return 'Critical';
    }
  }
}
