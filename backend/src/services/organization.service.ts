/**
 * Organization Service
 * Handles organization profile management, onboarding, and company data
 * Integrates with AI-lib for website analysis and data extraction
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseOrganization,
  CompanySize,
  RiskProfile,
  UserRole,
} from '../types/database';
import { analyzeWebsite, extractCompanyData, extractFromWebsite, getCachedExtraction, cacheExtraction } from '../lib/ai';

// Validation schemas
const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  website: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional() // Removed strict URL validation to match routes and anonymous flow
  ),
  industry: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(100).optional()
  ),
  size: z.nativeEnum(CompanySize).optional(),
  country: z.string().min(2, 'Country code required').max(2),
  region: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(100).optional()
  ),
  description: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(1000).optional()
  ),
  // Add missing fields that frontend sends
  annualRevenue: z.enum(['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M']).optional(),
  complianceTeamSize: z.enum(['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN']).optional(),
  geography: z.enum(['US', 'EU', 'UK', 'APAC', 'GLOBAL']).optional(),
});

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  website: z.string().optional(), // Removed strict URL validation to match routes and anonymous flow
  industry: z.string().max(100).optional(),
  size: z.nativeEnum(CompanySize).optional(),
  country: z.string().min(2).max(2).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  riskProfile: z.nativeEnum(RiskProfile).optional(),
  annualRevenue: z.enum(['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M']).optional(),
  complianceTeamSize: z.enum(['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN']).optional(),
  geography: z.enum(['US', 'EU', 'UK', 'APAC', 'GLOBAL']).optional(),
});

const OnboardingDataSchema = z.object({
  businessModel: z.string().optional(),
  primaryServices: z.array(z.string()).optional(),
  complianceRequirements: z.array(z.string()).optional(),
  currentChallenges: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
});

export interface OrganizationProfile extends DatabaseOrganization {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    documents: number;
    assessments: number;
  };
}

export interface CompanyInsights {
  industryAnalysis: {
    sector: string;
    subSector: string;
    riskFactors: string[];
  };
  websiteAnalysis: {
    services: string[];
    technologies: string[];
    complianceIndicators: string[];
  };
  riskAssessment: {
    profile: RiskProfile;
    factors: string[];
    score: number;
  };
  recommendations: string[];
}

export class OrganizationService extends BaseService {
  /**
   * Create a new organization profile for a user
   */
  async createOrganization(
    userId: string,
    data: z.infer<typeof CreateOrganizationSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseOrganization>> {
    try {
      const validatedData = await this.validateInput(CreateOrganizationSchema, data);

      // Check if user already has an organization
      const existingOrg = await this.prisma.organization.findUnique({
        where: { userId },
      });

      if (existingOrg) {
        // Return the existing organization instead of throwing an error
        // This handles cases where the organization was created during session claim
        this.logger.info('User already has an organization, returning existing', {
          organizationId: existingOrg.id,
          userId,
        });
        return this.createResponse(true, existingOrg, 'Organization already exists');
      }

      // Verify user exists and has permission
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      let initialRiskProfile = null;

      // Analyze website if provided
      if (validatedData.website) {
        try {
          const websiteAnalysis = await analyzeWebsite(validatedData.website);
          
          // Extract initial risk profile from website analysis
          const companyData = await extractCompanyData({
            website: validatedData.website,
            name: validatedData.name,
            industry: validatedData.industry,
          });
          
          if (companyData.riskProfile) {
            initialRiskProfile = companyData.riskProfile;
          }
        } catch (error) {
          this.logger.warn('Website analysis failed', { 
            website: validatedData.website, 
            error: error.message 
          });
        }
      }

      // Use transaction to create organization and update user's organizationId atomically
      const organization = await this.executeTransaction(async (tx) => {
        // Create organization
        const org = await tx.organization.create({
          data: {
            userId,
            name: validatedData.name,
            website: validatedData.website || null,
            industry: validatedData.industry || null,
            size: validatedData.size || null,
            country: validatedData.country,
            region: validatedData.region || null,
            description: validatedData.description || null,
            // Add missing fields
            annualRevenue: validatedData.annualRevenue || null,
            complianceTeamSize: validatedData.complianceTeamSize || null,
            geography: validatedData.geography || null,
            riskProfile: initialRiskProfile,
            onboardingCompleted: false,
          },
        });

        // No need to update user - the relation is established via Organization.userId

        return org;
      });

      await this.logAudit(
        {
          action: 'ORGANIZATION_CREATED',
          entity: 'Organization',
          entityId: organization.id,
          newValues: {
            name: organization.name,
            country: organization.country,
            size: organization.size,
          },
        },
        context
      );

      this.logger.info('Organization created successfully', {
        organizationId: organization.id,
        userId,
      });

      return this.createResponse(true, organization, 'Organization created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createOrganization');
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<OrganizationProfile>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              documents: true,
              assessments: true,
            },
          },
        },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      return this.createResponse(true, organization);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getOrganizationById');
    }
  }

  /**
   * Get organization by user ID
   */
  async getOrganizationByUserId(
    userId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<OrganizationProfile | null>> {
    try {
      // Check permissions
      this.requirePermission(context, [UserRole.USER, UserRole.ADMIN], userId);

      const organization = await this.prisma.organization.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          name: true,
          website: true,
          industry: true,
          size: true,
          country: true,
          region: true,
          description: true,
          annualRevenue: true,
          complianceTeamSize: true,
          geography: true,
          complianceGaps: true,
          onboardingCompleted: true,
          riskProfile: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              documents: true,
              assessments: true,
            },
          },
        },
      });

      return this.createResponse(true, organization);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getOrganizationByUserId');
    }
  }

  /**
   * Update organization profile
   */
  async updateOrganization(
    id: string,
    data: z.infer<typeof UpdateOrganizationSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseOrganization>> {
    try {
      const validatedData = await this.validateInput(UpdateOrganizationSchema, data);

      const existingOrg = await this.prisma.organization.findUnique({
        where: { id },
        select: { id: true, userId: true, website: true, name: true },
      });

      if (!existingOrg) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        existingOrg.userId
      );

      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'ORGANIZATION_UPDATED',
          entity: 'Organization',
          entityId: id,
          oldValues: existingOrg,
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Organization updated successfully', { organizationId: id });

      return this.createResponse(true, updatedOrganization, 'Organization updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateOrganization');
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(
    organizationId: string,
    data: z.infer<typeof OnboardingDataSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseOrganization>> {
    try {
      const validatedData = await this.validateInput(OnboardingDataSchema, data);

      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, userId: true, onboardingCompleted: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      if (organization.onboardingCompleted) {
        throw this.createError(
          'Onboarding already completed',
          400,
          'ONBOARDING_COMPLETED'
        );
      }

      // Generate initial compliance gaps based on onboarding data
      let complianceGaps = null;
      if (validatedData.complianceRequirements && validatedData.complianceRequirements.length > 0) {
        try {
          const gapAnalysis = await extractCompanyData({
            complianceRequirements: validatedData.complianceRequirements,
            currentChallenges: validatedData.currentChallenges || [],
            objectives: validatedData.objectives || [],
          });
          complianceGaps = gapAnalysis.gaps;
        } catch (error) {
          this.logger.warn('Compliance gap analysis failed', { error: error.message });
        }
      }

      const updatedOrganization = await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          onboardingCompleted: true,
          complianceGaps,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'ONBOARDING_COMPLETED',
          entity: 'Organization',
          entityId: organizationId,
          metadata: { onboardingData: validatedData },
        },
        context
      );

      this.logger.info('Onboarding completed successfully', { organizationId });

      return this.createResponse(
        true,
        updatedOrganization,
        'Onboarding completed successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'completeOnboarding');
    }
  }

  /**
   * Get company insights using AI analysis
   */
  async getCompanyInsights(
    organizationId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<CompanyInsights>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          documents: {
            select: { documentType: true, extractedData: true },
            take: 10, // Latest documents
            orderBy: { createdAt: 'desc' },
          },
          assessments: {
            select: { riskScore: true, aiAnalysis: true },
            take: 5, // Latest assessments
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      // Generate insights using AI
      try {
        const analysisData = {
          organization: {
            name: organization.name,
            industry: organization.industry,
            size: organization.size,
            country: organization.country,
            website: organization.website,
          },
          websiteData: null, // Legacy website data no longer used
          documents: organization.documents,
          assessments: organization.assessments,
        };

        const companyData = await extractCompanyData(analysisData);

        const insights: CompanyInsights = {
          industryAnalysis: {
            sector: companyData.sector || organization.industry || 'Unknown',
            subSector: companyData.subSector || '',
            riskFactors: companyData.industryRisks || [],
          },
          websiteAnalysis: {
            services: companyData.services || [],
            technologies: companyData.technologies || [],
            complianceIndicators: companyData.complianceIndicators || [],
          },
          riskAssessment: {
            profile: companyData.riskProfile || RiskProfile.MEDIUM,
            factors: companyData.riskFactors || [],
            score: companyData.riskScore || 50,
          },
          recommendations: companyData.recommendations || [],
        };

        // Update organization with new insights
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            riskProfile: insights.riskAssessment.profile,
            updatedAt: this.now(),
          },
        });

        return this.createResponse(true, insights, 'Company insights generated successfully');
      } catch (aiError) {
        this.logger.error('AI analysis failed', { error: aiError.message, organizationId });
        
        // Return basic insights if AI fails
        const basicInsights: CompanyInsights = {
          industryAnalysis: {
            sector: organization.industry || 'Unknown',
            subSector: '',
            riskFactors: [],
          },
          websiteAnalysis: {
            services: [],
            technologies: [],
            complianceIndicators: [],
          },
          riskAssessment: {
            profile: organization.riskProfile || RiskProfile.MEDIUM,
            factors: [],
            score: 50,
          },
          recommendations: ['Complete an assessment to get personalized recommendations'],
        };

        return this.createResponse(true, basicInsights, 'Basic insights available');
      }
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getCompanyInsights');
    }
  }

  /**
   * List organizations (admin only)
   */
  async listOrganizations(
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<OrganizationProfile>>> {
    try {
      // Only admins can list all organizations
      this.requirePermission(context, [UserRole.ADMIN]);

      const queryOptions = this.buildQueryOptions(options);

      const [organizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          ...queryOptions,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                documents: true,
                assessments: true,
              },
            },
          },
        }),
        this.prisma.organization.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        organizations,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listOrganizations');
    }
  }

  /**
   * Parse organization website for insights and gaps
   * Story 2.1 Phase 1: Uses real AI extraction with caching
   */
  async parseWebsite(
    organizationId: string,
    url?: string,  // Optional URL parameter - if not provided, uses organization.website
    context?: ServiceContext
  ): Promise<ApiResponse<{
    extractedData: any;
    confidence: Record<string, number>;
    metadata: any;
  }>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          userId: true,
          name: true,
          website: true,
          industry: true
        },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      // Use provided URL or fall back to organization's website
      const websiteUrl = url || organization.website;

      if (!websiteUrl) {
        throw this.createError(
          'No website URL provided or configured for this organization',
          400,
          'NO_WEBSITE_CONFIGURED'
        );
      }

      // Parse website using AI with caching (Phase 1 MVP)
      try {
        this.logger.info('Starting website extraction', {
          organizationId,
          website: websiteUrl
        });

        // Check cache first (24h TTL)
        let extractionResult = await getCachedExtraction(websiteUrl);

        if (!extractionResult) {
          this.logger.info('Cache miss - extracting from website', {
            website: websiteUrl
          });

          // Extract website data using GPT-4o-mini
          extractionResult = await extractFromWebsite(websiteUrl);

          // Cache the result for 24 hours
          if (extractionResult.success) {
            await cacheExtraction(websiteUrl, extractionResult);
          }
        } else {
          this.logger.info('Cache hit - using cached extraction', {
            website: websiteUrl
          });
        }

        if (!extractionResult.success) {
          throw new Error(extractionResult.errors?.join(', ') || 'Extraction failed');
        }

        // Keep the full FieldResult structure for frontend
        const extractedFields: Record<string, any> = {};
        const confidenceScores: Record<string, number> = {};

        for (const [field, result] of Object.entries(extractionResult.data)) {
          if (result && typeof result === 'object') {
            // Frontend expects the full FieldResult structure
            extractedFields[field] = result; // Keep entire { value, confidence, sources, needsReview }
            confidenceScores[field] = result.confidence;
          }
        }

        // Update organization with high-confidence extracted data
        // When user explicitly clicks "Analyze", update all high-confidence fields
        const updateData: any = {};

        // Update all fields with high confidence (>0.75), overwriting existing values
        // This is intentional - user clicked "Analyze" to get fresh data
        if (extractedFields.name && confidenceScores.name > 0.75) {
          updateData.name = extractedFields.name.value;
        }
        if (extractedFields.industry && confidenceScores.industry > 0.75) {
          updateData.industry = extractedFields.industry.value;
        }
        if (extractedFields.size && confidenceScores.size > 0.75) {
          updateData.size = extractedFields.size.value;
        }
        if (extractedFields.country && confidenceScores.country > 0.75) {
          updateData.country = extractedFields.country.value;
        }
        if (extractedFields.region && confidenceScores.region > 0.75) {
          updateData.region = extractedFields.region.value;
        }
        if (extractedFields.description && confidenceScores.description > 0.75) {
          updateData.description = extractedFields.description.value;
        }
        if (extractedFields.annualRevenue && confidenceScores.annualRevenue > 0.75) {
          updateData.annualRevenue = extractedFields.annualRevenue.value;
        }
        if (extractedFields.complianceTeamSize && confidenceScores.complianceTeamSize > 0.75) {
          updateData.complianceTeamSize = extractedFields.complianceTeamSize.value;
        }
        if (extractedFields.geography && confidenceScores.geography > 0.75) {
          updateData.geography = extractedFields.geography.value;
        }
        if (extractedFields.riskProfile && confidenceScores.riskProfile > 0.70) {
          updateData.riskProfile = extractedFields.riskProfile.value;
        }

        // Update organization if we have any high-confidence data
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = this.now();

          await this.prisma.organization.update({
            where: { id: organizationId },
            data: updateData,
          });

          this.logger.info('Organization updated with extracted data', {
            organizationId,
            updatedFields: Object.keys(updateData)
          });
        }

        await this.logAudit(
          {
            action: 'WEBSITE_PARSED',
            entity: 'Organization',
            entityId: organizationId,
            metadata: {
              website: websiteUrl,
              avgConfidence: extractionResult.metadata.avgConfidence,
              extractionTime: extractionResult.metadata.extractionTime
            },
          },
          context
        );

        this.logger.info('Website extraction completed', {
          organizationId,
          website: websiteUrl,
          avgConfidence: extractionResult.metadata.avgConfidence,
          extractionTime: extractionResult.metadata.extractionTime
        });

        return this.createResponse(
          true,
          {
            extractedData: extractedFields,
            confidence: confidenceScores,
            metadata: extractionResult.metadata
          },
          'Website extracted successfully'
        );
      } catch (aiError) {
        this.logger.error('Website extraction failed', {
          error: aiError.message,
          organizationId,
          website: websiteUrl,
        });

        throw this.createError(
          `Failed to extract website data: ${aiError.message}`,
          400,
          'WEBSITE_EXTRACTION_FAILED'
        );
      }
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'parseWebsite');
    }
  }

  /**
   * Delete organization (admin only)
   */
  async deleteOrganization(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Only admins can delete organizations
      this.requirePermission(context, [UserRole.ADMIN]);

      // Use transaction to ensure data consistency
      await this.executeTransaction(async (tx) => {
        // Delete related records first (if needed)
        // Note: Most relations should cascade delete according to the schema
        
        await tx.organization.delete({
          where: { id },
        });
      });

      await this.logAudit(
        {
          action: 'ORGANIZATION_DELETED',
          entity: 'Organization',
          entityId: id,
          oldValues: { name: organization.name, userId: organization.userId },
        },
        context
      );

      this.logger.info('Organization deleted successfully', { organizationId: id });

      return this.createResponse(true, undefined, 'Organization deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteOrganization');
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(
    organizationId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{
    totalDocuments: number;
    totalAssessments: number;
    completedAssessments: number;
    averageRiskScore: number;
    recentActivity: any[];
  }>> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions - only check userId ownership
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId
      );

      const [
        totalDocuments,
        totalAssessments,
        completedAssessments,
        avgRiskScore,
        recentActivity,
      ] = await Promise.all([
        this.prisma.document.count({
          where: { organizationId },
        }),
        this.prisma.assessment.count({
          where: { organizationId },
        }),
        this.prisma.assessment.count({
          where: {
            organizationId,
            status: 'COMPLETED',
          },
        }),
        this.prisma.assessment.aggregate({
          where: {
            organizationId,
            status: 'COMPLETED',
            riskScore: { not: null },
          },
          _avg: {
            riskScore: true,
          },
        }),
        this.prisma.auditLog.findMany({
          where: {
            OR: [
              { entity: 'Organization', entityId: organizationId },
              { entity: 'Assessment', metadata: { path: ['organizationId'], equals: organizationId } },
              { entity: 'Document', metadata: { path: ['organizationId'], equals: organizationId } },
            ],
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            action: true,
            entity: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      const stats = {
        totalDocuments,
        totalAssessments,
        completedAssessments,
        averageRiskScore: Math.round(avgRiskScore._avg.riskScore || 0),
        recentActivity,
      };

      return this.createResponse(true, stats);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getOrganizationStats');
    }
  }
}

export const organizationService = new OrganizationService();