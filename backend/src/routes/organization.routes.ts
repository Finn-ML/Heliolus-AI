/**
 * Organization Routes
 * Handles organization profile management, onboarding, and company data operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { OrganizationService } from '../services/organization.service';
import { CompanySize, RiskProfile } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';
import { getJwtSecret } from '../lib/auth/secret';

// Zod schemas for TypeScript typing
const CompanySizeSchema = z.enum(['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE']);
const RiskProfileSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const CreateOrganizationRequestSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100).optional(),
  size: CompanySizeSchema.optional(),
  country: z.string().min(2, 'Country code is required').max(2, 'Use 2-letter country code'),
  region: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

const AnnualRevenueSchema = z.enum(['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M']);
const ComplianceTeamSizeSchema = z.enum(['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN']);
const GeographySchema = z.enum(['US', 'EU', 'UK', 'APAC', 'GLOBAL']);

const UpdateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100).optional(),
  size: CompanySizeSchema.optional(),
  description: z.string().max(1000).optional(),
  annualRevenue: AnnualRevenueSchema.optional(),
  complianceTeamSize: ComplianceTeamSizeSchema.optional(),
  geography: GeographySchema.optional(),
});

// JSON Schemas for Fastify validation
const CreateOrganizationJSONSchema = {
  type: 'object',
  required: ['name', 'country'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    website: { type: 'string' }, // Removed strict URI format validation to match anonymous flow
    industry: { type: 'string', maxLength: 100 },
    size: { type: 'string', enum: ['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE'] },
    country: { type: 'string', minLength: 2, maxLength: 2, description: '2-letter country code' },
    region: { type: 'string', maxLength: 100 },
    description: { type: 'string', maxLength: 1000 },
    // Add missing fields that frontend sends
    annualRevenue: { type: 'string', enum: ['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M'] },
    complianceTeamSize: { type: 'string', enum: ['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN'] },
    geography: { type: 'string', enum: ['US', 'EU', 'UK', 'APAC', 'GLOBAL'] },
  },
  additionalProperties: false
};

const UpdateOrganizationJSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    website: { type: 'string' }, // Removed strict URI format validation to match anonymous flow
    industry: { type: 'string', maxLength: 100 },
    size: { type: 'string', enum: ['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE'] },
    description: { type: 'string', maxLength: 1000 },
    annualRevenue: { type: 'string', enum: ['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M'] },
    complianceTeamSize: { type: 'string', enum: ['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN'] },
    geography: { type: 'string', enum: ['US', 'EU', 'UK', 'APAC', 'GLOBAL'] },
  },
  required: [],
  additionalProperties: false
};

// JSON Schema for Fastify responses
const OrganizationResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    website: { type: 'string' },
    industry: { type: 'string' },
    size: { type: 'string', enum: ['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE'] },
    country: { type: 'string' },
    region: { type: 'string' },
    description: { type: 'string' },
    annualRevenue: { type: 'string', enum: ['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M'] },
    complianceTeamSize: { type: 'string', enum: ['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN'] },
    geography: { type: 'string', enum: ['US', 'EU', 'UK', 'APAC', 'GLOBAL'] },
    onboardingCompleted: { type: 'boolean' },
    riskProfile: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    createdAt: { type: 'string' },
  },
  required: ['id', 'name', 'country', 'onboardingCompleted', 'createdAt']
};

// JSON Schema for parse website response
const ParseWebsiteResponseSchema = {
  type: 'object',
  properties: {
    extractedData: { type: 'object', additionalProperties: true },
    gaps: { type: 'array', items: { type: 'object', additionalProperties: true } },
    confidence: { type: 'object', additionalProperties: true },
    metadata: { type: 'object', additionalProperties: true },
  },
  required: ['extractedData', 'gaps']
};

type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;

// Create service instance
const organizationService = new OrganizationService();

// JWT secret - use from env or default for development
const JWT_SECRET = getJwtSecret();

export default async function organizationRoutes(server: FastifyInstance) {

  // GET /:orgId/documents - List documents for organization
  server.get('/:orgId/documents', {
    schema: {
      description: 'List documents for organization',
      tags: ['Organizations', 'Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orgId: { type: 'string' },
        },
        required: ['orgId'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          documentType: { 
            type: 'string', 
            enum: ['COMPLIANCE_POLICY', 'FINANCIAL_REPORT', 'SECURITY_AUDIT', 'CONTRACT', 'CERTIFICATE', 'OTHER']
          },
          search: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ 
    Params: { orgId: string }; 
    Querystring: { page?: number; limit?: number; documentType?: string; search?: string } 
  }>, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { orgId } = request.params;

    try {
      // Authorization check: users can only access documents for their own organization unless they're admin
      if (user.role !== 'ADMIN' && user.organizationId !== orgId) {
        reply.status(403).send({
          message: 'Access denied to organization documents',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // For now, return empty array since document service integration isn't complete
      // TODO: Integrate with document service when available
      const page = request.query.page || 1;
      const limit = request.query.limit || 20;
      
      reply.status(200).send({
        data: [],
        pagination: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, orgId }, 'Failed to list organization documents');
      
      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /:orgId/documents/stats - Get document statistics for organization
  server.get('/:orgId/documents/stats', {
    schema: {
      description: 'Get document statistics for organization',
      tags: ['Organizations', 'Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orgId: { type: 'string' },
        },
        required: ['orgId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalDocuments: { type: 'number' },
            totalSize: { type: 'number' },
            documentsByType: { type: 'object' },
          },
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { orgId } = request.params;

    try {
      // Authorization check: users can only access document stats for their own organization unless they're admin
      if (user.role !== 'ADMIN' && user.organizationId !== orgId) {
        reply.status(403).send({
          message: 'Access denied to organization document statistics',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // For now, return empty stats since document service integration isn't complete
      // TODO: Integrate with document service when available
      reply.status(200).send({
        totalDocuments: 0,
        totalSize: 0,
        documentsByType: {},
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, orgId }, 'Failed to get organization document statistics');
      
      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));
  
  // POST /organizations - Create Organization
  server.post('/', {
    schema: {
      description: 'Create a new organization profile',
      tags: ['Organizations'],
      security: [{ bearerAuth: [] }],
      body: CreateOrganizationJSONSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            website: { type: 'string' },
            industry: { type: 'string' },
            size: { type: 'string' },
            country: { type: 'string' },
            region: { type: 'string' },
            description: { type: 'string' },
            onboardingCompleted: { type: 'boolean' },
            riskProfile: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
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
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Direct JWT authentication like in auth routes
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        message: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7);
    let user: any;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      user = {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role || 'USER',
        organizationId: decoded.organizationId,
        emailVerified: decoded.emailVerified || true,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      reply.status(401).send({
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const data = request.body as CreateOrganizationRequest;


    try {
      // Map size from string to enum
      const mappedData = {
        ...data,
        size: data.size ? CompanySize[data.size as keyof typeof CompanySize] : undefined,
      };

      const result = await organizationService.createOrganization(
        user.id, 
        mappedData,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(400).send({
          message: result.message || 'Failed to create organization',
          code: 'ORGANIZATION_CREATE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const organization = result.data;

      // Generate a new JWT token with the organizationId included
      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: organization.id,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      reply.status(201).send({
        id: organization.id,
        name: organization.name,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        region: organization.region,
        description: organization.description,
        annualRevenue: organization.annualRevenue,
        complianceTeamSize: organization.complianceTeamSize,
        geography: organization.geography,
        onboardingCompleted: organization.onboardingCompleted,
        riskProfile: organization.riskProfile,
        createdAt: organization.createdAt.toISOString(),
        // Include new token so frontend can update localStorage
        token: newToken,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, errorMessage: error.message, errorStack: error.stack }, 'Failed to create organization');

      if (error.statusCode === 409) {
        reply.status(409).send({
          message: error.message || 'Organization already exists',
          code: error.code || 'ORGANIZATION_EXISTS',
          statusCode: 409,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: error.message || 'Failed to create organization',
        code: error.code || 'ORGANIZATION_CREATE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV !== 'production' ? { error: error.message } : undefined,
      });
    }
  }));

  // GET /organizations/:id - Get Organization
  server.get('/:id', {
    schema: {
      description: 'Get organization by ID',
      tags: ['Organizations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: OrganizationResponseSchema,
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        403: {
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
    const params = request.params as { id: string };

    try {
      const result = await organizationService.getOrganizationById(
        params.id,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const organization = result.data;

      reply.status(200).send({
        id: organization.id,
        name: organization.name,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        region: organization.region,
        description: organization.description,
        annualRevenue: organization.annualRevenue,
        complianceTeamSize: organization.complianceTeamSize,
        geography: organization.geography,
        onboardingCompleted: organization.onboardingCompleted,
        riskProfile: organization.riskProfile,
        createdAt: organization.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, organizationId: params.id }, 'Failed to get organization');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Organization not found',
          code: error.code || 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: error.code || 'ACCESS_DENIED',
          statusCode: 403,
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

  // PATCH /organizations/:id - Update Organization
  server.patch('/:id', {
    schema: {
      description: 'Update organization profile',
      tags: ['Organizations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: UpdateOrganizationJSONSchema,
      response: {
        200: OrganizationResponseSchema,
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
        403: {
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
    const params = request.params as { id: string };
    const data = request.body as UpdateOrganizationRequest;

    try {
      // Map size from string to enum if provided
      const mappedData = {
        ...data,
        size: data.size ? CompanySize[data.size as keyof typeof CompanySize] : undefined,
      };

      const result = await organizationService.updateOrganization(
        params.id,
        mappedData,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: result.message || 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const organization = result.data;

      reply.status(200).send({
        id: organization.id,
        name: organization.name,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        region: organization.region,
        description: organization.description,
        annualRevenue: organization.annualRevenue,
        complianceTeamSize: organization.complianceTeamSize,
        geography: organization.geography,
        onboardingCompleted: organization.onboardingCompleted,
        riskProfile: organization.riskProfile,
        createdAt: organization.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, organizationId: params.id }, 'Failed to update organization');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Organization not found',
          code: error.code || 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: error.code || 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: 'Failed to update organization',
        code: 'ORGANIZATION_UPDATE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /organizations/:id/parse-website - Parse Organization Website
  server.post('/:id/parse-website', {
    schema: {
      description: 'Parse organization website for company insights and compliance gaps',
      tags: ['Organizations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: ParseWebsiteResponseSchema,
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
        403: {
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
    const params = request.params as { id: string };
    const body = request.body as { url?: string };

    try {
      const result = await organizationService.parseWebsite(
        params.id,
        body.url,  // Pass the URL from request body
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        if (result.message?.includes('not found')) {
          reply.status(404).send({
            message: 'Organization not found',
            code: 'ORGANIZATION_NOT_FOUND',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (result.message?.includes('website')) {
          reply.status(400).send({
            message: result.message || 'No website URL configured for this organization',
            code: 'NO_WEBSITE_CONFIGURED',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to parse website',
          code: 'WEBSITE_PARSE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const responseBody = {
        extractedData: result.data.extractedData || {},
        gaps: [], // Phase 1 MVP doesn't generate gaps yet
        confidence: result.data.confidence || {},
        metadata: result.data.metadata || {},
      };

      request.log.info({ responseBody, resultData: result.data }, 'Sending website extraction response to frontend');

      reply.status(200).send(responseBody);

    } catch (error: any) {
      request.log.error({ error, userId: user.id, organizationId: params.id }, 'Failed to parse website');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Organization not found',
          code: error.code || 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: error.code || 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: 'Failed to parse website',
        code: 'WEBSITE_PARSE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /my-organization - Get current user's organization
  server.get('/my-organization', {
    schema: {
      description: 'Get current user organization profile',
      tags: ['Organizations'],
      security: [{ bearerAuth: [] }],
      response: {
        200: OrganizationResponseSchema,
        404: {
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

    try {
      const result = await organizationService.getOrganizationByUserId(
        user.id,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Organization not found for current user',
          code: 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const organization = result.data;

      reply.status(200).send({
        id: organization.id,
        name: organization.name,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        region: organization.region,
        description: organization.description,
        annualRevenue: organization.annualRevenue,
        complianceTeamSize: organization.complianceTeamSize,
        geography: organization.geography,
        onboardingCompleted: organization.onboardingCompleted,
        riskProfile: organization.riskProfile,
        createdAt: organization.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to get user organization');
      
      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));
}