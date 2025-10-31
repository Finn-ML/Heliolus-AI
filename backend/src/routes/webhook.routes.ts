/**
 * Webhook Routes
 * Handles Stripe webhooks for subscription and payment events
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscriptionService } from '../services';
import { processStripeWebhook } from '../lib/payment';

export default async function webhookRoutes(server: FastifyInstance) {
  
  // POST /webhooks/stripe - Stripe Webhook Handler
  server.post('/stripe', {
    schema: {
      description: 'Handle Stripe webhook events',
      tags: ['Webhooks'],
      headers: {
        type: 'object',
        properties: {
          'stripe-signature': { type: 'string' },
        },
        required: ['stripe-signature'],
      },
      body: {
        type: 'string',
      },
      response: {
        200: {
          type: 'object',
          properties: {
            received: { type: 'boolean' },
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
      },
    },
    config: {
      // @ts-expect-error - Fastify config type doesn't include rawBody
      rawBody: true, // Enable raw body parsing for webhook signature verification
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'] as string;
    const body = request.body as string;

    if (!signature) {
      reply.status(400).send({
        message: 'Missing Stripe signature',
        code: 'MISSING_SIGNATURE',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      } as Record<string, any>);
      return;
    }

    try {
      // Process the webhook using the payment service
      const result = await processStripeWebhook(body, signature);

      if (!result.success) {
        if (result.message?.includes('signature')) {
          reply.status(401).send({
            message: 'Invalid webhook signature',
            code: 'INVALID_SIGNATURE',
            statusCode: 401,
            timestamp: new Date().toISOString(),
          } as Record<string, any>);
          return;
        }

        reply.status(400).send({
          message: result.message || 'Webhook processing failed',
          code: 'WEBHOOK_PROCESSING_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        } as Record<string, any>);
        return;
      }

      // Log successful webhook processing
      // @ts-expect-error - Fastify logger type mismatch
      request.log.info('Stripe webhook processed successfully', {
        eventType: result.data?.type,
        eventId: result.data?.id,
      });

      reply.status(200).send({ received: true });

    } catch (error: any) {
      request.log.error({ error, signature }, 'Stripe webhook processing failed');

      if (error.message?.includes('signature')) {
        reply.status(401).send({
          message: 'Invalid webhook signature',
          code: 'INVALID_SIGNATURE',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        } as Record<string, any>);
        return;
      }

      reply.status(400).send({
        message: 'Webhook processing failed',
        code: 'WEBHOOK_PROCESSING_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      } as Record<string, any>);
    }
  });

  // POST /webhooks/test - Test Webhook Handler (development only)
  if (process.env.NODE_ENV === 'development') {
    server.post('/test', {
      schema: {
        description: 'Test webhook handler for development',
        tags: ['Webhooks'],
        body: {
          type: 'object',
          properties: {
            eventType: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['eventType'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              received: { type: 'boolean' },
              processed: { type: 'boolean' },
            },
          },
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventType, data } = request.body as {
        eventType: string;
        data?: any;
      };

      try {
        // Process test webhook
        // @ts-expect-error - Fastify logger type mismatch
        request.log.info('Test webhook received', { eventType, data });

        // Simulate webhook processing based on event type
        let processed = false;

        switch (eventType) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
          case 'invoice.payment_succeeded':
          case 'invoice.payment_failed':
            processed = true;
            break;
          default:
            // @ts-expect-error - Fastify logger type mismatch
            request.log.warn('Unknown test webhook event type', { eventType });
        }

        reply.status(200).send({
          received: true,
          processed,
        } as Record<string, any>);

      } catch (error: any) {
        request.log.error({ error }, 'Test webhook processing failed');
        
        reply.status(400).send({
          message: 'Test webhook processing failed',
          code: 'TEST_WEBHOOK_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        } as Record<string, any>);
      }
    });
  }

  // GET /webhooks/health - Webhook Health Check
  server.get('/health', {
    schema: {
      description: 'Webhook service health check',
      tags: ['Webhooks'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            webhookEndpoint: { type: 'string' },
            environment: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      webhookEndpoint: '/v1/webhooks/stripe',
      environment: process.env.NODE_ENV || 'development',
    });
  });
}