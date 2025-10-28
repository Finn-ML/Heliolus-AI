import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAnonymousSession, ANONYMOUS_COOKIE_NAME } from '../middleware/anonymous-session.middleware';
import { userService } from '../services/user.service';
import { OrganizationService } from '../services/organization.service';
import { PrismaClient } from '../generated/prisma/index.js';
import { ObjectStorageService } from '../objectStorage.js';
import { LegalDocumentService } from '../services/legal-document.service';
import { LegalDocumentType } from '../generated/prisma';

// Create service instances
const organizationService = new OrganizationService();
const objectStorageService = new ObjectStorageService();
const legalDocService = new LegalDocumentService();

// JSON Schema definitions for Fastify validation
const OrganizationDraftSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    website: { type: 'string' }, // Removed strict URI format validation
    industry: { type: 'string' },
    size: { type: 'string', enum: ['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE'] },
    country: { type: 'string' },
    region: { type: 'string' },
    description: { type: 'string' },
    annualRevenue: { type: 'string', enum: ['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M'] },
    complianceTeamSize: { type: 'string', enum: ['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN'] },
    geography: { type: 'string', enum: ['US', 'EU', 'UK', 'APAC', 'GLOBAL'] },
    riskProfile: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    complianceGaps: { type: 'array', items: { type: 'string' } },
    financialCrimeRisk: { type: 'string' },
    riskAppetite: { type: 'string' },
    complianceBudget: { type: 'string' },
    regulatoryRequirements: { type: 'string' },
    painPoints: { type: 'string' },
  },
};

const AssessmentDraftSchema = {
  type: 'object',
  properties: {
    templateId: { type: 'string' },
    title: { type: 'string' },
    answers: { type: 'object' },
    metadata: { type: 'object' },
    status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED'] },
    analysisResults: { type: 'object' },
  },
};

const DocumentUploadSchema = {
  type: 'object',
  required: ['filename', 'mimeType', 'size'],
  properties: {
    filename: { type: 'string', minLength: 1 },
    mimeType: { type: 'string', minLength: 1 },
    size: { type: 'number', minimum: 1 },
    documentType: { type: 'string', enum: ['POLICY', 'ANNUAL_REPORT', 'COMPLIANCE_CERT', 'AUDIT_REPORT', 'OTHER'] },
  },
};

export default async function anonymousRoutes(
  fastify: FastifyInstance,
  options: { prisma: PrismaClient }
) {
  const { prisma } = options;
  // Use services directly instead of injected Prisma client

  // POST /anon/sessions - Initialize a new anonymous session
  fastify.post('/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    // Generate unique session ID and create database record
    const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create session record in database
    await prisma.anonymousSession.create({
      data: {
        id: sessionId,
        sessionToken: sessionId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        lastSeenAt: new Date()
      }
    });

    // Set session cookie
    reply.cookie(ANONYMOUS_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/'
    });
    
    return {
      sessionId,
      isAnonymous: true,
      message: 'Anonymous session initialized'
    };
  });

  // Helper function to get session from cookie
  async function getSessionFromCookie(request: FastifyRequest) {
    const sessionToken = request.cookies?.[ANONYMOUS_COOKIE_NAME];
    if (!sessionToken) {
      throw new Error('No session cookie found');
    }
    
    const session = await prisma.anonymousSession.findUnique({
      where: { sessionToken }
    });
    
    if (!session || session.status !== 'ACTIVE') {
      throw new Error('Invalid or expired session');
    }
    
    return { sessionId: session.id, sessionToken: session.sessionToken };
  }

  // GET /anon/profile - Get current organization draft
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await getSessionFromCookie(request);
    
    const organizationDraft = await prisma.organizationDraft.findUnique({
      where: { sessionId: session.sessionId }
    });

    return {
      profile: organizationDraft || null,
      sessionId: session.sessionId
    };
  });

  // PUT /anon/profile - Update organization draft
  fastify.put('/profile', {
    schema: {
      body: OrganizationDraftSchema
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const session = await getSessionFromCookie(request);
    const data = request.body as Record<string, any>;

    const organizationDraft = await prisma.organizationDraft.upsert({
      where: { sessionId: session.sessionId },
      create: {
        sessionId: session.sessionId,
        ...data
      },
      update: data
    });

    return {
      profile: organizationDraft,
      message: 'Profile draft saved successfully'
    };
  });

  // GET /anon/documents - Get document drafts
  fastify.get('/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await getSessionFromCookie(request);
    
    const documents = await prisma.documentDraft.findMany({
      where: { sessionId: session.sessionId },
      orderBy: { createdAt: 'desc' }
    });

    // Convert BigInt size to number for JSON serialization
    const serializedDocuments = documents.map(doc => ({
      ...doc,
      size: Number(doc.size)
    }));

    return {
      documents: serializedDocuments,
      sessionId: session.sessionId
    };
  });

  // POST /anon/documents/upload-url - Generate presigned URL for document upload
  fastify.post('/documents/upload-url', {
    schema: {
      body: DocumentUploadSchema
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const session = await getSessionFromCookie(request);
    const body = request.body as any;
    const { filename, mimeType, size, documentType } = body;

    // Generate unique object key for anonymous upload using the same format as DocumentService
    const timestamp = Date.now();
    const privateDir = objectStorageService.getPrivateObjectDir();
    const objectPath = `${privateDir}/anon/${session.sessionId}/${timestamp}-${filename}`;

    // Create document draft record
    const documentDraft = await prisma.documentDraft.create({
      data: {
        sessionId: session.sessionId,
        filename,
        originalName: filename,
        mimeType,
        size: BigInt(size),
        objectKey: objectPath,
        documentType: documentType || 'OTHER'
      }
    });

    // Generate actual presigned URL with object storage service
    const presignedUrl = await objectStorageService.getDocumentUploadURL(objectPath);

    // Return format matching the authenticated endpoint for frontend compatibility
    return {
      document: {
        id: documentDraft.id,
        filename: documentDraft.filename,
        originalName: documentDraft.originalName,
        mimeType: documentDraft.mimeType,
        size: Number(documentDraft.size),
        documentType: documentDraft.documentType,
        objectKey: objectPath,
        createdAt: documentDraft.createdAt.toISOString()
      },
      uploadUrl: presignedUrl,
      fields: {}, // Empty for presigned URL (not needed for PUT upload)
      expiresIn: 3600 // 1 hour
    };
  });

  // DELETE /anon/documents/:documentId - Delete document draft
  fastify.delete('/documents/:documentId', async (request: FastifyRequest<{ Params: { documentId: string } }>, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    const { documentId } = request.params;

    // Verify the document belongs to this session
    const document = await prisma.documentDraft.findFirst({
      where: {
        id: documentId,
        sessionId: session.sessionId
      }
    });

    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    // Delete the document record
    await prisma.documentDraft.delete({
      where: { id: documentId }
    });

    // TODO: Delete actual file from object storage

    return {
      message: 'Document deleted successfully'
    };
  });

  // POST /anon/documents/:documentId/confirm-upload - Confirm document upload
  fastify.post('/documents/:documentId/confirm-upload', async (request: FastifyRequest<{ Params: { documentId: string } }>, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    const { documentId } = request.params;

    // Verify the document belongs to this session
    const document = await prisma.documentDraft.findFirst({
      where: {
        id: documentId,
        sessionId: session.sessionId
      }
    });

    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    // Update document to mark as confirmed/uploaded
    const updatedDocument = await prisma.documentDraft.update({
      where: { id: documentId },
      data: {
        uploadConfirmed: true,
        updatedAt: new Date()
      }
    });

    return {
      id: updatedDocument.id,
      filename: updatedDocument.filename,
      mimeType: updatedDocument.mimeType,
      size: Number(updatedDocument.size),
      documentType: updatedDocument.documentType,
      uploadConfirmed: true
    };
  });

  // GET /anon/assessments - Get assessment drafts
  fastify.get('/assessments', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    
    const assessments = await prisma.assessmentDraft.findMany({
      where: { sessionId: session.sessionId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      assessments,
      sessionId: session.sessionId
    };
  });

  // POST /anon/assessments - Create assessment draft
  fastify.post('/assessments', {
    schema: {
      body: AssessmentDraftSchema
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    const data = request.body as Record<string, any>;

    const assessmentDraft = await prisma.assessmentDraft.create({
      data: {
        sessionId: session.sessionId,
        ...data
      }
    });

    return {
      assessment: assessmentDraft,
      message: 'Assessment draft created successfully'
    };
  });

  // PUT /anon/assessments/:assessmentId - Update assessment draft
  fastify.put('/assessments/:assessmentId', {
    schema: {
      body: AssessmentDraftSchema
    }
  }, async (request: FastifyRequest<{ 
    Params: { assessmentId: string };
    Body: any;
  }>, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    const { assessmentId } = request.params;
    const data = request.body;

    // Verify the assessment belongs to this session
    const existingAssessment = await prisma.assessmentDraft.findFirst({
      where: {
        id: assessmentId,
        sessionId: session.sessionId
      }
    });

    if (!existingAssessment) {
      return reply.status(404).send({ error: 'Assessment not found' });
    }

    const assessmentDraft = await prisma.assessmentDraft.update({
      where: { id: assessmentId },
      data
    });

    return {
      assessment: assessmentDraft,
      message: 'Assessment draft updated successfully'
    };
  });

  // GET /anon/status - Get session status and data summary
  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = requireAnonymousSession(request);
    
    const [organizationDraft, documentDrafts, assessmentDrafts] = await Promise.all([
      prisma.organizationDraft.findUnique({
        where: { sessionId: session.sessionId }
      }),
      prisma.documentDraft.count({
        where: { sessionId: session.sessionId }
      }),
      prisma.assessmentDraft.count({
        where: { sessionId: session.sessionId }
      })
    ]);

    return {
      sessionId: session.sessionId,
      isAnonymous: true,
      hasProfile: !!organizationDraft,
      documentCount: documentDrafts,
      assessmentCount: assessmentDrafts,
      profileComplete: !!(organizationDraft?.name && organizationDraft?.industry),
      canProceed: !!(organizationDraft?.name && organizationDraft?.industry && documentDrafts > 0)
    };
  });

  // ==================== PUBLIC LEGAL DOCUMENT ROUTES ====================
  // These routes are accessible to anonymous users for viewing privacy policy and terms

  /**
   * GET /anon/legal-documents/active/:type
   * Get the active legal document by type (public, no auth required)
   */
  fastify.get('/legal-documents/active/:type', async (request: FastifyRequest<{
    Params: { type: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.getActiveLegalDocument(
      request.params.type as LegalDocumentType
    );
    return reply.code(200).send(result);
  });

  /**
   * GET /anon/legal-documents/:id/download
   * Get download URL for a legal document (public, no auth required)
   */
  fastify.get('/legal-documents/:id/download', async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const result = await legalDocService.getDownloadUrl(request.params.id);
    return reply.code(result.success ? 200 : 404).send(result);
  });
}