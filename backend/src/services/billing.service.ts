/**
 * BillingService
 * Handles subscription renewal, invoice generation, and billing operations
 */

import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  SubscriptionPlan,
  BillingCycle,
  InvoiceStatus,
} from '../types/database';
import { PRICING } from './subscription.service';

export class BillingService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Process subscription renewal
   * Updates billing period, resets quotas, and generates invoice
   *
   * @param subscriptionId - Subscription ID to renew
   * @throws Error if subscription not found or has no billing cycle
   */
  async processSubscriptionRenewal(subscriptionId: string): Promise<void> {
    try {
      // Fetch subscription with user relation
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      if (!subscription) {
        throw this.createError(
          'Subscription not found',
          404,
          'SUBSCRIPTION_NOT_FOUND'
        );
      }

      // Handle FREE tier gracefully (no billing cycle)
      if (!subscription.billingCycle) {
        this.logger.info('Skipping renewal for FREE tier subscription', {
          subscriptionId,
          userId: subscription.userId,
          plan: subscription.plan,
        });
        return;
      }

      // Calculate new period dates
      const now = this.now();
      const currentPeriodStart = now;
      let currentPeriodEnd: Date;

      if (subscription.billingCycle === 'MONTHLY') {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else if (subscription.billingCycle === 'ANNUAL') {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        throw this.createError(
          `Unknown billing cycle: ${subscription.billingCycle}`,
          400,
          'INVALID_BILLING_CYCLE'
        );
      }

      const renewalDate = currentPeriodEnd;

      // Perform renewal in transaction
      await this.prisma.$transaction(async (tx) => {
        // 1. Update subscription period
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: {
            currentPeriodStart,
            currentPeriodEnd,
            renewalDate,
          },
        });

        // 2. Reset monthly assessment quota for MONTHLY renewals
        if (subscription.billingCycle === 'MONTHLY') {
          await tx.userAssessmentQuota.updateMany({
            where: { userId: subscription.userId },
            data: {
              assessmentsUsedThisMonth: 0,
            },
          });
        }

        // 3. Generate invoice
        await this.generateInvoice(tx, subscription);
      });

      await this.logAudit({
        action: 'SUBSCRIPTION_RENEWED',
        entity: 'Subscription',
        entityId: subscriptionId,
        newValues: {
          currentPeriodStart,
          currentPeriodEnd,
          renewalDate,
        },
      });

      this.logger.info('Subscription renewed successfully', {
        subscriptionId,
        userId: subscription.userId,
        billingCycle: subscription.billingCycle,
        newPeriodEnd: currentPeriodEnd,
      });
    } catch (error: any) {
      this.logger.error('Subscription renewal failed', {
        subscriptionId,
        error: error.message,
      });

      // TODO: Send alert to admin/support team
      // await this.sendRenewalFailureAlert(subscriptionId, error);

      throw error;
    }
  }

  /**
   * Generate invoice record for subscription renewal
   * Private helper method for processSubscriptionRenewal
   *
   * @param tx - Prisma transaction client
   * @param subscription - Subscription data
   */
  private async generateInvoice(
    tx: any,
    subscription: any
  ): Promise<void> {
    // Determine invoice amount based on billing cycle
    let amountInCents: number;

    if (subscription.billingCycle === 'MONTHLY') {
      amountInCents = PRICING.PREMIUM_MONTHLY.price;
    } else if (subscription.billingCycle === 'ANNUAL') {
      amountInCents = PRICING.PREMIUM_ANNUAL.price;
    } else {
      throw this.createError(
        `Cannot generate invoice for billing cycle: ${subscription.billingCycle}`,
        400,
        'INVALID_BILLING_CYCLE'
      );
    }

    // Convert cents to euros for Invoice model
    const amountInEuros = amountInCents / 100;

    // Mock Stripe invoice ID (real implementation would get from Stripe)
    const stripeInvoiceId = `in_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate period dates
    const periodStart = subscription.currentPeriodStart || this.now();
    const periodEnd = subscription.currentPeriodEnd || new Date(periodStart.getTime() + (subscription.billingCycle === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000);

    // Calculate due date (typically 7 days after period end)
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 7);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${subscription.id.substring(0, 8)}`;

    // Create invoice record (schema-compliant)
    await tx.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId,
        number: invoiceNumber,
        amount: amountInEuros,
        currency: 'EUR',
        status: InvoiceStatus.PAID, // Mock as paid for MVP (Stripe webhook would update this)
        periodStart,
        periodEnd,
        dueDate,
        paidAt: this.now(), // Mock as immediately paid
      },
    });

    this.logger.info('Invoice generated', {
      subscriptionId: subscription.id,
      stripeInvoiceId,
      invoiceNumber,
      amount: amountInEuros,
      billingCycle: subscription.billingCycle,
    });
  }

  /**
   * Get subscriptions due for renewal
   * Helper method for cron job to identify subscriptions needing renewal
   *
   * @param daysAhead - Number of days to look ahead (default 1)
   * @returns Array of subscription IDs due for renewal
   */
  async getUpcomingRenewals(daysAhead: number = 1): Promise<string[]> {
    const now = this.now();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        renewalDate: {
          lte: targetDate,
        },
        billingCycle: {
          not: null,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    return subscriptions.map((sub) => sub.id);
  }
}
