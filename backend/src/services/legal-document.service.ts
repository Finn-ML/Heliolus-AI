/**
 * Legal Document Service
 * Handles uploading and managing privacy policy and terms of service PDFs
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import { ApiResponse } from '../types/database';
import { ObjectStorageService } from '../objectStorage';
import { LegalDocumentType } from '../generated/prisma';

// Object storage configuration
const objectStorageService = new ObjectStorageService();

// Validation schemas
const UploadLegalDocumentSchema = z.object({
  type: z.nativeEnum(LegalDocumentType),
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().refine((mime) => mime === 'application/pdf', {
    message: 'Only PDF files are allowed',
  }),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  version: z.string().optional().default('1.0'),
});

export interface LegalDocumentData {
  id: string;
  type: LegalDocumentType;
  filename: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  version: string;
  isActive: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadLegalDocumentResult {
  document: LegalDocumentData;
  uploadUrl: string;
  fields: Record<string, string>;
}

export class LegalDocumentService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Upload a legal document (admin only)
   * Returns presigned URL for upload
   */
  async uploadLegalDocument(
    data: z.infer<typeof UploadLegalDocumentSchema>,
    uploadedBy: string
  ): Promise<ApiResponse<UploadLegalDocumentResult>> {
    try {
      // Validate input
      const validated = UploadLegalDocumentSchema.parse(data);

      // Generate S3 key
      const timestamp = Date.now();
      const sanitizedFilename = validated.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `legal-documents/${validated.type.toLowerCase()}/${timestamp}_${sanitizedFilename}`;
      const s3Bucket = process.env.S3_BUCKET_NAME || 'heliolus-documents';

      // Deactivate any existing active documents of this type
      await this.context.prisma.legalDocument.updateMany({
        where: {
          type: validated.type,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Create document record
      const document = await this.context.prisma.legalDocument.create({
        data: {
          type: validated.type,
          filename: validated.filename,
          s3Key,
          s3Bucket,
          fileSize: validated.fileSize,
          mimeType: validated.mimeType,
          version: validated.version,
          isActive: true,
          uploadedBy,
        },
      });

      // Generate presigned upload URL
      const { url, fields } = await objectStorageService.generatePresignedUploadUrl(
        s3Key,
        validated.mimeType,
        validated.fileSize
      );

      this.context.logger.info(
        `Legal document upload initiated: ${validated.type} by ${uploadedBy}`
      );

      return {
        success: true,
        data: {
          document,
          uploadUrl: url,
          fields,
        },
        message: 'Legal document upload URL generated',
      };
    } catch (error) {
      this.context.logger.error('Error uploading legal document:', error);
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : 'Failed to upload legal document',
      };
    }
  }

  /**
   * Get the active legal document by type (public)
   */
  async getActiveLegalDocument(
    type: LegalDocumentType
  ): Promise<ApiResponse<LegalDocumentData | null>> {
    try {
      const document = await this.context.prisma.legalDocument.findFirst({
        where: {
          type,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!document) {
        return {
          success: true,
          data: null,
          message: 'No active legal document found',
        };
      }

      return {
        success: true,
        data: document,
        message: 'Legal document retrieved',
      };
    } catch (error) {
      this.context.logger.error('Error fetching legal document:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to fetch legal document',
      };
    }
  }

  /**
   * Get download URL for a legal document (public)
   */
  async getDownloadUrl(documentId: string): Promise<ApiResponse<string>> {
    try {
      const document = await this.context.prisma.legalDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return {
          success: false,
          data: '',
          message: 'Legal document not found',
        };
      }

      // Generate presigned download URL (valid for 1 hour)
      const url = await objectStorageService.generatePresignedDownloadUrl(
        document.s3Key,
        3600 // 1 hour
      );

      return {
        success: true,
        data: url,
        message: 'Download URL generated',
      };
    } catch (error) {
      this.context.logger.error('Error generating download URL:', error);
      return {
        success: false,
        data: '',
        message: 'Failed to generate download URL',
      };
    }
  }

  /**
   * List all legal documents by type (admin only)
   */
  async listLegalDocuments(
    type: LegalDocumentType
  ): Promise<ApiResponse<LegalDocumentData[]>> {
    try {
      const documents = await this.context.prisma.legalDocument.findMany({
        where: { type },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: documents,
        message: `Found ${documents.length} document(s)`,
      };
    } catch (error) {
      this.context.logger.error('Error listing legal documents:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to list legal documents',
      };
    }
  }

  /**
   * Delete a legal document (admin only)
   */
  async deleteLegalDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const document = await this.context.prisma.legalDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return {
          success: false,
          data: undefined,
          message: 'Legal document not found',
        };
      }

      // Delete from S3
      try {
        await objectStorageService.deleteObject(document.s3Key);
      } catch (error) {
        this.context.logger.warn('Failed to delete S3 object:', error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database
      await this.context.prisma.legalDocument.delete({
        where: { id: documentId },
      });

      this.context.logger.info(`Legal document deleted: ${documentId}`);

      return {
        success: true,
        data: undefined,
        message: 'Legal document deleted',
      };
    } catch (error) {
      this.context.logger.error('Error deleting legal document:', error);
      return {
        success: false,
        data: undefined,
        message: 'Failed to delete legal document',
      };
    }
  }

  /**
   * Set a specific document version as active (admin only)
   */
  async setActiveVersion(documentId: string): Promise<ApiResponse<LegalDocumentData>> {
    try {
      const document = await this.context.prisma.legalDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return {
          success: false,
          data: null as any,
          message: 'Legal document not found',
        };
      }

      // Deactivate all other documents of this type
      await this.context.prisma.legalDocument.updateMany({
        where: {
          type: document.type,
          isActive: true,
          id: { not: documentId },
        },
        data: {
          isActive: false,
        },
      });

      // Activate this document
      const updatedDocument = await this.context.prisma.legalDocument.update({
        where: { id: documentId },
        data: { isActive: true },
      });

      this.context.logger.info(`Legal document activated: ${documentId}`);

      return {
        success: true,
        data: updatedDocument,
        message: 'Legal document version activated',
      };
    } catch (error) {
      this.context.logger.error('Error activating legal document:', error);
      return {
        success: false,
        data: null as any,
        message: 'Failed to activate legal document',
      };
    }
  }
}
