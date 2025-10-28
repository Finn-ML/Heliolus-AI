/**
 * Compatibility layer for existing subscription service
 * Provides backward-compatible function exports that wrap the new class-based implementation
 */

import { stripeProvider } from './stripe';
import Stripe from 'stripe';

// Get Stripe config directly from environment to avoid circular dependency
const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_',
  apiVersion: '2025-08-27.basil' as const
};

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: STRIPE_CONFIG.apiVersion
});

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(data: {
  email: string;
  name?: string;
  description?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const customer = await stripeProvider.createCustomer(data);
    return {
      success: true,
      data: customer
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create customer'
    };
  }
}

/**
 * Create a Stripe subscription
 */
export async function createStripeSubscription(data: {
  customer: string;
  items: Array<{ price: string }>;
  trial_period_days?: number;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const subscription = await stripe.subscriptions.create(data);
    return {
      success: true,
      data: subscription
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create subscription'
    };
  }
}

/**
 * Update a Stripe subscription
 */
export async function updateStripeSubscription(
  subscriptionId: string,
  data: any
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, data);
    return {
      success: true,
      data: subscription
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update subscription'
    };
  }
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const subscription = immediately
      ? await stripe.subscriptions.cancel(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
    return {
      success: true,
      data: subscription
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to cancel subscription'
    };
  }
}

/**
 * Create a Stripe payment method
 */
export async function createStripePaymentMethod(data: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const paymentMethod = await stripe.paymentMethods.create(data);
    return {
      success: true,
      data: paymentMethod
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create payment method'
    };
  }
}

/**
 * Get a Stripe invoice
 */
export async function getStripeInvoice(invoiceId: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return {
      success: true,
      data: invoice
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to retrieve invoice'
    };
  }
}

/**
 * Process Stripe webhook
 */
export async function processStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.webhookSecret
    );

    console.log(`Received Stripe webhook: ${event.type}`);

    // For now, just acknowledge receipt
    // Full webhook processing can be implemented later
    return {
      success: true,
      data: {
        eventId: event.id,
        type: event.type,
        received: true
      }
    };
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      message: error.message || 'Failed to process webhook'
    };
  }
}
