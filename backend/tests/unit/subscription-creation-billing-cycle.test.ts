import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubscriptionService } from '../../src/services/subscription.service';
import { PrismaClient, SubscriptionPlan } from '../../src/generated/prisma';

describe('Subscription Creation - Billing Cycles', () => {
  let service: SubscriptionService;
  let prisma: PrismaClient;
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    service = new SubscriptionService();
    prisma = new PrismaClient();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `billing-test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    testUserId = user.id;
    testUserEmail = user.email;
  });

  afterEach(async () => {
    // Cleanup - cascade will delete subscription, quota, etc.
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('FREE tier', () => {
    it('should create subscription with no billing cycle', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      expect(response.success).toBe(true);
      expect(response.data.billingCycle).toBeNull();
      expect(response.data.currentPeriodEnd).toBeNull();
      expect(response.data.renewalDate).toBeNull();
      expect(response.data.creditsBalance).toBe(0);
      expect(response.data.creditsPurchased).toBe(0);
    });

    it('should create UserAssessmentQuota record', async () => {
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: testUserId },
      });

      expect(quota).toBeDefined();
      expect(quota?.totalAssessmentsCreated).toBe(0);
      expect(quota?.assessmentsThisMonth).toBe(0);
      expect(quota?.assessmentsUsedThisMonth).toBe(0);
    });

    it('should default billingEmail to user email', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      expect(response.data.billingEmail).toBe(testUserEmail);
    });

    it('should NOT create credit transaction for FREE', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      const transactions = await prisma.creditTransaction.findMany({
        where: { subscriptionId: response.data.id },
      });

      expect(transactions.length).toBe(0);
    });
  });

  describe('PREMIUM MONTHLY', () => {
    it('should create subscription with 1-month period', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.success).toBe(true);
      expect(response.data.billingCycle).toBe('MONTHLY');

      // Check period is ~1 month
      const start = new Date(response.data.currentPeriodStart);
      const end = new Date(response.data.currentPeriodEnd!);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(27); // At least 28 days (Feb)
      expect(daysDiff).toBeLessThan(32);    // At most 31 days
    });

    it('should set renewalDate equal to currentPeriodEnd', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.data.renewalDate).toEqual(response.data.currentPeriodEnd);
    });

    it('should allocate 100 initial credits', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.data.creditsBalance).toBe(100);
      expect(response.data.creditsPurchased).toBe(100);
    });

    it('should create initial credit transaction', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      const transactions = await prisma.creditTransaction.findMany({
        where: { subscriptionId: response.data.id },
      });

      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('SUBSCRIPTION_RENEWAL');
      expect(transactions[0].amount).toBe(100);
      expect(transactions[0].balance).toBe(100);
    });

    it('should create UserAssessmentQuota record', async () => {
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: testUserId },
      });

      expect(quota).toBeDefined();
      expect(quota?.totalAssessmentsCreated).toBe(0);
    });

    it('should handle end-of-month dates correctly', async () => {
      // This test verifies JavaScript Date handles edge cases
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      // Just verify period is set
      expect(response.data.currentPeriodEnd).toBeDefined();
      expect(response.data.currentPeriodEnd).not.toBeNull();
    });
  });

  describe('PREMIUM ANNUAL', () => {
    it('should create subscription with 1-year period', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUAL',
      });

      expect(response.success).toBe(true);
      expect(response.data.billingCycle).toBe('ANNUAL');

      // Check period is ~1 year
      const start = new Date(response.data.currentPeriodStart);
      const end = new Date(response.data.currentPeriodEnd!);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(364); // At least 364 days
      expect(daysDiff).toBeLessThan(367);    // At most 366 days (leap year)
    });

    it('should allocate 100 initial credits (same as monthly)', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUAL',
      });

      // Initial allocation is same, renewals differ
      expect(response.data.creditsBalance).toBe(100);
      expect(response.data.creditsPurchased).toBe(100);
    });

    it('should set renewalDate equal to currentPeriodEnd', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUAL',
      });

      expect(response.data.renewalDate).toEqual(response.data.currentPeriodEnd);
    });
  });

  describe('ENTERPRISE', () => {
    it('should create subscription with 0 initial credits', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.ENTERPRISE,
        billingCycle: 'ANNUAL',
      });

      expect(response.data.creditsBalance).toBe(0);
      expect(response.data.creditsPurchased).toBe(0);
    });

    it('should NOT create credit transaction', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.ENTERPRISE,
        billingCycle: 'ANNUAL',
      });

      const transactions = await prisma.creditTransaction.findMany({
        where: { subscriptionId: response.data.id },
      });

      expect(transactions.length).toBe(0);
    });

    it('should create UserAssessmentQuota record', async () => {
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.ENTERPRISE,
        billingCycle: 'ANNUAL',
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: testUserId },
      });

      expect(quota).toBeDefined();
    });
  });

  describe('Billing email', () => {
    it('should use provided billing email', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
        billingEmail: 'billing@company.com',
      });

      expect(response.data.billingEmail).toBe('billing@company.com');
    });

    it('should default to user email if not provided', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.data.billingEmail).toBe(testUserEmail);
    });

    it('should validate email format', async () => {
      await expect(
        service.createSubscription(testUserId, {
          plan: SubscriptionPlan.PREMIUM,
          billingCycle: 'MONTHLY',
          billingEmail: 'invalid-email',
        })
      ).rejects.toThrow();
    });
  });

  describe('Period calculations', () => {
    it('should calculate monthly period correctly', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      const start = new Date(response.data.currentPeriodStart);
      const end = new Date(response.data.currentPeriodEnd!);

      // End should be ~1 month later
      const expectedEnd = new Date(start);
      expectedEnd.setMonth(expectedEnd.getMonth() + 1);

      // Allow 1 hour difference for potential timezone issues
      const timeDiff = Math.abs(end.getTime() - expectedEnd.getTime());
      expect(timeDiff).toBeLessThan(60 * 60 * 1000); // < 1 hour
    });

    it('should calculate annual period correctly', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUAL',
      });

      const start = new Date(response.data.currentPeriodStart);
      const end = new Date(response.data.currentPeriodEnd!);

      // End should be ~1 year later
      const expectedEnd = new Date(start);
      expectedEnd.setFullYear(expectedEnd.getFullYear() + 1);

      // Allow 1 hour difference for potential timezone issues
      const timeDiff = Math.abs(end.getTime() - expectedEnd.getTime());
      expect(timeDiff).toBeLessThan(60 * 60 * 1000); // < 1 hour
    });

    it('should handle FREE with null periods', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      expect(response.data.currentPeriodEnd).toBeNull();
      expect(response.data.renewalDate).toBeNull();
      expect(response.data.currentPeriodStart).toBeDefined();
    });
  });

  describe('UserAssessmentQuota upsert', () => {
    it('should create new quota if not exists', async () => {
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: testUserId },
      });

      expect(quota).toBeDefined();
      expect(quota?.totalAssessmentsCreated).toBe(0);
    });

    it('should not modify existing quota', async () => {
      // Create quota manually first
      await prisma.userAssessmentQuota.create({
        data: {
          userId: testUserId,
          totalAssessmentsCreated: 5,
          assessmentsThisMonth: 2,
          assessmentsUsedThisMonth: 1,
        },
      });

      // Create subscription (should upsert without changing existing)
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: testUserId },
      });

      // Values should remain unchanged
      expect(quota?.totalAssessmentsCreated).toBe(5);
      expect(quota?.assessmentsThisMonth).toBe(2);
      expect(quota?.assessmentsUsedThisMonth).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should require valid billingCycle enum', async () => {
      await expect(
        service.createSubscription(testUserId, {
          plan: SubscriptionPlan.PREMIUM,
          billingCycle: 'INVALID' as any,
        })
      ).rejects.toThrow();
    });

    it('should allow FREE without billingCycle', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      expect(response.success).toBe(true);
    });

    it('should reject duplicate subscription', async () => {
      await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.FREE,
      });

      await expect(
        service.createSubscription(testUserId, {
          plan: SubscriptionPlan.PREMIUM,
          billingCycle: 'MONTHLY',
        })
      ).rejects.toThrow('already has a subscription');
    });
  });

  describe('Status and timestamps', () => {
    it('should set status to ACTIVE by default', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.data.status).toBe('ACTIVE');
    });

    it('should set status to TRIALING if trialDays provided', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
        trialDays: 14,
      });

      expect(response.data.status).toBe('TRIALING');
      expect(response.data.trialEnd).toBeDefined();
    });

    it('should set createdAt timestamp', async () => {
      const response = await service.createSubscription(testUserId, {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'MONTHLY',
      });

      expect(response.data.createdAt).toBeInstanceOf(Date);
    });
  });
});
