/**
 * RFP Routes
 * Handles RFP (Request for Proposal) creation, management, and sending
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RFPService, CreateRFPSchema, UpdateRFPSchema } from '../services/rfp.service.js';
import { StrategicRoadmapService } from '../services/strategic-roadmap.service.js';
import { requirePremiumTier } from '../middleware/premium-tier.middleware.js';

// Initialize services
const rfpService = new RFPService();
const strategicRoadmapService = new StrategicRoadmapService();

// ==================== REQUEST/RESPONSE TYPES ====================

interface CreateRFPRequest {
  Body: {
    organizationId: string;
    title: string;
    objectives?: string;
    requirements?: string;
    timeline?: string;
    budget?: string;
    vendorIds: string[];
    documents?: string[];
  };
}

interface UpdateRFPRequest {
  Params: {
    id: string;
  };
  Body: {
    title?: string;
    objectives?: string;
    requirements?: string;
    timeline?: string;
    budget?: string;
    vendorIds?: string[];
    documents?: string[];
  };
}

interface GetRFPRequest {
  Params: {
    id: string;
  };
}

interface GetUserRFPsRequest {
  Querystring: {
    status?: string;
    leadStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

interface GetStrategicRoadmapRequest {
  Params: {
    id: string; // organizationId
  };
}

// ==================== JSON SCHEMAS FOR VALIDATION ====================

const CreateRFPRequestSchema = {
  type: 'object',
  properties: {
    organizationId: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    objectives: { type: 'string' },
    requirements: { type: 'string' },
    timeline: { type: 'string' },
    budget: { type: 'string' },
    vendorIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    documents: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5,
    },
  },
  required: ['organizationId', 'title', 'vendorIds'],
  additionalProperties: false,
};

const UpdateRFPRequestSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    objectives: { type: 'string' },
    requirements: { type: 'string' },
    timeline: { type: 'string' },
    budget: { type: 'string' },
    vendorIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    documents: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5,
    },
  },
  additionalProperties: false,
};

// ==================== ROUTE DEFINITIONS ====================

export default async function rfpRoutes(server: FastifyInstance) {
  /**
   * POST /v1/rfps
   * Create a new RFP
   *
   * @requires Authentication
   * @requires Premium Tier
   */
  server.post<CreateRFPRequest>(
    '/rfps',
    {
      preHandler: [server.authenticate, requirePremiumTier],
      schema: {
        description: 'Create a new RFP with auto-population support',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        body: CreateRFPRequestSchema,
        response: {
          201: {
            description: 'RFP created successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  organizationId: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  vendorIds: { type: 'array', items: { type: 'string' } },
                  documents: { type: 'array', items: { type: 'string' } },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { organizationId, ...rfpData } = request.body;

        const rfp = await rfpService.createRFP(userId, organizationId, rfpData, {
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.code(201).send({
          success: true,
          data: rfp,
          message: 'RFP created successfully',
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to create RFP',
          code: error.code,
        });
      }
    }
  );

  /**
   * GET /v1/rfps
   * Get all RFPs for the authenticated user
   *
   * @requires Authentication
   */
  server.get<GetUserRFPsRequest>(
    '/rfps',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get all RFPs for the authenticated user with optional filters',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            leadStatus: { type: 'string' },
            dateFrom: { type: 'string', format: 'date' },
            dateTo: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            description: 'RFPs retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    status: { type: 'string' },
                    leadStatus: { type: 'string', nullable: true },
                    vendorIds: { type: 'array', items: { type: 'string' } },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const filters = request.query;

        // Convert date strings to Date objects
        const processedFilters = {
          ...filters,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        };

        const rfps = await rfpService.getUserRFPs(userId, processedFilters);

        return reply.send({
          success: true,
          data: rfps,
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to retrieve RFPs',
          code: error.code,
        });
      }
    }
  );

  /**
   * GET /v1/rfps/:id
   * Get a single RFP by ID
   *
   * @requires Authentication
   * @requires Ownership
   */
  server.get<GetRFPRequest>(
    '/rfps/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get a single RFP by ID with ownership validation',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'RFP retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  organizationId: { type: 'string' },
                  title: { type: 'string' },
                  objectives: { type: 'string' },
                  requirements: { type: 'string' },
                  timeline: { type: 'string', nullable: true },
                  budget: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  leadStatus: { type: 'string', nullable: true },
                  vendorIds: { type: 'array', items: { type: 'string' } },
                  documents: { type: 'array', items: { type: 'string' } },
                  sentAt: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;

        const rfp = await rfpService.getRFP(id, userId);

        return reply.send({
          success: true,
          data: rfp,
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to retrieve RFP',
          code: error.code,
        });
      }
    }
  );

  /**
   * PATCH /v1/rfps/:id
   * Update an existing RFP (DRAFT only)
   *
   * @requires Authentication
   * @requires Ownership
   * @requires Status = DRAFT
   */
  server.patch<UpdateRFPRequest>(
    '/rfps/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Update an existing RFP (DRAFT only)',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: UpdateRFPRequestSchema,
        response: {
          200: {
            description: 'RFP updated successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        const updates = request.body;

        const updatedRFP = await rfpService.updateRFP(id, userId, updates, {
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: updatedRFP,
          message: 'RFP updated successfully',
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to update RFP',
          code: error.code,
        });
      }
    }
  );

  /**
   * DELETE /v1/rfps/:id
   * Delete an RFP with cascade delete of contacts
   *
   * @requires Authentication
   * @requires Ownership
   */
  server.delete<GetRFPRequest>(
    '/rfps/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Delete an RFP and its associated contacts',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'RFP deleted successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;

        const result = await rfpService.deleteRFP(id, userId, {
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send(result);
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to delete RFP',
          code: error.code,
        });
      }
    }
  );

  /**
   * POST /v1/rfps/:id/send
   * Send RFP to vendors with 3-phase transaction
   *
   * @requires Authentication
   * @requires Ownership
   */
  server.post<GetRFPRequest>(
    '/rfps/:id/send',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Send RFP to selected vendors',
        tags: ['RFPs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'RFP sent successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  sentCount: { type: 'number' },
                  failedCount: { type: 'number' },
                  failures: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        vendorId: { type: 'string' },
                        vendorName: { type: 'string' },
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid request',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;

        const result = await rfpService.sendRFP(id, userId, {
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to send RFP',
          code: error.code,
        });
      }
    }
  );

  /**
   * GET /v1/organizations/:id/strategic-roadmap
   * Get strategic roadmap for RFP auto-population
   *
   * @requires Authentication
   * @requires Ownership
   */
  server.get<GetStrategicRoadmapRequest>(
    '/organizations/:id/strategic-roadmap',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get strategic roadmap data for RFP auto-population',
        tags: ['RFPs', 'Organizations'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Strategic roadmap retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  organizationProfile: { type: 'object' },
                  assessmentContext: { type: 'object', nullable: true },
                  topGaps: { type: 'array' },
                  phasedRoadmap: { type: 'object', nullable: true },
                  hasCompletedAssessment: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id: organizationId } = request.params;

        const roadmap = await strategicRoadmapService.getStrategicRoadmap(
          organizationId,
          userId
        );

        // Optionally format for RFP
        const formatted = strategicRoadmapService.formatForRFP(roadmap);

        return reply.send({
          success: true,
          data: {
            ...roadmap,
            formatted,
          },
        });
      } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return reply.code(statusCode).send({
          success: false,
          message: error.message || 'Failed to retrieve strategic roadmap',
          code: error.code,
        });
      }
    }
  );
}
