import { BaseService } from './base.service';
import { SubscriptionPlan, Severity, Priority } from '@prisma/client';

interface MockedGap {
  id: string;
  assessmentId: string;
  category: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  priorityScore: number | null;
  estimatedCost: null;
  estimatedEffort: null;
  suggestedVendors: string[];
  createdAt: Date;
  isRestricted: boolean;
}

interface MockedStrategyMatrix {
  assessmentId: string;
  matrix: Array<{ x: string; y: string; items: string[] }>;
  summary: string;
  isRestricted: boolean;
}

/**
 * FreemiumContentService
 *
 * Generates mock/blurred content for FREE tier users to:
 * 1. Reduce OpenAI API costs - No AI calls for free users
 * 2. Show value proposition - Users see structure but not details
 * 3. Drive upgrades - Clear "unlock" messaging throughout
 *
 * IMPORTANT: This service does NOT call OpenAI API
 */
export class FreemiumContentService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Generate mocked gap analysis for Freemium users
   * Does NOT call OpenAI API - pure in-memory generation
   *
   * @param assessmentId - Assessment ID to generate mocked gaps for
   * @returns Promise<MockedGap[]> - Array of 3-5 generic mocked gaps
   */
  async generateMockedGapAnalysis(assessmentId: string): Promise<MockedGap[]> {
    const mockTitles = [
      'Risk Area 1',
      'Compliance Gap 2',
      'Control Weakness 3',
      'Process Deficiency 4',
      'Documentation Gap 5'
    ];

    const severities: Severity[] = [Severity.HIGH, Severity.MEDIUM, Severity.LOW];
    const gapCount = 3 + Math.floor(Math.random() * 3); // 3-5 gaps

    const gaps: MockedGap[] = [];

    for (let i = 0; i < gapCount; i++) {
      gaps.push({
        id: `mock-gap-${assessmentId}-${i + 1}`,
        assessmentId,
        category: 'HIDDEN_ANALYSIS',
        title: mockTitles[i % mockTitles.length],
        description: '[UNLOCK PREMIUM TO SEE DETAILS]',
        severity: severities[i % severities.length],
        priority: Priority.MEDIUM,
        priorityScore: null,
        estimatedCost: null,
        estimatedEffort: null,
        suggestedVendors: [],
        createdAt: new Date(),
        isRestricted: true,
      });
    }

    this.logger.info(`Generated ${gaps.length} mocked gaps for assessment ${assessmentId}`);
    return gaps;
  }

  /**
   * Generate mocked strategy matrix for Freemium users
   *
   * @param assessmentId - Assessment ID
   * @returns Promise<MockedStrategyMatrix> - Blurred strategy matrix
   */
  async generateMockedStrategyMatrix(assessmentId: string): Promise<MockedStrategyMatrix> {
    return {
      assessmentId,
      matrix: [
        { x: 'Low', y: 'Low', items: ['[DETAILS HIDDEN]'] },
        { x: 'High', y: 'High', items: ['[DETAILS HIDDEN]'] },
      ],
      summary: 'Upgrade to Premium to see personalized strategy recommendations',
      isRestricted: true,
    };
  }

  /**
   * Check if user should receive real AI analysis
   *
   * @param userId - User ID to check
   * @returns Promise<boolean> - true if PREMIUM or ENTERPRISE, false if FREE
   */
  async shouldGenerateRealAnalysis(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true },
    });

    if (!subscription) {
      this.logger.warn(`No subscription found for user ${userId}, defaulting to FREE`);
      return false;
    }

    const isRealAnalysis = subscription.plan !== SubscriptionPlan.FREE;

    this.logger.info(
      `User ${userId} plan: ${subscription.plan}, real analysis: ${isRealAnalysis}`
    );

    return isRealAnalysis;
  }
}
