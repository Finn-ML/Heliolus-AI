/**
 * RFP Service
 * Handles RFP (Request for Proposal) management with:
 * - Authorization and ownership validation
 * - CRUD operations for RFPs
 * - Document management
 * - Vendor selection
 * - Status transitions
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service.js';
import { RFP, RFPStatus, LeadStatus, Prisma } from '../generated/prisma/index.js';

// ==================== VALIDATION SCHEMAS ====================

/**
 * Schema for creating a new RFP
 * CRITICAL: Vendor array must have at least 1 vendor
 */
export const CreateRFPSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  objectives: z.string().optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  vendorIds: z.array(z.string()).min(1, 'At least one vendor must be selected'),
  documents: z.array(z.string()).max(5, 'Maximum 5 documents allowed').optional().default([]),
});

export type CreateRFPInput = z.infer<typeof CreateRFPSchema>;

/**
 * Schema for updating an existing RFP
 */
export const UpdateRFPSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  objectives: z.string().optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  vendorIds: z.array(z.string()).min(1).optional(),
  documents: z.array(z.string()).max(5).optional(),
  status: z.nativeEnum(RFPStatus).optional(),
  leadStatus: z.nativeEnum(LeadStatus).optional(),
});

export type UpdateRFPInput = z.infer<typeof UpdateRFPSchema>;

/**
 * Schema for RFP filters
 */
export const RFPFiltersSchema = z.object({
  status: z.nativeEnum(RFPStatus).optional(),
  leadStatus: z.nativeEnum(LeadStatus).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type RFPFilters = z.infer<typeof RFPFiltersSchema>;

// ==================== RFP SERVICE ====================

export class RFPService extends BaseService {
  constructor() {
    super();
  }

  /**
   * CRITICAL: Authorization helper to prevent IDOR vulnerability
   * Validates that the requesting user owns the RFP
   *
   * @param rfpId - The RFP ID to authorize
   * @param userId - The requesting user ID
   * @param includeRelations - Optional relations to include in the query
   * @returns The RFP if authorized
   * @throws Error if RFP not found or user doesn't own it
   */
  private async authorizeRFPAccess(
    rfpId: string,
    userId: string,
    includeRelations?: Prisma.RFPInclude
  ): Promise<RFP & any> {
    const rfp = await this.prisma.rFP.findUnique({
      where: { id: rfpId },
      include: includeRelations,
    });

    if (!rfp) {
      this.logger.warn('RFP not found', { rfpId, userId });
      throw this.createError('RFP not found', 404, 'RFP_NOT_FOUND');
    }

    if (rfp.userId !== userId) {
      // Log unauthorized access attempt for security monitoring
      await this.logAudit(
        {
          action: 'UNAUTHORIZED_RFP_ACCESS',
          entity: 'RFP',
          entityId: rfpId,
          metadata: {
            attemptedBy: userId,
            ownedBy: rfp.userId,
            timestamp: new Date().toISOString(),
          },
        },
        { userId }
      );

      throw this.createError(
        'Access denied - you do not own this RFP',
        403,
        'FORBIDDEN'
      );
    }

    return rfp;
  }

  /**
   * Create a new RFP
   *
   * @param userId - User creating the RFP
   * @param organizationId - Organization the RFP belongs to
   * @param data - RFP data
   * @param context - Service context for audit logging
   * @returns Created RFP
   */
  async createRFP(
    userId: string,
    organizationId: string,
    data: CreateRFPInput,
    context?: ServiceContext
  ): Promise<RFP> {
    try {
      // Validate input
      const validatedData = await this.validateInput(CreateRFPSchema, data);

      // Verify organization ownership
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
          userId: userId,
        },
      });

      if (!organization) {
        throw this.createError(
          'Organization not found or access denied',
          404,
          'ORGANIZATION_NOT_FOUND'
        );
      }

      // Verify all vendors exist
      if (validatedData.vendorIds.length > 0) {
        const vendors = await this.prisma.vendor.findMany({
          where: {
            id: { in: validatedData.vendorIds },
          },
          select: { id: true },
        });

        if (vendors.length !== validatedData.vendorIds.length) {
          throw this.createError(
            'One or more vendors not found',
            400,
            'INVALID_VENDORS'
          );
        }
      }

      // Create RFP
      const rfp = await this.prisma.rFP.create({
        data: {
          userId,
          organizationId,
          title: validatedData.title,
          objectives: validatedData.objectives || '',
          requirements: validatedData.requirements || '',
          timeline: validatedData.timeline,
          budget: validatedData.budget,
          vendorIds: validatedData.vendorIds,
          documents: validatedData.documents || [],
          status: RFPStatus.DRAFT,
        },
        include: {
          organization: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log audit event
      await this.logAudit(
        {
          action: 'RFP_CREATED',
          entity: 'RFP',
          entityId: rfp.id,
          newValues: { title: rfp.title, vendorCount: rfp.vendorIds.length },
        },
        { userId, organizationId, ...context }
      );

      this.logger.info('RFP created successfully', {
        rfpId: rfp.id,
        userId,
        organizationId,
      });

      return rfp;
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'createRFP');
    }
  }

  /**
   * Get an RFP by ID with authorization check
   *
   * @param rfpId - RFP ID to retrieve
   * @param userId - Requesting user ID
   * @returns RFP with relations
   */
  async getRFP(rfpId: string, userId: string): Promise<RFP & any> {
    return this.authorizeRFPAccess(rfpId, userId, {
      organization: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      contacts: {
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              contactEmail: true,
            },
          },
        },
      },
    });
  }

  /**
   * Get all RFPs for a user with optional filters
   *
   * @param userId - User ID
   * @param filters - Optional filters
   * @returns Array of RFPs
   */
  async getUserRFPs(userId: string, filters?: RFPFilters): Promise<RFP[]> {
    try {
      const where: Prisma.RFPWhereInput = {
        userId, // Implicit authorization - only returns user's RFPs
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.leadStatus) {
        where.leadStatus = filters.leadStatus;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      const rfps = await this.prisma.rFP.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          contacts: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return rfps;
    } catch (error) {
      return this.handleDatabaseError(error, 'getUserRFPs');
    }
  }

  /**
   * Update an RFP with authorization check
   * Only DRAFT RFPs can be updated
   *
   * @param rfpId - RFP ID to update
   * @param userId - Requesting user ID
   * @param data - Update data
   * @param context - Service context for audit logging
   * @returns Updated RFP
   */
  async updateRFP(
    rfpId: string,
    userId: string,
    data: UpdateRFPInput,
    context?: ServiceContext
  ): Promise<RFP> {
    try {
      // Authorize access
      const existingRFP = await this.authorizeRFPAccess(rfpId, userId);

      // Validate input
      const validatedData = await this.validateInput(UpdateRFPSchema, data);

      // Only DRAFT RFPs can be updated
      if (existingRFP.status !== RFPStatus.DRAFT) {
        throw this.createError(
          `Cannot update RFP with status: ${existingRFP.status}. Only DRAFT RFPs can be updated.`,
          400,
          'INVALID_STATUS'
        );
      }

      // Verify vendors if vendorIds provided
      if (validatedData.vendorIds && validatedData.vendorIds.length > 0) {
        const vendors = await this.prisma.vendor.findMany({
          where: {
            id: { in: validatedData.vendorIds },
          },
          select: { id: true },
        });

        if (vendors.length !== validatedData.vendorIds.length) {
          throw this.createError(
            'One or more vendors not found',
            400,
            'INVALID_VENDORS'
          );
        }
      }

      // Update RFP
      const updatedRFP = await this.prisma.rFP.update({
        where: { id: rfpId },
        data: validatedData,
        include: {
          organization: true,
          contacts: true,
        },
      });

      // Log audit event
      await this.logAudit(
        {
          action: 'RFP_UPDATED',
          entity: 'RFP',
          entityId: rfpId,
          oldValues: {
            title: existingRFP.title,
            vendorCount: existingRFP.vendorIds.length,
          },
          newValues: {
            title: updatedRFP.title,
            vendorCount: updatedRFP.vendorIds.length,
          },
        },
        { userId, ...context }
      );

      this.logger.info('RFP updated successfully', { rfpId, userId });

      return updatedRFP;
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'updateRFP');
    }
  }

  /**
   * Delete an RFP with authorization check and audit logging
   * Uses cascade delete to automatically remove related VendorContact records
   *
   * @param rfpId - RFP ID to delete
   * @param userId - Requesting user ID
   * @param context - Service context for audit logging
   * @returns Success response
   */
  async deleteRFP(
    rfpId: string,
    userId: string,
    context?: ServiceContext
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Authorize access and get RFP with contacts for audit logging
      const rfp = await this.authorizeRFPAccess(rfpId, userId, {
        contacts: {
          select: {
            id: true,
            vendorId: true,
          },
        },
      });

      // Log audit event BEFORE deletion (cascade will remove contacts)
      await this.logAudit(
        {
          action: 'RFP_DELETED',
          entity: 'RFP',
          entityId: rfpId,
          oldValues: {
            title: rfp.title,
            status: rfp.status,
            vendorCount: rfp.vendorIds.length,
            contactsDeleted: rfp.contacts?.length || 0,
            contactIds: rfp.contacts?.map((c: any) => c.id) || [],
          },
        },
        { userId, ...context }
      );

      // Delete RFP (cascade delete will handle VendorContact records)
      await this.prisma.rFP.delete({
        where: { id: rfpId },
      });

      this.logger.info('RFP deleted successfully', {
        rfpId,
        userId,
        contactsDeleted: rfp.contacts?.length || 0,
      });

      return {
        success: true,
        message: 'RFP deleted successfully',
      };
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'deleteRFP');
    }
  }

  /**
   * Generate document download links for RFP documents
   *
   * @param documents - Array of document URLs
   * @returns Array of document info with pre-signed URLs
   */
  generateDocumentLinks(documents: string[]): Array<{ url: string; filename: string }> {
    return documents.map((url) => {
      const filename = url.split('/').pop() || 'document';
      return {
        url,
        filename,
      };
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default RFPService;
