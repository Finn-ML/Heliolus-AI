import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionService, CREDIT_ALLOCATION } from '../../src/services/subscription.service';
import { SubscriptionPlan } from '../../src/generated/prisma';

describe('getInitialCredits Helper Method', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  describe('Credit allocation per plan', () => {
    it('should return 0 credits for FREE plan', () => {
      // Access private method via type assertion for testing
      const initialCredits = (service as any).getInitialCredits(SubscriptionPlan.FREE);

      expect(initialCredits).toBe(0);
    });

    it('should return 100 credits for PREMIUM plan', () => {
      const initialCredits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);

      expect(initialCredits).toBe(100);
    });

    it('should return 0 credits for ENTERPRISE plan', () => {
      const initialCredits = (service as any).getInitialCredits(SubscriptionPlan.ENTERPRISE);

      expect(initialCredits).toBe(0);
    });
  });

  describe('Consistency with CREDIT_ALLOCATION', () => {
    it('should match CREDIT_ALLOCATION.FREE', () => {
      const helperResult = (service as any).getInitialCredits(SubscriptionPlan.FREE);
      const constantResult = CREDIT_ALLOCATION.FREE;

      expect(helperResult).toBe(constantResult);
      expect(helperResult).toBe(0);
    });

    it('should match CREDIT_ALLOCATION.PREMIUM', () => {
      const helperResult = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);
      const constantResult = CREDIT_ALLOCATION.PREMIUM;

      expect(helperResult).toBe(constantResult);
      expect(helperResult).toBe(100);
    });

    it('should match CREDIT_ALLOCATION.ENTERPRISE', () => {
      const helperResult = (service as any).getInitialCredits(SubscriptionPlan.ENTERPRISE);
      const constantResult = CREDIT_ALLOCATION.ENTERPRISE;

      expect(helperResult).toBe(constantResult);
      expect(helperResult).toBe(0);
    });

    it('should match CREDIT_ALLOCATION for all plans', () => {
      const plans = [SubscriptionPlan.FREE, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE];

      plans.forEach((plan) => {
        const helperResult = (service as any).getInitialCredits(plan);
        const constantResult = CREDIT_ALLOCATION[plan];

        expect(helperResult).toBe(constantResult);
      });
    });
  });

  describe('Credit rationale', () => {
    it('FREE plan gets 0 credits (limited by quota system)', () => {
      const credits = (service as any).getInitialCredits(SubscriptionPlan.FREE);

      // FREE users limited to 2 assessments via UserAssessmentQuota, not credit system
      expect(credits).toBe(0);
    });

    it('PREMIUM plan gets 100 credits (sufficient for ~2 assessments)', () => {
      const credits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);

      // 100 credits allows ~2 assessments at 50 credits each
      expect(credits).toBe(100);
      expect(credits / 50).toBe(2); // Number of assessments
    });

    it('ENTERPRISE plan gets 0 credits (admin grants manually)', () => {
      const credits = (service as any).getInitialCredits(SubscriptionPlan.ENTERPRISE);

      // Enterprise credits granted via AdminCreditService, not on subscription creation
      expect(credits).toBe(0);
    });
  });

  describe('Return type', () => {
    it('should return a number', () => {
      const plans = [SubscriptionPlan.FREE, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE];

      plans.forEach((plan) => {
        const result = (service as any).getInitialCredits(plan);
        expect(typeof result).toBe('number');
      });
    });

    it('should return non-negative number', () => {
      const plans = [SubscriptionPlan.FREE, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE];

      plans.forEach((plan) => {
        const result = (service as any).getInitialCredits(plan);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return integer', () => {
      const plans = [SubscriptionPlan.FREE, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE];

      plans.forEach((plan) => {
        const result = (service as any).getInitialCredits(plan);
        expect(Number.isInteger(result)).toBe(true);
      });
    });
  });

  describe('Usage in createSubscription', () => {
    it('should be used for creditsBalance initialization', () => {
      // This test verifies the helper is used in createSubscription
      // The actual integration is tested in subscription-creation-billing-cycle.test.ts

      const freeCredits = (service as any).getInitialCredits(SubscriptionPlan.FREE);
      const premiumCredits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);
      const enterpriseCredits = (service as any).getInitialCredits(SubscriptionPlan.ENTERPRISE);

      // Verify values are correct for subscription creation
      expect(freeCredits).toBe(0);
      expect(premiumCredits).toBe(100);
      expect(enterpriseCredits).toBe(0);
    });
  });

  describe('Comparison with direct CREDIT_ALLOCATION access', () => {
    it('helper method provides same result as direct access', () => {
      // Helper method
      const helperResult = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);

      // Direct access (old approach)
      const directResult = CREDIT_ALLOCATION[SubscriptionPlan.PREMIUM];

      expect(helperResult).toBe(directResult);
    });

    it('helper method is clearer than direct access', () => {
      // This test documents the benefit of using the helper

      // Clearer intent:
      const creditsViaHelper = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);

      // Less clear:
      const creditsViaDirect = CREDIT_ALLOCATION[SubscriptionPlan.PREMIUM];

      expect(creditsViaHelper).toBe(creditsViaDirect);
      expect(creditsViaHelper).toBe(100);
    });
  });

  describe('Encapsulation benefits', () => {
    it('private method encapsulates credit allocation logic', () => {
      // Private method ensures credit logic is centralized
      // Future changes to credit allocation only require updating one method

      const freeCredits = (service as any).getInitialCredits(SubscriptionPlan.FREE);
      const premiumCredits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);

      // Method provides consistent interface
      expect(typeof freeCredits).toBe('number');
      expect(typeof premiumCredits).toBe('number');
    });

    it('method can be extended with additional logic in future', () => {
      // Current: Returns CREDIT_ALLOCATION[plan]
      // Future: Could add promotional bonuses, regional adjustments, etc.

      const baseCredits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);
      expect(baseCredits).toBe(100);

      // Future enhancement example (not implemented):
      // const bonusCredits = isFirstTimeUser ? 50 : 0;
      // return CREDIT_ALLOCATION[plan] + bonusCredits;
    });
  });

  describe('Type safety', () => {
    it('accepts valid SubscriptionPlan enum values', () => {
      // TypeScript ensures only valid plan types accepted
      const validPlans = [
        SubscriptionPlan.FREE,
        SubscriptionPlan.PREMIUM,
        SubscriptionPlan.ENTERPRISE,
      ];

      validPlans.forEach((plan) => {
        expect(() => {
          (service as any).getInitialCredits(plan);
        }).not.toThrow();
      });
    });
  });

  describe('Integration with credit system', () => {
    it('PREMIUM credits sufficient for 2 assessments', () => {
      const premiumCredits = (service as any).getInitialCredits(SubscriptionPlan.PREMIUM);
      const creditsPerAssessment = 50; // From PRICING.ADDITIONAL_ASSESSMENT

      const assessmentsAllowed = premiumCredits / creditsPerAssessment;
      expect(assessmentsAllowed).toBe(2);
    });

    it('FREE credits do not allow any assessments via credit system', () => {
      const freeCredits = (service as any).getInitialCredits(SubscriptionPlan.FREE);

      // FREE users use quota system, not credit system
      expect(freeCredits).toBe(0);
    });

    it('ENTERPRISE starts with 0 to prevent automatic allocation', () => {
      const enterpriseCredits = (service as any).getInitialCredits(SubscriptionPlan.ENTERPRISE);

      // Prevents automatic credit allocation before contract finalized
      expect(enterpriseCredits).toBe(0);
    });
  });
});
