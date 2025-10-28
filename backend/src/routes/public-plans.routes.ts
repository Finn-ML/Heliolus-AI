/**
 * Public Plans Routes
 * Public API endpoints for fetching pricing plans (no authentication required)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { asyncHandler } from '../middleware';
import { PlanService } from '../services/plan.service';

const planService = new PlanService();

export default async function publicPlansRoutes(server: FastifyInstance) {
  // GET /public/plans - List all active public plans
  server.get(
    '/',
    {
      schema: {
        description: 'List all active and public pricing plans',
        tags: ['public', 'plans'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    slug: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    monthlyPrice: { type: 'number' },
                    annualPrice: { type: 'number' },
                    currency: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    displayOrder: { type: 'number' },
                    maxAssessments: { type: 'number' },
                    monthlyCredits: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await planService.listPlans({
        activeOnly: true,
        publicOnly: true,
        page: 1,
        limit: 100,
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
      });
    })
  );
}
