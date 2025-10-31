/**
 * Stripe webhook handling system
 */

import Stripe from 'stripe';
import { PrismaClient } from '../../generated/prisma/index';
import {
  WebhookHandler,
  WebhookEvent,
  WebhookResult,
  PaymentError
} from './types';
import { PAYMENT_CONFIG } from './config';
import { SubscriptionStatus, InvoiceStatus, TransactionType } from '../../types/database';

const prisma = new PrismaClient();
const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
  apiVersion: PAYMENT_CONFIG.stripe.apiVersion
});

/**
 * Comprehensive webhook event handling
 */
export class HeliolusWebhookHandler implements WebhookHandler {
  /**
   * Validate webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    try {
      stripe.webhooks.constructEvent(
        payload,
        signature,
        PAYMENT_CONFIG.stripe.webhookSecret
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle webhook event (required by interface)
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    // Process the webhook event
    // This is a simplified implementation of the interface method
    console.log('Processing webhook event:', event.type);
  }

  /**
   * Handle incoming webhook event
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult> {
    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        PAYMENT_CONFIG.stripe.webhookSecret
      );

      console.log(`Processing webhook event: ${event.type}`);

      // Process the event based on type
      let result: any;
      switch (event.type) {
        // Checkout events
        case 'checkout.session.completed':
          result = await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'checkout.session.expired':
          result = await this.handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
          break;

        // Customer events
        case 'customer.created':
          result = await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;
        case 'customer.updated':
          result = await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;
        case 'customer.deleted':
          result = await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;

        // Subscription events
        case 'customer.subscription.created':
          result = await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          result = await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          result = await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.trial_will_end':
          result = await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        // Invoice events
        case 'invoice.created':
          result = await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.updated':
          result = await this.handleInvoiceUpdated(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.paid':
          result = await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          result = await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.finalized':
          result = await this.handleInvoiceFinalized(event.data.object as Stripe.Invoice);
          break;

        // Payment events
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        // Payment method events
        case 'payment_method.attached':
          result = await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
        case 'payment_method.detached':
          result = await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
          result = { handled: false, message: 'Event type not handled' };
      }

      // Log webhook event
      await this.logWebhookEvent(event, result);

      return {
        success: true,
        processed: true,
        data: result
      };
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        processed: false,
        error: error instanceof PaymentError ? error.message : 'Webhook processing failed'
      };
    }
  }

  // Checkout event handlers

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<any> {
    console.log(`Checkout session completed: ${session.id}`);

    try {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId || !plan) {
        console.error('Missing userId or plan in checkout session metadata');
        return { handled: false, error: 'Missing metadata' };
      }

      // For subscription mode
      if (session.mode === 'subscription' && session.subscription) {
        // Get the Stripe subscription
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
        const stripeSubscription = stripeSub as any as Stripe.Subscription;

        // Check if subscription already exists for this user
        const existingSub = await prisma.subscription.findUnique({
          where: { userId }
        });

        if (existingSub) {
          // Update existing subscription with Stripe details
          await prisma.subscription.update({
            where: { userId },
            data: {
              plan: plan as any,
              status: this.mapStripeSubscriptionStatus(stripeSubscription.status),
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: stripeSubscription.id,
              stripePaymentMethodId: stripeSubscription.default_payment_method as string || null,
              currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
              trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
            }
          });

          // Add initial credits for the plan
          const planConfig = PAYMENT_CONFIG.subscriptions.plans[plan];
          if (planConfig && planConfig.credits > 0) {
            await prisma.$transaction(async (tx) => {
              const updatedSub = await tx.subscription.update({
                where: { userId },
                data: {
                  creditsBalance: { increment: planConfig.credits },
                  creditsPurchased: { increment: planConfig.credits }
                }
              });

              await tx.creditTransaction.create({
                data: {
                  subscriptionId: existingSub.id,
                  type: TransactionType.SUBSCRIPTION_RENEWAL,
                  amount: planConfig.credits,
                  balance: updatedSub.creditsBalance,
                  description: `${plan} plan subscription credits`,
                  reference: session.id
                }
              });
            });
          }

          console.log(`✅ Subscription upgraded for user ${userId} to ${plan}`);
        } else {
          // Create new subscription
          const planConfig = PAYMENT_CONFIG.subscriptions.plans[plan];
          const newSubscription = await prisma.subscription.create({
            data: {
              userId,
              plan: plan as any,
              status: this.mapStripeSubscriptionStatus(stripeSubscription.status),
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: stripeSubscription.id,
              stripePaymentMethodId: stripeSubscription.default_payment_method as string || null,
              creditsBalance: planConfig?.credits || 0,
              creditsUsed: 0,
              creditsPurchased: planConfig?.credits || 0,
              currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
              trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
            }
          });

          // Create initial credit transaction
          if (planConfig && planConfig.credits > 0) {
            await prisma.creditTransaction.create({
              data: {
                subscriptionId: newSubscription.id,
                type: TransactionType.SUBSCRIPTION_RENEWAL,
                amount: planConfig.credits,
                balance: planConfig.credits,
                description: `${plan} plan subscription credits`,
                reference: session.id
              }
            });
          }

          console.log(`✅ New subscription created for user ${userId} with plan ${plan}`);
        }

        return { sessionId: session.id, userId, plan, handled: true };
      }

      // For payment mode (credit purchases)
      if (session.mode === 'payment') {
        const creditAmount = parseInt(session.metadata?.creditAmount || '0');
        if (creditAmount > 0) {
          const subscription = await prisma.subscription.findUnique({
            where: { userId }
          });

          if (subscription) {
            await prisma.$transaction(async (tx) => {
              const updatedSub = await tx.subscription.update({
                where: { userId },
                data: {
                  creditsBalance: { increment: creditAmount },
                  creditsPurchased: { increment: creditAmount }
                }
              });

              await tx.creditTransaction.create({
                data: {
                  subscriptionId: subscription.id,
                  type: TransactionType.PURCHASE,
                  amount: creditAmount,
                  balance: updatedSub.creditsBalance,
                  description: `Purchased ${creditAmount} credits`,
                  reference: session.id
                }
              });
            });

            console.log(`✅ Added ${creditAmount} credits to user ${userId}`);
          }
        }

        return { sessionId: session.id, userId, creditAmount, handled: true };
      }

      return { sessionId: session.id, handled: true };
    } catch (error) {
      console.error('Error handling checkout session:', error);
      return { handled: false, error: error.message };
    }
  }

  private async handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<any> {
    console.log(`Checkout session expired: ${session.id}`);

    // Log expired session - could send email reminder to user
    const userId = session.metadata?.userId;
    if (userId) {
      console.log(`User ${userId} abandoned checkout session ${session.id}`);
    }

    return { sessionId: session.id, handled: true };
  }

  // Customer event handlers

  private async handleCustomerCreated(customer: Stripe.Customer): Promise<any> {
    console.log(`Customer created: ${customer.id}`);
    
    // Update user record with Stripe customer ID if needed
    if (customer.email) {
      await prisma.user.updateMany({
        where: { email: customer.email },
        data: { stripeCustomerId: customer.id }
      });
    }

    return { customerId: customer.id, handled: true };
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<any> {
    console.log(`Customer updated: ${customer.id}`);
    
    // Sync customer data
    if (customer.email) {
      await prisma.user.updateMany({
        where: { stripeCustomerId: customer.id },
        data: {
          email: customer.email,
          firstName: customer.name?.split(' ')[0] || undefined,
          lastName: customer.name?.split(' ').slice(1).join(' ') || undefined
        }
      });
    }

    return { customerId: customer.id, handled: true };
  }

  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<any> {
    console.log(`Customer deleted: ${customer.id}`);
    
    // Clean up customer data
    await prisma.user.updateMany({
      where: { stripeCustomerId: customer.id },
      data: { stripeCustomerId: null }
    });

    return { customerId: customer.id, handled: true };
  }

  // Subscription event handlers

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<any> {
    console.log(`Subscription created: ${subscription.id}`);
    
    // This is typically handled by the subscription creation flow
    // But we can update status if needed
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: this.mapStripeSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      }
    });

    return { subscriptionId: subscription.id, handled: true };
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<any> {
    console.log(`Subscription updated: ${subscription.id}`);
    
    // Update subscription status and period
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (dbSubscription) {
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: this.mapStripeSubscriptionStatus(subscription.status),
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        }
      });

      // If subscription was canceled, log it
      if (subscription.status === 'canceled') {
        console.log(`Subscription ${subscription.id} was canceled`);
      }
    }

    return { subscriptionId: subscription.id, handled: true };
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<any> {
    console.log(`Subscription deleted: ${subscription.id}`);
    
    // Update subscription status to canceled
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date()
      }
    });

    return { subscriptionId: subscription.id, handled: true };
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<any> {
    console.log(`Trial will end for subscription: ${subscription.id}`);
    
    // This is a good place to send email notifications to users
    // about their trial ending
    
    return { subscriptionId: subscription.id, handled: true };
  }

  // Invoice event handlers

  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<any> {
    console.log(`Invoice created: ${invoice.id}`);
    
    // Create or update invoice record
    await this.upsertInvoiceFromStripe(invoice);
    
    return { invoiceId: invoice.id, handled: true };
  }

  private async handleInvoiceUpdated(invoice: Stripe.Invoice): Promise<any> {
    console.log(`Invoice updated: ${invoice.id}`);
    
    // Update invoice record
    await this.upsertInvoiceFromStripe(invoice);
    
    return { invoiceId: invoice.id, handled: true };
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<any> {
    console.log(`Invoice paid: ${invoice.id}`);
    
    // Update invoice status
    const dbInvoice = await this.upsertInvoiceFromStripe(invoice);
    
    // Add credits if this is a credit purchase
    if ((invoice as any).subscription && dbInvoice) {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: (invoice as any).subscription as string }
      });

      if (subscription) {
        // Calculate credits to add based on amount paid
        const creditsToAdd = Math.floor(invoice.amount_paid / 100); // 1 credit per cent
        
        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              creditsBalance: { increment: creditsToAdd },
              creditsPurchased: { increment: creditsToAdd }
            }
          });

          await tx.creditTransaction.create({
            data: {
              subscriptionId: subscription.id,
              type: TransactionType.PURCHASE,
              amount: creditsToAdd,
              balance: subscription.creditsBalance + creditsToAdd,
              description: `Payment received for invoice ${invoice.id}`,
              reference: invoice.id
            }
          });
        });
      }
    }
    
    return { invoiceId: invoice.id, handled: true };
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<any> {
    console.log(`Invoice payment failed: ${invoice.id}`);
    
    // Update invoice status
    await this.upsertInvoiceFromStripe(invoice);
    
    // Handle failed payment - maybe pause subscription or send notification
    if ((invoice as any).subscription) {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: (invoice as any).subscription as string },
        data: { status: SubscriptionStatus.PAST_DUE }
      });
    }
    
    return { invoiceId: invoice.id, handled: true };
  }

  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<any> {
    console.log(`Invoice finalized: ${invoice.id}`);
    
    // Update invoice status
    await this.upsertInvoiceFromStripe(invoice);
    
    return { invoiceId: invoice.id, handled: true };
  }

  // Payment event handlers

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    
    // Payment was successful - this is usually handled by invoice.paid event
    // but we can add additional logic here if needed
    
    return { paymentIntentId: paymentIntent.id, handled: true };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    console.log(`Payment intent failed: ${paymentIntent.id}`);
    
    // Payment failed - handle accordingly
    
    return { paymentIntentId: paymentIntent.id, handled: true };
  }

  // Payment method event handlers

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<any> {
    console.log(`Payment method attached: ${paymentMethod.id}`);
    
    // Update user's default payment method if needed
    if (paymentMethod.customer) {
      await prisma.subscription.updateMany({
        where: { stripeCustomerId: paymentMethod.customer as string },
        data: { stripePaymentMethodId: paymentMethod.id }
      });
    }
    
    return { paymentMethodId: paymentMethod.id, handled: true };
  }

  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<any> {
    console.log(`Payment method detached: ${paymentMethod.id}`);
    
    // Remove payment method reference
    await prisma.subscription.updateMany({
      where: { stripePaymentMethodId: paymentMethod.id },
      data: { stripePaymentMethodId: null }
    });
    
    return { paymentMethodId: paymentMethod.id, handled: true };
  }

  // Helper methods

  private async upsertInvoiceFromStripe(stripeInvoice: Stripe.Invoice): Promise<any> {
    // Find the subscription in our database
    const subscription = (stripeInvoice as any).subscription ?
      await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: (stripeInvoice as any).subscription as string },
        select: { id: true }
      }) : null;

    // Calculate period dates from Stripe invoice
    const periodStart = stripeInvoice.period_start
      ? new Date(stripeInvoice.period_start * 1000)
      : new Date();
    const periodEnd = stripeInvoice.period_end
      ? new Date(stripeInvoice.period_end * 1000)
      : new Date();

    const invoiceData = {
      stripeInvoiceId: stripeInvoice.id,
      subscriptionId: subscription?.id || null,
      // Generate invoice number from Stripe or fallback to ID
      number: stripeInvoice.number || `INV-${stripeInvoice.id.substring(3, 11)}`,
      // Convert amount from cents to euros (Stripe uses cents, DB uses Float euros)
      amount: stripeInvoice.amount_due / 100,
      currency: stripeInvoice.currency.toUpperCase(),
      status: this.mapStripeInvoiceStatus(stripeInvoice.status),
      periodStart,
      periodEnd,
      dueDate: stripeInvoice.due_date
        ? new Date(stripeInvoice.due_date * 1000)
        : periodEnd,
      paidAt: stripeInvoice.status_transitions.paid_at
        ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
        : null
    };

    return await prisma.invoice.upsert({
      where: { stripeInvoiceId: stripeInvoice.id },
      create: invoiceData,
      update: invoiceData
    });
  }

  private async logWebhookEvent(event: Stripe.Event, result: any): Promise<void> {
    try {
      // TODO: Add webhookEvent model to Prisma schema if needed
      // await prisma.webhookEvent.create({
      //   data: {
      //     stripeEventId: event.id,
      //     type: event.type,
      //     processed: result.handled || false,
      //     processingResult: JSON.stringify(result),
      //     eventData: JSON.stringify(event.data),
      //     createdAt: new Date(event.created * 1000)
      //   }
      // });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }

  private mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
      case 'cancelled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.ACTIVE; // Treat trial as active
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private mapStripeInvoiceStatus(stripeStatus: string): InvoiceStatus {
    switch (stripeStatus) {
      case 'draft':
        return InvoiceStatus.DRAFT;
      case 'open':
        return InvoiceStatus.OPEN;
      case 'paid':
        return InvoiceStatus.PAID;
      case 'void':
        return InvoiceStatus.VOID;
      case 'uncollectible':
        return InvoiceStatus.UNCOLLECTIBLE;
      default:
        return InvoiceStatus.DRAFT;
    }
  }
}

// Export the webhook handler instance
export const webhookHandler = new HeliolusWebhookHandler();