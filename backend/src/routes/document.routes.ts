/**
 * Document Routes
 * Handles document upload, management, and analysis
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DocumentService } from '../services/document.service';
import { OrganizationService } from '../services/organization.service';
import { DocumentType } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';

// Create service instances
const documentService = new DocumentService();
const organizationService = new OrganizationService();

// Request/Response schemas
const UploadDocumentRequestSchema = {
  type: 'object',
  required: ['organizationId', 'filename', 'mimeType', 'size'],
  properties: {
    organizationId: { type: 'string' },
    filename: { type: 'string', minLength: 1, maxLength: 255 },
    mimeType: { type: 'string', minLength: 1 },
    size: { type: 'number', minimum: 1, maximum: 50 * 1024 * 1024 }, // 50MB max
    documentType: { 
      type: 'string', 
      enum: ['POLICY', 'ANNUAL_REPORT', 'COMPLIANCE_CERT', 'AUDIT_REPORT', 'OTHER']
    },
  },
};

const UpdateDocumentRequestSchema = {
  type: 'object',
  properties: {
    filename: { type: 'string', minLength: 1, maxLength: 255 },
    documentType: { 
      type: 'string', 
      enum: ['POLICY', 'ANNUAL_REPORT', 'COMPLIANCE_CERT', 'AUDIT_REPORT', 'OTHER']
    },
  },
};

const AnalyzeDocumentRequestSchema = {
  type: 'object',
  properties: {
    extractData: { type: 'boolean', default: true },
    analyzeContent: { type: 'boolean', default: true },
    generateSummary: { type: 'boolean', default: false },
  },
};

const DocumentResponseSchema = {
  type: 'object',
  required: ['id', 'organizationId', 'filename', 'mimeType', 'size', 'createdAt'],
  properties: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    filename: { type: 'string' },
    originalName: { type: 'string' },
    mimeType: { type: 'string' },
    size: { type: 'number' },
    documentType: { type: 'string' },
    s3Key: { type: 'string' },
    s3Bucket: { type: 'string' },
    uploadedBy: { type: 'string' },
    encrypted: { type: 'boolean' },
    extractedData: { type: 'object' },
    parsedContent: { type: 'object' },
    complianceIndicators: { type: 'array', items: { type: 'string' } },
    analysisStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
    evidenceTier: { type: 'string', enum: ['TIER_0', 'TIER_1', 'TIER_2'] },
    tierClassificationReason: { type: 'string' },
    tierConfidenceScore: { type: 'number' },
    downloadUrl: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    organization: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
};

const UploadResultResponseSchema = {
  type: 'object',
  required: ['document', 'uploadUrl', 'fields'],
  properties: {
    document: DocumentResponseSchema,
    uploadUrl: { type: 'string' },
    fields: { type: 'object' },
  },
};

const DocumentListResponseSchema = {
  type: 'object',
  required: ['data', 'pagination'],
  properties: {
    data: {
      type: 'array',
      items: DocumentResponseSchema,
    },
    pagination: {
      type: 'object',
      required: ['page', 'limit', 'total', 'totalPages'],
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};

const AnalysisResultResponseSchema = {
  type: 'object',
  required: ['extractedData', 'parsedContent', 'complianceIndicators'],
  properties: {
    extractedData: { type: 'object' },
    parsedContent: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        metadata: { type: 'object' },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              value: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        },
      },
    },
    complianceIndicators: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    riskFactors: { type: 'array', items: { type: 'string' } },
  },
};

const DocumentStatsResponseSchema = {
  type: 'object',
  required: ['totalDocuments', 'totalSize', 'documentsByType'],
  properties: {
    totalDocuments: { type: 'number' },
    totalSize: { type: 'number' },
    documentsByType: { type: 'object' },
    recentUploads: { type: 'number' },
    analysisProgress: {
      type: 'object',
      properties: {
        pending: { type: 'number' },
        processing: { type: 'number' },
        completed: { type: 'number' },
        failed: { type: 'number' },
      },
    },
  },
};

const DownloadUrlResponseSchema = {
  type: 'object',
  required: ['downloadUrl', 'expiresAt'],
  properties: {
    downloadUrl: { type: 'string' },
    expiresAt: { type: 'string', format: 'date-time' },
  },
};

const ErrorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' },
    statusCode: { type: 'number' },
    timestamp: { type: 'string' },
    details: { type: 'object' },
  },
};

// Type definitions
type UploadDocumentRequest = {
  organizationId: string;
  filename: string;
  mimeType: string;
  size: number;
  documentType?: string;
};

type UpdateDocumentRequest = {
  filename?: string;
  documentType?: string;
};

type AnalyzeDocumentRequest = {
  extractData?: boolean;
  analyzeContent?: boolean;
  generateSummary?: boolean;
};

export default async function documentRoutes(server: FastifyInstance) {
  
  // POST /documents/upload-url - Generate presigned upload URL
  server.post('/upload-url', {
    schema: {
      description: 'Generate presigned upload URL for document',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      body: UploadDocumentRequestSchema,
      response: {
        200: UploadResultResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Body: UploadDocumentRequest }>, reply: FastifyReply) => {
    try {
      // Extract user context from authentication
      const context = { 
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId || request.body.organizationId
      };
      
      // Convert documentType to enum if provided
      const requestBody = {
        ...request.body,
        documentType: request.body.documentType as any // Type assertion for enum conversion
      };
      
      const result = await documentService.generateUploadUrl(requestBody, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /documents/:id/confirm-upload - Confirm document upload
  server.post('/:id/confirm-upload', {
    schema: {
      description: 'Confirm document upload completion',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: DocumentResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      const result = await documentService.confirmUpload(request.params.id, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /documents/:id - Get document by ID
  server.get('/:id', {
    schema: {
      description: 'Get document by ID',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: DocumentResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      const result = await documentService.getDocumentById(request.params.id, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // PATCH /documents/:id - Update document metadata
  server.patch('/:id', {
    schema: {
      description: 'Update document metadata',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: UpdateDocumentRequestSchema,
      response: {
        200: DocumentResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateDocumentRequest }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      // Convert documentType to enum if provided
      const requestBody = {
        ...request.body,
        documentType: request.body.documentType as any // Type assertion for enum conversion
      };

      const result = await documentService.updateDocument(request.params.id, requestBody, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // DELETE /documents/:id - Delete document
  server.delete('/:id', {
    schema: {
      description: 'Delete document',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Get user's organization first to set proper context
      const organizationResult = await organizationService.getOrganizationByUserId(
        request.currentUser?.id || '',
        { userId: request.currentUser?.id || '', userRole: request.currentUser?.role || 'USER' }
      );

      if (!organizationResult.success || !organizationResult.data) {
        reply.code(404).send({
          message: 'User organization not found',
          code: 'ORGANIZATION_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Set proper context with the user's organizationId
      const context = { 
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: organizationResult.data.id
      };
      
      // First fetch the document to verify it exists and user has access
      const document = await documentService.getDocumentById(request.params.id, context);
      
      if (!document.success || !document.data) {
        reply.code(404).send({
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const result = await documentService.deleteDocument(request.params.id, context);
      
      if (result.success) {
        reply.code(204).send();
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /organizations/:orgId/documents - List documents for organization
  server.get('/organizations/:orgId/documents', {
    schema: {
      description: 'List documents for organization',
      tags: ['Documents'],
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
        200: DocumentListResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ 
    Params: { orgId: string }; 
    Querystring: { page?: number; limit?: number; documentType?: string; search?: string } 
  }>, reply: FastifyReply) => {
    try {
      const context = { 
        userId: request.currentUser?.id || '',
        organizationId: request.params.orgId, // Use orgId from URL params
        userRole: request.currentUser?.role || 'USER'
      };
      const { page = 1, limit = 20, documentType, search } = request.query;
      
      const queryOptions = {
        page,
        limit,
        filters: {
          ...(documentType && { documentType }),
          ...(search && { search }),
        },
      };
      
      const result = await documentService.listDocuments(request.params.orgId, queryOptions, context);
      
      if (result.success) {
        // Transform to match schema format: separate data and pagination
        const { data, total, page, limit, totalPages } = result.data;
        reply.code(200).send({
          data,
          pagination: { total, page, limit, totalPages }
        });
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /documents/:id/analyze - Analyze document
  server.post('/:id/analyze', {
    schema: {
      description: 'Analyze document content',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: AnalyzeDocumentRequestSchema,
      response: {
        200: AnalysisResultResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string }; Body: AnalyzeDocumentRequest }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      // Provide default values for required properties
      const analysisOptions = {
        extractData: request.body.extractData ?? true,
        analyzeContent: request.body.analyzeContent ?? true,
        generateSummary: request.body.generateSummary ?? false,
      };

      const result = await documentService.analyzeDocument(request.params.id, analysisOptions, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /documents/:id/download-url - Get download URL
  server.get('/:id/download-url', {
    schema: {
      description: 'Get download URL for document',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: DownloadUrlResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      const result = await documentService.getDownloadUrl(request.params.id, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /organizations/:orgId/documents/stats - Get document statistics
  server.get('/organizations/:orgId/documents/stats', {
    schema: {
      description: 'Get document statistics for organization',
      tags: ['Documents'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orgId: { type: 'string' },
        },
        required: ['orgId'],
      },
      response: {
        200: DocumentStatsResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    preHandler: authenticationMiddleware
  }, asyncHandler(async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
    try {
      const context = {
        userId: request.currentUser?.id || '',
        userRole: request.currentUser?.role || 'USER',
        organizationId: request.currentUser?.organizationId
      };

      const result = await documentService.getDocumentStats(request.params.orgId, context);
      
      if (result.success) {
        reply.code(200).send(result.data);
      } else {
        reply.code(500).send({
          message: result.error || result.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));
}