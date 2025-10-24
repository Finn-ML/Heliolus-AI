import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AssessmentService } from '../../src/services/assessment.service';
import { PrismaClient, SubscriptionPlan, AssessmentStatus } from '../../src/generated/prisma';

describe('Assessment Mocked Content - FREE Tier', () => {
  let service: AssessmentService;
  let prisma: PrismaClient;
  let freeUserId: string;
  let premiumUserId: string;
  let freeAssessmentId: string;
  let premiumAssessmentId: string;

  beforeAll(async () => {
    service = new AssessmentService();
    prisma = new PrismaClient();

    // Create FREE user with assessment
    const freeUser = await prisma.user.create({
      data: {
        email: 'free-mock@example.com',
        firstName: 'Free',
        lastName: 'User',
        password: 'hashed',
        subscription: {
          create: {
            plan: SubscriptionPlan.FREE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
          },
        },
      },
    });
    freeUserId = freeUser.id;

    // Create assessment for FREE user
    const freeAssessment = await prisma.assessment.create({
      data: {
        userId: freeUserId,
        templateId: 'test-template',
        organizationId: 'test-org',
        status: AssessmentStatus.COMPLETED,
        riskScore: 67,
        responses: {},
        creditsUsed: 0,
      },
    });
    freeAssessmentId = freeAssessment.id;

    // Create PREMIUM user with assessment
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium-mock@example.com',
        firstName: 'Premium',
        lastName: 'User',
        password: 'hashed',
        subscription: {
          create: {
            plan: SubscriptionPlan.PREMIUM,
            creditsBalance: 100,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
          },
        },
      },
    });
    premiumUserId = premiumUser.id;

    // Create assessment for PREMIUM user
    const premiumAssessment = await prisma.assessment.create({
      data: {
        userId: premiumUserId,
        templateId: 'test-template',
        organizationId: 'test-org',
        status: AssessmentStatus.COMPLETED,
        riskScore: 72,
        responses: {},
        creditsUsed: 0,
      },
    });
    premiumAssessmentId = premiumAssessment.id;
  });

  afterAll(async () => {
    await prisma.assessment.deleteMany({
      where: { id: { in: [freeAssessmentId, premiumAssessmentId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [freeUserId, premiumUserId] } }
    });
    await prisma.$disconnect();
  });

  it('should return mocked gaps for FREE user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      freeAssessmentId,
      { userId: freeUserId, userRole: 'USER' }
    );

    expect(response.success).toBe(true);

    // Check gaps are mocked (if present)
    if (response.data.gaps && response.data.gaps.length > 0) {
      response.data.gaps.forEach((gap: any) => {
        expect(gap.description).toContain('[UNLOCK PREMIUM TO SEE DETAILS]');
        expect(gap.isRestricted).toBe(true);
      });
    }
  });

  it('should mark assessment as restricted for FREE user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      freeAssessmentId,
      { userId: freeUserId, userRole: 'USER' }
    );

    expect(response.data.isRestricted).toBe(true);
    expect(response.data.restrictionReason).toContain('Upgrade to Premium');
  });

  it('should preserve riskScore for FREE user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      freeAssessmentId,
      { userId: freeUserId, userRole: 'USER' }
    );

    expect(response.data.riskScore).toBe(67); // Original score preserved
  });

  it('should blur strategy matrix for FREE user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      freeAssessmentId,
      { userId: freeUserId, userRole: 'USER' }
    );

    if (response.data.aiStrategyMatrix) {
      expect(response.data.aiStrategyMatrix.isRestricted).toBe(true);
      expect(response.data.aiStrategyMatrix.matrix).toBe('[UNLOCK PREMIUM TO SEE]');
    }
  });

  it('should hide vendor matches for FREE user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      freeAssessmentId,
      { userId: freeUserId, userRole: 'USER' }
    );

    expect(response.data.vendorMatches).toEqual([]);
  });

  it('should mark assessment as unrestricted for PREMIUM user', async () => {
    const response = await service.getAssessmentResultsUnfiltered(
      premiumAssessmentId,
      { userId: premiumUserId, userRole: 'USER' }
    );

    expect(response.data.isRestricted).toBe(false);
  });
});
