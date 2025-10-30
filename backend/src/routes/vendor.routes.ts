/**
 * Vendor Routes
 * Handles vendor marketplace, solutions, contacts, and matching functionality
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
// import { zodToJsonSchema } from 'zod-to-json-schema'; // Causes Fastify schema issues
import { vendorService } from '../services';
import { emailService } from '../services/email.service';
import { VendorMatchingService } from '../services/vendor-matching.service';
import { StrategyMatrixService } from '../services/strategy-matrix.service';
import { PrioritiesService } from '../services/priorities.service';
import { VendorCategory, PricingModel, ContactType, ContactStatus } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';
import { env } from '../config/env.validation';
import crypto from 'crypto';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Request/Response schemas matching the contract tests
const VendorCategorySchema = z.enum([
  'KYC_AML',
  'TRANSACTION_MONITORING',
  'SANCTIONS_SCREENING',
  'TRADE_SURVEILLANCE',
  'RISK_ASSESSMENT',
  'COMPLIANCE_TRAINING',
  'REGULATORY_REPORTING',
  'DATA_GOVERNANCE',
]);

const PricingModelSchema = z.enum(['SUBSCRIPTION', 'LICENSE', 'USAGE', 'CUSTOM']);
const ContactTypeSchema = z.enum(['DEMO_REQUEST', 'INFO_REQUEST', 'RFP', 'PRICING', 'GENERAL']);
const ContactStatusSchema = z.enum(['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);

const ContactVendorRequestSchema = z.object({
  type: ContactTypeSchema,
  message: z.string().min(1, 'Message is required').max(2000),
  requirements: z.object({}).passthrough().optional(),
  budget: z.string().max(100).optional(),
  timeline: z.string().max(100).optional(),
});

const CompareVendorsRequestSchema = z.object({
  vendorIds: z.array(z.string()).min(2, 'At least 2 vendors required').max(4, 'Maximum 4 vendors allowed'),
});

const SolutionResponseSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  name: z.string(),
  description: z.string(),
  category: VendorCategorySchema,
  features: z.array(z.string()),
  pricingModel: PricingModelSchema,
  startingPrice: z.number().optional(),
  currency: z.string().optional(),
});

const VendorResponseSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string(),
  logoUrl: z.string().nullable().optional(),
  headquarters: z.string().nullable().optional(),
  primaryProducts: z.string().nullable().optional(),
  aiCapabilities: z.string().nullable().optional(),
  deploymentOptions: z.string().nullable().optional(),
  integrations: z.string().nullable().optional(),
  dataCoverage: z.string().nullable().optional(),
  awards: z.string().nullable().optional(),
  customerSegments: z.string().nullable().optional(),
  benefitsSnapshot: z.string().nullable().optional(),
  maturityAssessment: z.string().nullable().optional(),
  categories: z.array(VendorCategorySchema),
  featured: z.boolean(),
  verified: z.boolean(),
  rating: z.number().nullable().optional(),
  reviewCount: z.number(),
  status: z.string(),
});

const VendorContactResponseSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  type: ContactTypeSchema,
  message: z.string(),
  status: ContactStatusSchema,
  createdAt: z.string().datetime(),
});

const VendorComparisonResponseSchema = z.object({
  vendors: z.array(VendorResponseSchema),
  comparison: z.object({}).passthrough(),
});

const VendorMatchResponseSchema = z.object({
  id: z.string(),
  gapId: z.string(),
  vendorId: z.string(),
  solutionId: z.string(),
  matchScore: z.number(),
  reasoning: z.array(z.string()),
});

const VendorRegistrationRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL required'),
  description: z.string().min(1, 'Description is required'),
  foundedYear: z.string().optional(),
  headquarters: z.string().optional(),
  employeeCount: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  pricing: z.string().optional(),
  implementationTime: z.string().optional(),
  features: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  clientTypes: z.array(z.string()).default([]),
  supportedRegions: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid contact email required'),
  contactPhone: z.string().optional(),
  casStudies: z.string().optional(),
});

type ContactVendorRequest = z.infer<typeof ContactVendorRequestSchema>;
type CompareVendorsRequest = z.infer<typeof CompareVendorsRequestSchema>;
type VendorRegistrationRequest = z.infer<typeof VendorRegistrationRequestSchema>;

export default async function vendorRoutes(server: FastifyInstance) {

  // POST /vendors/register - Vendor Registration (Public endpoint)
  server.post('/register', {
    schema: {
      description: 'Submit vendor registration application',
      tags: ['Vendors'],
      body: {
        type: 'object',
        properties: {
          companyName: { type: 'string', minLength: 1 },
          website: { type: 'string', format: 'uri' },
          description: { type: 'string', minLength: 1 },
          foundedYear: { type: 'string' },
          headquarters: { type: 'string' },
          employeeCount: { type: 'string' },
          category: { type: 'string', minLength: 1 },
          pricing: { type: 'string' },
          implementationTime: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          certifications: { type: 'array', items: { type: 'string' } },
          clientTypes: { type: 'array', items: { type: 'string' } },
          supportedRegions: { type: 'array', items: { type: 'string' } },
          integrations: { type: 'array', items: { type: 'string' } },
          contactName: { type: 'string', minLength: 1 },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          casStudies: { type: 'string' },
        },
        required: ['companyName', 'website', 'description', 'category', 'contactName', 'contactEmail']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['success', 'message']
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
        500: {
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
    // No authentication required - public endpoint
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as VendorRegistrationRequest;

    try {
      // Validate the request body using Zod
      const validatedData = VendorRegistrationRequestSchema.parse(data);

      // Get admin email from environment
      const adminEmail = env.ADMIN_EMAIL;

      // Send email notification to admin
      await emailService.sendVendorRegistrationNotification(adminEmail, validatedData);

      request.log.info('Vendor registration application submitted', {
        companyName: validatedData.companyName,
        contactEmail: validatedData.contactEmail,
      });

      reply.status(200).send({
        success: true,
        message: 'Your vendor application has been submitted successfully. We will review it and contact you within 2-3 business days.',
      });

    } catch (error: any) {
      request.log.error('Failed to submit vendor registration', { error, data });

      // Handle validation errors
      if (error.name === 'ZodError') {
        reply.status(400).send({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(500).send({
        message: 'Failed to submit vendor registration. Please try again later.',
        code: 'REGISTRATION_FAILED',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /vendors - List Vendors (Public endpoint for marketplace)
  server.get('/', {
    schema: {
      description: 'List vendors with filtering, search, and pagination',
      tags: ['Vendors'],
      // No security requirement - public marketplace endpoint
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING', 'TRADE_SURVEILLANCE', 'RISK_ASSESSMENT', 'COMPLIANCE_TRAINING', 'REGULATORY_REPORTING', 'DATA_GOVERNANCE'] },
          search: { type: 'string' },
          featured: { type: 'boolean' },
          verified: { type: 'boolean' },
          minRating: { type: 'number', minimum: 0, maximum: 5 },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sortBy: { type: 'string', enum: ['name', 'rating', 'reviewCount', 'featured'], default: 'featured' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { 
              type: 'array', 
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  companyName: { type: 'string' },
                  website: { type: 'string' },
                  logoUrl: { type: ['string', 'null'] },
                  headquarters: { type: ['string', 'null'] },
                  primaryProducts: { type: ['string', 'null'] },
                  aiCapabilities: { type: ['string', 'null'] },
                  deploymentOptions: { type: ['string', 'null'] },
                  integrations: { type: ['string', 'null'] },
                  dataCoverage: { type: ['string', 'null'] },
                  awards: { type: ['string', 'null'] },
                  customerSegments: { type: ['string', 'null'] },
                  benefitsSnapshot: { type: ['string', 'null'] },
                  maturityAssessment: { type: ['string', 'null'] },
                  categories: { type: 'array', items: { type: 'string' } },
                  featured: { type: 'boolean' },
                  verified: { type: 'boolean' },
                  rating: { type: 'number' },
                  reviewCount: { type: 'number' },
                  status: { type: 'string' },
                },
                required: ['id', 'companyName', 'website', 'categories', 'featured', 'verified', 'reviewCount', 'status']
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
              required: ['page', 'limit', 'total', 'totalPages']
            },
          },
          required: ['data', 'pagination']
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
    // No preHandler - public endpoint accessible without authentication
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Public endpoint - no user required
    const query = request.query as {
      category?: string;
      search?: string;
      featured?: boolean;
      verified?: boolean;
      minRating?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    try {
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        sortBy: query.sortBy || 'featured',
        sortOrder: query.sortOrder || 'desc',
        filters: {
          category: query.category ? VendorCategory[query.category as keyof typeof VendorCategory] : undefined,
          search: query.search,
          featured: query.featured,
          verified: query.verified,
          minRating: query.minRating,
        },
      };

      const result = await vendorService.listMarketplaceVendors(
        options,
        // No authentication context needed for public marketplace
        undefined
      );

      if (!result.success || !result.data) {
        reply.status(400).send({
          message: result.message || 'Failed to list vendors',
          code: 'VENDOR_LIST_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { data: vendors, total, page, limit } = result.data;

      reply.status(200).send({
        data: vendors.map(vendor => ({
          id: vendor.id,
          companyName: vendor.companyName,
          website: vendor.website,
          logo: vendor.logo,
          logoUrl: vendor.logo, // Map logo field to logoUrl for compatibility
          headquarters: vendor.headquarters,
          primaryProducts: vendor.primaryProduct,
          aiCapabilities: vendor.aiCapabilities,
          deploymentOptions: vendor.deploymentOptions,
          integrations: vendor.integrations,
          dataCoverage: vendor.dataCoverage,
          awards: vendor.awards,
          customerSegments: vendor.customerSegments,
          benefitsSnapshot: vendor.benefitsSnapshot,
          maturityAssessment: vendor.maturityAssessment,
          description: vendor.description,
          shortDescription: vendor.shortDescription,
          categories: vendor.categories || [],
          featured: vendor.featured,
          verified: vendor.verified,
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
          status: vendor.status,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error: any) {
      request.log.error({ error }, 'Failed to list vendors');
      
      reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /vendors/:id/click - Track Vendor Click
  server.post('/:id/click', {
    schema: {
      description: 'Track a click on a vendor profile or listing (analytics)',
      tags: ['Vendors'],
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
          required: ['success']
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
    // No authentication required - public tracking endpoint
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };

    try {
      // Increment vendor click count
      const vendor = await prisma.vendor.update({
        where: { id: params.id },
        data: { clickCount: { increment: 1 } },
        select: { id: true, companyName: true, clickCount: true }
      });

      request.log.info('Vendor click tracked', {
        vendorId: vendor.id,
        companyName: vendor.companyName,
        newClickCount: vendor.clickCount,
      });

      reply.status(200).send({
        success: true,
        message: 'Click tracked successfully',
      });

    } catch (error: any) {
      request.log.error({ error, vendorId: params.id }, 'Failed to track vendor click');

      if (error.code === 'P2025') {
        reply.status(404).send({
          message: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND',
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

  // GET /vendors/:id - Get Vendor
  server.get('/:id', {
    schema: {
      description: 'Get vendor by ID',
      tags: ['Vendors'],
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
            id: { type: 'string' },
            companyName: { type: 'string' },
            website: { type: 'string' },
            logo: { type: 'string' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            categories: { type: 'array', items: { type: 'string' } },
            featured: { type: 'boolean' },
            verified: { type: 'boolean' },
            rating: { type: 'number' },
            reviewCount: { type: 'number' },
          },
          required: ['id', 'companyName', 'categories', 'featured', 'verified', 'reviewCount']
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
    const params = request.params as { id: string };

    try {
      const result = await vendorService.getVendorById(
        params.id,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const vendor = result.data;

      reply.status(200).send({
        id: vendor.id,
        companyName: vendor.companyName,
        website: vendor.website,
        logo: vendor.logo,
        description: vendor.description,
        shortDescription: vendor.shortDescription,
        categories: vendor.categories || [],
        featured: vendor.featured,
        verified: vendor.verified,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, vendorId: params.id }, 'Failed to get vendor');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Vendor not found',
          code: error.code || 'VENDOR_NOT_FOUND',
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

  // GET /vendors/:id/solutions - Get Vendor Solutions
  server.get('/:id/solutions', {
    schema: {
      description: 'Get solutions offered by vendor',
      tags: ['Vendors'],
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
          category: { type: 'string', enum: ['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING', 'TRADE_SURVEILLANCE', 'RISK_ASSESSMENT', 'COMPLIANCE_TRAINING', 'REGULATORY_REPORTING', 'DATA_GOVERNANCE'] },
          pricingModel: { type: 'string', enum: ['SUBSCRIPTION', 'LICENSE', 'USAGE', 'CUSTOM'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              vendorId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
              pricingModel: { type: 'string' },
              startingPrice: { type: 'number' },
              currency: { type: 'string' },
            },
            required: ['id', 'vendorId', 'name', 'description', 'category', 'features', 'pricingModel']
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
    const params = request.params as { id: string };
    const query = request.query as {
      category?: string;
      pricingModel?: string;
    };

    try {
      const options = {
        filters: {
          vendorId: params.id,
          category: query.category ? VendorCategory[query.category as keyof typeof VendorCategory] : undefined,
          pricingModel: query.pricingModel ? PricingModel[query.pricingModel as keyof typeof PricingModel] : undefined,
        },
      };

      const result = await vendorService.listMarketplaceSolutions(
        options,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Vendor or solutions not found',
          code: 'VENDOR_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { data: solutions } = result.data;

      reply.status(200).send(solutions.map(solution => ({
        id: solution.id,
        vendorId: solution.vendorId,
        name: solution.name,
        description: solution.description,
        category: solution.category,
        features: solution.features || [],
        pricingModel: solution.pricingModel,
        startingPrice: solution.startingPrice,
        currency: solution.currency,
      })));

    } catch (error: any) {
      request.log.error({ error, userId: user.id, vendorId: params.id }, 'Failed to get vendor solutions');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Vendor not found',
          code: error.code || 'VENDOR_NOT_FOUND',
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

  // POST /vendors/:id/contact - Contact Vendor
  server.post('/:id/contact', {
    schema: {
      description: 'Contact vendor for information or demo request',
      tags: ['Vendors'],
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
          type: { type: 'string', enum: ['DEMO_REQUEST', 'INFO_REQUEST', 'RFP', 'PRICING', 'GENERAL'] },
          message: { type: 'string', minLength: 1, maxLength: 2000 },
          requirements: { type: 'object' },
          budget: { type: 'string', maxLength: 100 },
          timeline: { type: 'string', maxLength: 100 },
        },
        required: ['type', 'message']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            vendorId: { type: 'string' },
            type: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
          },
          required: ['id', 'vendorId', 'type', 'message', 'status', 'createdAt']
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
        402: {
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
    const data = request.body as ContactVendorRequest;

    try {
      // Map contact type from string to enum
      const contactData = {
        vendorId: params.id,
        ...data,
        type: ContactType[data.type as keyof typeof ContactType],
      };

      const result = await vendorService.contactVendor(
        contactData,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        if (result.message?.includes('subscription') || result.message?.includes('premium')) {
          reply.status(402).send({
            message: result.message || 'Premium subscription required to contact vendors',
            code: 'SUBSCRIPTION_REQUIRED',
            statusCode: 402,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (result.message?.includes('not found')) {
          reply.status(404).send({
            message: 'Vendor not found',
            code: 'VENDOR_NOT_FOUND',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        reply.status(400).send({
          message: result.message || 'Failed to contact vendor',
          code: 'VENDOR_CONTACT_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const contact = result.data;

      reply.status(201).send({
        id: contact.id,
        vendorId: contact.vendorId,
        type: contact.type,
        message: contact.message,
        status: contact.status,
        createdAt: contact.createdAt.toISOString(),
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id, vendorId: params.id }, 'Failed to contact vendor');
      
      if (error.statusCode === 402) {
        reply.status(402).send({
          message: error.message || 'Premium subscription required',
          code: error.code || 'SUBSCRIPTION_REQUIRED',
          statusCode: 402,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Vendor not found',
          code: error.code || 'VENDOR_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(400).send({
        message: 'Failed to contact vendor',
        code: 'VENDOR_CONTACT_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /vendors/compare - Compare Vendors
  server.post('/compare', {
    schema: {
      description: 'Compare multiple vendors side by side',
      tags: ['Vendors'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          vendorIds: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
        },
        required: ['vendorIds']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            vendors: { type: 'array', items: { type: 'object' } },
            comparisonMatrix: { type: 'object' },
          },
          required: ['vendors', 'comparisonMatrix']
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
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    const data = request.body as CompareVendorsRequest;

    try {
      // Get all vendors to compare
      const vendorPromises = data.vendorIds.map(vendorId =>
        vendorService.getVendorById(vendorId, { userId: user.id, userRole: user.role })
      );

      const vendorResults = await Promise.all(vendorPromises);
      const vendors = vendorResults
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      if (vendors.length !== data.vendorIds.length) {
        reply.status(400).send({
          message: 'One or more vendors not found',
          code: 'VENDOR_NOT_FOUND',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate comparison data (this could be enhanced with more detailed analysis)
      const comparison = {
        summary: {
          totalVendors: vendors.length,
          categories: [...new Set(vendors.flatMap(v => v.categories || []))],
          avgRating: vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length,
          totalReviews: vendors.reduce((sum, v) => sum + v.reviewCount, 0),
        },
        matrix: vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.companyName,
          categories: vendor.categories || [],
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
          verified: vendor.verified,
          featured: vendor.featured,
        })),
      };

      reply.status(200).send({
        vendors: vendors.map(vendor => ({
          id: vendor.id,
          companyName: vendor.companyName,
          website: vendor.website,
          logo: vendor.logo,
          description: vendor.description,
          shortDescription: vendor.shortDescription,
          categories: vendor.categories || [],
          featured: vendor.featured,
          verified: vendor.verified,
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
        })),
        comparison,
      });

    } catch (error: any) {
      request.log.error({ error, userId: user.id }, 'Failed to compare vendors');
      
      reply.status(400).send({
        message: 'Failed to compare vendors',
        code: 'VENDOR_COMPARISON_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /gaps/:id/vendor-matches - Get Vendor Matches for Gap
  server.get('/gaps/:id/vendor-matches', {
    schema: {
      description: 'Get vendor matches for a specific compliance gap',
      tags: ['Vendors'],
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
          minScore: { type: 'number', minimum: 0, maximum: 100 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendor: { type: 'object' },
              solution: { type: 'object' },
              matchScore: { type: 'number' },
            },
            required: ['vendor', 'solution', 'matchScore']
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
    const params = request.params as { id: string };
    const query = request.query as {
      minScore?: number;
      limit?: number;
    };

    try {
      const options = {
        minScore: query.minScore || 0,
        limit: query.limit || 10,
      };

      const result = await vendorService.findVendorMatches(
        params.id,
        options,
        { userId: user.id, userRole: user.role }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: result.message || 'Gap not found or no matches available',
          code: 'GAP_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const matches = result.data;

      reply.status(200).send(matches.map(match => ({
        id: match.id,
        gapId: match.gapId,
        vendorId: match.vendorId,
        solutionId: match.solutionId,
        matchScore: match.matchScore,
        reasoning: match.reasoning || [],
      })));

    } catch (error: any) {
      request.log.error({ error, userId: user.id, gapId: params.id }, 'Failed to get vendor matches');
      
      if (error.statusCode === 404) {
        reply.status(404).send({
          message: error.message || 'Gap not found',
          code: error.code || 'GAP_NOT_FOUND',
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

  // ==================== ENHANCED VENDOR MATCHING ROUTES (Story 1.11) ====================

  const vendorMatchingService = new VendorMatchingService();
  const strategyMatrixService = new StrategyMatrixService();
  const prioritiesService = new PrioritiesService();

  // GET /:id/vendor-matches-v2 - Enhanced vendor matching with priorities
  // NOTE: This should really be in assessment.routes.ts, but for now it's here
  // The path needs to be relative since vendor routes have /vendors prefix
  // Frontend expects: /v1/assessments/:id/vendor-matches-v2
  // But this creates: /v1/vendors/:id/vendor-matches-v2 (WRONG!)
  // TODO: Move this route to assessment.routes.ts
  server.get('/:id/vendor-matches-v2', {
    preHandler: [authenticationMiddleware]
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }, Querystring: { threshold?: number, limit?: number } }>, reply: FastifyReply) => {
    const { id: assessmentId } = request.params;
    const { threshold = 80, limit = 20 } = request.query;
    const user = request.currentUser!;

    try {
      // Check priorities exist
      const priorities = await prioritiesService.getPriorities(assessmentId);
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
        vendors: filtered,
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

  // GET /api/assessments/:id/strategy-matrix - Phased remediation roadmap
  server.get('/api/assessments/:id/strategy-matrix', {
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