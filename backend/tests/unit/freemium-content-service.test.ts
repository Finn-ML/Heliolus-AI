import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FreemiumContentService } from '../../src/services/freemium-content.service';
import { PrismaClient, SubscriptionPlan } from '../../src/generated/prisma';

describe('FreemiumContentService', () => {
  let service: FreemiumContentService;
  let prisma: PrismaClient;
  let freeUserId: string;
  let premiumUserId: string;

  beforeAll(async () => {
    service = new FreemiumContentService();
    prisma = new PrismaClient();

    // Create FREE user
    const freeUser = await prisma.user.create({
      data: {
        email: 'freemium-test@example.com',
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

    // Create PREMIUM user
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium-test@example.com',
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
    await prisma.user.deleteMany({
      where: { id: { in: [freeUserId, premiumUserId] } }
    });
    await prisma.$disconnect();
  });

  describe('generateMockedGapAnalysis', () => {
    it('should return 3-5 mocked gaps', async () => {
      const gaps = await service.generateMockedGapAnalysis('test-assessment-1');

      expect(gaps.length).toBeGreaterThanOrEqual(3);
      expect(gaps.length).toBeLessThanOrEqual(5);
    });

    it('should mark all gaps as restricted', async () => {
      const gaps = await service.generateMockedGapAnalysis('test-assessment-2');

      gaps.forEach(gap => {
        expect(gap.isRestricted).toBe(true);
        expect(gap.description).toContain('[UNLOCK PREMIUM TO SEE DETAILS]');
      });
    });

    it('should match Gap model structure', async () => {
      const gaps = await service.generateMockedGapAnalysis('test-assessment-3');

      gaps.forEach(gap => {
        expect(gap).toHaveProperty('id');
        expect(gap).toHaveProperty('assessmentId');
        expect(gap).toHaveProperty('category');
        expect(gap).toHaveProperty('title');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('severity');
        expect(gap).toHaveProperty('priority');
        expect(gap).toHaveProperty('createdAt');
        expect(gap.category).toBe('HIDDEN_ANALYSIS');
        expect(gap.priority).toBe('MEDIUM');
      });
    });

    it('should have varying severity levels', async () => {
      const gaps = await service.generateMockedGapAnalysis('test-assessment-4');

      // Should have different severities (HIGH, MEDIUM, LOW)
      const severities = new Set(gaps.map(g => g.severity));
      expect(severities.size).toBeGreaterThan(1); // At least 2 different severities
    });

    it('should not include remediation data', async () => {
      const gaps = await service.generateMockedGapAnalysis('test-assessment-5');

      gaps.forEach(gap => {
        expect(gap.estimatedCost).toBeNull();
        expect(gap.estimatedEffort).toBeNull();
        expect(gap.suggestedVendors).toEqual([]);
        expect(gap.priorityScore).toBeNull();
      });
    });
  });

  describe('generateMockedStrategyMatrix', () => {
    it('should return blurred strategy matrix', async () => {
      const matrix = await service.generateMockedStrategyMatrix('test-assessment-6');

      expect(matrix.isRestricted).toBe(true);
      expect(matrix.summary).toContain('Upgrade to Premium');
      expect(matrix.assessmentId).toBe('test-assessment-6');
    });

    it('should have generic matrix coordinates', async () => {
      const matrix = await service.generateMockedStrategyMatrix('test-assessment-7');

      expect(matrix.matrix).toBeDefined();
      expect(Array.isArray(matrix.matrix)).toBe(true);
      expect(matrix.matrix.length).toBeGreaterThan(0);

      matrix.matrix.forEach(item => {
        expect(item.items).toContain('[DETAILS HIDDEN]');
      });
    });
  });

  describe('shouldGenerateRealAnalysis', () => {
    it('should return false for FREE plan user', async () => {
      const result = await service.shouldGenerateRealAnalysis(freeUserId);

      expect(result).toBe(false);
    });

    it('should return true for PREMIUM plan user', async () => {
      const result = await service.shouldGenerateRealAnalysis(premiumUserId);

      expect(result).toBe(true);
    });

    it('should return false if subscription not found', async () => {
      const result = await service.shouldGenerateRealAnalysis('nonexistent-user');

      expect(result).toBe(false);
    });

    it('should return true for ENTERPRISE plan user', async () => {
      // Create ENTERPRISE user
      const enterpriseUser = await prisma.user.create({
        data: {
          email: 'enterprise-test@example.com',
          firstName: 'Enterprise',
          lastName: 'User',
          password: 'hashed',
          subscription: {
            create: {
              plan: SubscriptionPlan.ENTERPRISE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
            },
          },
        },
      });

      const result = await service.shouldGenerateRealAnalysis(enterpriseUser.id);

      expect(result).toBe(true);

      // Cleanup
      await prisma.user.delete({ where: { id: enterpriseUser.id } });
    });
  });

  describe('API Cost Optimization', () => {
    it('should NOT import OpenAI (cost optimization)', () => {
      // This is a meta test - verify service doesn't use OpenAI
      const serviceCode = FreemiumContentService.toString();
      expect(serviceCode).not.toContain('openai');
      expect(serviceCode).not.toContain('OpenAI');
    });

    it('should generate content in-memory (fast)', async () => {
      const startTime = Date.now();

      await service.generateMockedGapAnalysis('perf-test');

      const duration = Date.now() - startTime;

      // Should be very fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
