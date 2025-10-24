import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubscriptionService } from '../../src/services/subscription.service';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '../../src/generated/prisma';

describe('Purchase Additional Assessment', () => {
  let service: SubscriptionService;
  let prisma: PrismaClient;
  let premiumUserId: string;
  let enterpriseUserId: string;
  let freeUserId: string;
  let premiumSubscriptionId: string;

  beforeEach(async () => {
    service = new SubscriptionService();
    prisma = new PrismaClient();

    // Create PREMIUM user with subscription
    const premiumUser = await prisma.user.create({
      data: {
        email: `premium-purchase-${Date.now()}@example.com`,
        firstName: 'Premium',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    premiumUserId = premiumUser.id;

    await prisma.subscription.create({
      data: {
        userId: premiumUserId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        creditsBalance: 50,
        creditsPurchased: 100,
        creditsUsed: 50,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const premiumSubscription = await prisma.subscription.findUnique({
      where: { userId: premiumUserId },
    });
    premiumSubscriptionId = premiumSubscription!.id;

    // Create ENTERPRISE user with subscription
    const enterpriseUser = await prisma.user.create({
      data: {
        email: `enterprise-purchase-${Date.now()}@example.com`,
        firstName: 'Enterprise',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    enterpriseUserId = enterpriseUser.id;

    await prisma.subscription.create({
      data: {
        userId: enterpriseUserId,
        plan: SubscriptionPlan.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        creditsBalance: 200,
        creditsPurchased: 200,
        creditsUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Create FREE user with subscription
    const freeUser = await prisma.user.create({
      data: {
        email: `free-purchase-${Date.now()}@example.com`,
        firstName: 'Free',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    freeUserId = freeUser.id;

    await prisma.subscription.create({
      data: {
        userId: freeUserId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        creditsBalance: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      },
    });
  });

  afterEach(async () => {
    // Cleanup - cascade will delete subscriptions
    await prisma.user.delete({ where: { id: premiumUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: enterpriseUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: freeUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('PREMIUM user purchases', () => {
    it('should allow PREMIUM user to purchase additional credits', async () => {
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test123' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      expect(response.success).toBe(true);
      expect(response.data.creditsAdded).toBe(50);
      expect(response.data.newBalance).toBe(100); // 50 + 50
      expect(response.message).toContain('50 credits added successfully');
    });

    it('should update subscription credits balance', async () => {
      await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test123' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const subscription = await prisma.subscription.findUnique({
        where: { userId: premiumUserId },
      });

      expect(subscription?.creditsBalance).toBe(100); // 50 + 50
      expect(subscription?.creditsPurchased).toBe(150); // 100 + 50
    });

    it('should create credit transaction record', async () => {
      await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test123' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const transactions = await prisma.creditTransaction.findMany({
        where: {
          subscriptionId: premiumSubscriptionId,
          type: 'PURCHASE',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(transactions.length).toBe(1);
      expect(transactions[0].amount).toBe(50);
      expect(transactions[0].type).toBe('PURCHASE');
      expect(transactions[0].balance).toBe(100);
      expect(transactions[0].description).toBe('Purchased additional assessment credits');
    });

    it('should include correct metadata in transaction', async () => {
      await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_premium_additional' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const transaction = await prisma.creditTransaction.findFirst({
        where: {
          subscriptionId: premiumSubscriptionId,
          type: 'PURCHASE',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(transaction?.metadata).toBeDefined();
      expect((transaction?.metadata as any).amount).toBe(29900); // €299 in cents
      expect((transaction?.metadata as any).currency).toBe('eur');
      expect((transaction?.metadata as any).stripePriceId).toBe('price_premium_additional');
      expect((transaction?.metadata as any).purchaseDate).toBeDefined();
    });

    it('should allow multiple purchases', async () => {
      // First purchase
      const response1 = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test1' },
        { userId: premiumUserId, userRole: 'USER' }
      );
      expect(response1.data.newBalance).toBe(100); // 50 + 50

      // Second purchase
      const response2 = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test2' },
        { userId: premiumUserId, userRole: 'USER' }
      );
      expect(response2.data.newBalance).toBe(150); // 100 + 50

      // Verify total
      const subscription = await prisma.subscription.findUnique({
        where: { userId: premiumUserId },
      });
      expect(subscription?.creditsBalance).toBe(150);
      expect(subscription?.creditsPurchased).toBe(200); // 100 + 50 + 50
    });
  });

  describe('ENTERPRISE user purchases', () => {
    it('should allow ENTERPRISE user to purchase additional credits', async () => {
      const response = await service.purchaseAdditionalAssessment(
        enterpriseUserId,
        { stripePriceId: 'price_test123' },
        { userId: enterpriseUserId, userRole: 'USER' }
      );

      expect(response.success).toBe(true);
      expect(response.data.creditsAdded).toBe(50);
      expect(response.data.newBalance).toBe(250); // 200 + 50
    });

    it('should create transaction for ENTERPRISE purchase', async () => {
      await service.purchaseAdditionalAssessment(
        enterpriseUserId,
        { stripePriceId: 'price_enterprise_add' },
        { userId: enterpriseUserId, userRole: 'USER' }
      );

      const transactions = await prisma.creditTransaction.findMany({
        where: {
          subscription: { userId: enterpriseUserId },
          type: 'PURCHASE',
        },
      });

      expect(transactions.length).toBe(1);
      expect(transactions[0].amount).toBe(50);
    });
  });

  describe('FREE user restrictions', () => {
    it('should reject FREE user purchase attempt', async () => {
      await expect(
        service.purchaseAdditionalAssessment(
          freeUserId,
          { stripePriceId: 'price_test123' },
          { userId: freeUserId, userRole: 'USER' }
        )
      ).rejects.toThrow('Additional assessments available for Premium and Enterprise users only');
    });

    it('should throw 403 TIER_RESTRICTION error for FREE user', async () => {
      try {
        await service.purchaseAdditionalAssessment(
          freeUserId,
          { stripePriceId: 'price_test123' },
          { userId: freeUserId, userRole: 'USER' }
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('TIER_RESTRICTION');
      }
    });

    it('should not modify FREE user credits on rejection', async () => {
      const balanceBefore = (
        await prisma.subscription.findUnique({ where: { userId: freeUserId } })
      )?.creditsBalance;

      try {
        await service.purchaseAdditionalAssessment(
          freeUserId,
          { stripePriceId: 'price_test' },
          { userId: freeUserId, userRole: 'USER' }
        );
      } catch (error) {
        // Expected to fail
      }

      const balanceAfter = (
        await prisma.subscription.findUnique({ where: { userId: freeUserId } })
      )?.creditsBalance;

      expect(balanceAfter).toBe(balanceBefore);
      expect(balanceAfter).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should throw 404 for non-existent subscription', async () => {
      await expect(
        service.purchaseAdditionalAssessment(
          'nonexistent-user-id',
          { stripePriceId: 'price_test123' },
          { userId: 'nonexistent-user-id', userRole: 'USER' }
        )
      ).rejects.toThrow('Subscription not found');
    });

    it('should throw 404 SUBSCRIPTION_NOT_FOUND error', async () => {
      try {
        await service.purchaseAdditionalAssessment(
          'nonexistent-user-id',
          { stripePriceId: 'price_test' },
          { userId: 'nonexistent-user-id', userRole: 'USER' }
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('SUBSCRIPTION_NOT_FOUND');
      }
    });

    it('should validate stripePriceId is required', async () => {
      await expect(
        service.purchaseAdditionalAssessment(
          premiumUserId,
          { stripePriceId: '' },
          { userId: premiumUserId, userRole: 'USER' }
        )
      ).rejects.toThrow();
    });

    it('should rollback transaction on error', async () => {
      const balanceBefore = (
        await prisma.subscription.findUnique({ where: { userId: premiumUserId } })
      )?.creditsBalance;

      const transactionCountBefore = await prisma.creditTransaction.count({
        where: { subscriptionId: premiumSubscriptionId },
      });

      // Attempt purchase with invalid data (empty stripePriceId)
      try {
        await service.purchaseAdditionalAssessment(
          premiumUserId,
          { stripePriceId: '' },
          { userId: premiumUserId, userRole: 'USER' }
        );
      } catch (error) {
        // Expected to fail
      }

      const balanceAfter = (
        await prisma.subscription.findUnique({ where: { userId: premiumUserId } })
      )?.creditsBalance;

      const transactionCountAfter = await prisma.creditTransaction.count({
        where: { subscriptionId: premiumSubscriptionId },
      });

      // Balance and transaction count should not change
      expect(balanceAfter).toBe(balanceBefore);
      expect(transactionCountAfter).toBe(transactionCountBefore);
    });
  });

  describe('Authorization', () => {
    it('should allow user to purchase for themselves', async () => {
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      expect(response.success).toBe(true);
    });

    it('should allow admin to purchase for any user', async () => {
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: 'admin-123', userRole: 'ADMIN' }
      );

      expect(response.success).toBe(true);
    });

    it('should reject unauthorized user purchase', async () => {
      await expect(
        service.purchaseAdditionalAssessment(
          premiumUserId,
          { stripePriceId: 'price_test' },
          { userId: 'other-user-id', userRole: 'USER' }
        )
      ).rejects.toThrow();
    });
  });

  describe('Transaction atomicity', () => {
    it('should update both balance and creditsPurchased atomically', async () => {
      await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const subscription = await prisma.subscription.findUnique({
        where: { userId: premiumUserId },
      });

      const transactions = await prisma.creditTransaction.findMany({
        where: { subscriptionId: premiumSubscriptionId },
      });

      // Both updates should have succeeded
      expect(subscription?.creditsBalance).toBe(100);
      expect(subscription?.creditsPurchased).toBe(150);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should create transaction with correct balance snapshot', async () => {
      // Balance before: 50
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const transaction = await prisma.creditTransaction.findFirst({
        where: {
          subscriptionId: premiumSubscriptionId,
          type: 'PURCHASE',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transaction should record new balance
      expect(transaction?.balance).toBe(100); // 50 + 50
      expect(transaction?.balance).toBe(response.data.newBalance);
    });
  });

  describe('Credit amounts', () => {
    it('should add exactly 50 credits', async () => {
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      expect(response.data.creditsAdded).toBe(50);
    });

    it('should use PRICING.ADDITIONAL_ASSESSMENT constant', async () => {
      const response = await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const transaction = await prisma.creditTransaction.findFirst({
        where: {
          subscriptionId: premiumSubscriptionId,
          type: 'PURCHASE',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Should use price from PRICING constant (€299 = 29900 cents)
      expect((transaction?.metadata as any).amount).toBe(29900);
    });
  });

  describe('Audit logging', () => {
    it('should log purchase to audit trail', async () => {
      await service.purchaseAdditionalAssessment(
        premiumUserId,
        { stripePriceId: 'price_test' },
        { userId: premiumUserId, userRole: 'USER' }
      );

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity: 'Subscription',
          entityId: premiumSubscriptionId,
          action: 'CREDITS_PURCHASED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs.length).toBe(1);
      expect((auditLogs[0].newValues as any).creditsAdded).toBe(50);
      expect((auditLogs[0].newValues as any).newBalance).toBe(100);
      expect((auditLogs[0].newValues as any).amount).toBe(299); // In euros
    });
  });
});
