/**
 * Document Service
 * Handles document upload, storage, processing, and management
 * Integrates with Replit Object Storage for file storage and AI-lib for document analysis
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseDocument,
  DocumentType,
  UserRole,
} from '../types/database';
import { ObjectStorageService, ObjectNotFoundError } from '../objectStorage';
import { ObjectAclPolicy, ObjectPermission } from '../objectAcl';
import { analyzeDocument, extractDocumentData } from '../lib/ai';
import { DocumentParserService } from './document-parser.service';
import { DocumentPreprocessingService } from './document-preprocessing.service';

// Replit Object Storage Configuration
const objectStorageService = new ObjectStorageService();

// Validation schemas
const UploadDocumentSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().min(1, 'File size must be positive').max(50 * 1024 * 1024), // 50MB max
  documentType: z.nativeEnum(DocumentType).optional(),
});

const UpdateDocumentSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
});

const UploadAnonymousDocumentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().min(1, 'File size must be positive').max(50 * 1024 * 1024), // 50MB max
  documentType: z.nativeEnum(DocumentType).optional(),
});

const DocumentAnalysisSchema = z.object({
  extractData: z.boolean().default(true),
  analyzeContent: z.boolean().default(true),
  generateSummary: z.boolean().default(false),
});

// File type mappings
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/csv': 'csv', // Alternative MIME type for CSV
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export interface DocumentWithMetadata extends DatabaseDocument {
  organization: {
    id: string;
    name: string;
  };
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  previewUrl?: string;
}

export interface DocumentAnalysisResult {
  extractedData: Record<string, any>;
  parsedContent: {
    text: string;
    metadata: Record<string, any>;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
  };
  complianceIndicators: string[];
  summary?: string;
  riskFactors?: string[];
}

export interface UploadResult {
  document: DatabaseDocument;
  uploadUrl: string;
  fields: Record<string, string>;
}

export class DocumentService extends BaseService {
  private preprocessingService: DocumentPreprocessingService;

  constructor() {
    super();
    this.preprocessingService = new DocumentPreprocessingService();
  }

  /**
   * Generate presigned upload URL for direct S3 upload
   */
  async generateUploadUrl(
    data: z.infer<typeof UploadDocumentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<UploadResult>> {
    try {
      const validatedData = await this.validateInput(UploadDocumentSchema, data);

      // Verify organization exists and user has access
      const organization = await this.prisma.organization.findUnique({
        where: { id: validatedData.organizationId },
        select: { id: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      // Check file type
      if (!ALLOWED_MIME_TYPES[validatedData.mimeType]) {
        throw this.createError(
          'File type not supported',
          400,
          'UNSUPPORTED_FILE_TYPE',
          { supportedTypes: Object.keys(ALLOWED_MIME_TYPES) }
        );
      }

      // Generate unique object storage key
      const fileExtension = ALLOWED_MIME_TYPES[validatedData.mimeType];
      const timestamp = Date.now();
      const privateDir = objectStorageService.getPrivateObjectDir();
      const objectPath = `${privateDir}/organizations/${validatedData.organizationId}/documents/${timestamp}-${validatedData.filename}`;

      // Create document record in database
      const document = await this.prisma.document.create({
        data: {
          organizationId: validatedData.organizationId,
          filename: validatedData.filename,
          originalName: validatedData.filename,
          mimeType: validatedData.mimeType,
          size: validatedData.size,
          s3Key: objectPath, // Keep s3Key field name for compatibility
          s3Bucket: 'replit-object-storage', // Keep s3Bucket field name for compatibility
          documentType: validatedData.documentType || null,
          uploadedBy: context?.userId!,
          encrypted: false, // TODO: Implement encryption for sensitive documents
        },
      });

      // Generate presigned upload URL using Replit Object Storage
      const uploadUrl = await objectStorageService.getDocumentUploadURL(objectPath);

      await this.logAudit(
        {
          action: 'DOCUMENT_UPLOAD_INITIATED',
          entity: 'Document',
          entityId: document.id,
          newValues: {
            filename: document.filename,
            size: document.size,
            organizationId: validatedData.organizationId,
          },
        },
        context
      );

      this.logger.info('Upload URL generated successfully', {
        documentId: document.id,
        filename: validatedData.filename,
      });

      const result: UploadResult = {
        document,
        uploadUrl,
        fields: {
          'Content-Type': validatedData.mimeType,
          'Content-Length': validatedData.size.toString(),
        },
      };

      return this.createResponse(true, result, 'Upload URL generated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'generateUploadUrl');
    }
  }

  /**
   * Generate presigned upload URL for anonymous session document
   */
  async generateAnonymousUploadUrl(
    data: z.infer<typeof UploadAnonymousDocumentSchema>
  ): Promise<ApiResponse<{ presignedUrl: string; objectKey: string; documentId: string }>> {
    try {
      const validatedData = await this.validateInput(UploadAnonymousDocumentSchema, data);

      // Check file type
      if (!ALLOWED_MIME_TYPES[validatedData.mimeType]) {
        throw this.createError(
          'File type not supported',
          400,
          'UNSUPPORTED_FILE_TYPE',
          { supportedTypes: Object.keys(ALLOWED_MIME_TYPES) }
        );
      }

      // Generate unique object storage key for anonymous upload
      const timestamp = Date.now();
      const privateDir = objectStorageService.getPrivateObjectDir();
      const objectPath = `${privateDir}/anon/${validatedData.sessionId}/${timestamp}-${validatedData.filename}`;

      // Create document draft record in database
      const documentDraft = await this.prisma.documentDraft.create({
        data: {
          sessionId: validatedData.sessionId,
          filename: validatedData.filename,
          originalName: validatedData.filename,
          mimeType: validatedData.mimeType,
          size: BigInt(validatedData.size),
          objectKey: objectPath,
          bucket: 'replit-object-storage',
          documentType: validatedData.documentType || 'OTHER',
        },
      });

      // Generate presigned upload URL using Replit Object Storage
      const presignedUrl = await objectStorageService.getDocumentUploadURL(objectPath);

      this.logger.info('Anonymous upload URL generated successfully', {
        sessionId: validatedData.sessionId,
        filename: validatedData.filename,
        documentDraftId: documentDraft.id,
      });

      return this.createResponse(true, {
        presignedUrl,
        objectKey: objectPath,
        documentId: documentDraft.id,
      }, 'Anonymous upload URL generated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'generateAnonymousUploadUrl');
    }
  }

  /**
   * Migrate anonymous document to organization
   */
  async migrateAnonymousDocument(
    sourceObjectKey: string,
    targetOrganizationId: string,
    newObjectKey: string
  ): Promise<string> {
    try {
      // Copy object from anon/ to org/ prefix
      await (objectStorageService as any).copyObject(sourceObjectKey, newObjectKey);

      // Verify copy was successful
      const exists = await objectStorageService.documentExists(newObjectKey);
      if (!exists) {
        throw new Error('Failed to copy document to new location');
      }

      // Delete original anonymous document
      await (objectStorageService as any).deleteObject(sourceObjectKey);
      
      this.logger.info('Document migrated successfully', {
        sourceKey: sourceObjectKey,
        targetKey: newObjectKey,
        organizationId: targetOrganizationId,
      });
      
      return newObjectKey;
    } catch (error) {
      this.logger.error('Failed to migrate anonymous document', {
        sourceKey: sourceObjectKey,
        targetKey: newObjectKey,
        error: error.message,
      });
      throw this.createError('Document migration failed', 500, 'MIGRATION_FAILED');
    }
  }

  /**
   * Confirm document upload and trigger processing
   */
  async confirmUpload(
    documentId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<DocumentWithMetadata>> {
    try {
      this.logger.info('📤 confirmUpload called', {
        documentId,
        userId: context?.userId,
        userRole: context?.userRole,
        organizationId: context?.organizationId
      });

      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          organization: {
            select: { id: true, name: true, userId: true },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      this.logger.info('📄 Document found', {
        documentId,
        filename: document.filename,
        orgUserId: document.organization.userId,
        docOrgId: document.organizationId
      });

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId,
        document.organizationId
      );

      this.logger.info('✅ Permission check passed', { documentId });

      // Verify file exists in Object Storage
      try {
        const exists = await objectStorageService.documentExists(document.s3Key);
        if (!exists) {
          throw new Error('Document not found');
        }
      } catch (storageError) {
        this.logger.error('Document not found in Object Storage', {
          documentId,
          objectPath: document.s3Key,
          error: storageError.message,
        });
        throw this.createError('Document upload incomplete', 400, 'UPLOAD_INCOMPLETE');
      }

      // Trigger background document processing (includes tier classification)
      this.processDocumentBackground(documentId, context);

      await this.logAudit(
        {
          action: 'DOCUMENT_UPLOAD_CONFIRMED',
          entity: 'Document',
          entityId: documentId,
        },
        context
      );

      this.logger.info('Document upload confirmed, analysis triggered', { documentId });

      const documentWithMetadata = {
        ...document,
        analysisStatus: 'processing' as const,
      };

      return this.createResponse(
        true,
        documentWithMetadata,
        'Document upload confirmed successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'confirmUpload');
    }
  }

  /**
   * Get document by ID with metadata
   */
  async getDocumentById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<DocumentWithMetadata>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          organization: {
            select: { id: true, name: true, userId: true },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId,
        document.organizationId
      );

      // Generate download URL if needed
      let downloadUrl = null;
      try {
        downloadUrl = await objectStorageService.getDocumentDownloadURL(document.s3Key);
      } catch (storageError) {
        this.logger.warn('Could not generate download URL', {
          documentId: id,
          error: storageError.message,
        });
      }

      const documentWithMetadata: DocumentWithMetadata = {
        ...document,
        downloadUrl,
        analysisStatus: (document.extractedData ? 'completed' : 'pending') as 'completed' | 'pending',
      };

      return this.createResponse(true, documentWithMetadata);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getDocumentById');
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    id: string,
    data: z.infer<typeof UpdateDocumentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseDocument>> {
    try {
      const validatedData = await this.validateInput(UpdateDocumentSchema, data);

      const existingDocument = await this.prisma.document.findUnique({
        where: { id },
        include: {
          organization: {
            select: { userId: true },
          },
        },
      });

      if (!existingDocument) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        existingDocument.organization.userId,
        existingDocument.organizationId
      );

      const updatedDocument = await this.prisma.document.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'DOCUMENT_UPDATED',
          entity: 'Document',
          entityId: id,
          oldValues: {
            filename: existingDocument.filename,
            documentType: existingDocument.documentType,
          },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Document updated successfully', { documentId: id });

      return this.createResponse(true, updatedDocument, 'Document updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateDocument');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          organization: {
            select: { userId: true },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId,
        document.organizationId
      );

      // Delete from Object Storage
      try {
        await objectStorageService.deleteDocument(document.s3Key);
      } catch (storageError) {
        this.logger.warn('Failed to delete from Object Storage', {
          documentId: id,
          objectPath: document.s3Key,
          error: storageError.message,
        });
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await this.prisma.document.delete({
        where: { id },
      });

      await this.logAudit(
        {
          action: 'DOCUMENT_DELETED',
          entity: 'Document',
          entityId: id,
          oldValues: {
            filename: document.filename,
            s3Key: document.s3Key,
          },
        },
        context
      );

      this.logger.info('Document deleted successfully', { documentId: id });

      return this.createResponse(true, undefined, 'Document deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteDocument');
    }
  }

  /**
   * List documents for an organization
   */
  async listDocuments(
    organizationId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<DocumentWithMetadata>>> {
    try {
      // Verify organization and permissions
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where.organizationId = organizationId;

      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          ...queryOptions,
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        }),
        this.prisma.document.count({ where: queryOptions.where }),
      ]);

      // Add analysis status to documents
      const documentsWithMetadata: DocumentWithMetadata[] = documents.map(doc => ({
        ...doc,
        analysisStatus: (doc.extractedData ? 'completed' : 'pending') as 'completed' | 'pending',
      }));

      const paginatedResponse = this.createPaginatedResponse(
        documentsWithMetadata,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listDocuments');
    }
  }

  /**
   * Analyze document content using AI
   */
  async analyzeDocument(
    id: string,
    options: z.infer<typeof DocumentAnalysisSchema> = { extractData: true, analyzeContent: true, generateSummary: false },
    context?: ServiceContext
  ): Promise<ApiResponse<DocumentAnalysisResult>> {
    try {
      const validatedOptions = await this.validateInput(DocumentAnalysisSchema, options);

      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          organization: {
            select: { userId: true },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId,
        document.organizationId
      );

      // Get document content from Object Storage
      let documentBuffer: Buffer;
      try {
        const documentFile = await objectStorageService.getDocumentFile(document.s3Key);
        const chunks: Uint8Array[] = [];

        const stream = documentFile.createReadStream();
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        documentBuffer = Buffer.concat(chunks);

        if (documentBuffer.length === 0) {
          throw new Error('Empty document');
        }
      } catch (storageError) {
        this.logger.error('Failed to retrieve document from Object Storage', {
          documentId: id,
          error: storageError.message,
        });
        throw this.createError('Document content not accessible', 500, 'DOCUMENT_INACCESSIBLE');
      }

      // Perform AI analysis
      let analysisResult: DocumentAnalysisResult = {
        extractedData: {},
        parsedContent: {
          text: '',
          metadata: {},
          entities: [],
        },
        complianceIndicators: [],
      };

      try {
        // Parse document content using DocumentParserService
        if (validatedOptions.analyzeContent) {
          const documentParserService = new DocumentParserService();
          const parseResult = await documentParserService.parseDocument(id, false, context);

          if (parseResult.success && parseResult.data.parsedContent) {
            analysisResult.parsedContent = parseResult.data.parsedContent as any;
          } else {
            this.logger.warn('Document parsing returned no content', { documentId: id });
            // Continue with empty content rather than failing
            analysisResult.parsedContent = {
              text: '',
              metadata: {},
              entities: [],
            };
          }
        }

        // Extract structured data
        if (validatedOptions.extractData) {
          const extractedData = await extractDocumentData(analysisResult.parsedContent.text);
          analysisResult.extractedData = extractedData;
        }

        // Analyze document for compliance
        const compliance = await analyzeDocument(analysisResult.parsedContent.text);

        analysisResult.complianceIndicators = compliance.indicators || [];
        analysisResult.riskFactors = compliance.riskFactors || [];

        // Generate summary if requested
        if (validatedOptions.generateSummary && analysisResult.parsedContent.text) {
          // TODO: Implement AI-powered summarization
          analysisResult.summary = analysisResult.parsedContent.text.substring(0, 500) + '...';
        }

        // Classify document evidence tier using AI
        let documentTier: 'TIER_0' | 'TIER_1' | 'TIER_2' | undefined;
        try {
          documentTier = await this.classifyDocumentTier(
            document.filename,
            analysisResult.parsedContent.text,
            analysisResult.extractedData
          );
        } catch (classificationError) {
          this.logger.warn('Failed to classify document tier, using default', {
            documentId: id,
            error: classificationError.message,
          });
          documentTier = 'TIER_0'; // Default to lowest tier on error
        }

        // Preprocess document for future assessments (Story 1.26 Optimization)
        // This happens ONCE at upload time, not during every assessment execution
        let preprocessingResult = null;
        if (process.env.AI_ENABLE_PREPROCESSING === 'true' && analysisResult.parsedContent.text) {
          try {
            const tempDoc = {
              id: document.id,
              filename: document.filename,
              parsedContent: analysisResult.parsedContent,
            } as any;

            const preprocessResult = await this.preprocessingService.preprocessDocumentsForAssessment(
              [tempDoc],
              {
                model: process.env.AI_PREPROCESSING_MODEL || 'gpt-4o-mini',
              },
              context
            );

            if (preprocessResult.success && preprocessResult.data) {
              const docPreprocessing = preprocessResult.data.get(document.id);
              if (docPreprocessing) {
                preprocessingResult = {
                  summary: docPreprocessing.summary,
                  keyTopics: docPreprocessing.keyTopics,
                  embedding: docPreprocessing.embedding,
                  confidence: docPreprocessing.confidence,
                  preprocessedAt: new Date().toISOString(),
                };

                this.logger.info('Document preprocessing completed', {
                  documentId: id,
                  keyTopics: docPreprocessing.keyTopics.length,
                  confidence: docPreprocessing.confidence,
                });
              }
            }
          } catch (preprocessError) {
            this.logger.warn('Document preprocessing failed, continuing without', {
              documentId: id,
              error: preprocessError.message,
            });
            // Don't fail the whole analysis if preprocessing fails
          }
        }

        // Merge preprocessing results with extracted data
        const finalExtractedData = preprocessingResult
          ? { ...analysisResult.extractedData, preprocessing: preprocessingResult }
          : analysisResult.extractedData;

        // Update document with analysis results, preprocessing, and evidence tier
        await this.prisma.document.update({
          where: { id },
          data: {
            parsedContent: analysisResult.parsedContent,
            extractedData: finalExtractedData,
            evidenceTier: documentTier,
            updatedAt: this.now(),
          },
        });

        this.logger.info('Document tier classified', {
          documentId: id,
          evidenceTier: documentTier,
        });

      } catch (analysisError) {
        this.logger.error('Document analysis failed', {
          documentId: id,
          error: analysisError.message,
        });
        throw this.createError(
          'Document analysis failed',
          500,
          'ANALYSIS_FAILED',
          { originalError: analysisError.message }
        );
      }

      await this.logAudit(
        {
          action: 'DOCUMENT_ANALYZED',
          entity: 'Document',
          entityId: id,
          metadata: {
            extractedData: validatedOptions.extractData,
            analyzeContent: validatedOptions.analyzeContent,
            complianceIndicators: analysisResult.complianceIndicators.length,
          },
        },
        context
      );

      this.logger.info('Document analyzed successfully', {
        documentId: id,
        complianceIndicators: analysisResult.complianceIndicators.length,
      });

      return this.createResponse(true, analysisResult, 'Document analyzed successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'analyzeDocument');
    }
  }

  /**
   * Get document download URL
   */
  async getDownloadUrl(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{ url: string; expiresAt: Date }>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          organization: {
            select: { userId: true },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId,
        document.organizationId
      );

      // Generate presigned download URL using Object Storage
      const url = await objectStorageService.getDocumentDownloadURL(document.s3Key);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

      await this.logAudit(
        {
          action: 'DOCUMENT_DOWNLOADED',
          entity: 'Document',
          entityId: id,
        },
        context
      );

      this.logger.info('Download URL generated', { documentId: id });

      return this.createResponse(true, { url, expiresAt }, 'Download URL generated');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getDownloadUrl');
    }
  }

  /**
   * Classify document evidence tier using AI
   * TIER_0: Self-Declared (×0.6 multiplier) - User-created documents, forms, declarations
   * TIER_1: Policy Documents (×0.8 multiplier) - Official policies, procedures, contracts
   * TIER_2: System-Generated (×1.0 multiplier) - Audit reports, certificates, system logs
   */
  private async classifyDocumentTier(
    filename: string,
    documentText: string,
    extractedData?: any
  ): Promise<'TIER_0' | 'TIER_1' | 'TIER_2'> {
    try {
      // Use OpenAI if available for more accurate classification
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey && openaiKey.startsWith('sk-')) {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: openaiKey });

        const prompt = `Analyze the following document and classify it into one of three evidence tiers for compliance assessment:

TIER_0 (Self-Declared): User-created documents, internal forms, self-assessments, declarations, or any document that appears to be created internally without external verification.

TIER_1 (Policy Documents): Official company policies, procedures, contracts, agreements, compliance frameworks, or governance documentation that shows established practices.

TIER_2 (System-Generated): External audit reports, third-party certifications, system-generated logs, automated reports, regulatory certificates, or any document generated/verified by an external authority.

Document filename: ${filename}
Document content excerpt (first 2000 chars): ${documentText.substring(0, 2000)}

${extractedData ? `Extracted metadata: ${JSON.stringify(extractedData).substring(0, 500)}` : ''}

Respond with only one of: TIER_0, TIER_1, or TIER_2`;

        try {
          const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert compliance document classifier. Classify documents based on their source, authority, and verification level.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2,
            max_tokens: 10,
          });

          const classification = response.choices[0]?.message?.content?.trim();
          if (classification && ['TIER_0', 'TIER_1', 'TIER_2'].includes(classification)) {
            this.logger.info('AI classified document tier', {
              filename,
              tier: classification,
              method: 'openai',
            });
            return classification as 'TIER_0' | 'TIER_1' | 'TIER_2';
          }
        } catch (aiError) {
          this.logger.warn('OpenAI classification failed, using fallback', {
            error: aiError.message,
          });
        }
      }

      // Fallback to rule-based classification if AI is not available
      const lowerFilename = filename.toLowerCase();
      const lowerContent = documentText.toLowerCase().substring(0, 5000); // Check first 5000 chars

      // TIER_2: System-Generated Evidence (highest tier)
      if (
        // External audit reports
        lowerFilename.includes('audit') && (lowerFilename.includes('report') || lowerContent.includes('external audit')) ||
        // Certifications
        lowerFilename.includes('certif') || lowerContent.includes('certification') ||
        lowerContent.includes('hereby certify') ||
        // ISO/SOC/Regulatory certificates
        lowerContent.includes('iso 27001') || lowerContent.includes('soc 2') ||
        lowerContent.includes('regulatory compliance') ||
        // System logs
        lowerFilename.includes('.log') || lowerFilename.includes('system_report') ||
        // External assessments
        lowerContent.includes('third-party assessment') ||
        lowerContent.includes('independent audit') ||
        // Official stamps/signatures
        lowerContent.includes('digitally signed') ||
        lowerContent.includes('attestation')
      ) {
        this.logger.info('Document classified as TIER_2 (System-Generated)', {
          filename,
          method: 'rule-based',
        });
        return 'TIER_2';
      }

      // TIER_1: Policy Documents (middle tier)
      if (
        // Policies and procedures
        lowerFilename.includes('policy') || lowerFilename.includes('procedure') ||
        lowerContent.includes('company policy') || lowerContent.includes('procedure document') ||
        // Contracts and agreements
        lowerFilename.includes('contract') || lowerFilename.includes('agreement') ||
        lowerContent.includes('terms and conditions') || lowerContent.includes('service agreement') ||
        // Compliance frameworks
        lowerFilename.includes('framework') || lowerFilename.includes('standard') ||
        lowerContent.includes('compliance framework') || lowerContent.includes('governance') ||
        // Official documentation
        lowerFilename.includes('handbook') || lowerFilename.includes('manual') ||
        lowerContent.includes('employee handbook') || lowerContent.includes('operations manual') ||
        // Risk assessments
        lowerFilename.includes('risk_assessment') || lowerContent.includes('risk management')
      ) {
        this.logger.info('Document classified as TIER_1 (Policy Document)', {
          filename,
          method: 'rule-based',
        });
        return 'TIER_1';
      }

      // TIER_0: Self-Declared (default/lowest tier)
      this.logger.info('Document classified as TIER_0 (Self-Declared)', {
        filename,
        method: 'rule-based',
        reason: 'default classification',
      });
      return 'TIER_0';
    } catch (error) {
      this.logger.error('Error classifying document tier', {
        filename,
        error: error.message,
      });
      // Default to lowest tier on error
      return 'TIER_0';
    }
  }

  /**
   * Process document in background (called after upload confirmation)
   */
  private async processDocumentBackground(
    documentId: string,
    context?: ServiceContext
  ): Promise<void> {
    // This would typically be handled by a background job queue
    // For now, we'll do basic processing

    this.logger.info('🔄 Background processing started', { documentId });

    setTimeout(async () => {
      try {
        this.logger.info('⏰ Background processing timeout triggered', { documentId });

        // First, always classify the tier based on filename alone (fast and reliable)
        const document = await this.prisma.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          this.logger.error('❌ Document not found in background processing', { documentId });
          return;
        }

        this.logger.info('📋 Document retrieved for background processing', {
          documentId,
          filename: document.filename,
          currentTier: document.evidenceTier
        });

        if (!document.evidenceTier) {
          this.logger.info('🏷️  Starting tier classification', { documentId, filename: document.filename });

          // Classify tier based on filename only (no content needed)
          const tier = await this.classifyDocumentTierByFilename(document.filename);

          this.logger.info('✅ Tier classification result', {
            documentId,
            filename: document.filename,
            tier
          });

          await this.prisma.document.update({
            where: { id: documentId },
            data: {
              evidenceTier: tier,
              tierClassificationReason: 'Classified by filename pattern',
              tierConfidenceScore: 0.7, // Medium confidence for filename-only classification
              classifiedAt: new Date(),
            },
          });

          this.logger.info('💾 Document tier saved to database', {
            documentId,
            tier,
            filename: document.filename,
          });
        } else {
          this.logger.info('⏭️  Document already has tier, skipping classification', {
            documentId,
            tier: document.evidenceTier
          });
        }

        // Then try full analysis (which may fail for images, PDFs, etc.)
        try {
          await this.analyzeDocument(
            documentId,
            {
              extractData: true,
              analyzeContent: true,
              generateSummary: false,
            },
            context
          );

          this.logger.info('Full document analysis completed', { documentId });
        } catch (analysisError) {
          // If full analysis fails, at least we have the tier classification
          this.logger.warn('Full document analysis failed, but tier was classified', {
            documentId,
            error: analysisError.message,
          });
        }
      } catch (error) {
        this.logger.error('Background document processing failed completely', {
          documentId,
          error: error.message,
        });
      }
    }, 1000); // Process after 1 second delay
  }

  /**
   * Quick tier classification based on filename only
   */
  private async classifyDocumentTierByFilename(
    filename: string
  ): Promise<'TIER_0' | 'TIER_1' | 'TIER_2'> {
    const lowerFilename = filename.toLowerCase();

    // TIER_2: System-Generated Evidence (highest tier)
    if (
      lowerFilename.includes('audit_report') ||
      lowerFilename.includes('audit-report') ||
      lowerFilename.includes('certificate') ||
      lowerFilename.includes('certification') ||
      lowerFilename.includes('iso27001') ||
      lowerFilename.includes('iso_27001') ||
      lowerFilename.includes('soc2') ||
      lowerFilename.includes('soc_2') ||
      lowerFilename.includes('pentest') ||
      lowerFilename.includes('penetration_test') ||
      lowerFilename.includes('.log') ||
      lowerFilename.includes('system_report') ||
      lowerFilename.includes('compliance_cert')
    ) {
      return 'TIER_2';
    }

    // TIER_1: Policy Documents (middle tier)
    if (
      lowerFilename.includes('policy') ||
      lowerFilename.includes('procedure') ||
      lowerFilename.includes('contract') ||
      lowerFilename.includes('agreement') ||
      lowerFilename.includes('framework') ||
      lowerFilename.includes('standard') ||
      lowerFilename.includes('handbook') ||
      lowerFilename.includes('manual') ||
      lowerFilename.includes('guideline') ||
      lowerFilename.includes('risk_assessment') ||
      lowerFilename.includes('risk-assessment') ||
      lowerFilename.includes('governance') ||
      lowerFilename.includes('compliance_framework')
    ) {
      return 'TIER_1';
    }

    // TIER_0: Self-Declared (default/lowest tier)
    return 'TIER_0';
  }

  /**
   * Get document statistics for organization
   */
  async getDocumentStats(
    organizationId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{
    totalDocuments: number;
    totalSize: number;
    documentsByType: Record<string, number>;
    recentUploads: number;
    analyzedDocuments: number;
  }>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      const [
        totalCount,
        totalSize,
        documentsByType,
        recentUploads,
        analyzedCount,
      ] = await Promise.all([
        this.prisma.document.count({
          where: { organizationId },
        }),
        this.prisma.document.aggregate({
          where: { organizationId },
          _sum: { size: true },
        }),
        this.prisma.document.groupBy({
          by: ['documentType'],
          where: { organizationId },
          _count: { documentType: true },
        }),
        this.prisma.document.count({
          where: {
            organizationId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
        this.prisma.document.count({
          where: {
            organizationId,
            extractedData: { not: null },
          },
        }),
      ]);

      const documentTypeStats = documentsByType.reduce((acc, item) => {
        acc[item.documentType || 'unknown'] = item._count.documentType;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        totalDocuments: totalCount,
        totalSize: totalSize._sum.size || 0,
        documentsByType: documentTypeStats,
        recentUploads,
        analyzedDocuments: analyzedCount,
      };

      return this.createResponse(true, stats);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getDocumentStats');
    }
  }
}

export const documentService = new DocumentService();