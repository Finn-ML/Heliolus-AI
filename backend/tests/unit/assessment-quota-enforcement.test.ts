import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AssessmentService } from '../../src/services/assessment.service';
import { PrismaClient, SubscriptionPlan } from '../../src/generated/prisma';

describe('Assessment Quota Enforcement', () => {
  let service: AssessmentService;
  let prisma: PrismaClient;
  let freeUserId: string;
  let premiumUserId: string;
  let testTemplateId: string;
  let testOrgId: string;

  beforeAll(async () => {
    service = new AssessmentService();
    prisma = new PrismaClient();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: 'Test Template',
        category: TemplateCategory.GDPR,
        description: 'Test',
        isActive: true,
      },
    });
    testTemplateId = template.id;

    // Create FREE user with quota
    const freeUser = await prisma.user.create({
      data: {
        email: 'free-quota@example.com',
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
        assessmentQuota: {
          create: {
            totalAssessmentsCreated: 0,
          },
        },
        organization: {
          create: {
            name: 'Free Org',
            country: 'US',
          },
        },
      },
      include: { organization: true },
    });
    freeUserId = freeUser.id;
    testOrgId = freeUser.organization!.id;

    // Create PREMIUM user
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium-quota@example.com',
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
  });

  afterAll(async () => {
    await prisma.template.delete({ where: { id: testTemplateId } });
    await prisma.user.deleteMany({
      where: { id: { in: [freeUserId, premiumUserId] } }
    });
    await prisma.$disconnect();
  });

  it('should allow FREE user to create 1st assessment', async () => {
    const response = await service.createAssessment({
      templateId: testTemplateId,
      organizationId: testOrgId,
    }, { userId: freeUserId, userRole: 'USER' });

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();

    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: freeUserId },
    });

    expect(quota?.totalAssessmentsCreated).toBe(1);
  });

  it('should allow FREE user to create 2nd assessment', async () => {
    const response = await service.createAssessment({
      templateId: testTemplateId,
      organizationId: testOrgId,
    }, { userId: freeUserId, userRole: 'USER' });

    expect(response.success).toBe(true);

    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: freeUserId },
    });

    expect(quota?.totalAssessmentsCreated).toBe(2);
  });

  it('should block FREE user from creating 3rd assessment', async () => {
    await expect(
      service.createAssessment({
        templateId: testTemplateId,
        organizationId: testOrgId,
      }, { userId: freeUserId, userRole: 'USER' })
    ).rejects.toThrow('Free users can create maximum 2 assessments');
  });

  it('should not check quota for PREMIUM user', async () => {
    // Create organization for premium user
    const premiumOrg = await prisma.organization.create({
      data: {
        userId: premiumUserId,
        name: 'Premium Org',
        country: 'US',
      },
    });

    // Create 5 assessments (no limit)
    for (let i = 0; i < 5; i++) {
      const response = await service.createAssessment({
        templateId: testTemplateId,
        organizationId: premiumOrg.id,
      }, { userId: premiumUserId, userRole: 'USER' });

      expect(response.success).toBe(true);
    }

    // Verify no quota record created for PREMIUM user
    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: premiumUserId },
    });

    expect(quota).toBeNull();

    // Cleanup
    await prisma.organization.delete({ where: { id: premiumOrg.id } });
  });

  it('should return 402 status code for quota exceeded', async () => {
    try {
      await service.createAssessment({
        templateId: testTemplateId,
        organizationId: testOrgId,
      }, { userId: freeUserId, userRole: 'USER' });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe('FREEMIUM_QUOTA_EXCEEDED');
    }
  });
});
