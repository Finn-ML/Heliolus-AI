/**
 * Plan Management Routes (Admin)
 * API endpoints for managing subscription plans
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole, asyncHandler, authenticationMiddleware } from '../middleware';
import { PlanService } from '../services/plan.service';

const planService = new PlanService();

export default async function planRoutes(server: FastifyInstance) {
  // Apply authentication and admin role check to all routes
  server.addHook('onRequest', authenticationMiddleware);
  // @ts-expect-error - Fastify preHandler type mismatch with custom AuthenticatedRequest
  server.addHook('preHandler', requireRole('ADMIN'));

  // GET /plans - List all plans
  server.get(
    '/',
    {
      schema: {
        description: 'List all subscription plans',
        tags: ['plans'],
        querystring: {
          type: 'object',
          properties: {
            activeOnly: { type: 'boolean' },
            publicOnly: { type: 'boolean' },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const { activeOnly, publicOnly, page, limit } = request.query as any;

      const result = await planService.listPlans({
        activeOnly: activeOnly === 'true',
        publicOnly: publicOnly === 'true',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      });

      if (!result.success || !result.data) {
        return reply.code(500).send({
          success: false,
          message: result.message || 'Failed to fetch plans',
        });
      }

      reply.send({
        success: true,
        data: result.data.data,
        pagination: (result.data as any).pagination,
      });
    })
  );

  // GET /plans/:id - Get a specific plan
  server.get(
    '/:id',
    {
      schema: {
        description: 'Get a specific plan by ID',
        tags: ['plans'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const result = await planService.getPlanById(id);

      if (!result.success || !result.data) {
        return reply.code(404).send({
          success: false,
          message: 'Plan not found',
        });
      }

      reply.send({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /plans - Create a new plan
  server.post(
    '/',
    {
      schema: {
        description: 'Create a new subscription plan',
        tags: ['plans'],
        body: {
          type: 'object',
          required: ['slug', 'name', 'monthlyPrice', 'annualPrice'],
          properties: {
            slug: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            monthlyPrice: { type: 'number' },
            annualPrice: { type: 'number' },
            currency: { type: 'string' },
            monthlyCredits: { type: 'integer' },
            assessmentCredits: { type: 'integer' },
            maxAssessments: { type: 'integer' },
            maxUsers: { type: 'integer' },
            features: { type: 'array', items: { type: 'string' } },
            trialDays: { type: 'integer' },
            isActive: { type: 'boolean' },
            isPublic: { type: 'boolean' },
            displayOrder: { type: 'integer' },
            createInStripe: { type: 'boolean' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const data = request.body as any;

      const result = await planService.createPlan(data, {
        userId: (request.user as any)?.id || 'system',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!result.success || !result.data) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to create plan',
        });
      }

      reply.code(201).send({
        success: true,
        data: result.data,
        message: 'Plan created successfully',
      });
    })
  );

  // PUT /plans/:id - Update a plan
  server.put(
    '/:id',
    {
      schema: {
        description: 'Update an existing plan',
        tags: ['plans'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            monthlyPrice: { type: 'number' },
            annualPrice: { type: 'number' },
            monthlyCredits: { type: 'integer' },
            assessmentCredits: { type: 'integer' },
            maxAssessments: { type: 'integer' },
            maxUsers: { type: 'integer' },
            features: { type: 'array', items: { type: 'string' } },
            trialDays: { type: 'integer' },
            isActive: { type: 'boolean' },
            isPublic: { type: 'boolean' },
            displayOrder: { type: 'integer' },
            syncToStripe: { type: 'boolean' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const data = request.body as any;

      try {
        const result = await planService.updatePlan(id, data, {
          userId: (request.user as any)?.id || 'system',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        if (!result.success || !result.data) {
          return reply.code(400).send({
            success: false,
            message: result.message || 'Failed to update plan',
          });
        }

        reply.send({
          success: true,
          data: result.data,
          message: 'Plan updated successfully',
        });
      } catch (error: any) {
        // Handle validation errors
        if (error.name === 'ZodError') {
          return reply.code(400).send({
            success: false,
            message: 'Validation failed',
            errors: error.errors,
          });
        }

        // Handle other errors
        return reply.code(error.statusCode || 500).send({
          success: false,
          message: error.message || 'Failed to update plan',
          code: error.code,
        });
      }
    })
  );

  // DELETE /plans/:id - Delete (deactivate) a plan
  server.delete(
    '/:id',
    {
      schema: {
        description: 'Delete (deactivate) a plan',
        tags: ['plans'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const result = await planService.deletePlan(id, {
        userId: (request.user as any)?.id || 'system',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to delete plan',
        });
      }

      reply.send({
        success: true,
        message: 'Plan deleted successfully',
      });
    })
  );

  // GET /plans/slug/:slug - Get a plan by slug
  server.get(
    '/slug/:slug',
    {
      schema: {
        description: 'Get a specific plan by slug',
        tags: ['plans'],
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const { slug } = request.params;

      const result = await planService.getPlanBySlug(slug);

      if (!result.success || !result.data) {
        return reply.code(404).send({
          success: false,
          message: 'Plan not found',
        });
      }

      reply.send({
        success: true,
        data: result.data,
      });
    })
  );
}
