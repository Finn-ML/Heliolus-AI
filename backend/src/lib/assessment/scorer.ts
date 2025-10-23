/**
 * Risk scoring and calculation engine
 */

import {
  ScoreCalculator as IScoreCalculator,
  ComplianceGap,
  RiskItem,
  ScoringConfig,
  ScoringWeights,
  ScoringThresholds
} from './types.js';
import { RiskCategory, Severity, RiskLevel } from '../../types/database.js';
import { ASSESSMENT_CONFIG } from './index.js';

/**
 * Advanced scoring and risk calculation engine
 */
export class ScoreCalculator implements IScoreCalculator {
  /**
   * Calculate overall risk score from gaps and risks
   */
  calculateOverallScore(
    gaps: ComplianceGap[],
    risks: RiskItem[],
    config: ScoringConfig = ASSESSMENT_CONFIG.scoring
  ): number {
    if (gaps.length === 0 && risks.length === 0) {
      return 0; // No data to score
    }

    const weights = config.weights;
    
    // Calculate component scores
    const complianceScore = this.calculateComplianceScore(gaps);
    const riskScore = this.calculateRiskScore(risks);
    const maturityScore = this.calculateMaturityScore(gaps, risks);
    const documentationScore = this.calculateDocumentationScore(gaps);

    // Apply weights
    const weightedScore =
      (complianceScore * weights.compliance) +
      (riskScore * weights.risk) +
      (maturityScore * weights.maturity) +
      (documentationScore * weights.documentation);

    // Normalize to 0-100 scale
    return Math.round(Math.min(100, Math.max(0, weightedScore)));
  }

  /**
   * Calculate category-specific scores
   */
  calculateCategoryScores(
    gaps: ComplianceGap[],
    risks: RiskItem[]
  ): Record<RiskCategory, number> {
    const categoryScores: Record<RiskCategory, number> = {
      [RiskCategory.GEOGRAPHIC]: 0,
      [RiskCategory.TRANSACTION]: 0,
      [RiskCategory.GOVERNANCE]: 0,
      [RiskCategory.OPERATIONAL]: 0,
      [RiskCategory.REGULATORY]: 0,
      [RiskCategory.REPUTATIONAL]: 0
    };

    // Score based on risks in each category
    for (const category of Object.values(RiskCategory)) {
      const categoryRisks = risks.filter(risk => risk.category === category);
      const categoryGaps = gaps.filter(gap => 
        this.mapGapCategoryToRiskCategory(gap.category) === category
      );

      if (categoryRisks.length === 0 && categoryGaps.length === 0) {
        categoryScores[category] = 50; // Neutral score for no data
        continue;
      }

      const riskScore = this.calculateCategoryRiskScore(categoryRisks);
      const gapScore = this.calculateCategoryGapScore(categoryGaps);
      
      // Combine risk and gap scores (weighted average)
      const totalItems = categoryRisks.length + categoryGaps.length;
      const weightedScore = (
        (riskScore * categoryRisks.length) +
        (gapScore * categoryGaps.length)
      ) / totalItems;

      categoryScores[category] = Math.round(weightedScore);
    }

    return categoryScores;
  }

  /**
   * Calculate compliance score based on gaps
   */
  private calculateComplianceScore(gaps: ComplianceGap[]): number {
    if (gaps.length === 0) return 85; // Good score if no gaps identified

    const severityWeights = {
      'CRITICAL': 25,
      'HIGH': 15,
      'MEDIUM': 8,
      'LOW': 3
    };

    // Calculate total impact of gaps
    const totalImpact = gaps.reduce((sum, gap) => {
      const weight = severityWeights[gap.severity as keyof typeof severityWeights] || 5;
      // FIX: If gapSize not set, assume 100 (full gap) instead of 0 (no gap)
      // This prevents gaps from having zero impact when gapSize is undefined/null
      const gapSize = gap.gapSize ?? 100; // Default to 100 if not set
      const gapFactor = gapSize / 100;
      return sum + (weight * gapFactor);
    }, 0);

    // Convert to score (lower impact = higher score)
    const maxPossibleImpact = gaps.length * 25; // Assuming all critical with max gap size
    const impactRatio = Math.min(1, totalImpact / maxPossibleImpact);

    return Math.round(100 - (impactRatio * 100));
  }

  /**
   * Calculate risk score based on identified risks
   */
  private calculateRiskScore(risks: RiskItem[]): number {
    if (risks.length === 0) return 75; // Good score if no major risks identified

    const riskLevelWeights = {
      'CRITICAL': 25,
      'HIGH': 15,
      'MEDIUM': 8,
      'LOW': 3
    };

    const likelihoodMultipliers = {
      'CERTAIN': 1.0,
      'LIKELY': 0.8,
      'POSSIBLE': 0.6,
      'UNLIKELY': 0.4,
      'RARE': 0.2
    };

    const impactMultipliers = {
      'CATASTROPHIC': 1.0,
      'MAJOR': 0.8,
      'MODERATE': 0.6,
      'MINOR': 0.4,
      'NEGLIGIBLE': 0.2
    };

    // Calculate weighted risk impact
    const totalRiskImpact = risks.reduce((sum, risk) => {
      const baseWeight = riskLevelWeights[risk.riskLevel as keyof typeof riskLevelWeights] || 5;
      const likelihoodMultiplier = likelihoodMultipliers[risk.likelihood as keyof typeof likelihoodMultipliers] || 0.6;
      const impactMultiplier = impactMultipliers[risk.impact as keyof typeof impactMultipliers] || 0.6;

      // Apply control effectiveness to reduce impact
      const controlReduction = (risk.controlEffectiveness || 0) / 100;
      const effectiveImpact = baseWeight * likelihoodMultiplier * impactMultiplier * (1 - controlReduction);

      return sum + effectiveImpact;
    }, 0);

    // Convert to score
    const maxPossibleImpact = risks.length * 25; // Assuming all critical with max likelihood/impact
    const impactRatio = Math.min(1, totalRiskImpact / maxPossibleImpact);

    return Math.round(100 - (impactRatio * 100));
  }

  /**
   * Calculate maturity score based on gaps and risks
   */
  private calculateMaturityScore(gaps: ComplianceGap[], risks: RiskItem[]): number {
    // Maturity score based on:
    // 1. Number of processes documented (inferred from gaps)
    // 2. Control effectiveness (from risks)
    // 3. Gap severity distribution
    // 4. Risk management maturity indicators

    let maturityScore = 50; // Base maturity score

    // Process documentation indicator
    const documentationGaps = gaps.filter(gap => 
      gap.category.toLowerCase().includes('documentation') ||
      gap.category.toLowerCase().includes('process') ||
      gap.description.toLowerCase().includes('documented')
    );
    
    if (documentationGaps.length === 0) {
      maturityScore += 15; // Good documentation maturity
    } else if (documentationGaps.length < 3) {
      maturityScore += 8; // Moderate documentation maturity
    } // Else no bonus for poor documentation

    // Control effectiveness indicator
    const avgControlEffectiveness = risks.length > 0
      ? risks.reduce((sum, risk) => sum + (risk.controlEffectiveness || 0), 0) / risks.length
      : 70; // Assume moderate if no risks identified

    maturityScore += Math.round((avgControlEffectiveness - 50) / 5); // Scale to +/- 10 points

    // Gap severity distribution (mature organizations have fewer critical gaps)
    const criticalGaps = gaps.filter(gap => gap.severity === 'CRITICAL').length;
    if (criticalGaps === 0) {
      maturityScore += 10;
    } else if (criticalGaps <= 2) {
      maturityScore += 5;
    } else {
      maturityScore -= 10;
    }

    // Risk management maturity (based on risk categories covered)
    const uniqueRiskCategories = new Set(risks.map(risk => risk.category));
    if (uniqueRiskCategories.size >= 4) {
      maturityScore += 10; // Good risk identification across categories
    } else if (uniqueRiskCategories.size >= 2) {
      maturityScore += 5;
    }

    return Math.round(Math.min(100, Math.max(0, maturityScore)));
  }

  /**
   * Calculate documentation score
   */
  private calculateDocumentationScore(gaps: ComplianceGap[]): number {
    const documentationGaps = gaps.filter(gap =>
      gap.category.toLowerCase().includes('documentation') ||
      gap.title.toLowerCase().includes('policy') ||
      gap.title.toLowerCase().includes('procedure') ||
      gap.description.toLowerCase().includes('documented')
    );

    if (documentationGaps.length === 0) {
      return 85; // Good documentation score
    }

    // Score based on severity of documentation gaps
    const severityImpact = documentationGaps.reduce((sum, gap) => {
      const severityWeights = { 'CRITICAL': 20, 'HIGH': 12, 'MEDIUM': 6, 'LOW': 2 };
      return sum + (severityWeights[gap.severity as keyof typeof severityWeights] || 6);
    }, 0);

    const maxImpact = documentationGaps.length * 20;
    const impactRatio = severityImpact / maxImpact;

    return Math.round(100 - (impactRatio * 100));
  }

  /**
   * Calculate risk score for a specific category
   */
  private calculateCategoryRiskScore(risks: RiskItem[]): number {
    if (risks.length === 0) return 75; // Good score for no risks

    const riskLevelWeights = {
      'CRITICAL': 100,
      'HIGH': 75,
      'MEDIUM': 50,
      'LOW': 25
    };

    const totalWeight = risks.reduce((sum, risk) => {
      const weight = riskLevelWeights[risk.riskLevel as keyof typeof riskLevelWeights] || 50;
      const controlReduction = (risk.controlEffectiveness || 0) / 100;
      return sum + (weight * (1 - controlReduction));
    }, 0);

    const avgRiskWeight = totalWeight / risks.length;
    return Math.round(100 - avgRiskWeight);
  }

  /**
   * Calculate gap score for a specific category
   */
  private calculateCategoryGapScore(gaps: ComplianceGap[]): number {
    if (gaps.length === 0) return 80; // Good score for no gaps

    const severityWeights = {
      'CRITICAL': 100,
      'HIGH': 75,
      'MEDIUM': 50,
      'LOW': 25
    };

    const totalWeight = gaps.reduce((sum, gap) => {
      const weight = severityWeights[gap.severity as keyof typeof severityWeights] || 50;
      // FIX: If gapSize not set, assume 100 (full gap) instead of 0
      const gapSize = gap.gapSize ?? 100;
      const gapFactor = gapSize / 100;
      return sum + (weight * gapFactor);
    }, 0);

    const avgGapWeight = totalWeight / gaps.length;
    return Math.round(100 - avgGapWeight);
  }

  /**
   * Map gap category to risk category
   */
  private mapGapCategoryToRiskCategory(category: string): RiskCategory {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('governance')) return RiskCategory.GOVERNANCE;
    if (categoryLower.includes('regulatory') || categoryLower.includes('compliance')) return RiskCategory.REGULATORY;
    if (categoryLower.includes('reputation') || categoryLower.includes('brand')) return RiskCategory.REPUTATIONAL;
    if (categoryLower.includes('geographic') || categoryLower.includes('jurisdiction')) return RiskCategory.GEOGRAPHIC;
    if (categoryLower.includes('transaction') || categoryLower.includes('financial')) return RiskCategory.TRANSACTION;
    
    return RiskCategory.OPERATIONAL;
  }

  /**
   * Get risk level from score
   */
  getRiskLevelFromScore(score: number): RiskLevel {
    const thresholds = ASSESSMENT_CONFIG.scoring.thresholds;
    
    if (score >= thresholds.high) return RiskLevel.LOW;
    if (score >= thresholds.medium) return RiskLevel.MEDIUM;
    if (score >= thresholds.low) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /**
   * Calculate trend analysis (simplified version)
   */
  calculateTrend(
    currentScore: number,
    previousScores: number[]
  ): {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidence: number;
  } {
    if (previousScores.length === 0) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidence: 0
      };
    }

    const lastScore = previousScores[previousScores.length - 1];
    const change = currentScore - lastScore;
    const changeRate = Math.abs(change) / lastScore * 100;

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (change > 2) direction = 'improving';
    else if (change < -2) direction = 'declining';

    // Confidence based on consistency of trend
    const confidence = previousScores.length >= 3 ? 
      this.calculateTrendConfidence(previousScores, currentScore) : 
      50;

    return {
      direction,
      changeRate: Math.round(changeRate * 100) / 100,
      confidence: Math.round(confidence)
    };
  }

  /**
   * Calculate confidence in trend analysis
   */
  private calculateTrendConfidence(scores: number[], currentScore: number): number {
    if (scores.length < 2) return 25;

    // Calculate if trend is consistent
    const allScores = [...scores, currentScore];
    let consistentDirection = true;
    let lastChange = 0;

    for (let i = 1; i < allScores.length; i++) {
      const change = allScores[i] - allScores[i - 1];
      if (i > 1 && Math.sign(change) !== Math.sign(lastChange) && Math.abs(change) > 1) {
        consistentDirection = false;
        break;
      }
      lastChange = change;
    }

    return consistentDirection ? 80 : 40;
  }

  /**
   * Calculate composite risk index
   */
  calculateCompositeRiskIndex(
    overallScore: number,
    categoryScores: Record<RiskCategory, number>,
    weights?: Partial<Record<RiskCategory, number>>
  ): number {
    const defaultWeights = {
      [RiskCategory.REGULATORY]: 0.25,
      [RiskCategory.OPERATIONAL]: 0.20,
      [RiskCategory.GOVERNANCE]: 0.15,
      [RiskCategory.REPUTATIONAL]: 0.15,
      [RiskCategory.TRANSACTION]: 0.15,
      [RiskCategory.GEOGRAPHIC]: 0.10
    };

    const effectiveWeights = { ...defaultWeights, ...weights };
    
    // Calculate weighted category average
    const categoryAverage = Object.entries(categoryScores).reduce((sum, [category, score]) => {
      const weight = effectiveWeights[category as RiskCategory] || 0;
      return sum + (score * weight);
    }, 0);

    // Combine overall score (60%) with category-weighted score (40%)
    return Math.round((overallScore * 0.6) + (categoryAverage * 0.4));
  }

  /**
   * Generate scoring insights
   */
  generateScoringInsights(
    overallScore: number,
    categoryScores: Record<RiskCategory, number>,
    gaps: ComplianceGap[],
    risks: RiskItem[]
  ): {
    level: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    priorities: string[];
  } {
    const level = this.getScoreLevel(overallScore);
    
    // Identify strengths (high-scoring categories)
    const strengths = Object.entries(categoryScores)
      .filter(([_, score]) => score >= 70)
      .map(([category, score]) => `Strong ${category.toLowerCase()} management (${score}%)`)
      .slice(0, 3);

    // Identify weaknesses (low-scoring categories)
    const weaknesses = Object.entries(categoryScores)
      .filter(([_, score]) => score < 50)
      .map(([category, score]) => `${category.toLowerCase()} gaps identified (${score}%)`)
      .slice(0, 3);

    // Priority areas (critical/high severity gaps and risks)
    const priorities = [
      ...gaps.filter(gap => gap.severity === 'CRITICAL' || gap.severity === 'HIGH')
        .slice(0, 3)
        .map(gap => `Address ${gap.title}`),
      ...risks.filter(risk => risk.riskLevel === RiskLevel.CRITICAL || risk.riskLevel === RiskLevel.HIGH)
        .slice(0, 2)
        .map(risk => `Mitigate ${risk.title}`)
    ].slice(0, 5);

    return {
      level,
      summary: this.generateScoreSummary(overallScore, gaps.length, risks.length),
      strengths: strengths.length > 0 ? strengths : ['Comprehensive assessment completed'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['No major weaknesses identified'],
      priorities: priorities.length > 0 ? priorities : ['Continue monitoring and improvement']
    };
  }

  private getScoreLevel(score: number): string {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  private generateScoreSummary(score: number, gapCount: number, riskCount: number): string {
    const level = this.getScoreLevel(score);
    return `${level} compliance posture with ${gapCount} gaps and ${riskCount} risks identified. ` +
           `Overall risk score: ${score}/100.`;
  }
}