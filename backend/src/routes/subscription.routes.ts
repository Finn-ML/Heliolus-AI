/**
 * Subscription Routes
 * Handles subscription management, billing, and credit system
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { subscriptionService } from '../services';
import { SubscriptionPlan, SubscriptionStatus, InvoiceStatus } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';

// Request/Response schemas matching the contract tests
const SubscriptionPlanSchema = z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']);
const SubscriptionStatusSchema = z.enum(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID']);
const InvoiceStatusSchema = z.enum(['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE']);

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