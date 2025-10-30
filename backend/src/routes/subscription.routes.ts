/**
 * Subscription Routes
 * Handles subscription management, billing, and credit system
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscriptionService } from '../services';
import { SubscriptionPlan, SubscriptionStatus, InvoiceStatus } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';

const CreateCheckoutRequestSchema = {
  type: 'object',
  required: ['plan'],
  properties: {
    plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
  },
};

const CancelSubscriptionRequestSchema = {
  type: 'object',
  properties: {
    immediately: { type: 'boolean', default: false },
  },
};

const PurchaseCreditsRequestSchema = {
  type: 'object',
  required: ['amount'],
  properties: {
    amount: { type: 'number', minimum: 1, maximum: 1000 },
  },
};

// Convert Zod schema to JSON Schema for Fastify
const SubscriptionResponseSchema = {
  type: 'object',
  required: ['id', 'plan', 'status', 'creditsBalance', 'creditsUsed', 'currentPeriodStart', 'currentPeriodEnd'],
  properties: {
    id: { type: 'string' },
    plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
    status: { type: 'string', enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID'] },
    creditsBalance: { type: 'number' },
    creditsUsed: { type: 'number' },
    currentPeriodStart: { type: 'string', format: 'date-time' },
    currentPeriodEnd: { type: 'string', format: 'date-time' },
    cancelAt: { type: 'string', format: 'date-time' },
  },
};

const SubscriptionPlanResponseSchema = {
  type: 'object',
  required: ['plan', 'price', 'currency', 'features', 'credits'],
  properties: {
    plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
    price: { type: 'number' },
    currency: { type: 'string' },
    features: { type: 'array', items: { type: 'string' } },
    credits: { type: 'number' },
  },
};

const CheckoutSessionResponseSchema = {
  type: 'object',
  required: ['sessionId', 'url'],
  properties: {
    sessionId: { type: 'string' },
    url: { type: 'string' },
  },
};

const CreditBalanceResponseSchema = {
  type: 'object',
  required: ['balance', 'used', 'purchased'],
  properties: {
    balance: { type: 'number' },
    used: { type: 'number' },
    purchased: { type: 'number' },
  },
};

const InvoiceResponseSchema = {
  type: 'object',
  required: ['id', 'number', 'status', 'total', 'currency', 'dueDate', 'createdAt'],
  properties: {
    id: { type: 'string' },
    number: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'] },
    total: { type: 'number' },
    currency: { type: 'string' },
    dueDate: { type: 'string', format: 'date-time' },
    paidAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

// Subscription Upgrade Schemas (Story 7.4)
const UpgradeSubscriptionParamsSchema = {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'string', pattern: '^[c-z][a-z0-9]{24}$' }, // CUID format
  },
} as const;

const UpgradeSubscriptionBodySchema = {
  type: 'object',
  required: ['plan', 'billingCycle', 'stripePaymentMethodId'],
  properties: {
    plan: { type: 'string', enum: ['PREMIUM'] },
    billingCycle: { type: 'string', enum: ['MONTHLY', 'ANNUAL'] },
    stripePaymentMethodId: { type: 'string', minLength: 1 },
  },
} as const;

const UpgradeSubscriptionResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          plan: { type: 'string' },
          status: { type: 'string' },
          billingCycle: { type: 'string', nullable: true },
          creditsBalance: { type: 'number' },
          currentPeriodStart: { type: 'string' },
          currentPeriodEnd: { type: 'string', nullable: true },
          renewalDate: { type: 'string', nullable: true },
          stripeCustomerId: { type: 'string', nullable: true },
          stripeSubscriptionId: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  },
  400: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      code: { type: 'string' },
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
  403: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      code: { type: 'string' },
    },
  },
};

const PurchaseAssessmentParamsSchema = {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'string', pattern: '^[c-z][a-z0-9]{24}$' }, // CUID format
  },
} as const;

const PurchaseAssessmentBodySchema = {
  type: 'object',
  required: ['stripePriceId'],
  properties: {
    stripePriceId: { type: 'string', minLength: 1 },
  },
} as const;

const PurchaseAssessmentResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          creditsAdded: { type: 'number' },
        },
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
  402: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      code: { type: 'string' },
    },
  },
  403: {
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

const GetBillingInfoParamsSchema = {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'string', pattern: '^[c-z][a-z0-9]{24}$' }, // CUID format
  },
} as const;

const GetBillingInfoResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
          billingCycle: { type: 'string', enum: ['MONTHLY', 'ANNUAL'], nullable: true },
          currentPeriodStart: { type: 'string', format: 'date-time' },
          currentPeriodEnd: { type: 'string', format: 'date-time', nullable: true },
          creditsBalance: { type: 'number' },
          stripeSubscriptionId: { type: 'string', nullable: true },
        },
        required: ['plan', 'currentPeriodStart', 'creditsBalance'],
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
  403: {
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

// TypeScript interfaces based on JSON Schema definitions
interface CreateCheckoutRequest {
  plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
}

interface CancelSubscriptionRequest {
  immediately?: boolean;
}

interface PurchaseCreditsRequest {
  amount: number;
}

export default async function subscriptionRoutes(server: FastifyInstance) {
  
  // GET /subscriptions/current - Get Current Subscription
  server.get('/current', {
    schema: {
      description: 'Get current user subscription',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: SubscriptionResponseSchema,
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;

    try {
      const result = await subscriptionService.getSubscriptionByUserId(
        user.id,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'No subscription found',
          code: 'SUBSCRIPTION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const subscription = result.data;

      reply.status(200).send({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        creditsBalance: subscription.creditsBalance,
        creditsUsed: subscription.creditsUsed,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAt: subscription.cancelAt?.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to get current subscription');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Subscription not found',
          code: error.code || 'SUBSCRIPTION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /:userId/upgrade - Upgrade User Subscription to PREMIUM
  server.post('/:userId/upgrade', {
    schema: {
      description: 'Upgrade user subscription to PREMIUM plan',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      params: UpgradeSubscriptionParamsSchema,
      body: UpgradeSubscriptionBodySchema,
      response: UpgradeSubscriptionResponseSchema,
    },
    preHandler: authenticationMiddleware,
  }, asyncHandler(async (request, reply) => {
    const { userId } = request.params;
    const { plan, billingCycle, stripePaymentMethodId } = request.body;
    const user = request.currentUser!;

    // Authorization check: user can only upgrade their own subscription (or admin)
    if (user.id !== userId && user.role !== 'ADMIN') {
      reply.status(403).send({
        success: false,
        message: 'You can only upgrade your own subscription',
        code: 'FORBIDDEN',
      });
      return;
    }

    try {
      // Check if user already has a subscription
      const existingResult = await subscriptionService.getSubscriptionByUserId(userId, {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!existingResult.success) {
        // No existing subscription found - create new one
        const createResult = await subscriptionService.createSubscription({
          userId,
          plan,
          billingCycle,
          stripePaymentMethodId,
        }, {
          userId: user.id,
          userRole: user.role,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        if (!createResult.success) {
          reply.status(400).send({
            success: false,
            message: createResult.error || 'Failed to create subscription',
            code: 'SUBSCRIPTION_CREATION_FAILED',
          });
          return;
        }

        reply.status(200).send({
          success: true,
          data: createResult.data,
        });
        return;
      }

      // Existing subscription found - check if upgrade needed
      const existingSubscription = existingResult.data;

      if (existingSubscription.plan === 'PREMIUM') {
        reply.status(400).send({
          success: false,
          message: 'User is already on PREMIUM plan',
          code: 'ALREADY_PREMIUM',
        });
        return;
      }

      // Upgrade from FREE to PREMIUM
      const upgradeResult = await subscriptionService.upgradeSubscription(
        userId,
        plan,
        billingCycle,
        stripePaymentMethodId,
        {
          userId: user.id,
          userRole: user.role,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        }
      );

      if (!upgradeResult.success) {
        reply.status(400).send({
          success: false,
          message: upgradeResult.error || 'Failed to upgrade subscription',
          code: 'UPGRADE_FAILED',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: upgradeResult.data,
      });
    } catch (error: any) {
      request.log.error({ error, userId }, 'Error upgrading subscription');

      reply.status(500).send({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /:userId/purchase-assessment - Purchase Additional Assessment Credits
  server.post('/:userId/purchase-assessment', {
    schema: {
      description: 'Purchase additional assessment credits (PREMIUM/ENTERPRISE only)',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      params: PurchaseAssessmentParamsSchema,
      body: PurchaseAssessmentBodySchema,
      response: PurchaseAssessmentResponseSchema,
    },
    preHandler: authenticationMiddleware,
  }, asyncHandler(async (request, reply) => {
    const { userId } = request.params;
    const { stripePriceId } = request.body;
    const user = request.currentUser!;

    // Authorization check: user can only purchase for their own account (or admin)
    if (user.id !== userId && user.role !== 'ADMIN') {
      reply.status(403).send({
        success: false,
        message: 'You can only purchase credits for your own account',
        code: 'FORBIDDEN',
      });
      return;
    }

    try {
      // Get user's subscription
      const subscriptionResult = await subscriptionService.getSubscriptionByUserId(userId, {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!subscriptionResult.success || !subscriptionResult.data) {
        reply.status(404).send({
          success: false,
          message: 'User subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND',
        });
        return;
      }

      const subscription = subscriptionResult.data;

      // Only PREMIUM and ENTERPRISE users can purchase additional credits
      if (subscription.plan === 'FREE') {
        reply.status(402).send({
          success: false,
          message: 'Upgrade to PREMIUM or ENTERPRISE to purchase additional assessments',
          code: 'UPGRADE_REQUIRED',
        });
        return;
      }

      // Purchase additional assessment credits
      const purchaseResult = await subscriptionService.purchaseAdditionalAssessment(
        userId,
        stripePriceId,
        {
          userId: user.id,
          userRole: user.role,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        }
      );

      if (!purchaseResult.success || !purchaseResult.data) {
        reply.status(400).send({
          success: false,
          message: purchaseResult.error || 'Failed to purchase additional assessment',
          code: 'PURCHASE_FAILED',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: purchaseResult.data,
      });
    } catch (error: any) {
      request.log.error({ error, userId }, 'Error purchasing assessment');

      if (error.code === 'SUBSCRIPTION_NOT_FOUND') {
        reply.status(404).send({
          success: false,
          message: error.message || 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND',
        });
        return;
      }

      if (error.code === 'UPGRADE_REQUIRED') {
        reply.status(402).send({
          success: false,
          message: error.message,
          code: 'UPGRADE_REQUIRED',
        });
        return;
      }

      reply.status(500).send({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /:userId/billing-info - Get Subscription Billing Information
  server.get('/:userId/billing-info', {
    schema: {
      description: 'Get subscription and billing information for user',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      params: GetBillingInfoParamsSchema,
      response: GetBillingInfoResponseSchema,
    },
    preHandler: authenticationMiddleware,
  }, asyncHandler(async (request, reply) => {
    const { userId } = request.params;
    const user = request.currentUser!;

    // Authorization check: user can only view their own billing info (unless admin)
    if (user.id !== userId && user.role !== 'ADMIN') {
      reply.status(403).send({
        success: false,
        message: 'You can only view your own billing information',
        code: 'FORBIDDEN',
      });
      return;
    }

    try {
      // Use subscription service to get billing info with user context
      const result = await subscriptionService.getSubscriptionByUserId(userId, {
        userId: user.id,
        userRole: user.role,
      });

      if (!result.success || !result.data) {
        reply.status(404).send({
          success: false,
          message: 'User subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND',
        });
        return;
      }

      const subscription = result.data;

      // Return billing info
      reply.status(200).send({
        success: true,
        data: {
          plan: subscription.plan,
          billingCycle: subscription.billingCycle || 'monthly',
          currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toISOString() : null,
          currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
          creditsBalance: subscription.creditsBalance || 0,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
        },
      });
    } catch (error: any) {
      request.log.error({ error: error.message || error, userId, stack: error?.stack }, 'Error getting billing info');

      reply.status(500).send({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /subscriptions/plans - List Subscription Plans
  server.get('/plans', {
    schema: {
      description: 'List available subscription plans',
      tags: ['Subscriptions'],
      response: {
        200: {
          type: 'array',
          items: SubscriptionPlanResponseSchema,
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Static subscription plan data (this could be retrieved from database or config)
      const plans = [
        {
          plan: SubscriptionPlan.FREE,
          price: 0,
          currency: 'EUR',
          features: [
            '1 assessment per month',
            'Basic risk analysis',
            'Limited report access',
            'Email support',
          ],
          credits: 1,
        },
        {
          plan: SubscriptionPlan.PREMIUM,
          price: 599,
          currency: 'EUR',
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
        {
          plan: SubscriptionPlan.ENTERPRISE,
          price: 1999,
          currency: 'EUR',
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
      ];

      reply.status(200).send(plans);

    } catch (error: any) {
      request.log.error({ error }, 'Failed to get subscription plans');
      
      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /subscriptions/checkout - Create Checkout Session
  server.post('/checkout', {
    schema: {
      description: 'Create Stripe checkout session for subscription upgrade',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      body: CreateCheckoutRequestSchema,
      response: {
        201: CheckoutSessionResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            details: { type: 'object' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const data = request.body as CreateCheckoutRequest;

    try {
      // Map plan from string to enum
      const plan = SubscriptionPlan[data.plan as keyof typeof SubscriptionPlan];

      const result = await subscriptionService.createCheckoutSession(
        user.id,
        plan,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        if (result.message?.includes('already has') || result.message?.includes('same plan')) {
          reply.status(409).send({
            message: result.message || 'User already has an active subscription',
            code: 'SUBSCRIPTION_EXISTS',
            statusCode: 409,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to create checkout session',
          code: 'CHECKOUT_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const session = result.data;

      reply.status(201).send({
        sessionId: session.sessionId,
        url: session.url,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to create checkout session');
      
      if (error.statusCode === 409) {
        reply.status(409).send({
          message: error.message || 'Subscription conflict',
          code: error.code || 'SUBSCRIPTION_EXISTS',
          statusCode: 409,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: 'Failed to create checkout session',
        code: 'CHECKOUT_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /subscriptions/cancel - Cancel Subscription
  server.post('/cancel', {
    schema: {
      description: 'Cancel current subscription',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      body: CancelSubscriptionRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            cancelAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const data = request.body as CancelSubscriptionRequest;

    try {
      const result = await subscriptionService.cancelSubscription(
        user.id,
        data.immediately || false,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        if (result.message?.includes('not found')) {
          reply.status(404).send({
            message: 'No active subscription found',
            code: 'SUBSCRIPTION_NOT_FOUND',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (result.message?.includes('already canceled')) {
          reply.status(400).send({
            message: result.message || 'Subscription already canceled',
            code: 'SUBSCRIPTION_ALREADY_CANCELED',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to cancel subscription',
          code: 'CANCEL_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const subscription = result.data;

      reply.status(200).send({
        message: data.immediately 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the billing period',
        cancelAt: subscription.cancelAt?.toISOString() || new Date().toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to cancel subscription');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Subscription not found',
          code: error.code || 'SUBSCRIPTION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: 'Failed to cancel subscription',
        code: 'CANCEL_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /subscriptions/credits - Get Credit Balance
  server.get('/credits', {
    schema: {
      description: 'Get user credit balance and usage',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: CreditBalanceResponseSchema,
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;

    try {
      const result = await subscriptionService.getCreditBalance(
        user.id,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const creditInfo = result.data;

      reply.status(200).send({
        balance: creditInfo.balance,
        used: creditInfo.used,
        purchased: creditInfo.purchased || 0,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to get credit balance');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Subscription not found',
          code: error.code || 'SUBSCRIPTION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /subscriptions/credits/purchase - Purchase Additional Credits
  server.post('/credits/purchase', {
    schema: {
      description: 'Create Stripe checkout session for additional credit purchase',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      body: PurchaseCreditsRequestSchema,
      response: {
        200: CheckoutSessionResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const data = request.body as PurchaseCreditsRequest;

    try {
      const result = await subscriptionService.createCreditPurchaseSession(
        user.id,
        data.amount,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(400).send({
          message: result.message || 'Failed to create credit purchase session',
          code: 'CREDIT_PURCHASE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const session = result.data;

      reply.status(200).send({
        sessionId: session.sessionId,
        url: session.url,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to create credit purchase session');
      
      reply.status(400).send({
        message: 'Failed to create credit purchase session',
        code: 'CREDIT_PURCHASE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /subscriptions/invoices - List Invoices
  server.get('/invoices', {
    schema: {
      description: 'List user invoices with pagination',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: InvoiceResponseSchema },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const query = request.query as {
      status?: string;
      page?: number;
      limit?: number;
    };

    try {
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        filters: {
          status: query.status ? InvoiceStatus[query.status as keyof typeof InvoiceStatus] : undefined,
        },
      };

      const result = await subscriptionService.getUserInvoices(
        user.id,
        options,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(400).send({
          message: result.message || 'Failed to list invoices',
          code: 'INVOICE_LIST_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { data: invoices, total, page, limit } = result.data;

      reply.status(200).send({
        data: invoices.map(invoice => ({
          id: invoice.id,
          number: invoice.invoiceNumber || invoice.id,
          status: invoice.status,
          total: invoice.total / 100, // Convert from cents
          currency: invoice.currency || 'EUR',
          dueDate: invoice.dueDate?.toISOString() || invoice.createdAt.toISOString(),
          paidAt: invoice.paidAt?.toISOString(),
          createdAt: invoice.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to list invoices');
      
      reply.status(400).send({
        message: 'Failed to list invoices',
        code: 'INVOICE_LIST_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));
}