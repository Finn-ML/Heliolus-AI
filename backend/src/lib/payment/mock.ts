/**
 * Mock Payment Implementation for Development/Testing
 * Provides stub implementations of payment functions to enable server testing
 */

import { SubscriptionPlan } from '../../types/database';

export async function processStripeWebhook(body: string, signature: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    // Parse the webhook body to determine event type
    const event = JSON.parse(body);
    
    // Mock different webhook event types
    const mockEvents = {
      'customer.subscription.updated': {
        id: 'evt_mock_subscription_updated',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_mock_123',
            status: 'active',
            plan: { id: 'price_premium' }
          }
        }
      },
      'payment_intent.succeeded': {
        id: 'evt_mock_payment_succeeded',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock_123',
            status: 'succeeded',
            amount: 5999
          }
        }
      },
      'invoice.payment_succeeded': {
        id: 'evt_mock_invoice_paid',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_mock_123',
            status: 'paid',
            subscription: 'sub_mock_123'
          }
        }
      }
    };
    
    // Return appropriate mock event based on body content or default
    const eventType = event.type || 'customer.subscription.updated';
    const mockEvent = mockEvents[eventType] || mockEvents['customer.subscription.updated'];
    
    return {
      success: true,
      data: mockEvent,
    };
  } catch (error) {
    // Return success with default event even if parsing fails
    return {
      success: true,
      data: {
        id: 'evt_mock_123',
        type: 'customer.subscription.updated',
      },
    };
  }
}

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
  // Mock checkout session creation
  const sessionId = `cs_mock_${Date.now()}`;
  return {
    success: true,
    data: {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
    },
  };
}

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
  // Mock credit checkout session creation
  const sessionId = `cs_credit_mock_${Date.now()}`;
  return {
    success: true,
    data: {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
    },
  };
}

export async function cancelStripeSubscription(subscriptionId: string, immediately: boolean = false): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: subscriptionId, status: immediately ? 'canceled' : 'cancel_at_period_end' },
  };
}

export async function updateStripeSubscription(subscriptionId: string, data: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: subscriptionId, ...data },
  };
}

export async function createStripeCustomer(data: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: `cus_mock_${Date.now()}`, email: data.email },
  };
}

export async function createStripeSubscription(data: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: `sub_mock_${Date.now()}`, status: 'active', ...data },
  };
}

export async function createStripePaymentMethod(data: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: `pm_mock_${Date.now()}`, ...data },
  };
}

export async function getStripeInvoice(invoiceId: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  return {
    success: true,
    data: { id: invoiceId, status: 'paid', amount_paid: 5999 },
  };
}