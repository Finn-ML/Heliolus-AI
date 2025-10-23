/**
 * Unit Tests for Weighted Scoring Service
 * Target: ≥90% code coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeightedScoringService } from './weighted-scoring.service.js';
import { EvidenceTier } from '../scoring/tier-multiplier.js';

// Mock Prisma Client
const mockPrisma = {
  answer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  section: {
    findUnique: vi.fn(),
  },
  assessment: {
    findUnique: vi.fn(),
  },
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
};

describe('WeightedScoringService', () => {
  let service: WeightedScoringService;

  beforeEach(() => {
    service = new WeightedScoringService();
    // Replace prisma instance with mock
    (service as any).prisma = mockPrisma;
    vi.clearAllMocks();
  });

  describe('calculateQuestionScore', () => {
    it('should calculate score with TIER_2 evidence (multiplier 1.0)', async () => {
      const mockAnswer = {
        id: 'ans1',
        questionId: 'q1',
        rawQualityScore: 4.0,
        assessmentId: 'assess1',
        linkedDocuments: [
          {
            document: {
              id: 'doc1',
              evidenceTier: 'TIER_2',
            },
          },
        ],
        question: {
          id: 'q1',
          text: 'Question 1',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_2', tierMultiplier: 1.0, finalScore: 4.0 });

      const result = await service.calculateQuestionScore('ans1');

      expect(result.rawQualityScore).toBe(4.0);
      expect(result.evidenceTier).toBe(EvidenceTier.TIER_2);
      expect(result.tierMultiplier).toBe(1.0);
      expect(result.finalScore).toBe(4.0);
    });

    it('should calculate score with TIER_1 evidence (multiplier 0.8)', async () => {
      const mockAnswer = {
        id: 'ans2',
        questionId: 'q2',
        rawQualityScore: 4.0,
        assessmentId: 'assess1',
        linkedDocuments: [
          {
            document: {
              id: 'doc2',
              evidenceTier: 'TIER_1',
            },
          },
        ],
        question: {
          id: 'q2',
          text: 'Question 2',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_1', tierMultiplier: 0.8, finalScore: 3.2 });

      const result = await service.calculateQuestionScore('ans2');

      expect(result.rawQualityScore).toBe(4.0);
      expect(result.evidenceTier).toBe(EvidenceTier.TIER_1);
      expect(result.tierMultiplier).toBe(0.8);
      expect(result.finalScore).toBe(3.2);
    });

    it('should calculate score with TIER_0 evidence (multiplier 0.6)', async () => {
      const mockAnswer = {
        id: 'ans3',
        questionId: 'q3',
        rawQualityScore: 4.0,
        assessmentId: 'assess1',
        linkedDocuments: [
          {
            document: {
              id: 'doc3',
              evidenceTier: 'TIER_0',
            },
          },
        ],
        question: {
          id: 'q3',
          text: 'Question 3',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_0', tierMultiplier: 0.6, finalScore: 2.4 });

      const result = await service.calculateQuestionScore('ans3');

      expect(result.rawQualityScore).toBe(4.0);
      expect(result.evidenceTier).toBe(EvidenceTier.TIER_0);
      expect(result.tierMultiplier).toBe(0.6);
      expect(result.finalScore).toBe(2.4);
    });

    it('should select best tier when multiple documents linked', async () => {
      const mockAnswer = {
        id: 'ans4',
        questionId: 'q4',
        rawQualityScore: 5.0,
        assessmentId: 'assess1',
        linkedDocuments: [
          { document: { id: 'doc1', evidenceTier: 'TIER_0' } },
          { document: { id: 'doc2', evidenceTier: 'TIER_2' } },
          { document: { id: 'doc3', evidenceTier: 'TIER_1' } },
        ],
        question: {
          id: 'q4',
          text: 'Question 4',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_2', tierMultiplier: 1.0, finalScore: 5.0 });

      const result = await service.calculateQuestionScore('ans4');

      expect(result.evidenceTier).toBe(EvidenceTier.TIER_2); // Best tier selected
      expect(result.tierMultiplier).toBe(1.0);
      expect(result.finalScore).toBe(5.0);
    });

    it('should handle missing rawQualityScore (treat as 0)', async () => {
      const mockAnswer = {
        id: 'ans5',
        questionId: 'q5',
        rawQualityScore: null,
        assessmentId: 'assess1',
        linkedDocuments: [
          { document: { id: 'doc1', evidenceTier: 'TIER_2' } },
        ],
        question: {
          id: 'q5',
          text: 'Question 5',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_2', tierMultiplier: 1.0, finalScore: 0 });

      const result = await service.calculateQuestionScore('ans5');

      expect(result.rawQualityScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });

    it('should throw error when answer not found', async () => {
      mockPrisma.answer.findUnique.mockResolvedValue(null);

      await expect(service.calculateQuestionScore('nonexistent')).rejects.toThrow('Answer not found');
    });

    it('should handle answer with no linked documents (default to TIER_0)', async () => {
      const mockAnswer = {
        id: 'ans6',
        questionId: 'q6',
        rawQualityScore: 3.0,
        assessmentId: 'assess1',
        linkedDocuments: [],
        question: {
          id: 'q6',
          text: 'Question 6',
        },
      };

      mockPrisma.answer.findUnique.mockResolvedValue(mockAnswer);
      mockPrisma.answer.update.mockResolvedValue({ ...mockAnswer, evidenceTier: 'TIER_0', tierMultiplier: 0.6, finalScore: 1.8 });

      const result = await service.calculateQuestionScore('ans6');

      expect(result.evidenceTier).toBe(EvidenceTier.TIER_0);
      expect(result.tierMultiplier).toBe(0.6);
      expect(result.finalScore).toBeCloseTo(1.8, 1);
    });
  });

  describe('calculateSectionScore', () => {
    it('should calculate section score with proper weighting', async () => {
      const mockSection = {
        id: 'sec1',
        name: 'Section 1',
        questions: [
          { id: 'q1', weight: 0.5, order: 1, text: 'Question 1' },
          { id: 'q2', weight: 0.3, order: 2, text: 'Question 2' },
          { id: 'q3', weight: 0.2, order: 3, text: 'Question 3' },
        ],
      };

      const mockAnswers = [
        {
          id: 'ans1',
          questionId: 'q1',
          rawQualityScore: 4.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
        {
          id: 'ans2',
          questionId: 'q2',
          rawQualityScore: 3.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
        {
          id: 'ans3',
          questionId: 'q3',
          rawQualityScore: 5.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
      ];

      mockPrisma.section.findUnique.mockResolvedValue(mockSection);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);

      // Mock calculateQuestionScore results
      mockPrisma.answer.findUnique.mockImplementation((args: any) => {
        const answer = mockAnswers.find(a => a.id === args.where.id);
        return Promise.resolve(answer ? { ...answer, question: mockSection.questions.find(q => q.id === answer.questionId) } : null);
      });

      mockPrisma.answer.update.mockImplementation((args: any) => {
        const answer = mockAnswers.find(a => a.id === args.where.id);
        return Promise.resolve(answer);
      });

      const result = await service.calculateSectionScore('sec1', 'assess1');

      // Expected: (4.0 * 0.5) + (3.0 * 0.3) + (5.0 * 0.2) = 2.0 + 0.9 + 1.0 = 3.9
      expect(result.score).toBeCloseTo(3.9, 1);
      expect(result.questionScores).toHaveLength(3);
      expect(result.totalWeight).toBe(1.0);
    });

    it('should handle section with missing answers', async () => {
      const mockSection = {
        id: 'sec2',
        name: 'Section 2',
        questions: [
          { id: 'q1', weight: 0.6, order: 1, text: 'Question 1' },
          { id: 'q2', weight: 0.4, order: 2, text: 'Question 2' },
        ],
      };

      const mockAnswers = [
        {
          id: 'ans1',
          questionId: 'q1',
          rawQualityScore: 4.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
        // q2 has no answer
      ];

      mockPrisma.section.findUnique.mockResolvedValue(mockSection);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.answer.findUnique.mockResolvedValue({ ...mockAnswers[0], question: mockSection.questions[0] });
      mockPrisma.answer.update.mockResolvedValue(mockAnswers[0]);

      const result = await service.calculateSectionScore('sec2', 'assess1');

      // Expected: (4.0 * 0.6) + (0 * 0.4) = 2.4
      expect(result.score).toBeCloseTo(2.4, 1);
      expect(result.questionScores).toHaveLength(2);
      expect(result.questionScores[1].finalScore).toBe(0); // Missing answer
    });

    it('should handle empty section (no questions)', async () => {
      const mockSection = {
        id: 'sec3',
        name: 'Empty Section',
        questions: [],
      };

      mockPrisma.section.findUnique.mockResolvedValue(mockSection);

      const result = await service.calculateSectionScore('sec3', 'assess1');

      expect(result.score).toBe(0);
      expect(result.scaledScore).toBe(0);
      expect(result.questionScores).toHaveLength(0);
    });

    it('should throw error when section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null);

      await expect(service.calculateSectionScore('nonexistent', 'assess1')).rejects.toThrow('Section not found');
    });

    it('should validate question weights sum to 1.0', async () => {
      const mockSection = {
        id: 'sec4',
        name: 'Invalid Weights Section',
        questions: [
          { id: 'q1', weight: 0.5, order: 1, text: 'Question 1' },
          { id: 'q2', weight: 0.3, order: 2, text: 'Question 2' },
          // Total: 0.8 (invalid, should be 1.0)
        ],
      };

      mockPrisma.section.findUnique.mockResolvedValue(mockSection);

      await expect(service.calculateSectionScore('sec4', 'assess1')).rejects.toThrow('must equal 1.0');
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate overall score with proper section weighting', async () => {
      const mockAssessment = {
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Test Template',
          sections: [
            {
              id: 'sec1',
              name: 'Section 1',
              weight: 0.6,
              order: 1,
              questions: [
                { id: 'q1', weight: 1.0, order: 1, text: 'Q1' },
              ],
            },
            {
              id: 'sec2',
              name: 'Section 2',
              weight: 0.4,
              order: 2,
              questions: [
                { id: 'q2', weight: 1.0, order: 1, text: 'Q2' },
              ],
            },
          ],
        },
      };

      mockPrisma.assessment.findUnique.mockResolvedValue(mockAssessment);
      mockPrisma.section.findUnique.mockImplementation((args: any) => {
        return Promise.resolve(mockAssessment.template.sections.find(s => s.id === args.where.id));
      });

      mockPrisma.answer.findMany.mockResolvedValue([
        {
          id: 'ans1',
          questionId: 'q1',
          rawQualityScore: 4.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
        {
          id: 'ans2',
          questionId: 'q2',
          rawQualityScore: 3.0,
          assessmentId: 'assess1',
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
      ]);

      mockPrisma.answer.findUnique.mockImplementation((args: any) => {
        const answers = [
          {
            id: 'ans1',
            questionId: 'q1',
            rawQualityScore: 4.0,
            assessmentId: 'assess1',
            linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
            question: { id: 'q1', text: 'Q1' },
          },
          {
            id: 'ans2',
            questionId: 'q2',
            rawQualityScore: 3.0,
            assessmentId: 'assess1',
            linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
            question: { id: 'q2', text: 'Q2' },
          },
        ];
        return Promise.resolve(answers.find(a => a.id === args.where.id));
      });

      mockPrisma.answer.update.mockResolvedValue({});

      const result = await service.calculateOverallScore('assess1');

      // Expected: (4.0 * 0.6) + (3.0 * 0.4) = 2.4 + 1.2 = 3.6 (on 0-5 scale)
      // Scaled to 0-100: 3.6 / 5 * 100 = 72
      expect(result.overallScore).toBeCloseTo(72, 0);
      expect(result.methodology).toBe('complete');
      expect(result.sectionScores).toHaveLength(2);
    });

    it('should assign correct risk bands', async () => {
      const createMockAssessment = (score: number) => ({
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Test Template',
          sections: [
            {
              id: 'sec1',
              name: 'Section 1',
              weight: 1.0,
              order: 1,
              questions: [{ id: 'q1', weight: 1.0, order: 1, text: 'Q1' }],
            },
          ],
        },
      });

      // Test Low risk (80-100)
      mockPrisma.assessment.findUnique.mockResolvedValue(createMockAssessment(5.0));
      mockPrisma.section.findUnique.mockResolvedValue(createMockAssessment(5.0).template.sections[0]);
      mockPrisma.answer.findMany.mockResolvedValue([
        { id: 'ans1', questionId: 'q1', rawQualityScore: 5.0, linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }] },
      ]);
      mockPrisma.answer.findUnique.mockResolvedValue({
        id: 'ans1',
        questionId: 'q1',
        rawQualityScore: 5.0,
        linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        question: { id: 'q1', text: 'Q1' },
      });
      mockPrisma.answer.update.mockResolvedValue({});

      let result = await service.calculateOverallScore('assess1');
      expect(result.riskBand).toBe('Low');

      // Test Critical risk (0-39)
      mockPrisma.answer.findUnique.mockResolvedValue({
        id: 'ans1',
        questionId: 'q1',
        rawQualityScore: 1.0,
        linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        question: { id: 'q1', text: 'Q1' },
      });
      mockPrisma.answer.findMany.mockResolvedValue([
        { id: 'ans1', questionId: 'q1', rawQualityScore: 1.0, linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }] },
      ]);

      result = await service.calculateOverallScore('assess1');
      expect(result.riskBand).toBe('Critical');
    });

    it('should handle perfect score (100/100)', async () => {
      const mockAssessment = {
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Test Template',
          sections: [
            {
              id: 'sec1',
              name: 'Section 1',
              weight: 1.0,
              order: 1,
              questions: [{ id: 'q1', weight: 1.0, order: 1, text: 'Q1' }],
            },
          ],
        },
      };

      mockPrisma.assessment.findUnique.mockResolvedValue(mockAssessment);
      mockPrisma.section.findUnique.mockResolvedValue(mockAssessment.template.sections[0]);
      mockPrisma.answer.findMany.mockResolvedValue([
        {
          id: 'ans1',
          questionId: 'q1',
          rawQualityScore: 5.0,
          linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        },
      ]);
      mockPrisma.answer.findUnique.mockResolvedValue({
        id: 'ans1',
        questionId: 'q1',
        rawQualityScore: 5.0,
        linkedDocuments: [{ document: { evidenceTier: 'TIER_2' } }],
        question: { id: 'q1', text: 'Q1' },
      });
      mockPrisma.answer.update.mockResolvedValue({});

      const result = await service.calculateOverallScore('assess1');

      expect(result.overallScore).toBe(100);
      expect(result.riskBand).toBe('Low');
    });

    it('should limit max score to 60 with all TIER_0 evidence', async () => {
      const mockAssessment = {
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Test Template',
          sections: [
            {
              id: 'sec1',
              name: 'Section 1',
              weight: 1.0,
              order: 1,
              questions: [{ id: 'q1', weight: 1.0, order: 1, text: 'Q1' }],
            },
          ],
        },
      };

      mockPrisma.assessment.findUnique.mockResolvedValue(mockAssessment);
      mockPrisma.section.findUnique.mockResolvedValue(mockAssessment.template.sections[0]);
      mockPrisma.answer.findMany.mockResolvedValue([
        {
          id: 'ans1',
          questionId: 'q1',
          rawQualityScore: 5.0,
          linkedDocuments: [{ document: { evidenceTier: 'TIER_0' } }],
        },
      ]);
      mockPrisma.answer.findUnique.mockResolvedValue({
        id: 'ans1',
        questionId: 'q1',
        rawQualityScore: 5.0,
        linkedDocuments: [{ document: { evidenceTier: 'TIER_0' } }],
        question: { id: 'q1', text: 'Q1' },
      });
      mockPrisma.answer.update.mockResolvedValue({});

      const result = await service.calculateOverallScore('assess1');

      // 5.0 * 0.6 = 3.0, scaled to 100: 60
      expect(result.overallScore).toBe(60);
      expect(result.riskBand).toBe('Medium');
    });

    it('should throw error when assessment not found', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue(null);

      await expect(service.calculateOverallScore('nonexistent')).rejects.toThrow('Assessment not found');
    });

    it('should handle assessment with no sections', async () => {
      const mockAssessment = {
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Empty Template',
          sections: [],
        },
      };

      mockPrisma.assessment.findUnique.mockResolvedValue(mockAssessment);

      const result = await service.calculateOverallScore('assess1');

      expect(result.overallScore).toBe(0);
      expect(result.riskBand).toBe('Critical');
      expect(result.sectionScores).toHaveLength(0);
    });

    it('should validate section weights sum to 1.0', async () => {
      const mockAssessment = {
        id: 'assess1',
        template: {
          id: 'template1',
          name: 'Invalid Template',
          sections: [
            {
              id: 'sec1',
              name: 'Section 1',
              weight: 0.5,
              order: 1,
              questions: [{ id: 'q1', weight: 1.0, order: 1, text: 'Q1' }],
            },
            {
              id: 'sec2',
              name: 'Section 2',
              weight: 0.3,
              order: 2,
              questions: [{ id: 'q2', weight: 1.0, order: 1, text: 'Q2' }],
            },
            // Total: 0.8 (invalid)
          ],
        },
      };

      mockPrisma.assessment.findUnique.mockResolvedValue(mockAssessment);

      await expect(service.calculateOverallScore('assess1')).rejects.toThrow('must equal 1.0');
    });
  });
});
