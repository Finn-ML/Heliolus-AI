/**
 * Payment configuration
 * Separate file to avoid circular dependencies
 */

export const PAYMENT_CONFIG = {
  stripe: {
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_',
    apiVersion: '2024-11-20.acacia' as const,
    timeout: 30000
  },
  subscriptions: {
    plans: {
      FREE: { price: 0, credits: 10, features: ['basic_assessments'] },
      PREMIUM: { price: 59900, credits: 100, features: ['advanced_assessments', 'ai_analysis', 'priority_support'] }, // €599
      ENTERPRISE: { price: 0, credits: 1000, features: ['all_features', 'custom_templates', 'dedicated_support'] } // Custom pricing
    },
    trialPeriodDays: 14,
    gracePeriodDays: 3
  },
  credits: {
    bonusCredits: {
      firstPurchase: 10,
      referral: 25,
      loyaltyThreshold: 500
    },
    packages: {
      small: { credits: 50, price: 2900 }, // €29
      medium: { credits: 150, price: 7900 }, // €79
      large: { credits: 400, price: 19900 }, // €199
      enterprise: { credits: 1000, price: 39900 } // €399
    }
  },
  invoicing: {
    daysUntilDue: 30,
    lateFeePercentage: 2.5,
    currency: 'EUR',
    taxRate: 0.21 // 21% VAT for EU
  }
} as const;
