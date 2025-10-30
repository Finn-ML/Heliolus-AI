/**
 * Subscription management implementation
 */

import Stripe from 'stripe';
import { PrismaClient } from '../../generated/prisma/index';
import {
  SubscriptionManager,
  Subscription,
  CreateSubscriptionData,
  UpdateSubscriptionData,
  CancelOptions,
  SubscriptionResult,
  SubscriptionError
} from './types';
import { stripeProvider } from './stripe';
import { SubscriptionPlan, SubscriptionStatus, TransactionType } from '../../types/database';

// Read config directly to avoid circular dependency
const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_',
  apiVersion: '2025-08-27.basil' as const
};

const PAYMENT_CONFIG = {
  subscriptions: {
    plans: {
      FREE: { price: 0, credits: 10, features: ['basic_assessments'] },
      PREMIUM: { price: 59900, credits: 100, features: ['advanced_assessments', 'ai_analysis', 'priority_support'] },
      ENTERPRISE: { price: 0, credits: 1000, features: ['all_features', 'custom_templates', 'dedicated_support'] }
    },
    trialPeriodDays: 14
  }
};

const prisma = new PrismaClient();
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: STRIPE_CONFIG.apiVersion
});

/**
 * Comprehensive subscription management
 */
export class HeliolusSubscriptionManager implements SubscriptionManager {
  /**
   * Create new subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    try {
      console.log(`Creating subscription for customer ${data.customerId}`);

      // Get plan configuration
      const planConfig = PAYMENT_CONFIG.subscriptions.plans[data.plan];
      if (!planConfig) {
        throw new SubscriptionError(`Invalid subscription plan: ${data.plan}`);
      }

      let stripeSubscription: Stripe.Subscription;

      if (data.plan === SubscriptionPlan.FREE) {
        // Handle free plan - no Stripe subscription needed
        const subscription = await this.createDatabaseSubscription(data, null);
        
        // Add initial credits for free plan
        await this.addPlanCredits(subscription.id, planConfig.credits, 'Free plan credits');
        
        return subscription;
      } else {
        // Create Stripe subscription for paid plans
        const priceId = await this.getOrCreateStripePriceId(data.plan, planConfig.price);
        
        stripeSubscription = await stripe.subscriptions.create({
          customer: data.customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
          trial_period_days: data.trialPeriodDays || PAYMENT_CONFIG.subscriptions.trialPeriodDays,
          metadata: data.metadata || {}
        });

        // Create database subscription
        const subscription = await this.createDatabaseSubscription(data, stripeSubscription.id);
        
        // Add plan credits
        await this.addPlanCredits(subscription.id, planConfig.credits, `${data.plan} plan credits`);
        
        return subscription;
      }
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error instanceof SubscriptionError ? error : new SubscriptionError('Failed to create subscription');
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, data: UpdateSubscriptionData): Promise<Subscription> {
    try {
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription) {
        throw new SubscriptionError('Subscription not found');
      }

      // Update Stripe subscription if it exists
      if (dbSubscription.stripeSubscriptionId && data.plan) {
        const planConfig = PAYMENT_CONFIG.subscriptions.plans[data.plan];
        if (!planConfig) {
          throw new SubscriptionError(`Invalid subscription plan: ${data.plan}`);
        }

        const priceId = await this.getOrCreateStripePriceId(data.plan, planConfig.price);
        
        await stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
          items: [{
            id: (await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId)).items.data[0].id,
            price: priceId
          }],
          proration_behavior: data.prorationBehavior || 'create_prorations'
        });
      }

      // Update database subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          plan: data.plan || dbSubscription.plan,
          stripePaymentMethodId: data.paymentMethodId || dbSubscription.stripePaymentMethodId
        }
      });

      return this.mapDatabaseSubscription(updatedSubscription);
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error instanceof SubscriptionError ? error : new SubscriptionError('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, options?: CancelOptions): Promise<Subscription> {
    try {
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription) {
        throw new SubscriptionError('Subscription not found');
      }

      // Cancel Stripe subscription if it exists
      if (dbSubscription.stripeSubscriptionId) {
        if (options?.immediately) {
          await stripe.subscriptions.cancel(dbSubscription.stripeSubscriptionId);
        } else {
          await stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true
          });
        }
      }

      // Update database subscription
      const canceledAt = options?.immediately ? new Date() : null;
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: options?.immediately ? SubscriptionStatus.CANCELED : SubscriptionStatus.ACTIVE,
          canceledAt,
          cancelAt: options?.immediately ? null : dbSubscription.currentPeriodEnd
        }
      });

      return this.mapDatabaseSubscription(updatedSubscription);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error instanceof SubscriptionError ? error : new SubscriptionError('Failed to cancel subscription');
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription) {
        throw new SubscriptionError('Subscription not found');
      }

      // Pause Stripe subscription if it exists
      if (dbSubscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
          pause_collection: {
            behavior: 'mark_uncollectible'
          }
        });
      }

      // Update database subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.PAST_DUE // Using PAST_DUE to represent paused
        }
      });

      return this.mapDatabaseSubscription(updatedSubscription);
    } catch (error) {
      console.error('Pause subscription error:', error);
      throw error instanceof SubscriptionError ? error : new SubscriptionError('Failed to pause subscription');
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription) {
        throw new SubscriptionError('Subscription not found');
      }

      // Resume Stripe subscription if it exists
      if (dbSubscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
          pause_collection: ''
        });
      }

      // Update database subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE
        }
      });

      return this.mapDatabaseSubscription(updatedSubscription);
    } catch (error) {
      console.error('Resume subscription error:', error);
      throw error instanceof SubscriptionError ? error : new SubscriptionError('Failed to resume subscription');
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription) {
        return null;
      }

      return this.mapDatabaseSubscription(dbSubscription);
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  /**
   * List subscriptions for customer
   */
  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const dbSubscriptions = await prisma.subscription.findMany({
        where: { stripeCustomerId: customerId },
        orderBy: { createdAt: 'desc' }
      });

      return dbSubscriptions.map(sub => this.mapDatabaseSubscription(sub));
    } catch (error) {
      console.error('List subscriptions error:', error);
      return [];
    }
  }

  // Private helper methods

  private async createDatabaseSubscription(
    data: CreateSubscriptionData,
    stripeSubscriptionId: string | null
  ): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const dbSubscription = await prisma.subscription.create({
      data: {
        userId: data.customerId, // Assuming customer ID is user ID
        plan: data.plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: data.customerId,
        stripeSubscriptionId,
        stripePaymentMethodId: data.paymentMethodId,
        creditsBalance: 0,
        creditsUsed: 0,
        creditsPurchased: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd: data.trialPeriodDays ? new Date(now.getTime() + data.trialPeriodDays * 24 * 60 * 60 * 1000) : null
      }
    });

    return this.mapDatabaseSubscription(dbSubscription);
  }

  private async addPlanCredits(subscriptionId: string, credits: number, description: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update subscription balance
      const subscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          creditsBalance: { increment: credits },
          creditsPurchased: { increment: credits }
        }
      });

      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          subscriptionId,
          type: TransactionType.BONUS,
          amount: credits,
          balance: subscription.creditsBalance + credits,
          description
        }
      });
    });
  }

  private async getOrCreateStripePriceId(plan: SubscriptionPlan, amount: number): Promise<string> {
    // In a real implementation, you would store price IDs in configuration or database
    // For now, we'll create prices dynamically (not recommended for production)
    try {
      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: 'eur',
        recurring: {
          interval: 'month'
        },
        product_data: {
          name: `${plan} Plan`,
          description: `Heliolus ${plan} subscription plan`
        }
      });

      return price.id;
    } catch (error) {
      console.error('Error creating Stripe price:', error);
      throw new SubscriptionError('Failed to create subscription price');
    }
  }

  private mapDatabaseSubscription(dbSubscription: any): Subscription {
    return {
      id: dbSubscription.id,
      customerId: dbSubscription.stripeCustomerId || dbSubscription.userId,
      plan: dbSubscription.plan,
      status: dbSubscription.status,
      currentPeriodStart: dbSubscription.currentPeriodStart,
      currentPeriodEnd: dbSubscription.currentPeriodEnd,
      trialEnd: dbSubscription.trialEnd,
      canceledAt: dbSubscription.canceledAt,
      cancelAtPeriodEnd: !!dbSubscription.cancelAt,
      defaultPaymentMethod: dbSubscription.stripePaymentMethodId,
      createdAt: dbSubscription.createdAt,
      updatedAt: dbSubscription.updatedAt
    };
  }
}

// Export the subscription manager instance
export const subscriptionManager = new HeliolusSubscriptionManager();

/**
 * Create Stripe Checkout Session for subscription upgrade
 */
export async function createSubscriptionCheckout(options: {
  userId: string;
  userEmail: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}): Promise<{
  success: boolean;
  message?: string;
  data?: { sessionId: string; url: string };
}> {
  try {
    // Get or create Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: options.userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: options.userEmail,
        metadata: { userId: options.userId }
      });
    }

    // Get plan configuration
    const planConfig = PAYMENT_CONFIG.subscriptions.plans[options.plan];
    if (!planConfig) {
      return {
        success: false,
        message: `Invalid subscription plan: ${options.plan}`
      };
    }

    // FREE plan doesn't need checkout
    if (options.plan === SubscriptionPlan.FREE) {
      return {
        success: false,
        message: 'Cannot create checkout session for FREE plan'
      };
    }

    // Get price ID from environment or create dynamic price
    const priceId = process.env[`STRIPE_${options.plan}_PRICE_ID`] ||
      await createDynamicPrice(options.plan, planConfig.price);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        plan: options.plan
      },
      subscription_data: {
        metadata: {
          userId: options.userId,
          plan: options.plan
        },
        trial_period_days: PAYMENT_CONFIG.subscriptions.trialPeriodDays
      }
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url || ''
      }
    };
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create checkout session'
    };
  }
}

/**
 * Create Stripe Checkout Session for credit purchase
 */
export async function createCreditCheckout(options: {
  userId: string;
  userEmail: string;
  creditAmount: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{
  success: boolean;
  message?: string;
  data?: { sessionId: string; url: string };
}> {
  try {
    // Get or create Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: options.userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: options.userEmail,
        metadata: { userId: options.userId }
      });
    }

    // Calculate price (e.g., $10 per 10 credits)
    const pricePerCredit = 1000; // $10 in cents
    const totalAmount = options.creditAmount * pricePerCredit;

    // Get credit price ID from environment or create dynamic price
    const priceId = process.env.STRIPE_CREDIT_PRICE_ID ||
      await createDynamicCreditPrice(totalAmount, options.creditAmount);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        creditAmount: options.creditAmount.toString()
      }
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url || ''
      }
    };
  } catch (error) {
    console.error('Error creating credit checkout session:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create credit checkout session'
    };
  }
}

/**
 * Helper: Create dynamic Stripe price for subscription plan
 */
async function createDynamicPrice(plan: SubscriptionPlan, amount: number): Promise<string> {
  try {
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      product_data: {
        name: `${plan} Plan`
      },
      metadata: {
        plan
      }
    });

    console.warn(`⚠️  Created dynamic price ${price.id} for ${plan} plan. Consider creating fixed prices in Stripe Dashboard.`);
    return price.id;
  } catch (error) {
    console.error('Error creating dynamic price:', error);
    throw new SubscriptionError('Failed to create subscription price');
  }
}

/**
 * Helper: Create dynamic Stripe price for credits
 */
async function createDynamicCreditPrice(amount: number, creditAmount: number): Promise<string> {
  try {
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: 'usd',
      product_data: {
        name: `${creditAmount} Credits`
      },
      metadata: {
        creditAmount: creditAmount.toString()
      }
    });

    console.warn(`⚠️  Created dynamic price ${price.id} for ${creditAmount} credits. Consider creating fixed prices in Stripe Dashboard.`);
    return price.id;
  } catch (error) {
    console.error('Error creating dynamic credit price:', error);
    throw new SubscriptionError('Failed to create credit price');
  }
}