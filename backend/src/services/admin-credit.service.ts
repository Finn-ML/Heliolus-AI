import { BaseService, ServiceContext } from './base.service';
import { CreditTransaction, TransactionType } from '@prisma/client';

/**
 * AdminCreditService
 *
 * Enables administrators to manually grant credits to Enterprise users
 * for custom billing arrangements
 *
 * Business Rules:
 * - ONLY admins can grant credits
 * - All grants must have reason/justification
 * - All grants create audit trail
 * - Credits added immediately (no delay)
 */
export class AdminCreditService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Grant credits to user (admin only)
   *
   * @param userId - Target user ID
   * @param amount - Credits to grant (must be positive)
   * @param reason - Justification for grant
   * @param context - Request context with admin user info
   * @returns Created credit transaction
   * @throws 403 if non-admin
   * @throws 404 if subscription not found
   * @throws 400 if amount <= 0
   */
  async addCreditsToUser(
    userId: string,
    amount: number,
    reason: string,
    context: ServiceContext
  ): Promise<CreditTransaction> {
    // Require admin permission
    this.requireAdmin(context);

    // Validate inputs
    if (amount <= 0) {
      throw this.createError('Credit amount must be positive', 400, 'INVALID_AMOUNT');
    }

    if (!reason || reason.trim().length === 0) {
      throw this.createError('Reason is required', 400, 'MISSING_REASON');
    }

    // Get subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw this.createError('User subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Calculate new balance
    const newBalance = subscription.creditsBalance + amount;

    // Atomic transaction: create transaction + update balance
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Create credit transaction
      const creditTx = await tx.creditTransaction.create({
        data: {
          subscriptionId: subscription.id,
          type: TransactionType.ADMIN_GRANT,
          amount,
          balance: newBalance,
          description: reason,
          metadata: {
            grantedBy: context.userId,
            grantReason: reason,
            grantedAt: new Date().toISOString(),
          },
        },
      });

      // Update subscription balance
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { creditsBalance: newBalance },
      });

      return creditTx;
    });

    // Log audit event (outside transaction - non-critical)
    await this.logAudit({
      action: 'CREDITS_GRANTED',
      entity: 'User',
      entityId: userId,
      metadata: {
        amount,
        reason,
        newBalance,
        grantedBy: context.userId,
      },
    }, context);

    this.logger.info(
      `Admin ${context.userId} granted ${amount} credits to user ${userId}. New balance: ${newBalance}`
    );

    return transaction;
  }

  /**
   * Get credit transaction history for user
   *
   * @param userId - User ID to query
   * @returns Array of credit transactions, newest first
   * @throws 404 if subscription not found
   */
  async getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw this.createError('User subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const transactions = await this.prisma.creditTransaction.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.info(`Retrieved ${transactions.length} credit transactions for user ${userId}`);

    return transactions;
  }
}
