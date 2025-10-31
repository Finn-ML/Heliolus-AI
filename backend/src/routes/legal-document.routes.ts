/**
 * Legal Document Routes
 * Endpoints for managing privacy policy and terms of service PDFs
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LegalDocumentService } from '../services/legal-document.service';
import { requireRole, asyncHandler, authenticationMiddleware } from '../middleware';
import { UserRole } from '../types/database';
import { LegalDocumentType } from '../generated/prisma';

export default async function legalDocumentRoutes(server: FastifyInstance) {
  const legalDocService = new LegalDocumentService();

  // Admin route middleware (auth + role check)
  const adminMiddleware = [authenticationMiddleware, requireRole('ADMIN')];

  // ==================== ADMIN ROUTES ====================

  /**
   * POST /legal-documents/upload
   * Upload a legal document (admin only)
   * Returns presigned URL for direct S3 upload
   */
  server.post('/upload', {
    schema: {
      description: 'Upload a legal document (Privacy Policy or Terms of Service)',
      tags: ['Admin', 'Legal Documents'],
      body: {
        type: 'object',
        required: ['type', 'filename', 'mimeType', 'fileSize'],
        properties: {
          type: { type: 'string', enum: ['PRIVACY_POLICY', 'TERMS_OF_SERVICE'] },
          filename: { type: 'string', minLength: 1, maxLength: 255 },
          mimeType: { type: 'string', pattern: '^application/pdf$' },
          fileSize: { type: 'number', minimum: 1, maximum: 10485760 }, // 10MB max
          version: { type: 'string', default: '1.0' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                document: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    filename: { type: 'string' },
                    s3Key: { type: 'string' },
                    version: { type: 'string' },
                    isActive: { type: 'boolean' },
                  },
                },
                uploadUrl: { type: 'string' },
                fields: { type: 'object' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    // @ts-expect-error - Fastify preHandler type mismatch with custom AuthenticatedRequest
    preHandler: adminMiddleware,
  }, asyncHandler(async (request: FastifyRequest<{
    Body: {
      type: string;
      filename: string;
      mimeType: string;
      fileSize: number;
      version?: string;
    };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.uploadLegalDocument(
      {
        type: request.body.type as LegalDocumentType,
        filename: request.body.filename,
        mimeType: request.body.mimeType,
        fileSize: request.body.fileSize,
        version: request.body.version,
      },
      request.currentUser?.id || 'system'
    );

    return reply.code(result.success ? 200 : 400).send(result);
  }));

  /**
   * GET /legal-documents/list/:type
   * List all versions of a legal document (admin only)
   */
  server.get('/list/:type', {
    schema: {
      description: 'List all versions of a legal document type',
      tags: ['Admin', 'Legal Documents'],
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['PRIVACY_POLICY', 'TERMS_OF_SERVICE'] },
        },
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
                  type: { type: 'string' },
                  filename: { type: 'string' },
                  version: { type: 'string' },
                  isActive: { type: 'boolean' },
                  fileSize: { type: 'number' },
                  createdAt: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    // @ts-expect-error - Fastify preHandler type mismatch with custom AuthenticatedRequest
    preHandler: adminMiddleware,
  }, asyncHandler(async (request: FastifyRequest<{
    Params: { type: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.listLegalDocuments(
      request.params.type as LegalDocumentType
    );

    return reply.code(result.success ? 200 : 400).send(result);
  }));

  /**
   * POST /legal-documents/:id/activate
   * Set a specific version as active (admin only)
   */
  server.post('/:id/activate', {
    schema: {
      description: 'Set a legal document version as active',
      tags: ['Admin', 'Legal Documents'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
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
                type: { type: 'string' },
                version: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    // @ts-expect-error - Fastify preHandler type mismatch with custom AuthenticatedRequest
    preHandler: adminMiddleware,
  }, asyncHandler(async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.setActiveVersion(request.params.id);

    return reply.code(result.success ? 200 : 404).send(result);
  }));

  /**
   * DELETE /legal-documents/:id
   * Delete a legal document (admin only)
   */
  server.delete('/:id', {
    schema: {
      description: 'Delete a legal document',
      tags: ['Admin', 'Legal Documents'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    // @ts-expect-error - Fastify preHandler type mismatch with custom AuthenticatedRequest
    preHandler: adminMiddleware,
  }, asyncHandler(async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.deleteLegalDocument(request.params.id);

    return reply.code(result.success ? 200 : 404).send(result);
  }));

  // ==================== PUBLIC ROUTES ====================

  /**
   * GET /legal-documents/active/:type
   * Get the active legal document by type (public)
   */
  server.get('/active/:type', {
    schema: {
      description: 'Get the active legal document by type',
      tags: ['Legal Documents', 'Public'],
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['PRIVACY_POLICY', 'TERMS_OF_SERVICE'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                filename: { type: 'string' },
                version: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest<{
    Params: { type: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.getActiveLegalDocument(
      request.params.type as LegalDocumentType
    );

    return reply.code(200).send(result);
  }));

  /**
   * GET /legal-documents/:id/download
   * Get download URL for a legal document (public)
   */
  server.get('/:id/download', {
    schema: {
      description: 'Get download URL for a legal document',
      tags: ['Legal Documents', 'Public'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.getDownloadUrl(request.params.id);

    return reply.code(result.success ? 200 : 404).send(result);
  }));
}
