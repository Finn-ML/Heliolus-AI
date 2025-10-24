import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AdminCreditService } from '../../src/services/admin-credit.service';
import { PrismaClient, SubscriptionPlan, UserRole } from '../../src/generated/prisma';

describe('AdminCreditService', () => {
  let service: AdminCreditService;
  let prisma: PrismaClient;
  let adminUserId: string;
  let enterpriseUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    service = new AdminCreditService();
    prisma = new PrismaClient();

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'hashed',
        role: UserRole.ADMIN,
      },
    });
    adminUserId = admin.id;

    // Create enterprise user with subscription
    const enterprise = await prisma.user.create({
      data: {
        email: 'enterprise@example.com',
        firstName: 'Enterprise',
        lastName: 'User',
        password: 'hashed',
        subscription: {
          create: {
            plan: SubscriptionPlan.ENTERPRISE,
            creditsBalance: 0,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
          },
        },
      },
    });
    enterpriseUserId = enterprise.id;

    // Create regular user
    const regular = await prisma.user.create({
      data: {
        email: 'regular@example.com',
        firstName: 'Regular',
        lastName: 'User',
        password: 'hashed',
        role: UserRole.USER,
      },
    });
    regularUserId = regular.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, enterpriseUserId, regularUserId] } }
    });
    await prisma.$disconnect();
  });

  describe('addCreditsToUser', () => {
    it('should grant credits when admin', async () => {
      const transaction = await service.addCreditsToUser(
        enterpriseUserId,
        100,
        'Q1 2025 allocation',
        { userId: adminUserId, userRole: 'ADMIN' }
      );

      expect(transaction.type).toBe('ADMIN_GRANT');
      expect(transaction.amount).toBe(100);
      expect(transaction.balance).toBe(100);
      expect(transaction.description).toBe('Q1 2025 allocation');
      expect(transaction.metadata).toHaveProperty('grantedBy', adminUserId);
    });

    it('should throw 403 when non-admin', async () => {
      await expect(
        service.addCreditsToUser(
          enterpriseUserId,
          100,
          'Unauthorized attempt',
          { userId: regularUserId, userRole: 'USER' }
        )
      ).rejects.toThrow('Admin role required');
    });

    it('should throw 404 when subscription not found', async () => {
      await expect(
        service.addCreditsToUser(
          'nonexistent-user',
          100,
          'Test',
          { userId: adminUserId, userRole: 'ADMIN' }
        )
      ).rejects.toThrow('User subscription not found');
    });

    it('should throw 400 when amount is zero or negative', async () => {
      await expect(
        service.addCreditsToUser(
          enterpriseUserId,
          0,
          'Invalid',
          { userId: adminUserId, userRole: 'ADMIN' }
        )
      ).rejects.toThrow('Credit amount must be positive');

      await expect(
        service.addCreditsToUser(
          enterpriseUserId,
          -50,
          'Invalid negative',
          { userId: adminUserId, userRole: 'ADMIN' }
        )
      ).rejects.toThrow('Credit amount must be positive');
    });

    it('should throw 400 when reason is empty', async () => {
      await expect(
        service.addCreditsToUser(
          enterpriseUserId,
          100,
          '',
          { userId: adminUserId, userRole: 'ADMIN' }
        )
      ).rejects.toThrow('Reason is required');
    });

    it('should update subscription balance atomically', async () => {
      const before = await prisma.subscription.findUnique({
        where: { userId: enterpriseUserId },
      });

      await service.addCreditsToUser(
        enterpriseUserId,
        50,
        'Test increment',
        { userId: adminUserId, userRole: 'ADMIN' }
      );

      const after = await prisma.subscription.findUnique({
        where: { userId: enterpriseUserId },
      });

      expect(after?.creditsBalance).toBe((before?.creditsBalance || 0) + 50);
    });
  });

  describe('getUserCreditHistory', () => {
    it('should return transactions ordered by date desc', async () => {
      // Grant credits twice
      await service.addCreditsToUser(
        enterpriseUserId,
        25,
        'First grant',
        { userId: adminUserId, userRole: 'ADMIN' }
      );

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await service.addCreditsToUser(
        enterpriseUserId,
        75,
        'Second grant',
        { userId: adminUserId, userRole: 'ADMIN' }
      );

      const history = await service.getUserCreditHistory(enterpriseUserId);

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].description).toBe('Second grant'); // Most recent first
      expect(history[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        history[1].createdAt.getTime()
      );
    });

    it('should throw 404 if subscription not found', async () => {
      await expect(
        service.getUserCreditHistory('nonexistent-user')
      ).rejects.toThrow('User subscription not found');
    });

    it('should return empty array for user with no transactions', async () => {
      // Create new user with no credit history
      const newUser = await prisma.user.create({
        data: {
          email: 'new-user@example.com',
          firstName: 'New',
          lastName: 'User',
          password: 'hashed',
          subscription: {
            create: {
              plan: SubscriptionPlan.PREMIUM,
              creditsBalance: 0,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
            },
          },
        },
      });

      const history = await service.getUserCreditHistory(newUser.id);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });
});
