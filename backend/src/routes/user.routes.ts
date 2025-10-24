/**
 * User Routes
 * User-specific endpoints (profile, quota, preferences)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { authenticationMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '../generated/prisma';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

const AssessmentQuotaResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          totalAssessmentsCreated: { type: 'number' },
          assessmentsThisMonth: { type: 'number' },
          assessmentsUsedThisMonth: { type: 'number' },
          plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
          quotaLimit: { type: 'number' },  // -1 for unlimited
          quotaRemaining: { type: 'number' },  // -1 for unlimited
        },
        required: [
          'userId',
          'totalAssessmentsCreated',
          'assessmentsThisMonth',
          'assessmentsUsedThisMonth',
          'plan',
          'quotaLimit',
          'quotaRemaining',
        ],
      },
    },
  },
  401: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      code: { type: 'string' },
    },
  },
  404: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      code: { type: 'string' },
    },
  },
};

/**
 * Quota limits by subscription plan
 */
const QUOTA_LIMITS = {
  FREE: 2,          // 2 total assessments (lifetime limit)
  PREMIUM: 2,       // 2 assessments per billing cycle
  ENTERPRISE: -1,   // Unlimited (-1 indicates unlimited)
};

export default async function userRoutes(server: FastifyInstance) {
  /**
   * Get Assessment Quota Information
   *
   * GET /v1/user/assessment-quota
   *
   * Returns assessment quota information for the authenticated user.
   * Includes usage counts and calculated quota limits/remaining.
   *
   * Quota Rules:
   * - FREE: 2 total assessments (lifetime limit)
   * - PREMIUM: 2 assessments per billing cycle (resets monthly/annually)
   * - ENTERPRISE: Unlimited assessments (quotaLimit and quotaRemaining = -1)
   *
   * Frontend uses this to display:
   * - "You've used X of Y assessments"
   * - Progress bars showing quota usage
   * - Warnings when quota nearly exhausted
   * - Upgrade prompts when quota exceeded
   *
   * @returns Quota information with calculated limits
   */
  server.get('/assessment-quota', {
    schema: {
      description: 'Get assessment quota information for authenticated user',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: AssessmentQuotaResponseSchema,
    },
    preHandler: authenticationMiddleware,
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).currentUser;
    const userId = user.id;

    try {
      // Query quota with subscription plan
      const quota = await prisma.userAssessmentQuota.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              subscription: {
                select: {
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!quota) {
        reply.status(404).send({
          success: false,
          message: 'Assessment quota not found. This should not happen - contact support.',
          code: 'QUOTA_NOT_FOUND',
        });
        return;
      }

      // Get user's plan (default to FREE if no subscription)
      const plan = quota.user.subscription?.plan || 'FREE';

      // Get quota limit for this plan
      const quotaLimit = QUOTA_LIMITS[plan as keyof typeof QUOTA_LIMITS];

      // Calculate remaining quota
      let quotaRemaining: number;

      if (quotaLimit === -1) {
        // Unlimited (ENTERPRISE)
        quotaRemaining = -1;
      } else {
        if (plan === 'FREE') {
          // FREE: lifetime limit based on total assessments created
          quotaRemaining = Math.max(0, quotaLimit - quota.totalAssessmentsCreated);
        } else {
          // PREMIUM: monthly limit based on assessments used this month
          quotaRemaining = Math.max(0, quotaLimit - quota.assessmentsUsedThisMonth);
        }
      }

      // Return quota information with calculated fields
      reply.status(200).send({
        success: true,
        data: {
          userId: quota.userId,
          totalAssessmentsCreated: quota.totalAssessmentsCreated,
          assessmentsThisMonth: quota.assessmentsThisMonth,
          assessmentsUsedThisMonth: quota.assessmentsUsedThisMonth,
          plan,
          quotaLimit,
          quotaRemaining,
        },
      });
    } catch (error: any) {
      logger.error('Error getting assessment quota', {
        userId,
        error: error.message,
      });

      reply.status(500).send({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));
}
