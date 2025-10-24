/**
 * Subscription Service
 * Handles subscription management, billing, and credit system
 * Uses payment-lib for Stripe integration and billing operations
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseSubscription,
  DatabaseInvoice,
  DatabaseCreditTransaction,
  SubscriptionPlan,
  SubscriptionStatus,
  TransactionType,
  InvoiceStatus,
  UserRole,
  BillingCycle,
} from '../types/database';
import {
  createStripeCustomer,
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  createStripePaymentMethod,
  getStripeInvoice,
} from '../lib/payment';

// Validation schemas
const CreateSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().min(0).max(90).optional(),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional(),
  billingEmail: z.string().email().optional(),
});

const UpdateSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan).optional(),
  paymentMethodId: z.string().optional(),
});

const AddCreditsSchema = z.object({
  amount: z.number().min(1, 'Credit amount must be positive'),
  description: z.string().max(200),
  metadata: z.record(z.any()).optional(),
});

const DeductCreditsSchema = z.object({
  amount: z.number().min(1, 'Credit amount must be positive'),
  type: z.nativeEnum(TransactionType),
  description: z.string().max(200),
  assessmentId: z.string().cuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const PurchaseAdditionalAssessmentSchema = z.object({
  stripePriceId: z.string().min(1, 'Stripe price ID required'),
  stripePaymentMethodId: z.string().optional(),
});

export interface SubscriptionWithDetails extends DatabaseSubscription {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: true;
  };
  _count: {
    invoices: number;
    creditTransactions: number;
  };
}

export interface CreditBalance {
  balance: number;
  used: number;
  purchased: number;
  pendingDeductions: number;
}

export interface BillingHistory {
  invoices: DatabaseInvoice[];
  transactions: DatabaseCreditTransaction[];
  total: number;
}

export interface SubscriptionUsage {
  currentPeriod: {
    start: Date;
    end: Date;
    creditsUsed: number;
    assessmentsCompleted: number;
  };
  limits: {
    creditsPerMonth: number;
    assessmentsPerMonth: number;
    documentsPerMonth: number;
  };
}

// Plan configurations
/**
 * @deprecated Use PRICING constants for V4 Pay-Gating implementation
 * This config remains for backward compatibility but will be removed
 */
export const PLAN_CONFIGS = {
  [SubscriptionPlan.FREE]: {
    price: 0,
    currency: 'EUR',
    creditsPerMonth: 1,
    assessmentsPerMonth: 1,
    documentsPerMonth: 5,
    features: [
      '1 assessment per month',
      'Basic risk analysis',
      'Limited report access',
      'Email support',
    ],
    credits: 1,
  },
  [SubscriptionPlan.PREMIUM]: {
    price: 599,
    currency: 'EUR',
    creditsPerMonth: 50,
    assessmentsPerMonth: 10,
    documentsPerMonth: 50,
    features: [
      'Unlimited assessments',
      'Advanced AI analysis',
      'Full report downloads',
      'Vendor marketplace access',
      'Priority support',
      'Export capabilities',
    ],
    credits: 50,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 1999,
    currency: 'EUR',
    creditsPerMonth: 200,
    assessmentsPerMonth: -1, // Unlimited
    documentsPerMonth: -1, // Unlimited
    features: [
      'Everything in Premium',
      'Custom templates',
      'API access',
      'Dedicated support',
      'Multi-user management',
      'Custom integrations',
      'Advanced analytics',
    ],
    credits: 200,
  },
};

/**
 * V4 Pay-Gating Pricing Configuration
 *
 * All prices in cents per Stripe convention.
 *
 * PREMIUM_MONTHLY: €599/month subscription
 * PREMIUM_ANNUAL: €6,469.20/year subscription (10% discount)
 * ADDITIONAL_ASSESSMENT: €299 per additional assessment
 *
 * @see docs/V4_REVISED_PAY_GATING_PLAN.md
 */
export const PRICING = {
  PREMIUM_MONTHLY: {
    price: 59900,           // €599.00 per month
    currency: 'eur',
    billingCycle: 'month',
    creditsIncluded: 100,   // Enough for ~2 assessments
  },
  PREMIUM_ANNUAL: {
    price: 646920,          // €6,469.20 per year (10% discount)
    currency: 'eur',
    billingCycle: 'year',
    creditsIncluded: 1200,  // 100 credits per month × 12
  },
  ADDITIONAL_ASSESSMENT: {
    price: 29900,           // €299.00 per assessment
    currency: 'eur',
    creditsGranted: 50,     // Credits granted per purchase
  },
} as const;

/**
 * Credit allocation per subscription plan
 */
export const CREDIT_ALLOCATION = {
  FREE: 0,          // No initial credits
  PREMIUM: 100,     // Enough for ~2 assessments
  ENTERPRISE: 0,    // Admin grants manually
} as const;

/**
 * Convert cents to euros for display
 */
export function getPriceInEuros(priceInCents: number): number {
  return priceInCents / 100;
}

/**
 * Get annual savings amount
 */
export function getAnnualSavings(): number {
  const monthlyTotal = PRICING.PREMIUM_MONTHLY.price * 12;
  const annualPrice = PRICING.PREMIUM_ANNUAL.price;
  return (monthlyTotal - annualPrice) / 100; // In euros
}

export class SubscriptionService extends BaseService {
  /**
   * Create a subscription for a user
   */
  async createSubscription(
    userId: string,
    data: z.infer<typeof CreateSubscriptionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSubscription>> {
    try {
      const validatedData = await this.validateInput(CreateSubscriptionSchema, data);

      // Check if user already has a subscription
      const existingSubscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSubscription) {
        throw this.createError(
          'User already has a subscription',
          409,
          'SUBSCRIPTION_EXISTS'
        );
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      let stripeCustomerId = null;
      let stripeSubscriptionId = null;
      let stripePaymentMethodId = null;

      const planConfig = PLAN_CONFIGS[validatedData.plan]; // TODO: Deprecated, keep for Stripe integration
      
      // Create Stripe entities for paid plans
      if (validatedData.plan !== SubscriptionPlan.FREE) {
        try {
          // Create Stripe customer
          const stripeCustomer = await createStripeCustomer({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            metadata: { userId },
          });
          stripeCustomerId = stripeCustomer.id;

          // Attach payment method if provided
          if (validatedData.paymentMethodId) {
            await createStripePaymentMethod({
              customerId: stripeCustomerId,
              paymentMethodId: validatedData.paymentMethodId,
            });
            stripePaymentMethodId = validatedData.paymentMethodId;
          }

          // Create Stripe subscription
          if (planConfig.price && planConfig.price > 0) {
            const stripeSubscription = await createStripeSubscription({
              customerId: stripeCustomerId,
              priceId: process.env[`STRIPE_${validatedData.plan}_PRICE_ID`] || '',
              paymentMethodId: stripePaymentMethodId,
              trialPeriodDays: validatedData.trialDays,
            });
            stripeSubscriptionId = stripeSubscription.id;
          }
        } catch (stripeError) {
          this.logger.error('Stripe subscription creation failed', {
            error: stripeError.message,
            userId,
          });
          throw this.createError(
            'Payment processing failed',
            400,
            'PAYMENT_FAILED',
            { originalError: stripeError.message }
          );
        }
      }

      // Calculate period dates based on billing cycle
      const now = this.now();
      const currentPeriodStart = now;

      let currentPeriodEnd: Date | null = null;
      let renewalDate: Date | null = null;

      if (validatedData.billingCycle) {
        if (validatedData.billingCycle === 'MONTHLY') {
          // Add 1 month
          currentPeriodEnd = new Date(now);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        } else if (validatedData.billingCycle === 'ANNUAL') {
          // Add 1 year
          currentPeriodEnd = new Date(now);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }
        renewalDate = currentPeriodEnd;
      }
      // FREE tier: currentPeriodEnd and renewalDate remain null

      const trialEnd = validatedData.trialDays
        ? new Date(now.getTime() + validatedData.trialDays * 24 * 60 * 60 * 1000)
        : null;

      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: validatedData.plan,
          status: trialEnd ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
          stripeCustomerId,
          stripeSubscriptionId,
          stripePaymentMethodId,

          // Billing cycle fields
          billingCycle: validatedData.billingCycle || null,
          billingEmail: validatedData.billingEmail || user.email,
          renewalDate,

          // Credit allocation using helper method
          creditsBalance: this.getInitialCredits(validatedData.plan),
          creditsUsed: 0,
          creditsPurchased: validatedData.plan === SubscriptionPlan.PREMIUM
            ? this.getInitialCredits(SubscriptionPlan.PREMIUM)
            : 0,

          currentPeriodStart,
          currentPeriodEnd,
          trialEnd,
        },
      });

      // Create initial credit transaction for paid plans
      const initialCredits = this.getInitialCredits(validatedData.plan);
      if (initialCredits > 0) {
        await this.prisma.creditTransaction.create({
          data: {
            subscriptionId: subscription.id,
            type: TransactionType.SUBSCRIPTION_RENEWAL,
            amount: initialCredits,
            balance: initialCredits,
            description: `Initial credits for ${validatedData.plan} plan`,
          },
        });
      }

      // Create/update UserAssessmentQuota record
      await this.prisma.userAssessmentQuota.upsert({
        where: { userId },
        create: {
          userId,
          totalAssessmentsCreated: 0,
          assessmentsThisMonth: 0,
          assessmentsUsedThisMonth: 0,
        },
        update: {}, // No updates needed if already exists
      });

      await this.logAudit(
        {
          action: 'SUBSCRIPTION_CREATED',
          entity: 'Subscription',
          entityId: subscription.id,
          newValues: {
            plan: subscription.plan,
            status: subscription.status,
            creditsBalance: subscription.creditsBalance,
          },
        },
        context
      );

      this.logger.info('Subscription created successfully', {
        subscriptionId: subscription.id,
        userId,
        plan: validatedData.plan,
      });

      return this.createResponse(true, subscription, 'Subscription created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createSubscription');
    }
  }

  /**
   * Purchase additional assessment credits
   * @param userId - User ID
   * @param data - Purchase data
   * @param context - Service context
   * @returns Purchase result with credits added
   */
  async purchaseAdditionalAssessment(
    userId: string,
    data: z.infer<typeof PurchaseAdditionalAssessmentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<{ creditsAdded: number; newBalance: number }>> {
    try {
      const validatedData = await this.validateInput(
        PurchaseAdditionalAssessmentSchema,
        data
      );

      // Check permission
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      // Get subscription
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        select: {
          id: true,
          plan: true,
          creditsBalance: true,
          creditsPurchased: true,
        },
      });

      if (!subscription) {
        throw this.createError(
          'Subscription not found',
          404,
          'SUBSCRIPTION_NOT_FOUND'
        );
      }

      // Validate subscription tier (PREMIUM or ENTERPRISE)
      if (
        subscription.plan !== SubscriptionPlan.PREMIUM &&
        subscription.plan !== SubscriptionPlan.ENTERPRISE
      ) {
        throw this.createError(
          'Additional assessments available for Premium and Enterprise users only',
          403,
          'TIER_RESTRICTION'
        );
      }

      // TODO: Integrate with Stripe Payment Intents
      // 1. Create PaymentIntent with amount: PRICING.ADDITIONAL_ASSESSMENT.price
      // 2. Confirm payment with stripePaymentMethodId
      // 3. Wait for payment success webhook
      // 4. Then proceed with credit allocation
      // For MVP: Assume payment succeeded (webhook will trigger this method)

      const creditsToAdd = PRICING.ADDITIONAL_ASSESSMENT.creditsGranted; // 50 credits
      const newBalance = subscription.creditsBalance + creditsToAdd;
      const newCreditsPurchased = subscription.creditsPurchased + creditsToAdd;

      // Atomic transaction: update credits + create transaction record
      await this.prisma.$transaction(async (tx) => {
        // Update subscription credits
        await tx.subscription.update({
          where: { userId },
          data: {
            creditsBalance: newBalance,
            creditsPurchased: newCreditsPurchased,
          },
        });

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            subscriptionId: subscription.id,
            type: TransactionType.PURCHASE,
            amount: creditsToAdd,
            balance: newBalance,
            description: 'Purchased additional assessment credits',
            metadata: {
              amount: PRICING.ADDITIONAL_ASSESSMENT.price,
              currency: PRICING.ADDITIONAL_ASSESSMENT.currency,
              stripePriceId: validatedData.stripePriceId,
              purchaseDate: this.now().toISOString(),
            },
          },
        });
      });

      await this.logAudit(
        {
          action: 'CREDITS_PURCHASED',
          entity: 'Subscription',
          entityId: subscription.id,
          newValues: {
            creditsAdded: creditsToAdd,
            newBalance,
            amount: PRICING.ADDITIONAL_ASSESSMENT.price / 100, // In euros
          },
        },
        context
      );

      this.logger.info('Additional assessment credits purchased', {
        userId,
        creditsAdded: creditsToAdd,
        newBalance,
      });

      return this.createResponse(
        true,
        {
          creditsAdded: creditsToAdd,
          newBalance,
        },
        `${creditsToAdd} credits added successfully`
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'purchaseAdditionalAssessment');
    }
  }

  /**
   * Get initial credit allocation for a subscription plan
   *
   * Credit allocation strategy:
   * - FREE: 0 credits (limited to 2 assessments total via quota)
   * - PREMIUM: 100 credits (sufficient for ~2 assessments at 50 credits each)
   * - ENTERPRISE: 0 credits (admin grants manually via AdminCreditService)
   *
   * @param plan - Subscription plan (FREE, PREMIUM, or ENTERPRISE)
   * @returns Number of credits to allocate on subscription creation
   *
   * @see CREDIT_ALLOCATION for credit allocation constants
   * @see Story 6.1 for pricing and credit definitions
   * @see Story 5.5 for AdminCreditService (Enterprise credit grants)
   */
  private getInitialCredits(plan: SubscriptionPlan): number {
    return CREDIT_ALLOCATION[plan];
  }

  /**
   * Get subscription by user ID
   */
  async getSubscriptionByUserId(
    userId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<SubscriptionWithDetails | null>> {
    try {
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              invoices: true,
              creditTransactions: true,
            },
          },
        },
      });

      return this.createResponse(true, subscription);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getSubscriptionByUserId');
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    userId: string,
    data: z.infer<typeof UpdateSubscriptionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSubscription>> {
    try {
      const validatedData = await this.validateInput(UpdateSubscriptionSchema, data);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      let updateData: any = {
        updatedAt: this.now(),
      };

      // Handle plan change
      if (validatedData.plan && validatedData.plan !== subscription.plan) {
        const newPlanConfig = PLAN_CONFIGS[validatedData.plan];

        // Update Stripe subscription if needed
        if (subscription.stripeSubscriptionId) {
          try {
            await updateStripeSubscription({
              subscriptionId: subscription.stripeSubscriptionId,
              priceId: process.env[`STRIPE_${validatedData.plan}_PRICE_ID`] || '',
            });
          } catch (stripeError) {
            this.logger.error('Stripe subscription update failed', {
              error: stripeError.message,
              subscriptionId: subscription.id,
            });
            throw this.createError('Payment processing failed', 400, 'PAYMENT_FAILED');
          }
        }

        updateData = {
          ...updateData,
          plan: validatedData.plan,
          creditsBalance: newPlanConfig.creditsPerMonth > 0 ? newPlanConfig.creditsPerMonth : 0,
        };

        // Add credits for new plan
        if (newPlanConfig.creditsPerMonth > 0) {
          await this.prisma.creditTransaction.create({
            data: {
              subscriptionId: subscription.id,
              type: TransactionType.SUBSCRIPTION_RENEWAL,
              amount: newPlanConfig.creditsPerMonth,
              balance: newPlanConfig.creditsPerMonth,
              description: `Plan upgrade to ${validatedData.plan}`,
            },
          });
          updateData.creditsPurchased = subscription.creditsPurchased + newPlanConfig.creditsPerMonth;
        }
      }

      // Handle payment method change
      if (validatedData.paymentMethodId && subscription.stripeCustomerId) {
        try {
          await createStripePaymentMethod({
            customerId: subscription.stripeCustomerId,
            paymentMethodId: validatedData.paymentMethodId,
          });
          updateData.stripePaymentMethodId = validatedData.paymentMethodId;
        } catch (stripeError) {
          this.logger.error('Payment method update failed', {
            error: stripeError.message,
            subscriptionId: subscription.id,
          });
          throw this.createError('Payment method update failed', 400, 'PAYMENT_FAILED');
        }
      }

      const updatedSubscription = await this.prisma.subscription.update({
        where: { userId },
        data: updateData,
      });

      await this.logAudit(
        {
          action: 'SUBSCRIPTION_UPDATED',
          entity: 'Subscription',
          entityId: subscription.id,
          oldValues: { plan: subscription.plan },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Subscription updated successfully', {
        subscriptionId: subscription.id,
        userId,
      });

      return this.createResponse(true, updatedSubscription, 'Subscription updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateSubscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: string,
    immediately: boolean = false,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSubscription>> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      // Cancel Stripe subscription
      if (subscription.stripeSubscriptionId) {
        try {
          const { cancelStripeSubscription } = await import('../lib/payment');
          await cancelStripeSubscription(subscription.stripeSubscriptionId, immediately);
        } catch (stripeError) {
          this.logger.error('Stripe subscription cancellation failed', {
            error: stripeError.message,
            subscriptionId: subscription.id,
          });
        }
      }

      const updateData: any = {
        status: SubscriptionStatus.CANCELED,
        updatedAt: this.now(),
      };
      
      if (immediately) {
        updateData.canceledAt = this.now();
      } else {
        updateData.cancelAt = subscription.currentPeriodEnd;
      }
      
      const canceledSubscription = await this.prisma.subscription.update({
        where: { userId },
        data: updateData,
      });

      await this.logAudit(
        {
          action: 'SUBSCRIPTION_CANCELED',
          entity: 'Subscription',
          entityId: subscription.id,
          oldValues: { status: subscription.status },
          newValues: { status: SubscriptionStatus.CANCELED },
        },
        context
      );

      this.logger.info('Subscription canceled successfully', {
        subscriptionId: subscription.id,
        userId,
      });

      return this.createResponse(true, canceledSubscription, 'Subscription canceled successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'cancelSubscription');
    }
  }

  /**
   * Add credits to subscription
   */
  async addCredits(
    userId: string,
    data: z.infer<typeof AddCreditsSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<CreditBalance>> {
    try {
      const validatedData = await this.validateInput(AddCreditsSchema, data);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      // Only admins can add credits manually, or system operations
      this.requirePermission(context, [UserRole.ADMIN]);

      const newBalance = subscription.creditsBalance + validatedData.amount;
      const newPurchased = subscription.creditsPurchased + validatedData.amount;

      const updatedSubscription = await this.executeTransaction(async (tx) => {
        // Update subscription
        const updated = await tx.subscription.update({
          where: { userId },
          data: {
            creditsBalance: newBalance,
            creditsPurchased: newPurchased,
            updatedAt: this.now(),
          },
        });

        // Create transaction record
        await tx.creditTransaction.create({
          data: {
            subscriptionId: subscription.id,
            type: TransactionType.PURCHASE,
            amount: validatedData.amount,
            balance: newBalance,
            description: validatedData.description,
            metadata: validatedData.metadata || null,
          },
        });

        return updated;
      });

      await this.logAudit(
        {
          action: 'CREDITS_ADDED',
          entity: 'Subscription',
          entityId: subscription.id,
          newValues: {
            amount: validatedData.amount,
            newBalance,
          },
        },
        context
      );

      this.logger.info('Credits added successfully', {
        subscriptionId: subscription.id,
        userId,
        amount: validatedData.amount,
      });

      const creditBalance: CreditBalance = {
        balance: updatedSubscription.creditsBalance,
        used: updatedSubscription.creditsUsed,
        purchased: updatedSubscription.creditsPurchased,
        pendingDeductions: 0, // Could be calculated from pending assessments
      };

      return this.createResponse(true, creditBalance, 'Credits added successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'addCredits');
    }
  }

  /**
   * Deduct credits from subscription
   */
  async deductCredits(
    userId: string,
    amount: number,
    transactionData: {
      type: TransactionType;
      description: string;
      assessmentId?: string;
      metadata?: Record<string, any>;
    },
    context?: ServiceContext
  ): Promise<ApiResponse<CreditBalance>> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      if (subscription.creditsBalance < amount) {
        throw this.createError('Insufficient credits', 402, 'INSUFFICIENT_CREDITS');
      }

      const newBalance = subscription.creditsBalance - amount;
      const newUsed = subscription.creditsUsed + amount;

      const updatedSubscription = await this.executeTransaction(async (tx) => {
        // Update subscription
        const updated = await tx.subscription.update({
          where: { userId },
          data: {
            creditsBalance: newBalance,
            creditsUsed: newUsed,
            updatedAt: this.now(),
          },
        });

        // Create transaction record
        await tx.creditTransaction.create({
          data: {
            subscriptionId: subscription.id,
            type: transactionData.type,
            amount: -amount, // Negative for deduction
            balance: newBalance,
            description: transactionData.description,
            assessmentId: transactionData.assessmentId || null,
            metadata: transactionData.metadata || null,
          },
        });

        return updated;
      });

      await this.logAudit(
        {
          action: 'CREDITS_DEDUCTED',
          entity: 'Subscription',
          entityId: subscription.id,
          newValues: {
            amount,
            newBalance,
            type: transactionData.type,
          },
        },
        context
      );

      this.logger.info('Credits deducted successfully', {
        subscriptionId: subscription.id,
        userId,
        amount,
      });

      const creditBalance: CreditBalance = {
        balance: updatedSubscription.creditsBalance,
        used: updatedSubscription.creditsUsed,
        purchased: updatedSubscription.creditsPurchased,
        pendingDeductions: 0,
      };

      return this.createResponse(true, creditBalance, 'Credits deducted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deductCredits');
    }
  }

  /**
   * Check if user has enough credits
   */
  async checkCreditsAvailable(
    userId: string,
    requiredAmount: number,
    context?: ServiceContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        select: { creditsBalance: true, plan: true },
      });

      if (!subscription) {
        return this.createResponse(false, false, 'No subscription found');
      }

      // Enterprise plans have unlimited credits
      if (subscription.plan === SubscriptionPlan.ENTERPRISE) {
        return this.createResponse(true, true);
      }

      const hasEnoughCredits = subscription.creditsBalance >= requiredAmount;
      return this.createResponse(true, hasEnoughCredits);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'checkCreditsAvailable');
    }
  }

  /**
   * Get credit balance for user
   */
  async getCreditBalance(
    userId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<CreditBalance>> {
    try {
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        select: {
          creditsBalance: true,
          creditsUsed: true,
          creditsPurchased: true,
          plan: true,
        },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      // Calculate pending deductions (from in-progress assessments)
      const pendingDeductions = await this.prisma.assessment.count({
        where: {
          userId,
          status: 'IN_PROGRESS',
        },
      }) * 10; // Assuming 10 credits per assessment

      const creditBalance: CreditBalance = {
        balance: subscription.creditsBalance,
        used: subscription.creditsUsed,
        purchased: subscription.creditsPurchased,
        pendingDeductions,
      };

      return this.createResponse(true, creditBalance);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getCreditBalance');
    }
  }

  /**
   * Get billing history for user
   */
  async getBillingHistory(
    userId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<BillingHistory>> {
    try {
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      const queryOptions = this.buildQueryOptions(options);

      const [invoices, transactions] = await Promise.all([
        this.prisma.invoice.findMany({
          where: { subscriptionId: subscription.id },
          orderBy: { createdAt: 'desc' },
          take: queryOptions.take,
          skip: queryOptions.skip,
        }),
        this.prisma.creditTransaction.findMany({
          where: { subscriptionId: subscription.id },
          orderBy: { createdAt: 'desc' },
          take: queryOptions.take,
          skip: queryOptions.skip,
        }),
      ]);

      const total = await this.prisma.invoice.count({
        where: { subscriptionId: subscription.id },
      });

      const billingHistory: BillingHistory = {
        invoices,
        transactions,
        total,
      };

      return this.createResponse(true, billingHistory);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getBillingHistory');
    }
  }

  /**
   * Get subscription usage for current period
   */
  async getSubscriptionUsage(
    userId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<SubscriptionUsage>> {
    try {
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      const planConfig = PLAN_CONFIGS[subscription.plan];

      // Get usage for current period
      const [creditsUsed, assessmentsCompleted] = await Promise.all([
        this.prisma.creditTransaction.aggregate({
          where: {
            subscriptionId: subscription.id,
            createdAt: {
              gte: subscription.currentPeriodStart,
              lte: subscription.currentPeriodEnd,
            },
            amount: { lt: 0 }, // Only deductions
          },
          _sum: { amount: true },
        }),
        this.prisma.assessment.count({
          where: {
            userId,
            status: 'COMPLETED',
            completedAt: {
              gte: subscription.currentPeriodStart,
              lte: subscription.currentPeriodEnd,
            },
          },
        }),
      ]);

      const usage: SubscriptionUsage = {
        currentPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
          creditsUsed: Math.abs(creditsUsed._sum.amount || 0),
          assessmentsCompleted,
        },
        limits: {
          creditsPerMonth: planConfig.creditsPerMonth,
          assessmentsPerMonth: planConfig.assessmentsPerMonth,
          documentsPerMonth: planConfig.documentsPerMonth,
        },
      };

      return this.createResponse(true, usage);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getSubscriptionUsage');
    }
  }

  /**
   * Process subscription renewal (called by webhook or cron job)
   */
  async processSubscriptionRenewal(
    subscriptionId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw this.createError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      const planConfig = PLAN_CONFIGS[subscription.plan];

      // Update period dates
      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = new Date(newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      await this.executeTransaction(async (tx) => {
        // Update subscription
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            creditsBalance: subscription.creditsBalance + (planConfig.creditsPerMonth || 0),
            creditsPurchased: subscription.creditsPurchased + (planConfig.creditsPerMonth || 0),
            creditsUsed: 0, // Reset usage counter
            updatedAt: this.now(),
          },
        });

        // Add renewal credits
        if (planConfig.creditsPerMonth > 0) {
          await tx.creditTransaction.create({
            data: {
              subscriptionId,
              type: TransactionType.SUBSCRIPTION_RENEWAL,
              amount: planConfig.creditsPerMonth,
              balance: subscription.creditsBalance + planConfig.creditsPerMonth,
              description: `Monthly renewal - ${subscription.plan} plan`,
            },
          });
        }
      });

      await this.logAudit(
        {
          action: 'SUBSCRIPTION_RENEWED',
          entity: 'Subscription',
          entityId: subscriptionId,
          metadata: {
            plan: subscription.plan,
            creditsAdded: planConfig.creditsPerMonth || 0,
          },
        },
        context
      );

      this.logger.info('Subscription renewed successfully', { subscriptionId });

      return this.createResponse(true, undefined, 'Subscription renewed successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'processSubscriptionRenewal');
    }
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    plan: SubscriptionPlan,
    context?: ServiceContext
  ): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    try {
      // Check if user already has an active subscription
      const existingSubscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
        throw this.createError(
          'User already has an active subscription',
          409,
          'SUBSCRIPTION_EXISTS'
        );
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Create Stripe checkout session
      const { createSubscriptionCheckout } = await import('../lib/payment');
      const result = await createSubscriptionCheckout({
        userId,
        userEmail: user.email,
        plan,
        successUrl: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
      });

      if (!result.success) {
        throw this.createError(
          result.message || 'Failed to create checkout session',
          400,
          'CHECKOUT_FAILED'
        );
      }

      this.logger.info('Checkout session created', {
        userId,
        plan,
        sessionId: result.data?.sessionId,
      });

      return this.createResponse(
        true,
        result.data!,
        'Checkout session created successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createCheckoutSession');
    }
  }

  /**
   * Create Stripe checkout session for credit purchase
   */
  async createCreditPurchaseSession(
    userId: string,
    creditAmount: number,
    context?: ServiceContext
  ): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Create Stripe checkout session for credit purchase
      const { createCreditCheckout } = await import('../lib/payment');
      const result = await createCreditCheckout({
        userId,
        userEmail: user.email,
        creditAmount,
        successUrl: `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/credits/cancel`,
      });

      if (!result.success) {
        throw this.createError(
          result.message || 'Failed to create credit purchase session',
          400,
          'CREDIT_CHECKOUT_FAILED'
        );
      }

      this.logger.info('Credit purchase session created', {
        userId,
        creditAmount,
        sessionId: result.data?.sessionId,
      });

      return this.createResponse(
        true,
        result.data!,
        'Credit purchase session created successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createCreditPurchaseSession');
    }
  }

  /**
   * Get user invoices with pagination
   */
  async getUserInvoices(
    userId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      // Check permissions
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const queryOptions = this.buildQueryOptions(options);

      // Get user's subscription
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!subscription) {
        // Return empty result if no subscription
        return this.createResponse(
          true,
          this.createPaginatedResponse([], 0, options.page || 1, options.limit || 10)
        );
      }

      // Query invoices for this subscription
      const whereClause = {
        subscriptionId: subscription.id,
        ...queryOptions.where,
      };

      const [invoices, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where: whereClause,
          ...queryOptions,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.invoice.count({ where: whereClause }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        invoices,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getUserInvoices');
    }
  }

  /**
   * Purchase additional assessment credits
   *
   * Allows PREMIUM and ENTERPRISE users to purchase additional assessment credits
   * when they exceed their monthly allocation. Each purchase adds 50 credits
   * (enough for 1 complete assessment) for €299.
   *
   * @param userId - User ID
   * @param stripePriceId - Stripe price ID (e.g., price_additional_assessment)
   * @param context - Service context
   * @returns Credits added
   */
  async purchaseAdditionalAssessment(
    userId: string,
    stripePriceId: string,
    context: ServiceContext
  ): Promise<ApiResponse<{ success: boolean; creditsAdded: number }>> {
    try {
      // Get subscription
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        return this.error('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      // Validate plan (PREMIUM or ENTERPRISE only)
      if (subscription.plan === SubscriptionPlan.FREE) {
        return this.error(
          'Upgrade to PREMIUM or ENTERPRISE to purchase additional assessments',
          402,
          'UPGRADE_REQUIRED'
        );
      }

      // TODO: Stripe payment processing
      // In production:
      // 1. Create Stripe payment intent
      // 2. Confirm payment with stripePriceId
      // 3. Wait for webhook confirmation
      // For now, mock successful payment

      // Credits per additional assessment purchase (€299 = 50 credits = 1 assessment)
      const CREDITS_PER_PURCHASE = 50;

      // Calculate new balance
      const newBalance = subscription.creditsBalance + CREDITS_PER_PURCHASE;

      // Atomic transaction: create transaction + update balance
      await this.prisma.$transaction(async (tx) => {
        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            subscriptionId: subscription.id,
            type: TransactionType.PURCHASE,
            amount: CREDITS_PER_PURCHASE,
            balance: newBalance,
            description: `Additional assessment purchase (€299)`,
            metadata: {
              stripePriceId,
              creditsAdded: CREDITS_PER_PURCHASE,
              purchasedAt: new Date().toISOString(),
              purchasedBy: context.userId,
            },
          },
        });

        // Update subscription balance
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            creditsBalance: newBalance,
            creditsPurchased: subscription.creditsPurchased + CREDITS_PER_PURCHASE,
          },
        });
      });

      // Log audit event
      await this.logAudit(
        {
          action: 'ASSESSMENT_PURCHASED',
          entity: 'Subscription',
          entityId: subscription.id,
          metadata: {
            creditsAdded: CREDITS_PER_PURCHASE,
            newBalance,
            stripePriceId,
          },
        },
        context
      );

      this.logger.info(
        `User ${userId} purchased additional assessment. Credits added: ${CREDITS_PER_PURCHASE}. New balance: ${newBalance}`
      );

      return this.success({
        success: true,
        creditsAdded: CREDITS_PER_PURCHASE,
      });
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to purchase additional assessment');
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();