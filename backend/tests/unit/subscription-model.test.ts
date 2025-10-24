import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, BillingCycle, SubscriptionPlan } from '../../src/generated/prisma';

describe('Subscription Billing Cycle Fields', () => {
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'billing-test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup - delete user (cascade will delete subscription)
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should create subscription with MONTHLY billing cycle', async () => {
    const subscription = await prisma.subscription.create({
      data: {
        userId: testUserId,
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: BillingCycle.MONTHLY,
        billingEmail: 'billing@example.com',
        renewalDate: new Date('2025-11-01'),
        stripePriceId: 'price_monthly_599',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      },
    });

    expect(subscription.billingCycle).toBe(BillingCycle.MONTHLY);
    expect(subscription.billingEmail).toBe('billing@example.com');
    expect(subscription.stripePriceId).toBe('price_monthly_599');
    expect(subscription.renewalDate).toBeInstanceOf(Date);
  });

  it('should create subscription with ANNUAL billing cycle', async () => {
    // Update existing subscription
    const subscription = await prisma.subscription.update({
      where: { userId: testUserId },
      data: {
        billingCycle: BillingCycle.ANNUAL,
        stripePriceId: 'price_annual_5990',
      },
    });

    expect(subscription.billingCycle).toBe(BillingCycle.ANNUAL);
    expect(subscription.stripePriceId).toBe('price_annual_5990');
  });

  it('should create FREE subscription with NULL billing cycle', async () => {
    // Create another user with FREE plan
    const freeUser = await prisma.user.create({
      data: {
        email: 'free-user@example.com',
        firstName: 'Free',
        lastName: 'User',
        password: 'hashed',
        subscription: {
          create: {
            plan: SubscriptionPlan.FREE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            // billingCycle is NULL (not set)
          },
        },
      },
      include: { subscription: true },
    });

    expect(freeUser.subscription?.billingCycle).toBeNull();
    expect(freeUser.subscription?.billingEmail).toBeNull();
    expect(freeUser.subscription?.renewalDate).toBeNull();
    expect(freeUser.subscription?.stripePriceId).toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: freeUser.id } });
  });

  it('should allow all new fields to be NULL', async () => {
    const enterpriseUser = await prisma.user.create({
      data: {
        email: 'enterprise@example.com',
        firstName: 'Enterprise',
        lastName: 'User',
        password: 'hashed',
        subscription: {
          create: {
            plan: SubscriptionPlan.ENTERPRISE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            billingCycle: null,
            billingEmail: null,
            renewalDate: null,
            stripePriceId: null,
          },
        },
      },
      include: { subscription: true },
    });

    expect(enterpriseUser.subscription).toBeDefined();
    expect(enterpriseUser.subscription?.billingCycle).toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: enterpriseUser.id } });
  });

  it('should verify BillingCycle enum values exist', () => {
    expect(BillingCycle.MONTHLY).toBe('MONTHLY');
    expect(BillingCycle.ANNUAL).toBe('ANNUAL');
  });
});
