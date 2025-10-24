import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BillingService } from '../../src/services/billing.service';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '../../src/generated/prisma';

describe('BillingService - Subscription Renewal', () => {
  let service: BillingService;
  let prisma: PrismaClient;
  let monthlyUserId: string;
  let annualUserId: string;
  let freeUserId: string;
  let monthlySubId: string;
  let annualSubId: string;
  let freeSubId: string;

  beforeEach(async () => {
    service = new BillingService();
    prisma = new PrismaClient();

    // Create MONTHLY subscription user
    const monthlyUser = await prisma.user.create({
      data: {
        email: `monthly-billing-${Date.now()}@example.com`,
        firstName: 'Monthly',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    monthlyUserId = monthlyUser.id;

    const monthlyPeriodStart = new Date('2025-01-01');
    const monthlyPeriodEnd = new Date('2025-02-01');

    const monthlySub = await prisma.subscription.create({
      data: {
        userId: monthlyUserId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'MONTHLY',
        creditsBalance: 100,
        creditsPurchased: 100,
        creditsUsed: 0,
        currentPeriodStart: monthlyPeriodStart,
        currentPeriodEnd: monthlyPeriodEnd,
        renewalDate: monthlyPeriodEnd,
      },
    });
    monthlySubId = monthlySub.id;

    // Create UserAssessmentQuota for monthly user
    await prisma.userAssessmentQuota.create({
      data: {
        userId: monthlyUserId,
        totalAssessmentsCreated: 5,
        assessmentsThisMonth: 3,
        assessmentsUsedThisMonth: 3,
      },
    });

    // Create ANNUAL subscription user
    const annualUser = await prisma.user.create({
      data: {
        email: `annual-billing-${Date.now()}@example.com`,
        firstName: 'Annual',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    annualUserId = annualUser.id;

    const annualPeriodStart = new Date('2024-01-01');
    const annualPeriodEnd = new Date('2025-01-01');

    const annualSub = await prisma.subscription.create({
      data: {
        userId: annualUserId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'ANNUAL',
        creditsBalance: 500,
        creditsPurchased: 1200,
        creditsUsed: 700,
        currentPeriodStart: annualPeriodStart,
        currentPeriodEnd: annualPeriodEnd,
        renewalDate: annualPeriodEnd,
      },
    });
    annualSubId = annualSub.id;

    // Create UserAssessmentQuota for annual user
    await prisma.userAssessmentQuota.create({
      data: {
        userId: annualUserId,
        totalAssessmentsCreated: 20,
        assessmentsThisMonth: 2,
        assessmentsUsedThisMonth: 2,
      },
    });

    // Create FREE subscription user
    const freeUser = await prisma.user.create({
      data: {
        email: `free-billing-${Date.now()}@example.com`,
        firstName: 'Free',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    freeUserId = freeUser.id;

    const freeSub = await prisma.subscription.create({
      data: {
        userId: freeUserId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: null, // FREE has no billing cycle
        creditsBalance: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        renewalDate: null,
      },
    });
    freeSubId = freeSub.id;

    await prisma.userAssessmentQuota.create({
      data: {
        userId: freeUserId,
        totalAssessmentsCreated: 2,
        assessmentsThisMonth: 0,
        assessmentsUsedThisMonth: 0,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: monthlyUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: annualUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: freeUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('MONTHLY subscription renewal', () => {
    it('should update billing period by 1 month', async () => {
      const beforeRenewal = await prisma.subscription.findUnique({
        where: { id: monthlySubId },
      });

      await service.processSubscriptionRenewal(monthlySubId);

      const afterRenewal = await prisma.subscription.findUnique({
        where: { id: monthlySubId },
      });

      const periodLengthDays = Math.round(
        (afterRenewal!.currentPeriodEnd!.getTime() - afterRenewal!.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      expect(periodLengthDays).toBeGreaterThan(27); // At least 28 days
      expect(periodLengthDays).toBeLessThan(32); // At most 31 days
    });

    it('should set renewalDate equal to currentPeriodEnd', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const subscription = await prisma.subscription.findUnique({
        where: { id: monthlySubId },
      });

      expect(subscription!.renewalDate).toEqual(subscription!.currentPeriodEnd);
    });

    it('should reset assessmentsUsedThisMonth to 0', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: monthlyUserId },
      });

      expect(quota!.assessmentsUsedThisMonth).toBe(0);
    });

    it('should NOT reset totalAssessmentsCreated', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: monthlyUserId },
      });

      expect(quota!.totalAssessmentsCreated).toBe(5); // Unchanged
    });

    it('should generate invoice with correct amount', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: monthlySubId },
        orderBy: { createdAt: 'desc' },
      });

      expect(invoice).toBeDefined();
      expect(invoice!.amount).toBe(599); // €599 in euros
      expect(invoice!.currency).toBe('eur');
    });

    it('should create invoice with PAID status (mocked)', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: monthlySubId },
        orderBy: { createdAt: 'desc' },
      });

      expect(invoice!.status).toBe('PAID');
      expect(invoice!.paidAt).toBeDefined();
    });
  });

  describe('ANNUAL subscription renewal', () => {
    it('should update billing period by 1 year', async () => {
      await service.processSubscriptionRenewal(annualSubId);

      const subscription = await prisma.subscription.findUnique({
        where: { id: annualSubId },
      });

      const periodLengthDays = Math.round(
        (subscription!.currentPeriodEnd!.getTime() - subscription!.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      expect(periodLengthDays).toBeGreaterThan(364); // At least 364 days
      expect(periodLengthDays).toBeLessThan(367); // At most 366 days
    });

    it('should NOT reset assessmentsUsedThisMonth for annual', async () => {
      const beforeRenewal = await prisma.userAssessmentQuota.findUnique({
        where: { userId: annualUserId },
      });

      await service.processSubscriptionRenewal(annualSubId);

      const afterRenewal = await prisma.userAssessmentQuota.findUnique({
        where: { userId: annualUserId },
      });

      // Annual renewals don't reset monthly quota
      expect(afterRenewal!.assessmentsUsedThisMonth).toBe(beforeRenewal!.assessmentsUsedThisMonth);
    });

    it('should generate invoice with annual amount', async () => {
      await service.processSubscriptionRenewal(annualSubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: annualSubId },
        orderBy: { createdAt: 'desc' },
      });

      expect(invoice!.amount).toBe(6469.20); // €6,469.20 in euros
    });

    it('should include billing cycle in invoice metadata', async () => {
      await service.processSubscriptionRenewal(annualSubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: annualSubId },
        orderBy: { createdAt: 'desc' },
      });

      expect((invoice!.metadata as any).billingCycle).toBe('ANNUAL');
    });
  });

  describe('FREE tier handling', () => {
    it('should skip renewal for FREE tier gracefully', async () => {
      // Should not throw error
      await expect(
        service.processSubscriptionRenewal(freeSubId)
      ).resolves.not.toThrow();
    });

    it('should not modify FREE subscription periods', async () => {
      const before = await prisma.subscription.findUnique({
        where: { id: freeSubId },
      });

      await service.processSubscriptionRenewal(freeSubId);

      const after = await prisma.subscription.findUnique({
        where: { id: freeSubId },
      });

      expect(after!.currentPeriodEnd).toEqual(before!.currentPeriodEnd);
      expect(after!.renewalDate).toEqual(before!.renewalDate);
    });

    it('should not generate invoice for FREE tier', async () => {
      await service.processSubscriptionRenewal(freeSubId);

      const invoices = await prisma.invoice.findMany({
        where: { subscriptionId: freeSubId },
      });

      expect(invoices.length).toBe(0);
    });
  });

  describe('Transaction atomicity', () => {
    it('should update subscription and quota in single transaction', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const subscription = await prisma.subscription.findUnique({
        where: { id: monthlySubId },
      });

      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId: monthlyUserId },
      });

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: monthlySubId },
      });

      // All three should be updated
      expect(subscription!.renewalDate).toBeDefined();
      expect(quota!.assessmentsUsedThisMonth).toBe(0);
      expect(invoice).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw 404 for non-existent subscription', async () => {
      await expect(
        service.processSubscriptionRenewal('nonexistent-id')
      ).rejects.toThrow('Subscription not found');
    });

    it('should throw error for invalid billing cycle', async () => {
      // Manually update to invalid cycle for test
      await prisma.subscription.update({
        where: { id: monthlySubId },
        data: { billingCycle: 'INVALID' as any },
      });

      await expect(
        service.processSubscriptionRenewal(monthlySubId)
      ).rejects.toThrow('Unknown billing cycle');
    });
  });

  describe('Invoice generation', () => {
    it('should generate unique Stripe invoice IDs', async () => {
      await service.processSubscriptionRenewal(monthlySubId);
      await service.processSubscriptionRenewal(annualSubId);

      const invoices = await prisma.invoice.findMany({
        where: {
          subscriptionId: {
            in: [monthlySubId, annualSubId],
          },
        },
      });

      const invoiceIds = invoices.map((inv) => inv.stripeInvoiceId);
      const uniqueIds = new Set(invoiceIds);

      expect(uniqueIds.size).toBe(invoices.length);
    });

    it('should set invoice due date 30 days from now', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: monthlySubId },
      });

      const daysDiff = Math.round(
        (invoice!.dueDate.getTime() - invoice!.invoiceDate.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(30);
    });

    it('should include plan and user email in metadata', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const invoice = await prisma.invoice.findFirst({
        where: { subscriptionId: monthlySubId },
        include: { user: true },
      });

      expect((invoice!.metadata as any).plan).toBe('PREMIUM');
      expect((invoice!.metadata as any).userEmail).toContain('@example.com');
    });
  });

  describe('getUpcomingRenewals', () => {
    it('should return subscriptions due for renewal', async () => {
      // Set renewal date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.subscription.update({
        where: { id: monthlySubId },
        data: { renewalDate: tomorrow },
      });

      const upcomingRenewals = await service.getUpcomingRenewals(1);

      expect(upcomingRenewals).toContain(monthlySubId);
    });

    it('should not return FREE subscriptions', async () => {
      const upcomingRenewals = await service.getUpcomingRenewals(365);

      expect(upcomingRenewals).not.toContain(freeSubId);
    });

    it('should only return ACTIVE subscriptions', async () => {
      await prisma.subscription.update({
        where: { id: monthlySubId },
        data: { status: 'CANCELLED' },
      });

      const upcomingRenewals = await service.getUpcomingRenewals(365);

      expect(upcomingRenewals).not.toContain(monthlySubId);
    });
  });

  describe('Audit logging', () => {
    it('should create audit log for renewal', async () => {
      await service.processSubscriptionRenewal(monthlySubId);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity: 'Subscription',
          entityId: monthlySubId,
          action: 'SUBSCRIPTION_RENEWED',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});
