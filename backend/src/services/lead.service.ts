/**
 * Lead Service
 * Virtual lead model aggregating RFP (Premium) and VendorContact (Basic) leads
 * Provides unified interface for admin lead tracking and classification
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service.js';
import { RFP, VendorContact, LeadStatus, ContactStatus, Prisma } from '../generated/prisma/index.js';

// ==================== TYPES ====================

export type LeadType = 'PREMIUM' | 'BASIC';

export interface Lead {
  id: string;
  type: LeadType;
  companyName: string;
  userEmail: string;
  userName: string;
  submissionDate: Date;
  status: LeadStatus | string;
  vendors: Array<{ id: string; name: string }>;
  budget?: string | null;
  timeline?: string | null;
  // Premium-specific fields
  rfpTitle?: string | null;
  objectives?: string | null;
  requirements?: string | null;
  documents?: string[];
  // Basic-specific fields
  message?: string | null;
  phone?: string | null;
}

export interface LeadFilters {
  type?: LeadType | 'ALL';
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface LeadAnalytics {
  totalLeads: number;
  premiumLeads: number;
  basicLeads: number;
  byStatus: Record<string, number>;
  conversionRate: number;
  avgResponseTimeHours: number | null;
}

// ==================== VALIDATION SCHEMAS ====================

export const LeadFiltersSchema = z.object({
  type: z.enum(['PREMIUM', 'BASIC', 'ALL']).optional().default('ALL'),
  status: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const UpdateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
  type: z.enum(['PREMIUM', 'BASIC']),
});

// ==================== LEAD SERVICE ====================

export class LeadService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get all leads with filtering and pagination
   * Aggregates from RFP (Premium) and VendorContact (Basic) tables
   */
  async getLeads(filters: LeadFilters): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const validatedFilters = await this.validateInput(LeadFiltersSchema, filters);
      const { type, status, startDate, endDate, page, limit } = validatedFilters;

      const leads: Lead[] = [];

      // ===== Fetch Premium Leads (from RFP table) =====
      if (type === 'PREMIUM' || type === 'ALL') {
        const rfpWhere: Prisma.RFPWhereInput = {
          status: { in: ['SENT', 'FAILED'] }, // Only sent RFPs are leads
        };

        if (status && status.length > 0) {
          rfpWhere.leadStatus = { in: status as LeadStatus[] };
        }

        if (startDate || endDate) {
          rfpWhere.createdAt = {};
          if (startDate) rfpWhere.createdAt.gte = startDate;
          if (endDate) rfpWhere.createdAt.lte = endDate;
        }

        const rfps = await this.prisma.rFP.findMany({
          where: rfpWhere,
          include: {
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            contacts: {
              include: {
                vendor: { select: { id: true, companyName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        for (const rfp of rfps) {
          // Handle potentially null/undefined relations with fallbacks
          const orgName = rfp.organization?.name || 'Unknown Organization';
          const userEmail = rfp.user?.email || 'Unknown Email';
          const firstName = rfp.user?.firstName || 'Unknown';
          const lastName = rfp.user?.lastName || 'User';

          leads.push({
            id: rfp.id,
            type: 'PREMIUM',
            companyName: orgName,
            userEmail: userEmail,
            userName: `${firstName} ${lastName}`.trim(),
            submissionDate: rfp.sentAt || rfp.createdAt,
            status: rfp.leadStatus || LeadStatus.NEW,
            vendors: rfp.contacts
              .filter(c => c.vendor) // Filter out contacts with null vendors
              .map(c => ({
                id: c.vendor!.id,
                name: c.vendor!.companyName,
              })),
            budget: rfp.budget,
            timeline: rfp.timeline,
            rfpTitle: rfp.title,
            objectives: rfp.objectives,
            requirements: rfp.requirements,
            documents: rfp.documents || [],
          });
        }
      }

      // ===== Fetch Basic Leads (from VendorContact table) =====
      if (type === 'BASIC' || type === 'ALL') {
        const contactWhere: Prisma.VendorContactWhereInput = {
          rfpId: null, // Only contacts NOT associated with an RFP
        };

        if (status && status.length > 0) {
          // Filter to only valid ContactStatus enum values
          const validStatuses = status.filter((s): s is ContactStatus => {
            const validValues: ContactStatus[] = ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
            return validValues.includes(s as ContactStatus);
          });

          // Only apply filter if there are valid statuses
          if (validStatuses.length > 0) {
            contactWhere.status = { in: validStatuses };
          }
        }

        if (startDate || endDate) {
          contactWhere.createdAt = {};
          if (startDate) contactWhere.createdAt.gte = startDate;
          if (endDate) contactWhere.createdAt.lte = endDate;
        }

        const contacts = await this.prisma.vendorContact.findMany({
          where: contactWhere,
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            vendor: { select: { id: true, companyName: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        for (const contact of contacts) {
          // Handle potentially null/undefined relations with fallbacks
          const orgName = contact.organization?.name || 'Unknown Organization';
          const userEmail = contact.user?.email || 'Unknown Email';
          const firstName = contact.user?.firstName || 'Unknown';
          const lastName = contact.user?.lastName || 'User';
          const vendorId = contact.vendor?.id || 'unknown-vendor';
          const vendorName = contact.vendor?.companyName || 'Unknown Vendor';

          leads.push({
            id: contact.id,
            type: 'BASIC',
            companyName: orgName,
            userEmail: userEmail,
            userName: `${firstName} ${lastName}`.trim(),
            submissionDate: contact.createdAt,
            status: contact.status || 'PENDING',
            vendors: [{ id: vendorId, name: vendorName }],
            message: (contact.metadata as any)?.message || null,
            phone: (contact.metadata as any)?.phone || null,
          });
        }
      }

      // Sort all leads by submission date (newest first)
      leads.sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());

      // Pagination
      const total = leads.length;
      const skip = (page - 1) * limit;
      const paginatedLeads = leads.slice(skip, skip + limit);
      const totalPages = Math.ceil(total / limit);

      this.logger.info('Leads retrieved', {
        type,
        total,
        page,
        limit,
        statusFilter: status,
      });

      return {
        leads: paginatedLeads,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'getLeads');
    }
  }

  /**
   * Get a single lead by ID and type
   */
  async getLeadById(leadId: string, leadType: LeadType): Promise<Lead> {
    try {
      if (leadType === 'PREMIUM') {
        const rfp = await this.prisma.rFP.findUnique({
          where: { id: leadId },
          include: {
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            contacts: {
              include: {
                vendor: { select: { id: true, companyName: true, contactEmail: true } },
              },
            },
          },
        });

        if (!rfp) {
          throw this.createError('Premium lead not found', 404, 'LEAD_NOT_FOUND');
        }

        return {
          id: rfp.id,
          type: 'PREMIUM',
          companyName: rfp.organization.name,
          userEmail: rfp.user.email,
          userName: `${rfp.user.firstName} ${rfp.user.lastName}`.trim(),
          submissionDate: rfp.sentAt || rfp.createdAt,
          status: rfp.leadStatus || LeadStatus.NEW,
          vendors: rfp.contacts.map(c => ({
            id: c.vendor.id,
            name: c.vendor.companyName,
          })),
          budget: rfp.budget,
          timeline: rfp.timeline,
          rfpTitle: rfp.title,
          objectives: rfp.objectives,
          requirements: rfp.requirements,
          documents: rfp.documents || [],
        };
      } else {
        // BASIC lead
        const contact = await this.prisma.vendorContact.findUnique({
          where: { id: leadId },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            vendor: { select: { id: true, companyName: true, contactEmail: true } },
          },
        });

        if (!contact) {
          throw this.createError('Basic lead not found', 404, 'LEAD_NOT_FOUND');
        }

        return {
          id: contact.id,
          type: 'BASIC',
          companyName: contact.organization.name,
          userEmail: contact.user.email,
          userName: `${contact.user.firstName} ${contact.user.lastName}`.trim(),
          submissionDate: contact.createdAt,
          status: contact.status || 'PENDING',
          vendors: [{ id: contact.vendor.id, name: contact.vendor.companyName }],
          message: (contact.metadata as any)?.message || null,
          phone: (contact.metadata as any)?.phone || null,
        };
      }
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'getLeadById');
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    leadType: LeadType,
    newStatus: LeadStatus,
    context?: ServiceContext
  ): Promise<Lead> {
    try {
      if (leadType === 'PREMIUM') {
        const updatedRFP = await this.prisma.rFP.update({
          where: { id: leadId },
          data: { leadStatus: newStatus },
          include: {
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            contacts: {
              include: {
                vendor: { select: { id: true, companyName: true } },
              },
            },
          },
        });

        // Log audit event
        await this.logAudit(
          {
            action: 'LEAD_STATUS_UPDATED',
            entity: 'RFP',
            entityId: leadId,
            newValues: { leadStatus: newStatus },
          },
          context
        );

        this.logger.info('Premium lead status updated', { leadId, newStatus });

        return {
          id: updatedRFP.id,
          type: 'PREMIUM',
          companyName: updatedRFP.organization.name,
          userEmail: updatedRFP.user.email,
          userName: `${updatedRFP.user.firstName} ${updatedRFP.user.lastName}`.trim(),
          submissionDate: updatedRFP.sentAt || updatedRFP.createdAt,
          status: updatedRFP.leadStatus || LeadStatus.NEW,
          vendors: updatedRFP.contacts.map(c => ({
            id: c.vendor.id,
            name: c.vendor.companyName,
          })),
          budget: updatedRFP.budget,
          timeline: updatedRFP.timeline,
          rfpTitle: updatedRFP.title,
          objectives: updatedRFP.objectives,
          requirements: updatedRFP.requirements,
          documents: updatedRFP.documents || [],
        };
      } else {
        // BASIC lead - map LeadStatus to VendorContact status
        const contactStatusMap: Record<LeadStatus, ContactStatus> = {
          [LeadStatus.NEW]: 'PENDING',
          [LeadStatus.IN_PROGRESS]: 'IN_PROGRESS',
          [LeadStatus.QUALIFIED]: 'ACKNOWLEDGED',
          [LeadStatus.CONVERTED]: 'COMPLETED',
          [LeadStatus.LOST]: 'REJECTED',
        };

        const contactStatus = contactStatusMap[newStatus] || 'PENDING';

        const updatedContact = await this.prisma.vendorContact.update({
          where: { id: leadId },
          data: { status: contactStatus },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            organization: { select: { name: true } },
            user: { select: { email: true, firstName: true, lastName: true } },
            vendor: { select: { id: true, companyName: true } },
          },
        });

        // Log audit event
        await this.logAudit(
          {
            action: 'LEAD_STATUS_UPDATED',
            entity: 'VendorContact',
            entityId: leadId,
            newValues: { status: contactStatus, leadStatus: newStatus },
          },
          context
        );

        this.logger.info('Basic lead status updated', { leadId, newStatus, contactStatus });

        return {
          id: updatedContact.id,
          type: 'BASIC',
          companyName: updatedContact.organization.name,
          userEmail: updatedContact.user.email,
          userName: `${updatedContact.user.firstName} ${updatedContact.user.lastName}`.trim(),
          submissionDate: updatedContact.createdAt,
          status: newStatus,
          vendors: [{ id: updatedContact.vendor.id, name: updatedContact.vendor.companyName }],
          message: (updatedContact.metadata as any)?.message || null,
          phone: (updatedContact.metadata as any)?.phone || null,
        };
      }
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'updateLeadStatus');
    }
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(): Promise<LeadAnalytics> {
    try {
      // Count premium leads (sent RFPs)
      const premiumLeadsCount = await this.prisma.rFP.count({
        where: { status: { in: ['SENT', 'FAILED'] } },
      });

      // Count basic leads (VendorContacts not from RFPs)
      const basicLeadsCount = await this.prisma.vendorContact.count({
        where: { rfpId: null },
      });

      // Group premium leads by status
      const premiumByStatus = await this.prisma.rFP.groupBy({
        by: ['leadStatus'],
        where: { status: { in: ['SENT', 'FAILED'] } },
        _count: true,
      });

      // Build status counts
      const byStatus: Record<string, number> = {};
      for (const group of premiumByStatus) {
        if (group.leadStatus) {
          byStatus[group.leadStatus] = group._count;
        } else {
          byStatus[LeadStatus.NEW] = (byStatus[LeadStatus.NEW] || 0) + group._count;
        }
      }

      // For basic leads, map their statuses
      const basicContacts = await this.prisma.vendorContact.groupBy({
        by: ['status'],
        where: { rfpId: null },
        _count: true,
      });

      // Map VendorContact statuses to LeadStatus
      const statusReverseMap: Record<string, LeadStatus> = {
        'PENDING': LeadStatus.NEW,
        'CONTACTED': LeadStatus.IN_PROGRESS,
        'RESPONDED': LeadStatus.QUALIFIED,
        'CONVERTED': LeadStatus.CONVERTED,
        'REJECTED': LeadStatus.LOST,
      };

      for (const group of basicContacts) {
        const leadStatus = statusReverseMap[group.status] || LeadStatus.NEW;
        byStatus[leadStatus] = (byStatus[leadStatus] || 0) + group._count;
      }

      const totalLeads = premiumLeadsCount + basicLeadsCount;
      const qualifiedLeads = byStatus[LeadStatus.QUALIFIED] || 0;
      const convertedLeads = byStatus[LeadStatus.CONVERTED] || 0;
      const conversionRate = totalLeads > 0 ? (qualifiedLeads + convertedLeads) / totalLeads : 0;

      // Calculate average response time (simplified - time from NEW to IN_PROGRESS)
      // This is a placeholder - would need actual timestamp tracking
      const avgResponseTimeHours: number | null = null;

      this.logger.info('Lead analytics calculated', {
        totalLeads,
        premiumLeads: premiumLeadsCount,
        basicLeads: basicLeadsCount,
      });

      return {
        totalLeads,
        premiumLeads: premiumLeadsCount,
        basicLeads: basicLeadsCount,
        byStatus,
        conversionRate,
        avgResponseTimeHours,
      };
    } catch (error) {
      return this.handleDatabaseError(error, 'getLeadAnalytics');
    }
  }

  /**
   * Export leads to CSV
   */
  async exportLeadsToCSV(filters: LeadFilters): Promise<string> {
    try {
      // Fetch all leads using pagination with max limit of 100
      const allLeads: Lead[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { leads, totalPages } = await this.getLeads({
          ...filters,
          limit: 100,
          page,
        });

        allLeads.push(...leads);
        hasMore = page < totalPages;
        page++;
      }

      // CSV headers
      const headers = [
        'Date',
        'Type',
        'Company',
        'User Email',
        'User Name',
        'Status',
        'Vendors',
        'Budget',
        'Timeline',
        'RFP Title',
        'Message',
      ];

      // CSV rows
      const rows = allLeads.map(lead => [
        lead.submissionDate.toISOString().split('T')[0], // Date only
        lead.type,
        lead.companyName,
        lead.userEmail,
        lead.userName,
        lead.status,
        lead.vendors.map(v => v.name).join('; '),
        lead.budget || '',
        lead.timeline || '',
        lead.rfpTitle || '',
        lead.message || '',
      ]);

      // Generate CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      this.logger.info('Leads exported to CSV', { leadCount: allLeads.length });

      return csvContent;
    } catch (error) {
      return this.handleDatabaseError(error, 'exportLeadsToCSV');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default LeadService;
