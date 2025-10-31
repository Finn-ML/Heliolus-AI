/**
 * Vendor Service
 * Handles vendor management, marketplace operations, and vendor matching
 * Uses vendor-lib for marketplace logic and matching algorithms
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseVendor,
  DatabaseSolution,
  DatabaseVendorMatch,
  VendorCategory,
  VendorStatus,
  PricingModel,
  CompanySize,
  UserRole,
  ContactType,
  ContactStatus,
} from '../types/database';
import {
  matchVendorsToGap,
  calculateMatchScore,
  rankVendorMatches,
  analyzeVendorFit,
} from '../lib/vendor';
import { emailService, VendorInquiryData } from './email.service.js';

// Validation schemas
const CreateVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Invalid website URL'),
  headquarters: z.string().max(200).optional(),
  primaryProduct: z.string().max(500).optional(),
  aiCapabilities: z.string().max(500).optional(),
  deploymentOptions: z.string().max(500).optional(),
  integrations: z.string().max(500).optional(),
  dataCoverage: z.string().max(500).optional(),
  awards: z.string().max(500).optional(),
  customerSegments: z.string().max(500).optional(),
  benefitsSnapshot: z.string().max(500).optional(),
  maturityAssessment: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  logo: z.string().url().optional(),
  categories: z.array(z.nativeEnum(VendorCategory)).min(1, 'At least one category required'),
});

// Schema for bulk uploads with more flexible validation
const BulkCreateVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Invalid website URL').nullable().optional(),
  headquarters: z.string().max(200).nullable().optional(),
  primaryProduct: z.string().max(500).nullable().optional(),
  aiCapabilities: z.string().max(500).nullable().optional(),
  deploymentOptions: z.string().max(500).nullable().optional(),
  integrations: z.string().max(500).nullable().optional(),
  dataCoverage: z.string().max(500).nullable().optional(),
  awards: z.string().max(500).nullable().optional(),
  customerSegments: z.string().max(500).nullable().optional(),
  benefitsSnapshot: z.string().max(500).nullable().optional(),
  maturityAssessment: z.string().max(500).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  categories: z.array(z.nativeEnum(VendorCategory)).min(1, 'At least one category required'),
});

const UpdateVendorSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  website: z.string().url().optional(),
  headquarters: z.string().max(200).optional(),
  primaryProduct: z.string().max(500).optional(),
  aiCapabilities: z.string().max(500).optional(),
  deploymentOptions: z.string().max(500).optional(),
  integrations: z.string().max(500).optional(),
  dataCoverage: z.string().max(500).optional(),
  awards: z.string().max(500).optional(),
  customerSegments: z.string().max(500).optional(),
  benefitsSnapshot: z.string().max(500).optional(),
  maturityAssessment: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  logo: z.string().url().optional(),
  categories: z.array(z.nativeEnum(VendorCategory)).optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
});

const CreateSolutionSchema = z.object({
  name: z.string().min(1, 'Solution name is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.nativeEnum(VendorCategory),
  features: z.array(z.string()).min(1, 'At least one feature required'),
  benefits: z.array(z.string()).min(1, 'At least one benefit required'),
  useCases: z.array(z.string()).optional(),
  pricingModel: z.nativeEnum(PricingModel),
  startingPrice: z.number().min(0).optional(),
  currency: z.string().length(3).default('EUR'),
  pricingDetails: z.string().max(1000).optional(),
  gapCategories: z.array(z.string()).min(1, 'At least one gap category required'),
  industries: z.array(z.string()).optional(),
  companySizes: z.array(z.nativeEnum(CompanySize)).optional(),
  demoUrl: z.string().url().optional(),
  brochureUrl: z.string().url().optional(),
  caseStudyUrls: z.array(z.string().url()).optional(),
});

const UpdateSolutionSchema = CreateSolutionSchema.partial();

const VendorContactSchema = z.object({
  vendorId: z.string().cuid('Invalid vendor ID'),
  type: z.nativeEnum(ContactType),
  message: z.string().max(2000).optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  budget: z.string().max(100).optional(),
  timeline: z.string().max(100).optional(),
});

const VendorMatchCriteriaSchema = z.object({
  gapCategories: z.array(z.string()).min(1),
  industry: z.string().optional(),
  companySize: z.nativeEnum(CompanySize).optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  location: z.string().optional(),
});

export interface VendorWithDetails extends DatabaseVendor {
  solutions: Array<{
    id: string;
    name: string;
    category: VendorCategory;
    pricingModel: PricingModel;
    startingPrice: number | null;
  }>;
  _count: {
    solutions: number;
    matches: number;
    contacts: number;
  };
}

export interface SolutionWithVendor extends DatabaseSolution {
  vendor: {
    id: string;
    companyName: string;
    website: string;
    logo: string | null;
    verified: boolean;
    rating: number | null;
  };
}

export interface VendorMatchResult {
  vendor: VendorWithDetails;
  solution: SolutionWithVendor | null;
  matchScore: number;
  matchReasons: string[];
  fit: {
    categoryMatch: number;
    sizeMatch: number;
    industryMatch: number;
    budgetMatch: number;
  };
}

export class VendorService extends BaseService {
  /**
   * Create a vendor profile for a user
   */
  async createVendor(
    data: z.infer<typeof CreateVendorSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseVendor>> {
    try {
      const validatedData = await this.validateInput(CreateVendorSchema, data);

      // Check if company name is already taken
      const existingCompany = await this.prisma.vendor.findUnique({
        where: { companyName: validatedData.companyName },
      });

      if (existingCompany) {
        throw this.createError(
          'Company name already registered',
          409,
          'COMPANY_NAME_EXISTS'
        );
      }

      this.requirePermission(context, [UserRole.VENDOR, UserRole.ADMIN]);

      const vendor = await this.prisma.vendor.create({
        data: {
          companyName: validatedData.companyName,
          website: validatedData.website,
          logo: validatedData.logo || null,
          contactEmail: validatedData.contactEmail || null,
          headquarters: validatedData.headquarters || null,
          primaryProduct: validatedData.primaryProduct || null,
          aiCapabilities: validatedData.aiCapabilities || null,
          deploymentOptions: validatedData.deploymentOptions || null,
          integrations: validatedData.integrations || null,
          dataCoverage: validatedData.dataCoverage || null,
          awards: validatedData.awards || null,
          customerSegments: validatedData.customerSegments || null,
          benefitsSnapshot: validatedData.benefitsSnapshot || null,
          maturityAssessment: validatedData.maturityAssessment || null,
          categories: validatedData.categories,
          status: VendorStatus.PENDING,
          featured: false,
          verified: false,
        },
      });


      await this.logAudit(
        {
          action: 'VENDOR_CREATED',
          entity: 'Vendor',
          entityId: vendor.id,
          newValues: {
            companyName: vendor.companyName,
            categories: vendor.categories,
            status: vendor.status,
          },
        },
        context
      );

      this.logger.info('Vendor created successfully', {
        vendorId: vendor.id,
        companyName: vendor.companyName,
      });

      return this.createResponse(true, vendor, 'Vendor profile created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createVendor');
    }
  }

  /**
   * Create a vendor for bulk uploads with flexible validation
   */
  async createVendorBulk(
    adminUserId: string, // The admin doing the import  
    data: z.infer<typeof BulkCreateVendorSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseVendor>> {
    try {
      const validatedData = await this.validateInput(BulkCreateVendorSchema, data);
      
      // For bulk uploads, create vendor without user account (they won't be logging in)
      const vendor = await this.prisma.vendor.create({
        data: {
          companyName: validatedData.companyName,
          website: validatedData.website,
          headquarters: validatedData.headquarters || null,
          primaryProduct: validatedData.primaryProduct || null,
          aiCapabilities: validatedData.aiCapabilities || null,
          deploymentOptions: validatedData.deploymentOptions || null,
          integrations: validatedData.integrations || null,
          dataCoverage: validatedData.dataCoverage || null,
          awards: validatedData.awards || null,
          customerSegments: validatedData.customerSegments || null,
          benefitsSnapshot: validatedData.benefitsSnapshot || null,
          maturityAssessment: validatedData.maturityAssessment || null,
          contactEmail: validatedData.contactEmail || null,
          logo: validatedData.logo || null,
          categories: validatedData.categories,
          status: VendorStatus.PENDING,
          featured: false,
          verified: false,
          rating: 0,
          reviewCount: 0,
        },
      });

      return this.createResponse(true, vendor, 'Vendor created successfully in bulk');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createVendorBulk');
    }
  }

  /**
   * Get vendor by ID with full details
   */
  async getVendorById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<VendorWithDetails>> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id },
        include: {
          solutions: {
            select: {
              id: true,
              name: true,
              category: true,
              pricingModel: true,
              startingPrice: true,
            },
            where: { isActive: true },
          },
          _count: {
            select: {
              solutions: true,
              matches: true,
              contacts: true,
            },
          },
        },
      });

      if (!vendor) {
        throw this.createError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }

      // Only show approved vendors to non-admins
      if (vendor.status !== VendorStatus.APPROVED) {
        this.requirePermission(context, [UserRole.ADMIN]);
      }

      return this.createResponse(true, vendor);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getVendorById');
    }
  }

  /**
   * Update vendor profile
   */
  async updateVendor(
    id: string,
    data: z.infer<typeof UpdateVendorSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseVendor>> {
    try {
      const validatedData = await this.validateInput(UpdateVendorSchema, data);

      const existingVendor = await this.prisma.vendor.findUnique({
        where: { id },
        select: { id: true, companyName: true },
      });

      if (!existingVendor) {
        throw this.createError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }

      // Check permissions - only admins can update vendors
      this.requirePermission(context, [UserRole.ADMIN]);

      // Admin permissions are already checked above, so no additional checks needed

      // Check company name uniqueness if changed
      if (validatedData.companyName && validatedData.companyName !== existingVendor.companyName) {
        const existingCompany = await this.prisma.vendor.findUnique({
          where: { companyName: validatedData.companyName },
        });
        if (existingCompany) {
          throw this.createError(
            'Company name already registered',
            409,
            'COMPANY_NAME_EXISTS'
          );
        }
      }

      const updatedVendor = await this.prisma.vendor.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: this.now(),
          approvedAt: validatedData.status === VendorStatus.APPROVED ? this.now() : undefined,
          approvedBy: validatedData.status === VendorStatus.APPROVED ? context?.userId : undefined,
        },
      });

      await this.logAudit(
        {
          action: 'VENDOR_UPDATED',
          entity: 'Vendor',
          entityId: id,
          oldValues: existingVendor,
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Vendor updated successfully', { vendorId: id });

      return this.createResponse(true, updatedVendor, 'Vendor updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateVendor');
    }
  }

  /**
   * Create a solution for a vendor
   */
  async createSolution(
    vendorId: string,
    data: z.infer<typeof CreateSolutionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSolution>> {
    try {
      const validatedData = await this.validateInput(CreateSolutionSchema, data);

      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, userId: true, status: true },
      });

      if (!vendor) {
        throw this.createError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.VENDOR, UserRole.ADMIN], vendor.userId);

      // Only approved vendors can create solutions
      if (vendor.status !== VendorStatus.APPROVED) {
        throw this.createError(
          'Vendor must be approved to create solutions',
          403,
          'VENDOR_NOT_APPROVED'
        );
      }

      const solution = await this.prisma.solution.create({
        data: {
          vendorId,
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          features: validatedData.features,
          benefits: validatedData.benefits,
          useCases: validatedData.useCases || [],
          pricingModel: validatedData.pricingModel,
          startingPrice: validatedData.startingPrice || null,
          currency: validatedData.currency,
          pricingDetails: validatedData.pricingDetails || null,
          gapCategories: validatedData.gapCategories,
          industries: validatedData.industries || [],
          companySizes: validatedData.companySizes || [],
          demoUrl: validatedData.demoUrl || null,
          brochureUrl: validatedData.brochureUrl || null,
          caseStudyUrls: validatedData.caseStudyUrls || [],
          isActive: true,
        },
      });

      await this.logAudit(
        {
          action: 'SOLUTION_CREATED',
          entity: 'Solution',
          entityId: solution.id,
          newValues: {
            vendorId,
            name: solution.name,
            category: solution.category,
          },
        },
        context
      );

      this.logger.info('Solution created successfully', {
        solutionId: solution.id,
        vendorId,
      });

      return this.createResponse(true, solution, 'Solution created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createSolution');
    }
  }

  /**
   * Update a solution
   */
  async updateSolution(
    id: string,
    data: z.infer<typeof UpdateSolutionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSolution>> {
    try {
      const validatedData = await this.validateInput(UpdateSolutionSchema, data);

      const solution = await this.prisma.solution.findUnique({
        where: { id },
        include: {
          vendor: {
            select: { id: true, userId: true },
          },
        },
      });

      if (!solution) {
        throw this.createError('Solution not found', 404, 'SOLUTION_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.VENDOR, UserRole.ADMIN], solution.vendor.userId);

      const updatedSolution = await this.prisma.solution.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'SOLUTION_UPDATED',
          entity: 'Solution',
          entityId: id,
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Solution updated successfully', { solutionId: id });

      return this.createResponse(true, updatedSolution, 'Solution updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateSolution');
    }
  }

  /**
   * Find vendor matches for a gap or set of criteria
   */
  async findVendorMatches(
    gapId: string,
    criteria?: z.infer<typeof VendorMatchCriteriaSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<VendorMatchResult[]>> {
    try {
      const gap = await this.prisma.gap.findUnique({
        where: { id: gapId },
        include: {
          assessment: {
            include: {
              organization: {
                select: {
                  id: true,
                  userId: true,
                  size: true,
                  industry: true,
                  country: true,
                },
              },
            },
          },
        },
      });

      if (!gap) {
        throw this.createError('Gap not found', 404, 'GAP_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        gap.assessment.organization.userId,
        gap.assessment.organizationId
      );

      // Use vendor matching library to find matches
      const matchCriteria = criteria || {
        gapCategories: [gap.category],
        industry: gap.assessment.organization.industry,
        companySize: gap.assessment.organization.size,
      };

      const validatedCriteria = await this.validateInput(VendorMatchCriteriaSchema, matchCriteria);

      // Get potential vendors
      const vendors = await this.prisma.vendor.findMany({
        where: {
          status: VendorStatus.APPROVED,
          categories: {
            hasSome: validatedCriteria.gapCategories as any,
          },
        },
        include: {
          solutions: {
            where: {
              isActive: true,
              gapCategories: {
                hasSome: validatedCriteria.gapCategories,
              },
            },
          },
          _count: {
            select: {
              solutions: true,
              matches: true,
              contacts: true,
            },
          },
        },
      });

      // Calculate matches using vendor library
      const matches: VendorMatchResult[] = [];

      for (const vendor of vendors) {
        try {
          const matchResult = await matchVendorsToGap({
            gap: {
              id: gap.id,
              category: gap.category,
              severity: gap.severity,
              priority: gap.priority,
            },
            organization: gap.assessment.organization,
            criteria: validatedCriteria,
          }, [vendor]);

          if (matchResult && matchResult.length > 0) {
            const vendorMatch = matchResult[0];
            const bestSolution = vendor.solutions.find(s => 
              s.gapCategories.some(cat => validatedCriteria.gapCategories.includes(cat))
            ) || null;

            const matchScore = await calculateMatchScore(vendor, gap);

            const fit = await analyzeVendorFit(vendor, gap);

            matches.push({
              vendor,
              solution: bestSolution ? {
                ...bestSolution,
                vendor: {
                  id: vendor.id,
                  companyName: vendor.companyName,
                  website: vendor.website,
                  logo: vendor.logo,
                  verified: vendor.verified,
                  rating: vendor.rating,
                },
              } : null,
              matchScore,
              matchReasons: vendorMatch.reasons || [],
              fit,
            });
          }
        } catch (error) {
          this.logger.warn('Vendor matching failed for vendor', {
            vendorId: vendor.id,
            error: error.message,
          });
        }
      }

      // Rank matches and take top results
      const rankedMatches = await rankVendorMatches(matches);
      const topMatches = rankedMatches.slice(0, 20); // Limit to top 20

      // Store matches in database for tracking
      if (topMatches.length > 0) {
        const matchData = topMatches.map(match => ({
          gapId,
          vendorId: match.vendor.id,
          solutionId: match.solution?.id || null,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons,
        }));

        await this.prisma.vendorMatch.createMany({
          data: matchData,
          skipDuplicates: true,
        });
      }

      this.logger.info('Vendor matches found', {
        gapId,
        matchCount: topMatches.length,
      });

      return this.createResponse(true, topMatches, 'Vendor matches found');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'findVendorMatches');
    }
  }

  /**
   * Contact a vendor
   */
  async contactVendor(
    data: z.infer<typeof VendorContactSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<{ id: string; status: ContactStatus }>> {
    try {
      const validatedData = await this.validateInput(VendorContactSchema, data);

      // Verify vendor exists and is approved, fetch contact details for email
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: validatedData.vendorId },
        select: {
          id: true,
          status: true,
          companyName: true,
          contactEmail: true
        },
      });

      if (!vendor || vendor.status !== VendorStatus.APPROVED) {
        throw this.createError('Vendor not found or not available', 404, 'VENDOR_NOT_FOUND');
      }

      // Get user's organization
      const user = await this.prisma.user.findUnique({
        where: { id: context?.userId! },
        include: { organization: true },
      });

      if (!user?.organization) {
        throw this.createError('User organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      const contact = await this.prisma.vendorContact.create({
        data: {
          vendorId: validatedData.vendorId,
          userId: context?.userId!,
          organizationId: user.organization.id,
          type: validatedData.type,
          message: validatedData.message || null,
          requirements: (validatedData.requirements as any) || null,
          budget: validatedData.budget || null,
          timeline: validatedData.timeline || null,
          status: ContactStatus.PENDING,
        },
      });

      // Send vendor inquiry email notification
      if (vendor.contactEmail) {
        try {
          const inquiryData: VendorInquiryData = {
            companyName: user.organization.name,
            userName: `${user.firstName} ${user.lastName}`.trim(),
            userEmail: user.email,
            message: validatedData.message || 'Customer is interested in your compliance solutions.',
            budget: validatedData.budget,
            timeline: validatedData.timeline,
          };

          await emailService.sendVendorInquiry(
            vendor.contactEmail,
            vendor.companyName,
            inquiryData
          );

          this.logger.info('Vendor inquiry email sent', {
            vendorId: vendor.id,
            vendorEmail: vendor.contactEmail,
            contactId: contact.id,
          });
        } catch (emailError) {
          // Log email failure but don't fail the API call
          this.logger.error('Failed to send vendor inquiry email', {
            vendorId: vendor.id,
            vendorEmail: vendor.contactEmail,
            contactId: contact.id,
            error: emailError,
          });
        }
      } else {
        this.logger.warn('Vendor has no contact email, skipping inquiry email', {
          vendorId: vendor.id,
          contactId: contact.id,
        });
      }

      // Mark any relevant vendor matches as contacted
      await this.prisma.vendorMatch.updateMany({
        where: {
          vendorId: validatedData.vendorId,
          gap: {
            assessment: {
              organizationId: user.organization.id,
            },
          },
        },
        data: {
          contacted: true,
        },
      });

      await this.logAudit(
        {
          action: 'VENDOR_CONTACTED',
          entity: 'VendorContact',
          entityId: contact.id,
          newValues: {
            vendorId: validatedData.vendorId,
            type: validatedData.type,
          },
        },
        context
      );

      this.logger.info('Vendor contact created', {
        contactId: contact.id,
        vendorId: validatedData.vendorId,
      });

      return this.createResponse(
        true,
        { id: contact.id, status: contact.status },
        'Vendor contacted successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'contactVendor');
    }
  }

  /**
   * List vendors in marketplace
   */
  async listMarketplaceVendors(
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<VendorWithDetails>>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      
      // Only show approved vendors in marketplace
      queryOptions.where.status = VendorStatus.APPROVED;

      // Featured vendors first
      if (!options.sortBy) {
        queryOptions.orderBy = [
          { featured: 'desc' },
          { verified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ] as any;
      }

      const [vendors, total] = await Promise.all([
        this.prisma.vendor.findMany({
          ...queryOptions,
          include: {
            solutions: {
              select: {
                id: true,
                name: true,
                category: true,
                pricingModel: true,
                startingPrice: true,
              },
              where: { isActive: true },
              take: 3, // Show top 3 solutions
            },
            _count: {
              select: {
                solutions: true,
                matches: true,
                contacts: true,
              },
            },
          },
        }),
        this.prisma.vendor.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        vendors,
        total,
        options.page || 1,
        options.limit || 12
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listMarketplaceVendors');
    }
  }

  /**
   * List solutions in marketplace
   */
  async listMarketplaceSolutions(
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<SolutionWithVendor>>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where.isActive = true;
      queryOptions.where.vendor = {
        status: VendorStatus.APPROVED,
      };

      const [solutions, total] = await Promise.all([
        this.prisma.solution.findMany({
          ...queryOptions,
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                website: true,
                logo: true,
                verified: true,
                rating: true,
              },
            },
          },
        }),
        this.prisma.solution.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        solutions,
        total,
        options.page || 1,
        options.limit || 12
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listMarketplaceSolutions');
    }
  }

  /**
   * Get vendor contacts for a vendor (vendor owner only)
   */
  async getVendorContacts(
    vendorId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, userId: true },
      });

      if (!vendor) {
        throw this.createError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.VENDOR, UserRole.ADMIN], vendor.userId);

      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where.vendorId = vendorId;

      const [contacts, total] = await Promise.all([
        this.prisma.vendorContact.findMany({
          ...queryOptions,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                size: true,
                country: true,
              },
            },
          },
        }),
        this.prisma.vendorContact.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        contacts,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getVendorContacts');
    }
  }

  /**
   * Delete a vendor (admin only)
   */
  async deleteVendor(
    vendorId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      // Check permissions - only admins can delete vendors
      this.requirePermission(context, [UserRole.ADMIN]);

      // Delete the vendor - Prisma will throw if not found
      await this.prisma.vendor.delete({
        where: { id: vendorId },
      });

      return this.createResponse(true, {
        success: true,
        message: 'Vendor deleted successfully',
      });
    } catch (error) {
      // Handle Prisma record not found error
      if (error.code === 'P2025' || error.message?.includes('Record to delete does not exist')) {
        throw this.createError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteVendor');
    }
  }
}

export const vendorService = new VendorService();