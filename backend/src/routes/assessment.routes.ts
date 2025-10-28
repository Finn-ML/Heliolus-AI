/**
 * Assessment Routes
 * Handles assessment creation, management, completion, and risk analysis
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { assessmentService } from '../services/assessment.service';
import { answerService } from '../services/answer.service';
import { TemplateService } from '../services/template.service';
import { reportGeneratorService } from '../services/report-generator.service';
import { PrioritiesService } from '../services/priorities.service';
import { VendorMatchingService } from '../services/vendor-matching.service';
import { StrategyMatrixService } from '../services/strategy-matrix.service';
import { PrioritiesSchema } from '../types/priorities.schema';
import { AssessmentStatus, AnswerStatus, Severity, Priority, CostRange, EffortRange, RiskCategory, Likelihood, Impact, RiskLevel } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Request/Response schemas matching the contract tests
const AssessmentStatusSchema = z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
const SeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const PrioritySchema = z.enum(['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']);
const CostRangeSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']);
const EffortRangeSchema = z.enum(['DAYS', 'WEEKS', 'MONTHS', 'QUARTERS']);
const RiskCategorySchema = z.enum(['GEOGRAPHIC', 'TRANSACTION', 'GOVERNANCE', 'OPERATIONAL', 'REGULATORY', 'REPUTATIONAL']);
const LikelihoodSchema = z.enum(['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']);
const ImpactSchema = z.enum(['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC']);
const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// JSON Schema definitions for Fastify validation
const CreateAssessmentRequestSchema = {
  type: 'object',
  properties: {
    organizationId: { type: 'string', minLength: 1 },
    templateId: { type: 'string', minLength: 1 }
  },
  required: ['templateId'],
  additionalProperties: false
};

const UpdateAssessmentRequestSchema = {
  type: 'object',
  properties: {
    responses: { type: 'object' },
    status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] }
  },
  additionalProperties: false
};

const AssessmentResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    organizationId: { type: 'string', nullable: true },
    templateId: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
    responses: { type: 'object' },
    riskScore: { type: 'number' },
    creditsUsed: { type: 'number', nullable: true },
    completedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    template: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        category: { type: 'string' }
      }
    },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string' },
          priority: { type: 'string' }
        }
      }
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          title: { type: 'string' },
          riskLevel: { type: 'string' }
        }
      }
    },
    hasPriorities: { type: 'boolean' }
  },
  required: ['id', 'templateId', 'status', 'createdAt']
};

const GapResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    category: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
    priority: { type: 'string', enum: ['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] },
    priorityScore: { type: 'number', nullable: true },
    estimatedCost: { type: 'string', enum: ['UNDER_10K', 'RANGE_10K_50K', 'RANGE_50K_100K', 'RANGE_100K_250K', 'OVER_250K'], nullable: true },
    estimatedEffort: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'], nullable: true },
    suggestedVendors: { type: 'array', items: { type: 'string' } }
  },
  required: ['id', 'category', 'title', 'description', 'severity', 'priority']
};

const RiskResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    category: { type: 'string', enum: ['GEOGRAPHIC', 'TRANSACTION', 'GOVERNANCE', 'OPERATIONAL', 'REGULATORY', 'REPUTATIONAL'] },
    title: { type: 'string' },
    description: { type: 'string' },
    likelihood: { type: 'string', enum: ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'] },
    impact: { type: 'string', enum: ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'] },
    riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    mitigationStrategy: { type: 'string' }
  },
  required: ['id', 'category', 'title', 'description', 'likelihood', 'impact', 'riskLevel', 'mitigationStrategy']
};

// Zod schemas for request validation
const CreateAssessmentZodSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required').optional(),
  templateId: z.string().min(1, 'Template ID is required'),
});

const UpdateAssessmentZodSchema = z.object({
  responses: z.object({}).passthrough().optional(),
  status: AssessmentStatusSchema.optional(),
});

type CreateAssessmentRequest = z.infer<typeof CreateAssessmentZodSchema>;
type UpdateAssessmentRequest = z.infer<typeof UpdateAssessmentZodSchema>;

export default async function assessmentRoutes(server: FastifyInstance) {
  const templateService = new TemplateService();

  // ==================== TEMPLATE ROUTES ====================
  
  // Use real template service instead of mock data

  // GET /templates - List all assessment templates
  server.get('/templates', {
    schema: {
      description: 'List assessment templates',
      tags: ['Templates'],
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['FINANCIAL_CRIME', 'TRADE_COMPLIANCE', 'DATA_PRIVACY', 'CYBERSECURITY', 'ESG']
          },
          active: { type: 'boolean' },
          search: { type: 'string' }
        }
      },
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
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  version: { type: 'string' },
                  isActive: { type: 'boolean' },
                  estimatedMinutes: { type: 'number' },
                  totalQuestions: { type: 'number' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      category?: string; 
      active?: boolean; 
      search?: string 
    } 
  }>, reply: FastifyReply) => {
    try {
      const result = await templateService.listTemplates({
        category: request.query.category as any,
        includeInactive: request.query.active === false,
        search: request.query.search,
      });

      if (!result.success) {
        reply.code(500).send({
          success: false,
          message: result.error || 'Failed to fetch templates'
        });
        return;
      }

      const templates = result.data?.data.map(template => ({
        id: template.id,
        name: template.name,
        slug: template.slug,
        category: template.category,
        description: template.description,
        version: template.version,
        isActive: template.isActive,
        estimatedMinutes: template.estimatedMinutes,
        totalQuestions: template._count.questions || 0,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      })) || [];

      reply.code(200).send({
        success: true,
        data: templates
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch templates',
        error: error.message
      });
    }
  });

  // GET /templates/:id - Get specific template
  server.get('/templates/:id', {
    schema: {
      description: 'Get template by ID',
      tags: ['Templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                category: { type: 'string' },
                description: { type: 'string' },
                version: { type: 'string' },
                isActive: { type: 'boolean' },
                estimatedMinutes: { type: 'number' },
                totalQuestions: { type: 'number' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const result = await templateService.getTemplateById(request.params.id, false);
      
      if (!result.success || !result.data) {
        reply.code(404).send({
          success: false,
          message: 'Template not found'
        });
        return;
      }

      const template = result.data;

      reply.code(200).send({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          category: template.category,
          description: template.description,
          version: template.version,
          isActive: template.isActive,
          estimatedMinutes: template.estimatedMinutes,
          totalQuestions: template._count.questions || 0,
          instructions: template.instructions,
          sections: template.sections.map(section => ({
            id: section.id,
            title: section.title,
            description: section.description,
            displayOrder: section.order,
            isRequired: false, // Sections don't have required field in schema
            instructions: '', // Sections don't have instructions field in schema
            questions: section.questions.map(question => ({
              id: question.id,
              question: question.text,
              type: question.type,
              displayOrder: question.order,
              isRequired: question.required,
              placeholder: '', // Questions don't have placeholder field in schema
              helpText: question.helpText,
              tags: [], // Questions don't have tags field in schema
            }))
          })),
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch template',
        error: error.message
      });
    }
  });

  // ==================== ASSESSMENT ROUTES ====================
  
  // POST /assessments - Create Assessment
  server.post('/', {
    schema: {
      description: 'Create a new assessment',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      body: CreateAssessmentRequestSchema,
      response: {
        201: AssessmentResponseSchema,
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
        402: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
            upgradeUrl: { type: 'string' },  // Optional upgrade URL for quota errors
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
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const data = request.body as CreateAssessmentRequest;

    // DEBUG: Log request details
    request.log.info('Assessment creation request:', {
      body: data,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });

    try {
      // Security: Prevent organization ID spoofing for non-admin users
      let targetOrganizationId: string | undefined;

      if (user.role === 'ADMIN') {
        // Admins can create assessments for any organization
        targetOrganizationId = data.organizationId;
      } else {
        // Fetch user's organization from database (JWT might not have it yet if recently created)
        const userOrg = await prisma.organization.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });

        const actualOrgId = userOrg?.id;

        // Non-admin users can create assessments for their own organization OR without an organization
        if (data.organizationId) {
          // If organizationId is provided in request, validate it matches user's org
          if (actualOrgId && data.organizationId !== actualOrgId) {
            reply.status(403).send({
              message: 'Access denied: Cannot create assessments for other organizations',
              code: 'CROSS_TENANT_ACCESS_DENIED',
              statusCode: 403,
              timestamp: new Date().toISOString(),
            });
            return;
          }
          targetOrganizationId = data.organizationId;
        } else {
          // Use user's actual organizationId if available, otherwise allow null
          targetOrganizationId = actualOrgId || undefined;
        }
      }

      const result = await assessmentService.createAssessment(
        {
          organizationId: targetOrganizationId,
          templateId: data.templateId,
        },
        { 
          userId: user.id, 
          userRole: user.role,
          organizationId: user.organizationId
        }
      );

      if (!result.success || !result.data) {
        if (result.message?.includes('insufficient credits') || result.message?.includes('credit')) {
          reply.status(402).send({
            message: result.message || 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            statusCode: 402,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to create assessment',
          code: 'ASSESSMENT_CREATE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;

      reply.status(201).send({
        id: assessment.id,
        organizationId: assessment.organizationId,
        templateId: assessment.templateId,
        status: assessment.status,
        responses: assessment.responses || {},
        riskScore: assessment.riskScore,
        creditsUsed: assessment.creditsUsed,
        completedAt: assessment.completedAt?.toISOString(),
        createdAt: assessment.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to create assessment');

      /**
       * Handle Freemium quota exceeded error
       *
       * When a FREE tier user attempts to create a 3rd assessment,
       * AssessmentService throws FREEMIUM_QUOTA_EXCEEDED error.
       *
       * Response includes upgradeUrl to streamline upgrade flow.
       *
       * @see Story 5.6 - AssessmentService quota checks
       * @see Story 8.2 - Frontend quota warning UI
       */
      if (error.code === 'FREEMIUM_QUOTA_EXCEEDED') {
        reply.status(402).send({
          success: false,
          error: error.message || 'Free users can create maximum 2 assessments. Upgrade to Premium for unlimited access.',
          code: 'FREEMIUM_QUOTA_EXCEEDED',
          upgradeUrl: '/pricing?upgrade=premium',
          statusCode: 402,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Handle other 402 errors (insufficient credits)
      if (error.statusCode === 402) {
        reply.status(402).send({
          message: error.message || 'Insufficient credits',
          code: error.code || 'INSUFFICIENT_CREDITS',
          statusCode: 402,
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
        message: 'Failed to create assessment',
        code: 'ASSESSMENT_CREATE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /assessments - List Assessments
  server.get('/', {
    schema: {
      description: 'List assessments with filtering and pagination',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          organizationId: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
          templateId: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sortBy: { type: 'string', enum: ['createdAt', 'completedAt', 'riskScore'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: AssessmentResponseSchema },
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
      organizationId?: string;
      status?: string;
      templateId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    try {
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
        filters: {
          organizationId: query.organizationId,
          status: query.status ? AssessmentStatus[query.status as keyof typeof AssessmentStatus] : undefined,
          templateId: query.templateId,
        },
      };

      // Use user's organizationId if not provided in query params
      const orgId = options.filters.organizationId || user.organizationId;

      if (!orgId) {
        reply.status(400).send({
          message: 'Organization ID is required. Please create an organization first.',
          code: 'ORGANIZATION_ID_REQUIRED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await assessmentService.listAssessments(
        orgId,
        options,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(400).send({
          message: result.message || 'Failed to list assessments',
          code: 'ASSESSMENT_LIST_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { data: assessments, total, page, limit } = result.data;


      reply.status(200).send({
        data: assessments.map(assessment => {
          // Debug specific assessment
          if (assessment.id === 'cmh3fju610001phrlckdz3aa2') {
            request.log.info({
              assessmentId: assessment.id,
              status: assessment.status,
              prioritiesRaw: assessment.priorities,
              hasPriorities: !!assessment.priorities,
              prioritiesId: assessment.priorities?.id,
            }, '[BACKEND DEBUG] Assessment cmh3fju610001phrlckdz3aa2');
          }

          return {
            id: assessment.id,
            organizationId: assessment.organizationId,
            templateId: assessment.templateId,
            status: assessment.status,
            responses: assessment.responses || {},
            riskScore: assessment.riskScore,
            creditsUsed: assessment.creditsUsed,
            completedAt: assessment.completedAt?.toISOString(),
            createdAt: assessment.createdAt.toISOString(),
            updatedAt: assessment.updatedAt.toISOString(),
            // Include template, gaps, risks, and priorities status for Reports page
            template: assessment.template ? {
              id: assessment.template.id,
              name: assessment.template.name,
              category: assessment.template.category,
            } : null,
            gaps: assessment.gaps || [],
            risks: assessment.risks || [],
            hasPriorities: !!assessment.priorities,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to list assessments');
      
      reply.status(400).send({
        message: 'Failed to list assessments',
        code: 'ASSESSMENT_LIST_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /assessments/:id - Get Assessment
  server.get('/:id', {
    schema: {
      description: 'Get assessment by ID',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: AssessmentResponseSchema,
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
      const result = await assessmentService.getAssessmentById(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;

      reply.status(200).send({
        id: assessment.id,
        organizationId: assessment.organizationId,
        templateId: assessment.templateId,
        status: assessment.status,
        responses: assessment.responses || {},
        riskScore: assessment.riskScore,
        creditsUsed: assessment.creditsUsed,
        completedAt: assessment.completedAt?.toISOString(),
        createdAt: assessment.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to get assessment');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // GET /assessments/:id/results - Get Assessment Results
  server.get('/:id/results', {
    schema: {
      description: 'Get assessment results with gaps and risks',
      tags: ['Assessments'],
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
          type: 'object',
          properties: {
            assessment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string', nullable: true },
                userId: { type: 'string', nullable: true },
                templateId: { type: 'string' },
                status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
                responses: { type: 'object' },
                riskScore: { type: 'number', nullable: true },
                creditsUsed: { type: 'number', nullable: true },
                completedAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            gaps: {
              type: 'array',
              items: GapResponseSchema,
            },
            risks: {
              type: 'array',
              items: RiskResponseSchema,
            },
            overallRiskScore: { type: 'number' },
            summary: {
              type: 'object',
              properties: {
                totalGaps: { type: 'number' },
                criticalGaps: { type: 'number' },
                highRisks: { type: 'number' },
                estimatedCost: { type: 'string' },
                estimatedEffort: { type: 'string' },
                priority: { type: 'string', enum: ['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] },
              },
              required: ['totalGaps', 'criticalGaps', 'highRisks', 'estimatedCost', 'estimatedEffort', 'priority']
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
            },
            nextSteps: {
              type: 'array',
              items: { type: 'string' },
            },
            lowConfidenceAnswers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  question: { type: 'string' },
                  sectionTitle: { type: 'string' },
                  confidence: { type: 'number' },
                  currentAnswer: { type: 'string' },
                },
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
      // Use unfiltered method to bypass freemium restrictions for results page
      const result = await assessmentService.getAssessmentResultsUnfiltered(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;
      const gaps = assessment.gaps || [];
      const risks = assessment.risks || [];

      // Fetch answers with low confidence (< 0.6) that need manual input
      // Only return low confidence answers if assessment is NOT completed
      let lowConfidenceAnswers: any[] = [];

      if (assessment.status !== 'COMPLETED') {
        try {
          const answersResult = await answerService.getAssessmentAnswers(
            params.id,
            { includeQuestionDetails: true },
            { userId: user.id, userRole: user.role, organizationId: user.organizationId }
          );

          if (answersResult.success && answersResult.data) {
            lowConfidenceAnswers = (answersResult.data as any[])
              .filter(answer => {
                // Consider low confidence if score is 0 or explanation indicates no evidence
                const explanation = answer.explanation || '';
                const hasNoEvidence = explanation.toLowerCase().includes('no evidence') ||
                                      explanation.toLowerCase().includes('insufficient');
                return answer.score === 0 || hasNoEvidence;
              })
              .map(answer => ({
                questionId: answer.questionId,
                question: answer.question?.text || '',
                sectionTitle: answer.question?.section?.title || 'Unknown Section',
                confidence: answer.score / 5, // Convert score to confidence (0-1)
                currentAnswer: answer.explanation,
              }));
          }
        } catch (answerError) {
          // Log error but don't fail the entire request
          request.log.warn({ answerError, assessmentId: params.id }, 'Failed to fetch low-confidence answers');
        }
      }

      // Calculate summary statistics (use directly fetched data, not filtered assessment data)
      const criticalGaps = gaps.filter(g => g.severity === 'CRITICAL').length;
      const highRisks = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length;
      
      // Get priority from highest severity gap
      const priority = gaps.some(g => g.severity === 'CRITICAL') ? 'IMMEDIATE' :
                      gaps.some(g => g.severity === 'HIGH') ? 'SHORT_TERM' :
                      'MEDIUM_TERM';

      const responseData = {
        assessment: {
          id: assessment.id,
          organizationId: assessment.organizationId,
          userId: assessment.userId || user.id,
          templateId: assessment.templateId,
          status: assessment.status,
          responses: assessment.responses || {},
          riskScore: assessment.riskScore,
          creditsUsed: assessment.creditsUsed,
          completedAt: assessment.completedAt ? new Date(assessment.completedAt).toISOString() : null,
          createdAt: assessment.createdAt ? new Date(assessment.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: assessment.updatedAt ? new Date(assessment.updatedAt).toISOString() : new Date().toISOString(),
        },
        gaps,
        risks,
        overallRiskScore: assessment.riskScore || 0,
        summary: {
          totalGaps: gaps.length,
          criticalGaps,
          highRisks,
          estimatedCost: gaps.length > 5 ? '$50,000 - $100,000' : '$10,000 - $50,000',
          estimatedEffort: gaps.length > 5 ? '3-6 months' : '1-3 months',
          priority,
        },
        recommendations: Array.isArray(assessment.recommendations) ? assessment.recommendations : [],
        nextSteps: [],
        lowConfidenceAnswers,
      };

      // Debug logging to identify the issue
      request.log.info({
        assessmentId: params.id,
        hasSummary: !!responseData.summary,
        summaryKeys: responseData.summary ? Object.keys(responseData.summary) : [],
        summaryPriority: responseData.summary?.priority,
        summaryData: JSON.stringify(responseData.summary, null, 2),
        gapsCount: responseData.gaps?.length,
        firstGap: responseData.gaps?.[0],
      }, 'Debug: Assessment results data structure');

      // Validate summary object has all required fields
      if (responseData.summary) {
        const requiredSummaryFields = ['totalGaps', 'criticalGaps', 'highRisks', 'estimatedCost', 'estimatedEffort', 'priority'];
        const missingSummaryFields = requiredSummaryFields.filter(field =>
          !(field in responseData.summary) || responseData.summary[field] === undefined
        );

        if (missingSummaryFields.length > 0) {
          request.log.error({
            missingSummaryFields,
            summary: responseData.summary
          }, 'Missing required summary fields');
        }
      }

      request.log.info({ assessmentId: params.id, responseData }, 'Sending assessment results');

      // Additional validation before sending
      try {
        // Check each gap has priority
        if (responseData.gaps && Array.isArray(responseData.gaps)) {
          const gapsWithoutPriority = responseData.gaps.filter((gap: any) =>
            !gap.priority || gap.priority === undefined
          );
          if (gapsWithoutPriority.length > 0) {
            request.log.error({
              gapsWithoutPriority: gapsWithoutPriority.map((g: any) => ({
                id: g.id,
                priority: g.priority,
                hasPriority: 'priority' in g
              }))
            }, 'Found gaps without priority field!');
          }
        }

        reply.status(200).send(responseData);
      } catch (sendError: any) {
        request.log.error({
          error: sendError.message,
          stack: sendError.stack,
          responseDataKeys: Object.keys(responseData),
          gapsCount: responseData.gaps?.length,
          firstGap: responseData.gaps?.[0],
        }, 'Failed to send response - likely schema validation error');
        throw sendError;
      }

    } catch (error: any) {
      request.log.error({ 
        error: error.message || error,
        errorStack: error.stack,
        errorName: error.name,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        userId: user.id, 
        assessmentId: params.id 
      }, 'Failed to get assessment results');

      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // GET /assessments/:id/rfp-requirements - Get formatted RFP requirements from gaps
  server.get('/:id/rfp-requirements', {
    preHandler: [authenticationMiddleware],
    schema: {
      description: 'Get professionally formatted RFP technical requirements from assessment gaps',
      tags: ['Assessments'],
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
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                formattedRequirements: { type: 'string' },
                assessmentName: { type: 'string' },
                gapCount: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const user = request.currentUser!;

    try {
      // Get assessment with template and gaps
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          template: {
            select: {
              name: true,
            },
          },
          gaps: {
            select: {
              id: true,
              category: true,
              title: true,
              description: true,
              severity: true,
              priority: true,
              priorityScore: true,
              estimatedCost: true,
              estimatedEffort: true,
            },
            orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
          },
        },
      });

      if (!assessment) {
        reply.status(404).send({
          success: false,
          error: 'Assessment not found',
        });
        return;
      }

      // Verify user has access to this assessment
      if (assessment.userId !== user.id && user.role !== 'ADMIN') {
        if (!assessment.organizationId || assessment.organizationId !== user.organizationId) {
          reply.status(403).send({
            success: false,
            error: 'Access denied',
          });
          return;
        }
      }

      const templateName = assessment.template?.name || 'Compliance';

      // Format gaps using AI service
      const { aiAnalysisService } = await import('../services/ai-analysis.service.js');
      const formattedRequirements = await aiAnalysisService.formatGapsForRFP(
        assessment.gaps || [],
        templateName
      );

      reply.status(200).send({
        success: true,
        data: {
          formattedRequirements,
          assessmentName: templateName,
          gapCount: assessment.gaps?.length || 0,
        },
      });
    } catch (error: any) {
      request.log.error({
        error: error.message,
        stack: error.stack,
        assessmentId
      }, 'Error formatting RFP requirements');
      reply.status(500).send({
        success: false,
        error: 'Failed to format RFP requirements',
        details: error.message,
      });
    }
  }));

  // POST /assessments/:id/execute - Execute AI Assessment Analysis
  server.post('/:id/execute', {
    schema: {
      description: 'Execute AI-powered assessment analysis',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          documentIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of document IDs to analyze (required)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            assessmentId: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
            progress: {
              type: 'object',
              properties: {
                totalQuestions: { type: 'number' },
                processedQuestions: { type: 'number' },
                successfulAnalyses: { type: 'number' },
                failedAnalyses: { type: 'number' },
              },
            },
            creditsUsed: { type: 'number' },
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
    const body = request.body as { documentIds?: string[] };

    // Validate documentIds
    if (!body.documentIds || body.documentIds.length === 0) {
      reply.status(400).send({
        message: 'At least one document must be selected for analysis',
        code: 'NO_DOCUMENTS_SELECTED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const result = await assessmentService.executeAssessment(
        params.id,
        body.documentIds,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: result.message || 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(200).send(result.data);

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to execute assessment');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // GET /assessments/:id/progress - Get Assessment Execution Progress
  server.get('/:id/progress', {
    schema: {
      description: 'Get assessment execution progress',
      tags: ['Assessments'],
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
          type: 'object',
          properties: {
            assessmentId: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
            totalQuestions: { type: 'number' },
            answeredQuestions: { type: 'number' },
            completionPercentage: { type: 'number' },
            lastUpdated: { type: 'string', format: 'date-time' },
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

    try {
      // Get assessment with answers
      const result = await assessmentService.getAssessmentById(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;

      // Get template to count total questions
      const templateResult = await templateService.getTemplateById(assessment.template.id, false);
      let totalQuestions = 0;
      
      if (templateResult.success && templateResult.data) {
        for (const section of templateResult.data.sections) {
          totalQuestions += section.questions.length;
        }
      }

      // Count answered questions from Answer service
      const answersResult = await answerService.getAssessmentAnswers(params.id, {}, { userId: user.id, userRole: user.role });
      const answeredQuestions = answersResult.success && answersResult.data ? (answersResult.data as any[]).length : 0;
      
      const completionPercentage = totalQuestions > 0 
        ? Math.round((answeredQuestions / totalQuestions) * 100) 
        : 0;

      reply.status(200).send({
        assessmentId: assessment.id,
        status: assessment.status,
        totalQuestions,
        answeredQuestions,
        completionPercentage,
        lastUpdated: assessment.updatedAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to get assessment progress');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // POST /assessments/:id/update-answers - Update multiple answers with manual input
  server.post('/:id/update-answers', {
    schema: {
      description: 'Update multiple answers with manual input (for low-confidence questions)',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          answers: {
            type: 'object',
            additionalProperties: { type: 'string' }
          }
        },
        required: ['answers']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            updatedCount: { type: 'number' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const params = request.params as { id: string };
    const body = request.body as { answers: Record<string, string> };

    request.log.info({ 
      assessmentId: params.id, 
      userId: user.id, 
      answerCount: Object.keys(body.answers).length 
    }, '[UPDATE-ANSWERS] Starting update process');

    try {
      // Verify assessment exists and user has access
      request.log.info({ assessmentId: params.id }, '[UPDATE-ANSWERS] Step 1: Fetching assessment');
      const assessmentResult = await assessmentService.getAssessmentById(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!assessmentResult.success || !assessmentResult.data) {
        request.log.warn({ assessmentId: params.id }, '[UPDATE-ANSWERS] Assessment not found');
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      request.log.info({ assessmentId: params.id }, '[UPDATE-ANSWERS] Step 1 complete: Assessment found');

      // Get all answers for the assessment
      request.log.info({ assessmentId: params.id }, '[UPDATE-ANSWERS] Step 2: Fetching assessment answers');
      const answersResult = await answerService.getAssessmentAnswers(
        params.id,
        { includeQuestionDetails: false },
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!answersResult.success || !answersResult.data) {
        request.log.error({ assessmentId: params.id, result: answersResult }, '[UPDATE-ANSWERS] Failed to retrieve assessment answers');
        reply.status(500).send({
          message: 'Failed to retrieve assessment answers',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      request.log.info({ 
        assessmentId: params.id, 
        answersCount: answersResult.data.length 
      }, '[UPDATE-ANSWERS] Step 2 complete: Retrieved answers');

      // Create a map of questionId to answerId
      request.log.info({ assessmentId: params.id }, '[UPDATE-ANSWERS] Step 3: Creating questionId to answerId map');
      const answerMap = new Map();
      for (const answer of answersResult.data as any[]) {
        answerMap.set(answer.questionId, answer.id);
        request.log.debug({ questionId: answer.questionId, answerId: answer.id }, '[UPDATE-ANSWERS] Mapped question to answer');
      }
      request.log.info({ 
        assessmentId: params.id, 
        mapSize: answerMap.size 
      }, '[UPDATE-ANSWERS] Step 3 complete: Map created');

      // Update each answer with the manual input
      request.log.info({ 
        assessmentId: params.id, 
        questionsToUpdate: Object.keys(body.answers).length 
      }, '[UPDATE-ANSWERS] Step 4: Starting answer updates');
      
      let updatedCount = 0;
      const errors: string[] = [];
      
      for (const [questionId, answerText] of Object.entries(body.answers)) {
        request.log.info({ 
          questionId, 
          answerTextLength: answerText.length,
          hasMapping: answerMap.has(questionId)
        }, '[UPDATE-ANSWERS] Processing question');

        if (answerText.trim() && answerMap.has(questionId)) {
          const answerId = answerMap.get(questionId);
          
          request.log.info({ 
            questionId, 
            answerId, 
            answerText: answerText.substring(0, 50) + '...' 
          }, '[UPDATE-ANSWERS] Updating answer');

          try {
            // Update the answer with manual response
            const updateResult = await answerService.updateAnswer(
              answerId,
              {
                explanation: answerText, // Store manual input in explanation
                score: 5, // Full score for manual answers
                status: 'COMPLETE'
              },
              { userId: user.id, userRole: user.role, organizationId: user.organizationId }
            );
            
            request.log.info({ 
              questionId, 
              answerId, 
              success: updateResult.success,
              result: updateResult
            }, '[UPDATE-ANSWERS] Update result');

            if (updateResult.success) {
              updatedCount++;
              request.log.info({ questionId, answerId }, '[UPDATE-ANSWERS] ✓ Answer updated successfully');
            } else {
              const errorMsg = `Failed to update answer for question ${questionId}: ${updateResult.error || 'Unknown error'}`;
              errors.push(errorMsg);
              request.log.error({ questionId, answerId, result: updateResult }, '[UPDATE-ANSWERS] ✗ Update failed');
            }
          } catch (updateError: any) {
            request.log.error({ 
              updateError: updateError.message, 
              stack: updateError.stack,
              questionId, 
              answerId 
            }, '[UPDATE-ANSWERS] ✗ Exception during update');
            errors.push(`Error updating question ${questionId}: ${updateError.message}`);
          }
        } else {
          request.log.warn({ 
            questionId, 
            isEmpty: !answerText.trim(), 
            hasMapping: answerMap.has(questionId) 
          }, '[UPDATE-ANSWERS] Skipping question (empty or no mapping)');
        }
      }

      request.log.info({ 
        assessmentId: params.id, 
        updatedCount, 
        errorCount: errors.length,
        errors 
      }, '[UPDATE-ANSWERS] Step 4 complete: All updates processed');

      reply.status(200).send({
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully updated ${updatedCount} answers` 
          : `Updated ${updatedCount} answers with ${errors.length} errors`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      request.log.error({ 
        error: error.message, 
        stack: error.stack,
        userId: user.id, 
        assessmentId: params.id 
      }, '[UPDATE-ANSWERS] ✗ Fatal error in update process');
      
      reply.status(500).send({
        message: 'Failed to update answers',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // PATCH /assessments/:id - Update Assessment
  server.patch('/:id', {
    schema: {
      description: 'Update assessment responses or status',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: UpdateAssessmentRequestSchema,
      response: {
        200: AssessmentResponseSchema,
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
    const data = request.body as UpdateAssessmentRequest;

    try {
      // Map status from string to enum if provided
      const updateData = {
        ...data,
        status: data.status ? AssessmentStatus[data.status as keyof typeof AssessmentStatus] : undefined,
      };

      const result = await assessmentService.updateAssessment(
        params.id,
        updateData,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: result.message || 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;

      reply.status(200).send({
        id: assessment.id,
        organizationId: assessment.organizationId,
        templateId: assessment.templateId,
        status: assessment.status,
        responses: assessment.responses || {},
        riskScore: assessment.riskScore,
        creditsUsed: assessment.creditsUsed,
        completedAt: assessment.completedAt?.toISOString(),
        createdAt: assessment.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to update assessment');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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
        message: 'Failed to update assessment',
        code: 'ASSESSMENT_UPDATE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // DELETE /assessments/:id - Delete Assessment
  server.delete('/:id', {
    schema: {
      description: 'Delete an assessment',
      tags: ['Assessments'],
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
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
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
      const result = await assessmentService.deleteAssessment(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        if (result.message?.includes('not found')) {
          reply.status(404).send({
            message: result.message || 'Assessment not found',
            code: 'ASSESSMENT_NOT_FOUND',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (result.message?.includes('Access denied')) {
          reply.status(403).send({
            message: result.message || 'Access denied',
            code: 'ACCESS_DENIED',
            statusCode: 403,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to delete assessment',
          code: 'ASSESSMENT_DELETE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(200).send({
        success: true,
        message: 'Assessment deleted successfully',
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to delete assessment');

      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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
        message: 'Failed to delete assessment',
        code: 'ASSESSMENT_DELETE_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /assessments/:id/gaps - Get Assessment Gaps
  server.get('/:id/gaps', {
    schema: {
      description: 'Get identified gaps from completed assessment',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          category: { type: 'string' },
          priority: { type: 'string', enum: ['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: GapResponseSchema,
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
    const query = request.query as {
      severity?: string;
      category?: string;
      priority?: string;
    };

    try {
      // Note: This functionality might need to be implemented in the assessment service
      // For now, we'll return a placeholder response structure
      const result = await assessmentService.getAssessmentById(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract gaps from assessment data (this would typically be in a separate service method)
      const gaps = (result.data.aiAnalysis as any)?.gaps || [];

      // Apply filters if provided
      let filteredGaps = gaps;
      if (query.severity) {
        filteredGaps = filteredGaps.filter((gap: any) => gap.severity === query.severity);
      }
      if (query.category) {
        filteredGaps = filteredGaps.filter((gap: any) => gap.category === query.category);
      }
      if (query.priority) {
        filteredGaps = filteredGaps.filter((gap: any) => gap.priority === query.priority);
      }

      reply.status(200).send(filteredGaps);

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to get assessment gaps');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // GET /assessments/:id/risks - Get Assessment Risks
  server.get('/:id/risks', {
    schema: {
      description: 'Get identified risks from completed assessment',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['GEOGRAPHIC', 'TRANSACTION', 'GOVERNANCE', 'OPERATIONAL', 'REGULATORY', 'REPUTATIONAL'] },
          riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          likelihood: { type: 'string', enum: ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: RiskResponseSchema,
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
    const query = request.query as {
      category?: string;
      riskLevel?: string;
      likelihood?: string;
    };

    try {
      // Note: This functionality might need to be implemented in the assessment service
      // For now, we'll return a placeholder response structure
      const result = await assessmentService.getAssessmentById(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract risks from assessment data (this would typically be in a separate service method)
      const risks = (result.data.aiAnalysis as any)?.risks || [];

      // Apply filters if provided
      let filteredRisks = risks;
      if (query.category) {
        filteredRisks = filteredRisks.filter((risk: any) => risk.category === query.category);
      }
      if (query.riskLevel) {
        filteredRisks = filteredRisks.filter((risk: any) => risk.riskLevel === query.riskLevel);
      }
      if (query.likelihood) {
        filteredRisks = filteredRisks.filter((risk: any) => risk.likelihood === query.likelihood);
      }

      reply.status(200).send(filteredRisks);

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: params.id }, 'Failed to get assessment risks');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
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

  // Additional routes for comprehensive assessment functionality

  // POST /assessments/:id/submit-response - Submit single question response
  server.post('/:id/submit-response', {
    schema: {
      description: 'Submit a response to a specific question',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          value: {},
          metadata: { type: 'object' }
        },
        required: ['questionId', 'value']
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    try {
      const result = await assessmentService.submitResponse(
        id,
        {
          questionId: body.questionId,
          value: body.value,
          metadata: body.metadata
        },
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          message: result.error || 'Failed to submit response',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send(result.data);
    } catch (error: any) {
      reply.status(500).send({
        message: 'Failed to submit response',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // POST /assessments/:id/complete - Complete assessment with AI analysis
  server.post('/:id/complete', {
    schema: {
      description: 'Complete assessment and trigger AI analysis',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          responses: { type: 'object' },
          autoGenerate: { type: 'boolean', default: true }
        },
        required: ['responses']
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    try {
      const result = await assessmentService.completeAssessment(
        id,
        {
          responses: body.responses,
          autoGenerate: body.autoGenerate !== false
        },
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        if (result.error?.includes('credits') || result.error?.includes('credit')) {
          reply.status(402).send({
            message: 'Insufficient credits to complete assessment',
            code: 'INSUFFICIENT_CREDITS',
            statusCode: 402,
            timestamp: new Date().toISOString()
          });
          return;
        }

        reply.status(400).send({
          message: result.error || 'Failed to complete assessment',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send(result.data);
    } catch (error: any) {
      if (error.statusCode === 402) {
        reply.status(402).send({
          message: 'Insufficient credits to complete assessment',
          code: 'INSUFFICIENT_CREDITS',
          statusCode: 402,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to complete assessment',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /assessments/:id/ai-analysis - Get or generate AI analysis (Story 3.4)
  server.get('/:id/ai-analysis', {
    schema: {
      description: `Retrieves AI-generated analysis for an assessment.

If analysis doesn't exist, it will be generated (one-time process).
Subsequent calls return the stored analysis instantly.

Generation includes:
- Executive overview with key insights
- Detailed risk assessment
- Strategic recommendations

Performance:
- First call: 3-5 seconds (generation)
- Subsequent calls: <100ms (retrieval)`,
      tags: ['Assessments', 'AI'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                riskAnalysis: { type: 'object', additionalProperties: true, nullable: true },
                strategyMatrix: { type: 'array', items: { type: 'object', additionalProperties: true }, nullable: true },
                generatedAt: { type: 'string', format: 'date-time', nullable: true }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const startTime = Date.now();

    try {
      // Check if assessment exists and user has access
      const assessment = await assessmentService.getAssessmentById(id, {
        userId: user.id,
        userRole: user.role,
        organizationId: user.organizationId
      });

      if (!assessment.success || !assessment.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const assessmentData = assessment.data;

      // Check if AI analysis already exists
      const hasAnalysis = assessmentData.aiRiskAnalysis && assessmentData.aiStrategyMatrix;

      if (hasAnalysis) {
        // Return cached content
        const duration = Date.now() - startTime;
        request.log.info({
          assessmentId: id,
          duration,
          source: 'cache',
          performance: duration < 100 ? 'GOOD' : 'SLOW'
        });

        reply.status(200).send({
          success: true,
          data: {
            riskAnalysis: assessmentData.aiRiskAnalysis,
            strategyMatrix: assessmentData.aiStrategyMatrix,
            generatedAt: assessmentData.aiGeneratedAt
          }
        });
        return;
      }

      // Generate AI analysis if it doesn't exist
      const result = await assessmentService.generateAndStoreAIAnalysis(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(500).send({
          message: result.error || 'Failed to generate AI analysis',
          code: 'AI_GENERATION_FAILED',
          statusCode: 500,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const duration = Date.now() - startTime;
      request.log.info({
        assessmentId: id,
        duration,
        source: 'generation',
        performance: duration < 5000 ? 'GOOD' : 'SLOW'
      });

      reply.status(200).send({
        success: true,
        data: {
          riskAnalysis: result.data.riskAnalysis,
          strategyMatrix: result.data.strategyMatrix,
          generatedAt: result.data.generatedAt || new Date().toISOString()
        }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      request.log.error({
        error,
        assessmentId: id,
        duration
      }, 'AI analysis endpoint failed');

      reply.status(500).send({
        message: 'An error occurred while processing your request',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // POST /assessments/:id/generate-ai-analysis - Generate and store AI analysis (Story 3.3)
  server.post('/:id/generate-ai-analysis', {
    schema: {
      description: 'Generate and store comprehensive AI analysis for assessment',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                aiGeneratedOverview: { type: 'string' },
                aiGeneratedContent: { type: 'string' },
                aiGeneratedRisks: { type: 'string', nullable: true },
                aiGeneratedStrategies: { type: 'string', nullable: true }
              }
            }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      const result = await assessmentService.generateAndStoreAIAnalysis(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          message: result.error || 'Failed to generate AI analysis',
          code: 'AI_ANALYSIS_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      request.log.error({ error, assessmentId: id }, 'AI analysis generation failed');
      reply.status(500).send({
        message: 'Failed to generate AI analysis',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /assessments/:id/risk-breakdown - Get risk score breakdown
  server.get('/:id/risk-breakdown', {
    schema: {
      description: 'Get detailed risk score breakdown',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      const result = await assessmentService.getRiskScoreBreakdown(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          message: result.error || 'Failed to get risk breakdown',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send(result.data);
    } catch (error: any) {
      reply.status(500).send({
        message: 'Failed to get risk breakdown',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ==================== ANSWER MANAGEMENT ROUTES ====================

  // POST /assessments/:id/answers - Create or bulk create answers
  server.post('/:id/answers', {
    schema: {
      description: 'Create or update answers for an assessment (supports bulk operations)',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                score: { type: 'number', minimum: 0, maximum: 5 },
                explanation: { type: 'string' },
                sourceReference: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['COMPLETE', 'INCOMPLETE', 'IN_PROGRESS'] }
              },
              required: ['questionId', 'score', 'explanation']
            }
          }
        },
        required: ['answers']
      },
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
                  assessmentId: { type: 'string' },
                  questionId: { type: 'string' },
                  score: { type: 'number' },
                  explanation: { type: 'string' },
                  sourceReference: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const body = request.body as { answers: any[] };

    try {
      const result = await answerService.bulkCreateAnswers(
        id,
        body.answers,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          success: false,
          message: result.error || 'Failed to create answers',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: id }, 'Failed to create answers');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to create answers',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /assessments/:id/answers - Get all answers for an assessment
  server.get('/:id/answers', {
    schema: {
      description: 'Get all answers for an assessment',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'INCOMPLETE', 'IN_PROGRESS'] },
          includeQuestionDetails: { type: 'boolean', default: false }
        }
      },
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
                  assessmentId: { type: 'string' },
                  questionId: { type: 'string' },
                  score: { type: 'number' },
                  explanation: { type: 'string' },
                  sourceReference: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const query = request.query as { 
      status?: string; 
      includeQuestionDetails?: boolean;
    };

    try {
      const result = await answerService.getAssessmentAnswers(
        id,
        {
          status: query.status ? AnswerStatus[query.status as keyof typeof AnswerStatus] : undefined,
          includeQuestionDetails: query.includeQuestionDetails
        },
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          success: false,
          message: result.error || 'Failed to get answers',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: id }, 'Failed to get answers');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to get answers',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /assessments/:id/answers/stats - Get answer statistics
  server.get('/:id/answers/stats', {
    schema: {
      description: 'Get answer statistics for an assessment',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalQuestions: { type: 'number' },
                totalAnswered: { type: 'number' },
                completedAnswers: { type: 'number' },
                incompleteAnswers: { type: 'number' },
                inProgressAnswers: { type: 'number' },
                averageScore: { type: 'number' },
                completionPercentage: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      const result = await answerService.getAssessmentAnswerStats(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          success: false,
          message: result.error || 'Failed to get answer statistics',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: id }, 'Failed to get answer statistics');
      
      reply.status(500).send({
        message: 'Failed to get answer statistics',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // PATCH /answers/:id - Update individual answer
  server.patch('/answers/:id', {
    schema: {
      description: 'Update an individual answer',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          score: { type: 'number', minimum: 0, maximum: 5 },
          explanation: { type: 'string' },
          sourceReference: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['COMPLETE', 'INCOMPLETE', 'IN_PROGRESS'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                assessmentId: { type: 'string' },
                questionId: { type: 'string' },
                score: { type: 'number' },
                explanation: { type: 'string' },
                sourceReference: { type: 'string', nullable: true },
                status: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    try {
      const result = await answerService.updateAnswer(
        id,
        body,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          success: false,
          message: result.error || 'Failed to update answer',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, answerId: id }, 'Failed to update answer');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to update answer',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // PATCH /answers/:id/status - Update answer status
  server.patch('/answers/:id/status', {
    schema: {
      description: 'Update answer status',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'INCOMPLETE', 'IN_PROGRESS'] }
        },
        required: ['status']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                assessmentId: { type: 'string' },
                questionId: { type: 'string' },
                score: { type: 'number' },
                explanation: { type: 'string' },
                sourceReference: { type: 'string', nullable: true },
                status: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };
    const body = request.body as { status: string };

    try {
      const result = await answerService.updateAnswerStatus(
        id,
        AnswerStatus[body.status as keyof typeof AnswerStatus],
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(400).send({
          success: false,
          message: result.error || 'Failed to update answer status',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, answerId: id }, 'Failed to update answer status');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to update answer status',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /answers/:id - Get answer with full details
  server.get('/answers/:id', {
    schema: {
      description: 'Get answer with full details including question and assessment',
      tags: ['Answers'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                assessmentId: { type: 'string' },
                questionId: { type: 'string' },
                score: { type: 'number' },
                explanation: { type: 'string' },
                sourceReference: { type: 'string', nullable: true },
                status: { type: 'string' },
                question: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    categoryTag: { type: 'string', nullable: true },
                    weight: { type: 'number' },
                    section: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        order: { type: 'number' }
                      }
                    }
                  }
                },
                assessment: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    templateId: { type: 'string' },
                    organizationId: { type: 'string' },
                    status: { type: 'string' }
                  }
                },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      const result = await answerService.getAnswerWithDetails(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        reply.status(404).send({
          success: false,
          message: result.error || 'Answer not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, answerId: id }, 'Failed to get answer details');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to get answer details',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ==================== REPORT GENERATION ROUTES ====================

  // GET /assessments/:id/report - Generate PDF report
  server.get('/:id/report', {
    schema: {
      description: 'Generate PDF report for completed assessment (Premium feature)',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      const result = await reportGeneratorService.generatePDFReport(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 : 
                          result.error?.includes('Premium') ? 403 : 400;
        reply.status(statusCode).send({
          success: false,
          message: result.error || 'Failed to generate report',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: id }, 'Failed to generate PDF report');
      
      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Premium feature - PDF reports are only available for premium users',
          code: 'PREMIUM_FEATURE',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (error.statusCode === 404) {
        reply.status(404).send({
          success: false,
          message: error.message || 'Assessment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to generate PDF report',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // GET /assessments/:id/report/download - Download PDF report
  server.get('/:id/report/download', {
    schema: {
      description: 'Download generated PDF report',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id } = request.params as { id: string };

    try {
      // Verify assessment exists and user has access
      const assessmentResult = await assessmentService.getAssessmentById(
        id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!assessmentResult.success || !assessmentResult.data) {
        reply.status(404).send({
          success: false,
          message: 'Assessment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Get the report file from object storage
      const objectStorageService = new (await import('../objectStorage')).ObjectStorageService();
      const privateDir = objectStorageService.getPrivateObjectDir();
      const filename = `assessment-report-${id}.pdf`;
      const objectPath = `${privateDir}/reports/${id}/${filename}`;

      // Get the file object
      const reportFile = await objectStorageService.getDocumentFile(objectPath);

      // Get file metadata
      const [metadata] = await reportFile.getMetadata();

      // Set headers for download
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Type', metadata.contentType || 'application/pdf');
      reply.header('Content-Length', metadata.size);
      reply.header('Cache-Control', 'private, max-age=86400');

      // Stream the file to the response
      const stream = reportFile.createReadStream();

      stream.on('error', (err) => {
        request.log.error({ error: err, assessmentId: id }, 'Stream error during PDF download');
        if (!reply.sent) {
          reply.status(500).send({
            success: false,
            message: 'Error streaming file',
            timestamp: new Date().toISOString()
          });
        }
      });

      return reply.send(stream);
    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId: id }, 'Failed to download PDF report');

      // Check if error is ObjectNotFoundError
      const { ObjectNotFoundError } = await import('../objectStorage');
      if (error instanceof ObjectNotFoundError || error.code === 404) {
        reply.status(404).send({
          success: false,
          message: 'No report found. Please generate a report first.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to download PDF report',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ==================== PRIORITIES ROUTES (Story 1.10) ====================

  const prioritiesService = new PrioritiesService();

  // POST /:id/priorities - Submit priorities questionnaire
  server.post('/:id/priorities', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;

    // Debug logging
    request.log.info({
      hasCurrentUser: !!request.currentUser,
      currentUser: request.currentUser,
      assessmentId
    }, 'Priorities route - checking authentication');

    const user = request.currentUser!;

    try {
      // Log incoming request body for debugging
      request.log.info({ body: request.body, assessmentId }, 'Priorities submission received');

      // Validate with Zod schema
      const validatedData = PrioritiesSchema.parse(request.body);

      // Submit priorities
      const priorities = await prioritiesService.submitPriorities(
        assessmentId,
        validatedData,
        user.id
      );

      reply.status(201).send({
        success: true,
        data: priorities
      });
    } catch (error: any) {
      // Log detailed error information
      request.log.error({
        error: error.message,
        errorName: error.name,
        errorDetails: error.errors || error,
        body: request.body
      }, 'Priorities submission failed');

      if (error.name === 'ZodError') {
        reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      if (error.statusCode === 404) {
        reply.status(404).send({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          success: false,
          error: error.message
        });
        return;
      }

      throw error;
    }
  }));

  // GET /:id/priorities - Get priorities questionnaire
  server.get('/:id/priorities', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const user = request.currentUser!;

    try {
      // Debug logging for specific assessment
      if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
        request.log.info({
          assessmentId,
          userId: user.id,
          userEmail: user.email,
        }, '[PRIORITIES DEBUG] Getting priorities for cmh3fju610001phrlckdz3aa2');
      }

      // Check assessment ownership
      const assessmentResult = await assessmentService.getAssessmentById(assessmentId);
      if (!assessmentResult || !assessmentResult.success || !assessmentResult.data) {
        if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
          request.log.error({
            assessmentId,
            assessmentResult
          }, '[PRIORITIES DEBUG] Assessment not found');
        }
        reply.status(404).send({
          success: false,
          error: 'Assessment not found'
        });
        return;
      }

      // Debug the actual data structure for our specific assessment
      if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
        request.log.info({
          assessmentId,
          assessmentUserId: assessmentResult.data.userId,
          currentUserId: user.id,
          match: assessmentResult.data.userId === user.id
        }, '[PRIORITIES DEBUG] Checking authorization');
      }

      // Check ownership - userId should now always be present after freemium service fix
      if (assessmentResult.data.userId !== user.id) {
        if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
          request.log.error({
            assessmentId,
            assessmentUserId: assessmentResult.data.userId,
            currentUserId: user.id,
          }, '[PRIORITIES DEBUG] User ID mismatch');
        }
        reply.status(403).send({
          success: false,
          error: 'Not authorized to access this assessment'
        });
        return;
      }

      // Get priorities
      const priorities = await prioritiesService.getPriorities(assessmentId);

      if (!priorities) {
        if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
          request.log.error({
            assessmentId
          }, '[PRIORITIES DEBUG] Priorities not found in DB');
        }
        reply.status(404).send({
          success: false,
          error: 'Priorities not found for this assessment'
        });
        return;
      }

      if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
        request.log.info({
          assessmentId,
          prioritiesId: priorities.id,
          hasPriorities: true
        }, '[PRIORITIES DEBUG] Returning priorities successfully');
      }

      reply.status(200).send({
        success: true,
        data: priorities
      });
    } catch (error: any) {
      throw error;
    }
  }));

  // PUT /:id/priorities - Update priorities questionnaire
  server.put('/:id/priorities', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const user = request.currentUser!;

    try {
      // Validate with Zod schema
      const validatedData = PrioritiesSchema.parse(request.body);

      // Update priorities (upsert handles both create and update)
      const priorities = await prioritiesService.submitPriorities(
        assessmentId,
        validatedData,
        user.id
      );

      reply.status(200).send({
        success: true,
        data: priorities
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      if (error.statusCode === 404) {
        reply.status(404).send({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          success: false,
          error: error.message
        });
        return;
      }

      throw error;
    }
  }));

  // GET /assessments/:id/enhanced-results - Get enhanced results with evidence weighting
  server.get('/:id/enhanced-results', {
    schema: {
      description: 'Get enhanced assessment results with evidence-weighted scoring',
      tags: ['Assessments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            confidenceLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            totalAnswers: { type: 'number' },
            evidenceDistribution: {
              type: 'object',
              properties: {
                tier0: { type: 'object', properties: { count: { type: 'number' }, percentage: { type: 'number' } } },
                tier1: { type: 'object', properties: { count: { type: 'number' }, percentage: { type: 'number' } } },
                tier2: { type: 'object', properties: { count: { type: 'number' }, percentage: { type: 'number' } } }
              }
            },
            sectionBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sectionId: { type: 'string' },
                  sectionName: { type: 'string' },
                  score: { type: 'number' },
                  weight: { type: 'number' },
                  evidenceCounts: {
                    type: 'object',
                    properties: {
                      tier0: { type: 'number' },
                      tier1: { type: 'number' },
                      tier2: { type: 'number' }
                    }
                  }
                }
              }
            },
            methodology: {
              type: 'object',
              properties: {
                scoringApproach: { type: 'string' },
                weightingExplanation: { type: 'string' },
                evidenceImpact: { type: 'string' }
              }
            },
            hasPriorities: { type: 'boolean' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const { id: assessmentId } = request.params as { id: string };

    try {
      // Get assessment to verify access and status
      const assessmentResult = await assessmentService.getAssessmentById(
        assessmentId,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!assessmentResult.success || !assessmentResult.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const assessment = assessmentResult.data;

      // Get all answers for evidence tier distribution
      const answersResult = await answerService.getAssessmentAnswers(
        assessmentId,
        {},
        { userId: user.id, userRole: user.role }
      );

      const answers = answersResult.success && answersResult.data ? answersResult.data as any[] : [];
      const totalAnswers = answers.length;

      // Calculate evidence distribution
      const tier0Count = answers.filter(a => a.evidenceTier === 'TIER_0').length;
      const tier1Count = answers.filter(a => a.evidenceTier === 'TIER_1').length;
      const tier2Count = answers.filter(a => a.evidenceTier === 'TIER_2').length;

      const evidenceDistribution = {
        tier0: {
          count: tier0Count,
          percentage: totalAnswers > 0 ? Math.round((tier0Count / totalAnswers) * 100) : 0
        },
        tier1: {
          count: tier1Count,
          percentage: totalAnswers > 0 ? Math.round((tier1Count / totalAnswers) * 100) : 0
        },
        tier2: {
          count: tier2Count,
          percentage: totalAnswers > 0 ? Math.round((tier2Count / totalAnswers) * 100) : 0
        }
      };

      // Determine confidence level based on evidence quality
      let confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      const tier2Percentage = evidenceDistribution.tier2.percentage;
      const tier1Percentage = evidenceDistribution.tier1.percentage;

      if (tier2Percentage >= 60) {
        confidenceLevel = 'HIGH';
      } else if (tier2Percentage + tier1Percentage >= 60) {
        confidenceLevel = 'MEDIUM';
      }

      // Get template to build section breakdown
      const templateResult = await templateService.getTemplateById(assessment.template.id, false);

      if (!templateResult.success || !templateResult.data) {
        reply.status(500).send({
          message: 'Failed to load template',
          code: 'TEMPLATE_NOT_FOUND',
          statusCode: 500,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const template = templateResult.data;

      // Build section breakdown with evidence counts
      const sectionBreakdown = template.sections.map(section => {
        // Get answers for this section's questions
        const sectionQuestionIds = section.questions.map(q => q.id);
        const sectionAnswers = answers.filter(a => sectionQuestionIds.includes(a.questionId));

        // Calculate section score (simple average of final scores, scaled to 0-100)
        const avgFinalScore = sectionAnswers.length > 0
          ? sectionAnswers.reduce((sum, a) => sum + (a.finalScore || a.score || 0), 0) / sectionAnswers.length
          : 0;
        const scaledScore = Math.round((avgFinalScore / 5) * 100); // Convert 0-5 scale to 0-100

        return {
          sectionId: section.id,
          sectionName: section.title,
          score: scaledScore,
          weight: Math.round(section.weight * 100),
          evidenceCounts: {
            tier0: sectionAnswers.filter(a => a.evidenceTier === 'TIER_0').length,
            tier1: sectionAnswers.filter(a => a.evidenceTier === 'TIER_1').length,
            tier2: sectionAnswers.filter(a => a.evidenceTier === 'TIER_2').length
          }
        };
      });

      // Check if priorities have been completed
      const hasPriorities = await prioritiesService.getPriorities(assessmentId)
        .then(() => true)
        .catch(() => false);

      // Methodology explanation
      const methodology = {
        scoringApproach: 'Each answer receives a quality score (0-5) which is multiplied by an evidence tier multiplier: TIER_0 (self-declared) = ×0.6, TIER_1 (claimed with evidence) = ×0.8, TIER_2 (pre-filled from documents) = ×1.0',
        weightingExplanation: 'Section scores are calculated by weighting individual question scores, then the overall assessment score is computed as a weighted average of section scores',
        evidenceImpact: 'Higher quality evidence (TIER_2) provides full scoring confidence, while lower tiers receive proportionally reduced scores to reflect uncertainty'
      };

      // Calculate overall score as weighted average of section scores
      const totalWeight = sectionBreakdown.reduce((sum, section) => sum + section.weight, 0);
      const weightedScoreSum = sectionBreakdown.reduce((sum, section) =>
        sum + (section.score * section.weight / 100), 0
      );
      const overallScore = totalWeight > 0 ? Math.round(weightedScoreSum) : 0;

      reply.status(200).send({
        overallScore,
        confidenceLevel,
        totalAnswers,
        evidenceDistribution,
        sectionBreakdown,
        methodology,
        hasPriorities
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, assessmentId }, 'Failed to get enhanced results');

      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Assessment not found',
          code: error.code || 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          message: error.message || 'Access denied',
          code: error.code || 'ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
        return;
      }

      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ==================== ENHANCED VENDOR MATCHING ROUTES (Story 1.11) ====================
  // These routes are assessment-specific, so they belong here not in vendor.routes.ts

  const vendorMatchingService = new VendorMatchingService();
  const strategyMatrixService = new StrategyMatrixService();
  const prioritiesServiceInstance = new PrioritiesService();

  // GET /:id/vendor-matches-v2 - Enhanced vendor matching with priorities
  server.get('/:id/vendor-matches-v2', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }, Querystring: { threshold?: number, limit?: number } }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const { threshold = 0, limit = 50 } = request.query;  // Lower threshold to 0 to show all matches
    const user = request.currentUser!;

    try {
      // Check priorities exist
      const priorities = await prioritiesServiceInstance.getPriorities(assessmentId);
      if (!priorities) {
        reply.status(400).send({
          success: false,
          error: 'Priorities questionnaire required for enhanced vendor matching. Please complete the priorities questionnaire first.',
          code: 'PRIORITIES_REQUIRED'
        });
        return;
      }

      // Generate cache key from priorities
      const prioritiesHash = crypto.createHash('md5').update(JSON.stringify(priorities)).digest('hex');
      const cacheKey = `vendor_matches:v2:${prioritiesHash}`;

      // Check cache (if Redis available)
      // Note: Redis client would be injected in production

      // Calculate matches
      const matches = await vendorMatchingService.matchVendorsToAssessment(
        assessmentId,
        priorities.id
      );

      // Filter and sort
      const filtered = matches
        .filter(m => m.totalScore >= threshold)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);

      const result = {
        matches: filtered,  // Frontend expects 'matches' not 'vendors'
        count: filtered.length,
        threshold,
        generatedAt: new Date()
      };

      reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        reply.status(404).send({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          success: false,
          error: error.message
        });
        return;
      }

      request.log.error({ error, assessmentId }, 'Vendor matching failed');
      reply.status(500).send({
        success: false,
        error: 'Vendor matching failed. Please try again.'
      });
    }
  }));

  // GET /:id/strategy-matrix - Phased remediation roadmap
  server.get('/:id/strategy-matrix', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const user = request.currentUser!;

    try {
      // Authorization check would be here (checking assessment ownership)
      // For now, generate matrix
      const matrix = await strategyMatrixService.generateStrategyMatrix(assessmentId);

      reply.status(200).send({
        success: true,
        data: matrix
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        reply.status(404).send({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.statusCode === 403) {
        reply.status(403).send({
          success: false,
          error: error.message
        });
        return;
      }

      request.log.error({ error, assessmentId }, 'Strategy matrix generation failed');
      reply.status(500).send({
        success: false,
        error: 'Strategy matrix generation failed. Please try again.'
      });
    }
  }));
}