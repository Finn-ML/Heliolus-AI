/**
 * Premium Tier Middleware
 * Validates that the requesting user has an active Premium subscription
 * Required for RFP features (Stories 13.1, 13.2)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Middleware to require Premium or Trialing subscription
 * Blocks Free users from accessing Premium features
 *
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function requirePremiumTier(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Ensure user is authenticated (should be handled by authenticate middleware first)
    if (!request.user || !request.user.id) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const userId = request.user.id;

    // Check user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    // Check if user has Premium plan with active or trialing status
    const isPremium =
      subscription?.plan === SubscriptionPlan.PREMIUM &&
      (subscription?.status === SubscriptionStatus.ACTIVE ||
        subscription?.status === SubscriptionStatus.TRIALING);

    if (!isPremium) {
      const currentPlan = subscription?.plan || 'FREE';
      const currentStatus = subscription?.status || 'NONE';

      return reply.code(403).send({
        success: false,
        message: 'This feature requires a Premium subscription. Upgrade to unlock RFP creation and sending.',
        code: 'PREMIUM_REQUIRED',
        data: {
          currentPlan,
          currentStatus,
          requiredPlan: 'PREMIUM',
          upgradeUrl: '/settings/subscription',
          features: [
            'Create detailed RFPs with auto-population',
            'Send RFPs to multiple vendors',
            'Track vendor responses',
            'Premium support',
          ],
        },
      });
    }

    // User has Premium access - allow request to continue
  } catch (error) {
    console.error('Error in requirePremiumTier middleware:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error while checking subscription',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Get user's subscription tier (for conditional logic in routes)
 *
 * @param userId - User ID to check
 * @returns Subscription tier info
 */
export async function getUserTier(userId: string): Promise<{
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
    },
  });

  const plan = subscription?.plan || SubscriptionPlan.FREE;
  const status = subscription?.status || SubscriptionStatus.ACTIVE;
  const isPremium =
    plan === SubscriptionPlan.PREMIUM &&
    (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING);

  return {
    plan,
    status,
    isPremium,
  };
}
