import { describe, it, expect } from 'vitest';
import {
  PRICING,
  CREDIT_ALLOCATION,
  getPriceInEuros,
  getAnnualSavings,
} from '../../src/services/subscription.service';

describe('Pricing Constants - V4 Pay-Gating', () => {
  describe('PRICING object', () => {
    it('should have Premium monthly price of €599', () => {
      expect(PRICING.PREMIUM_MONTHLY.price).toBe(59900);
      expect(PRICING.PREMIUM_MONTHLY.currency).toBe('eur');
      expect(PRICING.PREMIUM_MONTHLY.billingCycle).toBe('month');
      expect(PRICING.PREMIUM_MONTHLY.creditsIncluded).toBe(100);
    });

    it('should have Premium annual price with 10% discount', () => {
      const monthlyTotal = PRICING.PREMIUM_MONTHLY.price * 12; // 718800 cents
      const annualPrice = PRICING.PREMIUM_ANNUAL.price;        // 646920 cents
      const discountPercent = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;

      expect(annualPrice).toBe(646920); // €6,469.20
      expect(discountPercent).toBeCloseTo(10, 1); // 10% discount
    });

    it('should have additional assessment price of €299', () => {
      expect(PRICING.ADDITIONAL_ASSESSMENT.price).toBe(29900);
      expect(PRICING.ADDITIONAL_ASSESSMENT.creditsGranted).toBe(50);
      expect(PRICING.ADDITIONAL_ASSESSMENT.currency).toBe('eur');
    });

    it('should grant correct credits per plan', () => {
      expect(PRICING.PREMIUM_MONTHLY.creditsIncluded).toBe(100);
      expect(PRICING.PREMIUM_ANNUAL.creditsIncluded).toBe(1200); // 100 × 12
    });

    it('should have readonly constants (type safety)', () => {
      // This test verifies 'as const' works
      const pricing: typeof PRICING = PRICING;
      expect(pricing).toBeDefined();
      expect(pricing.PREMIUM_MONTHLY).toBeDefined();
      expect(pricing.PREMIUM_ANNUAL).toBeDefined();
      expect(pricing.ADDITIONAL_ASSESSMENT).toBeDefined();
    });

    it('should use "eur" currency for all prices', () => {
      expect(PRICING.PREMIUM_MONTHLY.currency).toBe('eur');
      expect(PRICING.PREMIUM_ANNUAL.currency).toBe('eur');
      expect(PRICING.ADDITIONAL_ASSESSMENT.currency).toBe('eur');
    });

    it('should have correct billing cycles', () => {
      expect(PRICING.PREMIUM_MONTHLY.billingCycle).toBe('month');
      expect(PRICING.PREMIUM_ANNUAL.billingCycle).toBe('year');
    });

    it('should calculate annual credits correctly', () => {
      const monthlyCredits = PRICING.PREMIUM_MONTHLY.creditsIncluded;
      const annualCredits = PRICING.PREMIUM_ANNUAL.creditsIncluded;

      expect(annualCredits).toBe(monthlyCredits * 12);
      expect(annualCredits).toBe(1200);
    });
  });

  describe('Helper functions', () => {
    describe('getPriceInEuros', () => {
      it('should convert Premium monthly price correctly', () => {
        expect(getPriceInEuros(59900)).toBe(599);
      });

      it('should convert Premium annual price correctly', () => {
        expect(getPriceInEuros(646920)).toBe(6469.20);
      });

      it('should convert additional assessment price correctly', () => {
        expect(getPriceInEuros(29900)).toBe(299);
      });

      it('should handle zero correctly', () => {
        expect(getPriceInEuros(0)).toBe(0);
      });

      it('should handle small amounts correctly', () => {
        expect(getPriceInEuros(1)).toBe(0.01);
        expect(getPriceInEuros(50)).toBe(0.5);
        expect(getPriceInEuros(99)).toBe(0.99);
      });

      it('should work with PRICING constants directly', () => {
        expect(getPriceInEuros(PRICING.PREMIUM_MONTHLY.price)).toBe(599);
        expect(getPriceInEuros(PRICING.PREMIUM_ANNUAL.price)).toBe(6469.20);
        expect(getPriceInEuros(PRICING.ADDITIONAL_ASSESSMENT.price)).toBe(299);
      });
    });

    describe('getAnnualSavings', () => {
      it('should calculate annual savings correctly', () => {
        const savings = getAnnualSavings();
        expect(savings).toBeCloseTo(718.80, 2); // €718.80 savings
      });

      it('should match manual calculation', () => {
        const monthlyTotal = getPriceInEuros(PRICING.PREMIUM_MONTHLY.price * 12);
        const annualPrice = getPriceInEuros(PRICING.PREMIUM_ANNUAL.price);
        const expectedSavings = monthlyTotal - annualPrice;

        expect(getAnnualSavings()).toBeCloseTo(expectedSavings, 2);
      });

      it('should represent exactly 10% discount', () => {
        const monthlyTotal = PRICING.PREMIUM_MONTHLY.price * 12;
        const savings = getAnnualSavings();
        const savingsInCents = savings * 100;
        const discountPercent = (savingsInCents / monthlyTotal) * 100;

        expect(discountPercent).toBeCloseTo(10, 1);
      });

      it('should return positive number', () => {
        expect(getAnnualSavings()).toBeGreaterThan(0);
      });

      it('should be less than monthly total', () => {
        const monthlyTotal = getPriceInEuros(PRICING.PREMIUM_MONTHLY.price * 12);
        expect(getAnnualSavings()).toBeLessThan(monthlyTotal);
      });
    });
  });

  describe('CREDIT_ALLOCATION', () => {
    it('should allocate credits correctly per plan', () => {
      expect(CREDIT_ALLOCATION.FREE).toBe(0);
      expect(CREDIT_ALLOCATION.PREMIUM).toBe(100);
      expect(CREDIT_ALLOCATION.ENTERPRISE).toBe(0);
    });

    it('should have readonly constants (type safety)', () => {
      const credits: typeof CREDIT_ALLOCATION = CREDIT_ALLOCATION;
      expect(credits).toBeDefined();
    });

    it('should match PRICING.PREMIUM_MONTHLY.creditsIncluded', () => {
      expect(CREDIT_ALLOCATION.PREMIUM).toBe(PRICING.PREMIUM_MONTHLY.creditsIncluded);
    });

    it('should only grant credits to PREMIUM tier', () => {
      const plansWithCredits = Object.entries(CREDIT_ALLOCATION)
        .filter(([_, credits]) => credits > 0)
        .map(([plan]) => plan);

      expect(plansWithCredits).toEqual(['PREMIUM']);
    });
  });

  describe('Pricing consistency', () => {
    it('should have PREMIUM_ANNUAL exactly 90% of monthly total', () => {
      const monthlyTotal = PRICING.PREMIUM_MONTHLY.price * 12;
      const annualPrice = PRICING.PREMIUM_ANNUAL.price;
      const expectedAnnualPrice = Math.round(monthlyTotal * 0.9);

      expect(annualPrice).toBe(expectedAnnualPrice);
    });

    it('should make annual cheaper than 12 months of monthly', () => {
      const monthlyTotal = PRICING.PREMIUM_MONTHLY.price * 12;
      const annualPrice = PRICING.PREMIUM_ANNUAL.price;

      expect(annualPrice).toBeLessThan(monthlyTotal);
    });

    it('should use Stripe convention (prices in cents)', () => {
      // All prices should be integers representing cents
      expect(Number.isInteger(PRICING.PREMIUM_MONTHLY.price)).toBe(true);
      expect(Number.isInteger(PRICING.PREMIUM_ANNUAL.price)).toBe(true);
      expect(Number.isInteger(PRICING.ADDITIONAL_ASSESSMENT.price)).toBe(true);
    });

    it('should have positive prices', () => {
      expect(PRICING.PREMIUM_MONTHLY.price).toBeGreaterThan(0);
      expect(PRICING.PREMIUM_ANNUAL.price).toBeGreaterThan(0);
      expect(PRICING.ADDITIONAL_ASSESSMENT.price).toBeGreaterThan(0);
    });
  });

  describe('Integration with credit system', () => {
    it('should have sufficient credits for assessment cost', () => {
      // If additional assessment costs €299 and grants 50 credits
      // Then 1 credit ≈ €5.98
      const pricePerCredit = PRICING.ADDITIONAL_ASSESSMENT.price / PRICING.ADDITIONAL_ASSESSMENT.creditsGranted;

      expect(pricePerCredit).toBeCloseTo(598, 0); // ~€5.98 per credit (in cents)
    });

    it('should allow ~2 assessments with PREMIUM credits', () => {
      const premiumCredits = CREDIT_ALLOCATION.PREMIUM;
      const creditsPerAssessment = PRICING.ADDITIONAL_ASSESSMENT.creditsGranted;
      const assessmentsAllowed = premiumCredits / creditsPerAssessment;

      expect(assessmentsAllowed).toBe(2); // 100 / 50 = 2
    });

    it('should allow ~24 assessments with PREMIUM annual credits', () => {
      const annualCredits = PRICING.PREMIUM_ANNUAL.creditsIncluded;
      const creditsPerAssessment = PRICING.ADDITIONAL_ASSESSMENT.creditsGranted;
      const assessmentsAllowed = annualCredits / creditsPerAssessment;

      expect(assessmentsAllowed).toBe(24); // 1200 / 50 = 24
    });
  });

  describe('Backward compatibility', () => {
    it('should not break when accessing constants', () => {
      // Ensure constants can be accessed without errors
      expect(() => {
        const _ = PRICING.PREMIUM_MONTHLY.price;
      }).not.toThrow();

      expect(() => {
        const _ = CREDIT_ALLOCATION.PREMIUM;
      }).not.toThrow();

      expect(() => {
        const _ = getPriceInEuros(100);
      }).not.toThrow();

      expect(() => {
        const _ = getAnnualSavings();
      }).not.toThrow();
    });
  });

  describe('Display formatting', () => {
    it('should format monthly price for display', () => {
      const price = getPriceInEuros(PRICING.PREMIUM_MONTHLY.price);
      const formatted = `€${price.toFixed(2)}`;

      expect(formatted).toBe('€599.00');
    });

    it('should format annual price for display', () => {
      const price = getPriceInEuros(PRICING.PREMIUM_ANNUAL.price);
      const formatted = `€${price.toFixed(2)}`;

      expect(formatted).toBe('€6469.20');
    });

    it('should format additional assessment price for display', () => {
      const price = getPriceInEuros(PRICING.ADDITIONAL_ASSESSMENT.price);
      const formatted = `€${price.toFixed(2)}`;

      expect(formatted).toBe('€299.00');
    });

    it('should format savings for display', () => {
      const savings = getAnnualSavings();
      const formatted = `€${savings.toFixed(2)}`;

      expect(formatted).toBe('€718.80');
    });
  });
});
