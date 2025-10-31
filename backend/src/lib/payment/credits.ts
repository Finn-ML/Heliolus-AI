/**
 * Credit management system
 */

import { PrismaClient } from '../../generated/prisma/index';
import {
  CreditManager,
  CreditTransaction,
  CreditBalance,
  AddCreditsData,
  DeductCreditsData,
  CreditTransactionData,
  CreditResult,
  CreditError
} from './types';
import { TransactionType } from '../../types/database';

const prisma = new PrismaClient();

/**
 * Comprehensive credit management
 */
export class HeliolusCreditManager implements CreditManager {
  /**
   * Purchase credits package
   */
  async purchaseCredits(userId: string, packageType: string): Promise<CreditTransaction> {
    try {
      // Find user's subscription
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!subscription) {
        throw new CreditError('No subscription found for user');
      }
      
      // Define credit packages
      const packages: Record<string, { credits: number; price: number }> = {
        small: { credits: 50, price: 299 },
        medium: { credits: 100, price: 499 },
        large: { credits: 200, price: 899 }
      };
      
      const creditPackage = packages[packageType.toLowerCase()];
      if (!creditPackage) {
        throw new CreditError('Invalid package type');
      }
      
      // Add credits and create transaction
      const result = await this.addCredits({
        userId,
        subscriptionId: subscription.id,
        amount: creditPackage.credits,
        description: `Purchased ${packageType} credit package`,
        type: TransactionType.PURCHASE,
        metadata: { packageType, price: creditPackage.price }
      });
      
      if (!result.success || !result.data) {
        throw new CreditError('Failed to purchase credits');
      }
      
      return result.data;
    } catch (error) {
      console.error('Purchase credits error:', error);
      throw error instanceof CreditError ? error : new CreditError('Failed to purchase credits');
    }
  }

  /**
   * Get credit balance for subscription
   */
  async getBalance(subscriptionId: string): Promise<CreditBalance | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: {
          id: true,
          creditsBalance: true,
          creditsUsed: true,
          creditsPurchased: true,
          plan: true,
          status: true
        }
      });

      if (!subscription) {
        return null;
      }

      return {
        subscriptionId: subscription.id,
        balance: subscription.creditsBalance,
        used: subscription.creditsUsed,
        purchased: subscription.creditsPurchased,
        plan: subscription.plan,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Get credit balance error:', error);
      return null;
    }
  }

  /**
   * Add credits to subscription
   */
  async addCredits(data: AddCreditsData): Promise<CreditResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get current subscription
        const subscription = await tx.subscription.findUnique({
          where: { id: data.subscriptionId }
        });

        if (!subscription) {
          throw new CreditError('Subscription not found');
        }

        // Update subscription balance
        const updatedSubscription = await tx.subscription.update({
          where: { id: data.subscriptionId },
          data: {
            creditsBalance: { increment: data.amount },
            creditsPurchased: { increment: data.amount }
          }
        });

        // Create transaction record
        const transaction = await tx.creditTransaction.create({
          data: {
            subscriptionId: data.subscriptionId,
            type: data.type || TransactionType.PURCHASE,
            amount: data.amount,
            balance: updatedSubscription.creditsBalance,
            description: data.description || `Added ${data.amount} credits`,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            assessmentId: data.assessmentId
          }
        });

        return {
          transaction: this.mapDatabaseTransaction(transaction),
          balance: {
            subscriptionId: updatedSubscription.id,
            balance: updatedSubscription.creditsBalance,
            used: updatedSubscription.creditsUsed,
            purchased: updatedSubscription.creditsPurchased,
            plan: updatedSubscription.plan,
            lastUpdated: updatedSubscription.updatedAt
          }
        };
      });

      console.log(`Added ${data.amount} credits to subscription ${data.subscriptionId}`);
      return { 
        success: true, 
        data: result.transaction,
        balance: result.balance.balance
      };
    } catch (error) {
      console.error('Add credits error:', error);
      return {
        success: false,
        error: error instanceof CreditError ? error.message : 'Failed to add credits'
      };
    }
  }

  /**
   * Deduct credits from subscription
   */
  async deductCredits(data: DeductCreditsData): Promise<CreditResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get current subscription
        const subscription = await tx.subscription.findUnique({
          where: { id: data.subscriptionId }
        });

        if (!subscription) {
          throw new CreditError('Subscription not found');
        }

        // Check if sufficient credits available
        if (subscription.creditsBalance < data.amount) {
          throw new CreditError('Insufficient credits');
        }

        // Update subscription balance
        const updatedSubscription = await tx.subscription.update({
          where: { id: data.subscriptionId },
          data: {
            creditsBalance: { decrement: data.amount },
            creditsUsed: { increment: data.amount }
          }
        });

        // Create transaction record
        const transaction = await tx.creditTransaction.create({
          data: {
            subscriptionId: data.subscriptionId,
            type: data.type || TransactionType.ASSESSMENT,
            amount: -data.amount, // Negative for deduction
            balance: updatedSubscription.creditsBalance,
            description: data.description || `Used ${data.amount} credits`,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            assessmentId: data.assessmentId
          }
        });

        return {
          transaction: this.mapDatabaseTransaction(transaction),
          balance: {
            subscriptionId: updatedSubscription.id,
            balance: updatedSubscription.creditsBalance,
            used: updatedSubscription.creditsUsed,
            purchased: updatedSubscription.creditsPurchased,
            plan: updatedSubscription.plan,
            lastUpdated: updatedSubscription.updatedAt
          }
        };
      });

      console.log(`Deducted ${data.amount} credits from subscription ${data.subscriptionId}`);
      return { 
        success: true, 
        data: result.transaction,
        balance: result.balance.balance
      };
    } catch (error) {
      console.error('Deduct credits error:', error);
      return {
        success: false,
        error: error instanceof CreditError ? error.message : 'Failed to deduct credits'
      };
    }
  }

  /**
   * Get credit transaction history
   */
  async getTransactionHistory(subscriptionId: string, limit?: number): Promise<CreditTransaction[]> {
    try {
      const transactions = await prisma.creditTransaction.findMany({
        where: { subscriptionId },
        orderBy: { createdAt: 'desc' },
        take: limit || 50
      });

      return transactions.map(t => this.mapDatabaseTransaction(t));
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  }

  /**
   * Transfer credits between subscriptions
   */
  async transferCredits(fromSubscriptionId: string, toSubscriptionId: string, amount: number, description?: string): Promise<CreditResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get both subscriptions
        const [fromSubscription, toSubscription] = await Promise.all([
          tx.subscription.findUnique({ where: { id: fromSubscriptionId } }),
          tx.subscription.findUnique({ where: { id: toSubscriptionId } })
        ]);

        if (!fromSubscription || !toSubscription) {
          throw new CreditError('One or both subscriptions not found');
        }

        // Check if sufficient credits available
        if (fromSubscription.creditsBalance < amount) {
          throw new CreditError('Insufficient credits for transfer');
        }

        // Update both subscriptions
        const [updatedFromSubscription, updatedToSubscription] = await Promise.all([
          tx.subscription.update({
            where: { id: fromSubscriptionId },
            data: {
              creditsBalance: { decrement: amount },
              creditsUsed: { increment: amount }
            }
          }),
          tx.subscription.update({
            where: { id: toSubscriptionId },
            data: {
              creditsBalance: { increment: amount },
              creditsPurchased: { increment: amount }
            }
          })
        ]);

        // Create transaction records
        const [fromTransaction, toTransaction] = await Promise.all([
          tx.creditTransaction.create({
            data: {
              subscriptionId: fromSubscriptionId,
              type: TransactionType.ADJUSTMENT,
              amount: -amount,
              balance: updatedFromSubscription.creditsBalance,
              description: description || `Transferred ${amount} credits to ${toSubscriptionId}`,
              metadata: JSON.stringify({ 
                toSubscriptionId, 
                transferType: 'outbound',
                reference: `transfer-${Date.now()}`
              })
            }
          }),
          tx.creditTransaction.create({
            data: {
              subscriptionId: toSubscriptionId,
              type: TransactionType.ADJUSTMENT,
              amount: amount,
              balance: updatedToSubscription.creditsBalance,
              description: description || `Received ${amount} credits from ${fromSubscriptionId}`,
              metadata: JSON.stringify({ 
                fromSubscriptionId, 
                transferType: 'inbound',
                reference: `transfer-${Date.now()}`
              })
            }
          })
        ]);

        return {
          fromTransaction: this.mapDatabaseTransaction(fromTransaction),
          toTransaction: this.mapDatabaseTransaction(toTransaction),
          fromBalance: {
            subscriptionId: updatedFromSubscription.id,
            balance: updatedFromSubscription.creditsBalance,
            used: updatedFromSubscription.creditsUsed,
            purchased: updatedFromSubscription.creditsPurchased,
            plan: updatedFromSubscription.plan,
            lastUpdated: updatedFromSubscription.updatedAt
          },
          toBalance: {
            subscriptionId: updatedToSubscription.id,
            balance: updatedToSubscription.creditsBalance,
            used: updatedToSubscription.creditsUsed,
            purchased: updatedToSubscription.creditsPurchased,
            plan: updatedToSubscription.plan,
            lastUpdated: updatedToSubscription.updatedAt
          }
        };
      });

      console.log(`Transferred ${amount} credits from ${fromSubscriptionId} to ${toSubscriptionId}`);
      return { 
        success: true, 
        data: result.fromTransaction,
        balance: result.fromBalance.balance
      };
    } catch (error) {
      console.error('Transfer credits error:', error);
      return {
        success: false,
        error: error instanceof CreditError ? error.message : 'Failed to transfer credits'
      };
    }
  }

  /**
   * Check if subscription has sufficient credits
   */
  async hasCredits(subscriptionId: string, amount: number): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { creditsBalance: true }
      });

      return subscription ? subscription.creditsBalance >= amount : false;
    } catch (error) {
      console.error('Check credits error:', error);
      return false;
    }
  }

  /**
   * Get credit usage statistics
   */
  async getUsageStats(subscriptionId: string, days: number = 30): Promise<{
    totalUsed: number;
    dailyAverage: number;
    peakDay: number;
    transactions: number;
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [usageTransactions, subscription] = await Promise.all([
        prisma.creditTransaction.findMany({
          where: {
            subscriptionId,
            type: TransactionType.ASSESSMENT,
            createdAt: { gte: since }
          },
          select: { amount: true, createdAt: true }
        }),
        prisma.subscription.findUnique({
          where: { id: subscriptionId },
          select: { creditsUsed: true }
        })
      ]);

      const totalUsed = Math.abs(usageTransactions.reduce((sum, t) => sum + t.amount, 0));
      const dailyAverage = totalUsed / days;

      // Calculate peak day usage
      const dailyUsage = usageTransactions.reduce((acc, t) => {
        const day = t.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

      const peakDay = Math.max(...Object.values(dailyUsage), 0);

      return {
        totalUsed,
        dailyAverage,
        peakDay,
        transactions: usageTransactions.length
      };
    } catch (error) {
      console.error('Get usage stats error:', error);
      return {
        totalUsed: 0,
        dailyAverage: 0,
        peakDay: 0,
        transactions: 0
      };
    }
  }

  // Private helper methods

  private mapDatabaseTransaction(dbTransaction: any): CreditTransaction {
    return {
      id: dbTransaction.id,
      userId: dbTransaction.userId || 'system',
      subscriptionId: dbTransaction.subscriptionId,
      type: dbTransaction.type,
      amount: dbTransaction.amount,
      balance: dbTransaction.balance,
      description: dbTransaction.description,
      metadata: dbTransaction.metadata ? JSON.parse(dbTransaction.metadata) : undefined,
      paymentIntentId: dbTransaction.paymentIntentId,
      assessmentId: dbTransaction.assessmentId,
      createdAt: dbTransaction.createdAt
    };
  }
}

// Export the credit manager instance
export const creditManager = new HeliolusCreditManager();