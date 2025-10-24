/**
 * Assessment Service
 * Handles assessment creation, risk scoring, and analysis
 * Uses assessment-lib for risk calculations and scoring algorithms
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseAssessment,
  AssessmentStatus,
  AnswerStatus,
  UserRole,
  TransactionType,
  Severity,
  Priority,
  RiskCategory,
  Likelihood,
  Impact,
  RiskLevel,
  SubscriptionPlan,
} from '../types/database';
import {
  calculateRiskScore,
  analyzeGaps,
  generateRecommendations,
  createStrategyMatrix,
  ASSESSMENT_CONFIG,
} from '../lib/assessment';
import { 
  analyzeWebsite, 
  extractCompanyData, 
  analyzeDocument,
  extractDocumentData,
  createExecutiveSummary,
  analyzeComplianceMatrix,
} from '../lib/ai';
import { subscriptionService } from './subscription.service';
import { TemplateService } from './template.service';
import { FreemiumService } from './freemium.service';
import { FreemiumContentService } from './freemium-content.service';
import { DocumentParserService } from './document-parser.service';
import { DocumentPreprocessingService } from './document-preprocessing.service';
import { AIAnalysisService } from './ai-analysis.service';
import { answerService } from './answer.service';
import { RiskAnalysisAIService, KeyFinding, MitigationStrategy } from './risk-analysis-ai.service';

// Validation schemas
const CreateAssessmentSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID').optional(),
  templateId: z.string().min(1, 'Template ID is required'),
});

const UpdateAssessmentSchema = z.object({
  responses: z.record(z.any()).optional(),
  status: z.nativeEnum(AssessmentStatus).optional(),
});

const SubmitResponseSchema = z.object({
  questionId: z.string().cuid('Invalid question ID'),
  value: z.any(),
  metadata: z.record(z.any()).optional(),
});

const CompleteAssessmentSchema = z.object({
  responses: z.record(z.any()),
  autoGenerate: z.boolean().default(true),
});

export interface AssessmentWithDetails extends DatabaseAssessment {
  organization: {
    id: string;
    name: string;
    size: string | null;
    country: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  template: {
    id: string;
    name: string;
    category: string;
  };
  gaps: Array<{
    id: string;
    category: string;
    title: string;
    severity: Severity;
    priority: Priority;
  }>;
  risks: Array<{
    id: string;
    category: RiskCategory;
    title: string;
    riskLevel: RiskLevel;
  }>;
  priorities?: {
    id: string;
  } | null;
}

export interface RiskScoreBreakdown {
  overall: number;
  categories: {
    [key: string]: {
      score: number;
      weight: number;
      factors: string[];
    };
  };
  recommendations: string[];
}

export class AssessmentService extends BaseService {
  private templateService: TemplateService;
  private documentParser: DocumentParserService;
  private aiAnalysis: AIAnalysisService;
  private preprocessingService: DocumentPreprocessingService;

  constructor() {
    super();
    this.templateService = new TemplateService();
    this.documentParser = new DocumentParserService();
    this.aiAnalysis = new AIAnalysisService();
    this.preprocessingService = new DocumentPreprocessingService();
  }
  /**
   * Create a new assessment
   */
  async createAssessment(
    data: z.infer<typeof CreateAssessmentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAssessment>> {
    try {
      const validatedData = await this.validateInput(CreateAssessmentSchema, data);

      // Verify organization exists and user has access (only if organizationId is provided)
      let organization = null;
      if (validatedData.organizationId) {
        organization = await this.prisma.organization.findUnique({
          where: { id: validatedData.organizationId },
          select: { id: true, userId: true },
        });

        if (!organization) {
          throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
        }

        // Check permissions - user must own the organization or be an admin
        this.requirePermission(
          context,
          [UserRole.USER, UserRole.ADMIN],
          organization.userId,
          organization.id
        );
      }

      // Verify template exists and is active
      const template = await this.prisma.template.findUnique({
        where: { id: validatedData.templateId },
        select: { id: true, name: true, isActive: true },
      });

      if (!template || !template.isActive) {
        throw this.createError('Template not found or inactive', 404, 'TEMPLATE_NOT_FOUND');
      }

      // Query user subscription plan to check quota
      const user = await this.prisma.user.findUnique({
        where: { id: context?.userId! },
        include: {
          subscription: true,
          organization: true,
        },
      });

      const plan = user?.subscription?.plan || SubscriptionPlan.FREE;

      // Check Freemium quota for FREE tier users
      if (plan === SubscriptionPlan.FREE) {
        const quota = await this.prisma.userAssessmentQuota.findUnique({
          where: { userId: context?.userId! },
        });

        if (quota && quota.totalAssessmentsCreated >= 2) {
          throw this.createError(
            'Free users can create maximum 2 assessments. Upgrade to Premium for unlimited access.',
            402,
            'FREEMIUM_QUOTA_EXCEEDED'
          );
        }
      }

      // Create assessment with quota increment in atomic transaction
      const assessment = await this.prisma.$transaction(async (tx) => {
        // Create assessment
        const newAssessment = await tx.assessment.create({
          data: {
            organizationId: validatedData.organizationId,
            userId: context?.userId!,
            templateId: validatedData.templateId,
            status: AssessmentStatus.DRAFT,
            responses: {},
            creditsUsed: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        // Create default AssessmentPriorities (required for vendor matching)
        await tx.assessmentPriorities.create({
          data: {
            assessmentId: newAssessment.id,
            // Step 1: Organizational Context
            companySize: user?.organization?.size || 'SMB',
            annualRevenue: user?.organization?.annualRevenue || 'FROM_1M_10M',
            complianceTeamSize: user?.organization?.complianceTeamSize || 'ONE_TWO',
            jurisdictions: ['US', 'EU'],
            existingSystems: [],
            // Step 2: Goals & Timeline
            primaryGoal: 'Regulatory compliance',
            implementationUrgency: 'MEDIUM',
            // Step 3: Use Case Prioritization
            selectedUseCases: [],
            rankedPriorities: [],
            // Step 4: Solution Requirements
            budgetRange: 'RANGE_10K_50K',
            deploymentPreference: 'CLOUD',
            mustHaveFeatures: [],
            criticalIntegrations: [],
            // Step 5: Vendor Preferences
            vendorMaturity: 'ESTABLISHED',
            geographicRequirements: 'GLOBAL',
            supportModel: 'STANDARD',
            // Step 6: Decision Factors
            decisionFactorRanking: [],
          }
        });

        // Increment quota for FREE users only
        if (plan === SubscriptionPlan.FREE) {
          await tx.userAssessmentQuota.upsert({
            where: { userId: context?.userId! },
            create: {
              userId: context?.userId!,
              totalAssessmentsCreated: 1,
            },
            update: {
              totalAssessmentsCreated: { increment: 1 },
            },
          });
        }

        return newAssessment;
      });

      await this.logAudit(
        {
          action: 'ASSESSMENT_CREATED',
          entity: 'Assessment',
          entityId: assessment.id,
          newValues: {
            organizationId: assessment.organizationId,
            templateId: assessment.templateId,
            status: assessment.status,
          },
        },
        context
      );

      this.logger.info('Assessment created successfully', {
        assessmentId: assessment.id,
        organizationId: validatedData.organizationId,
      });

      return this.createResponse(true, assessment, 'Assessment created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createAssessment');
    }
  }

  /**
   * Get assessment by ID with full details
   */
  async getAssessmentById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<AssessmentWithDetails>> {
    try {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              size: true,
              country: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          gaps: {
            select: {
              id: true,
              category: true,
              title: true,
              description: true,
              severity: true,
              priority: true,
              priorityScore: true,
              estimatedCost: true,
              estimatedEffort: true,
              suggestedVendors: true,
            },
            orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
          },
          risks: {
            select: {
              id: true,
              category: true,
              title: true,
              description: true,
              likelihood: true,
              impact: true,
              riskLevel: true,
              mitigationStrategy: true,
            },
            orderBy: { riskLevel: 'desc' },
          },
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions - allow access if user created the assessment OR belongs to the organization
      if (context) {
        const isAdmin = context.userRole === 'ADMIN';
        const isOwner = context.userId === assessment.userId;
        const belongsToOrg = context.organizationId && context.organizationId === assessment.organizationId;

        if (!isAdmin && !isOwner && !belongsToOrg) {
          throw this.createError('Access denied', 403, 'FORBIDDEN');
        }
      }

      // Apply freemium filtering based on user subscription
      const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
      const filteredAssessment = FreemiumService.filterAssessmentResults(assessment, userSubscriptionStatus.subscriptionType);

      return this.createResponse(true, filteredAssessment);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAssessmentById');
    }
  }

  /**
   * Get assessment results without freemium filtering
   * Used for results page where users should see their full assessment data
   */
  async getAssessmentResultsUnfiltered(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<AssessmentWithDetails>> {
    try {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              size: true,
              country: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          gaps: {
            select: {
              id: true,
              category: true,
              title: true,
              description: true,
              severity: true,
              priority: true,
              priorityScore: true,
              estimatedCost: true,
              estimatedEffort: true,
              suggestedVendors: true,
            },
            orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
          },
          risks: {
            select: {
              id: true,
              category: true,
              title: true,
              description: true,
              likelihood: true,
              impact: true,
              riskLevel: true,
              mitigationStrategy: true,
            },
            orderBy: { riskLevel: 'desc' },
          },
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions - allow access if user created the assessment OR belongs to the organization
      if (context) {
        const isAdmin = context.userRole === 'ADMIN';
        const isOwner = context.userId === assessment.userId;
        const belongsToOrg = context.organizationId && context.organizationId === assessment.organizationId;

        if (!isAdmin && !isOwner && !belongsToOrg) {
          throw this.createError('Access denied', 403, 'FORBIDDEN');
        }
      }

      // Check subscription plan to determine if content should be mocked
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId: assessment.userId },
        select: { plan: true },
      });

      const plan = subscription?.plan || SubscriptionPlan.FREE;

      // Replace with mocked content for FREE tier
      if (plan === SubscriptionPlan.FREE) {
        const freemiumService = new FreemiumContentService();

        // Replace gaps with mocked gaps
        const mockedGaps = await freemiumService.generateMockedGapAnalysis(assessment.id);
        (assessment as any).gaps = mockedGaps;

        // Replace strategy matrix with mocked version
        if ((assessment as any).aiStrategyMatrix) {
          (assessment as any).aiStrategyMatrix = {
            ...(assessment as any).aiStrategyMatrix,
            isRestricted: true,
            matrix: '[UNLOCK PREMIUM TO SEE]',
            summary: 'Upgrade to Premium to see personalized strategy recommendations',
          };
        }

        // Mark assessment as restricted
        (assessment as any).isRestricted = true;
        (assessment as any).restrictionReason = 'Upgrade to Premium to see full analysis';

        // Hide vendor matches (set to empty array)
        (assessment as any).vendorMatches = [];

        // Note: riskScore is ALWAYS visible regardless of tier
      } else {
        // Premium/Enterprise users get full content
        (assessment as any).isRestricted = false;
      }

      // Return unfiltered results for results page
      return this.createResponse(true, assessment);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAssessmentResultsUnfiltered');
    }
  }

  /**
   * Update assessment responses
   */
  async updateAssessment(
    id: string,
    data: z.infer<typeof UpdateAssessmentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAssessment>> {
    try {
      const validatedData = await this.validateInput(UpdateAssessmentSchema, data);

      const existingAssessment = await this.prisma.assessment.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          status: true,
          responses: true,
        },
      });

      if (!existingAssessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        existingAssessment.userId,
        existingAssessment.organizationId
      );

      // Don't allow updating completed assessments
      if (existingAssessment.status === AssessmentStatus.COMPLETED) {
        throw this.createError(
          'Cannot update completed assessment',
          400,
          'ASSESSMENT_COMPLETED'
        );
      }

      const updatedAssessment = await this.prisma.assessment.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'ASSESSMENT_UPDATED',
          entity: 'Assessment',
          entityId: id,
          oldValues: { responses: existingAssessment.responses },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Assessment updated successfully', { assessmentId: id });

      return this.createResponse(true, updatedAssessment, 'Assessment updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateAssessment');
    }
  }

  /**
   * Submit a single response to an assessment
   */
  async submitResponse(
    assessmentId: string,
    data: z.infer<typeof SubmitResponseSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAssessment>> {
    try {
      const validatedData = await this.validateInput(SubmitResponseSchema, data);

      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          status: true,
          responses: true,
          templateId: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        assessment.userId,
        assessment.organizationId
      );

      // Don't allow updating completed assessments
      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw this.createError(
          'Cannot update completed assessment',
          400,
          'ASSESSMENT_COMPLETED'
        );
      }

      // Verify question exists in template
      const question = await this.prisma.templateQuestion.findUnique({
        where: { id: validatedData.questionId },
        include: { section: { select: { templateId: true } } },
      });

      if (!question || question.section.templateId !== assessment.templateId) {
        throw this.createError('Invalid question for this assessment', 400, 'INVALID_QUESTION');
      }

      // Update responses
      const currentResponses = assessment.responses as Record<string, any> || {};
      const updatedResponses = {
        ...currentResponses,
        [validatedData.questionId]: {
          value: validatedData.value,
          metadata: validatedData.metadata,
          timestamp: this.now().toISOString(),
        },
      };

      const updatedAssessment = await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          responses: updatedResponses,
          status: AssessmentStatus.IN_PROGRESS,
          updatedAt: this.now(),
        },
      });

      this.logger.info('Response submitted successfully', {
        assessmentId,
        questionId: validatedData.questionId,
      });

      return this.createResponse(true, updatedAssessment, 'Response submitted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'submitResponse');
    }
  }

  /**
   * Complete an assessment and generate risk analysis
   */
  async completeAssessment(
    id: string,
    data: z.infer<typeof CompleteAssessmentSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<AssessmentWithDetails>> {
    try {
      const validatedData = await this.validateInput(CompleteAssessmentSchema, data);

      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        include: {
          organization: true,
          user: { select: { id: true } },
          template: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        assessment.userId,
        assessment.organizationId
      );

      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw this.createError('Assessment already completed', 400, 'ASSESSMENT_COMPLETED');
      }

      // Check freemium limits and credits using FreemiumService
      const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
      const limitations = FreemiumService.getLimitations(userSubscriptionStatus.subscriptionType);
      const creditsRequired = limitations.creditsPerAssessment;
      
      const creditCheck = FreemiumService.checkCreditLimits(userSubscriptionStatus, creditsRequired);
      if (!creditCheck.canProceed) {
        throw this.createError(
          creditCheck.reason || 'Insufficient credits to complete assessment',
          402,
          'INSUFFICIENT_CREDITS'
        );
      }

      // Legacy credit check for backwards compatibility
      const hasCredits = await subscriptionService.checkCreditsAvailable(
        assessment.userId,
        creditsRequired,
        context
      );

      if (!hasCredits.data) {
        throw this.createError(
          'Insufficient credits to complete assessment',
          402,
          'INSUFFICIENT_CREDITS'
        );
      }

      // Execute assessment completion in transaction
      const result = await this.executeTransaction(async (tx) => {
        // Update assessment with final responses
        const updatedAssessment = await tx.assessment.update({
          where: { id },
          data: {
            responses: validatedData.responses,
            status: AssessmentStatus.COMPLETED,
            completedAt: this.now(),
            updatedAt: this.now(),
          },
        });

        let riskScore = 0;
        let aiAnalysis = null;
        let recommendations = null;
        let strategyMatrix = null;

        if (validatedData.autoGenerate) {
          try {
            // Enhanced AI-powered analysis
            const analysisResults = await this.performComprehensiveAnalysis({
              assessment,
              responses: validatedData.responses,
            });

            riskScore = analysisResults.riskScore;
            aiAnalysis = analysisResults.analysis;
            recommendations = analysisResults.recommendations;
            strategyMatrix = analysisResults.strategyMatrix;

            // Create gaps in database
            if (analysisResults.gaps && analysisResults.gaps.length > 0) {
              const gapData = analysisResults.gaps.map((gap: any) => {
                // Map AI-generated category to VendorCategory enum (Story 1.1)
                const mappedCategory = this.mapGapCategoryToVendorCategory(gap.category);
                const finalCategory = mappedCategory || 'RISK_ASSESSMENT'; // Default fallback

                this.logger.info('Gap category mapped for database creation', {
                  assessmentId: id,
                  originalCategory: gap.category,
                  mappedCategory: finalCategory,
                });

                return {
                  assessmentId: id,
                  category: finalCategory,
                  title: gap.title,
                  description: gap.description,
                  severity: gap.severity as Severity,
                  priority: gap.priority as Priority,
                  estimatedCost: gap.estimatedCost || null,
                  estimatedEffort: gap.estimatedEffort || null,
                  suggestedVendors: gap.suggestedVendors || [],
                };
              });

              await tx.gap.createMany({ data: gapData });
            }

            // Create risks in database
            if (analysisResults.risks && analysisResults.risks.length > 0) {
              this.logger.info('Processing risks for database creation', {
                assessmentId: id,
                totalRisks: analysisResults.risks.length,
                risks: analysisResults.risks.map((r: any) => ({
                  category: r.category,
                  title: r.title,
                  likelihood: r.likelihood,
                  impact: r.impact,
                  riskLevel: r.riskLevel,
                })),
              });

              // Filter and validate risks before creating
              const validRisks = analysisResults.risks.filter((risk: any) => {
                const hasRequiredFields = risk.category && risk.title && risk.description &&
                  risk.likelihood && risk.impact && risk.riskLevel;

                if (!hasRequiredFields) {
                  this.logger.warn('Skipping risk with missing required fields during creation', {
                    assessmentId: id,
                    risk: {
                      category: risk.category,
                      title: risk.title,
                      description: risk.description ? 'present' : 'MISSING',
                      likelihood: risk.likelihood || 'MISSING',
                      impact: risk.impact || 'MISSING',
                      riskLevel: risk.riskLevel || 'MISSING',
                    },
                  });
                }

                return hasRequiredFields;
              });

              this.logger.info('Validated risks for creation', {
                assessmentId: id,
                validRisksCount: validRisks.length,
                invalidRisksCount: analysisResults.risks.length - validRisks.length,
              });

              if (validRisks.length > 0) {
                const riskData = validRisks.map((risk: any) => ({
                  assessmentId: id,
                  category: risk.category as RiskCategory,
                  title: risk.title,
                  description: risk.description,
                  likelihood: risk.likelihood as Likelihood,
                  impact: risk.impact as Impact,
                  riskLevel: risk.riskLevel as RiskLevel,
                  mitigationStrategy: risk.mitigationStrategy || null,
                  residualRisk: risk.residualRisk || null,
                }));

                this.logger.info('Creating risks in database', {
                  assessmentId: id,
                  riskCount: riskData.length,
                  riskData,
                });

                await tx.risk.createMany({ data: riskData });
              } else {
                this.logger.warn('No valid risks to create for assessment', { assessmentId: id });
              }
            }
          } catch (analysisError) {
            this.logger.error('Assessment analysis failed', {
              error: analysisError.message,
              assessmentId: id,
            });
            // Continue with basic completion if analysis fails
            riskScore = 50; // Default moderate risk
            aiAnalysis = { error: 'Analysis failed', message: analysisError.message };
          }
        }

        // Update with analysis results
        await tx.assessment.update({
          where: { id },
          data: {
            riskScore,
            aiAnalysis,
            recommendations,
            strategyMatrix,
            creditsUsed: creditsRequired,
          },
        });

        return updatedAssessment;
      });

      // Deduct credits AFTER transaction completes successfully
      // This ensures assessment stays COMPLETED even if credit deduction fails
      try {
        await subscriptionService.deductCredits(
          assessment.userId,
          creditsRequired,
          {
            type: TransactionType.ASSESSMENT,
            description: `Assessment completion: ${assessment.template.name}`,
            assessmentId: id,
          },
          context
        );
      } catch (creditError) {
        this.logger.error('Credit deduction failed after assessment completion', {
          error: creditError.message,
          assessmentId: id,
          userId: assessment.userId,
        });
        // Assessment is already completed, just log the error
        // Admin can manually reconcile credits later if needed
      }

      await this.logAudit(
        {
          action: 'ASSESSMENT_COMPLETED',
          entity: 'Assessment',
          entityId: id,
          metadata: {
            riskScore: result.riskScore,
            creditsUsed: creditsRequired,
          },
        },
        context
      );

      this.logger.info('Assessment completed successfully', {
        assessmentId: id,
        riskScore: result.riskScore,
      });

      // Return full assessment details
      const completedAssessment = await this.getAssessmentById(id, context);
      return this.createResponse(
        true,
        completedAssessment.data!,
        'Assessment completed successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'completeAssessment');
    }
  }

  /**
   * Get risk score breakdown for an assessment
   */
  async getRiskScoreBreakdown(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<RiskScoreBreakdown>> {
    try {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          riskScore: true,
          aiAnalysis: true,
          status: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        assessment.userId,
        assessment.organizationId
      );

      // Allow if assessment is COMPLETED or has analysis results (riskScore)
      if (assessment.status !== AssessmentStatus.COMPLETED && !assessment.riskScore) {
        throw this.createError(
          'Assessment must be completed or have analysis results',
          400,
          'ASSESSMENT_NOT_COMPLETED'
        );
      }

      // Extract breakdown from AI analysis or create basic breakdown
      let breakdown: RiskScoreBreakdown = {
        overall: assessment.riskScore || 0,
        categories: {},
        recommendations: [],
      };

      if (assessment.aiAnalysis) {
        const analysis = assessment.aiAnalysis as any;
        breakdown = {
          overall: assessment.riskScore || 0,
          categories: analysis.categories || {},
          recommendations: analysis.recommendations || [],
        };
      }

      // Apply freemium filtering to risk breakdown
      const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
      const filteredBreakdown = FreemiumService.filterRiskBreakdown(breakdown, userSubscriptionStatus.subscriptionType);
      
      return this.createResponse(true, filteredBreakdown);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getRiskScoreBreakdown');
    }
  }

  /**
   * List assessments for an organization
   */
  async listAssessments(
    organizationId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<AssessmentWithDetails>>> {
    try {
      // Verify organization exists and user has access
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, userId: true },
      });

      if (!organization) {
        throw this.createError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        organization.userId,
        organization.id
      );

      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where.organizationId = organizationId;

      const [assessments, total] = await Promise.all([
        this.prisma.assessment.findMany({
          ...queryOptions,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                size: true,
                country: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            template: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            gaps: {
              select: {
                id: true,
                category: true,
                title: true,
                severity: true,
                priority: true,
              },
              // Note: Removed take limit - Prisma applies take globally across all parents,
              // not per-parent, which causes gaps/risks to not be properly associated
            },
            risks: {
              select: {
                id: true,
                category: true,
                title: true,
                riskLevel: true,
              },
              // Note: Removed take limit - Prisma applies take globally across all parents
            },
            priorities: {
              select: {
                id: true,
              },
            },
          },
        }),
        this.prisma.assessment.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        assessments,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listAssessments');
    }
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          status: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        assessment.userId,
        assessment.organizationId
      );

      // Only allow deletion of draft or in-progress assessments
      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw this.createError(
          'Cannot delete completed assessment',
          400,
          'ASSESSMENT_COMPLETED'
        );
      }

      // Delete assessment (cascading deletes will handle related records)
      await this.prisma.assessment.delete({
        where: { id },
      });

      await this.logAudit(
        {
          action: 'ASSESSMENT_DELETED',
          entity: 'Assessment',
          entityId: id,
          oldValues: { status: assessment.status },
        },
        context
      );

      this.logger.info('Assessment deleted successfully', { assessmentId: id });

      return this.createResponse(true, undefined, 'Assessment deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteAssessment');
    }
  }

  /**
   * Execute AI-powered assessment analysis
   * Orchestrates document parsing, AI analysis, and answer generation
   */
  async executeAssessment(
    assessmentId: string,
    documentIds: string[],
    context?: ServiceContext
  ): Promise<ApiResponse<{
    assessmentId: string;
    status: AssessmentStatus;
    progress: {
      totalQuestions: number;
      processedQuestions: number;
      successfulAnalyses: number;
      failedAnalyses: number;
    };
    creditsUsed: number;
  }>> {
    try {
      // Load assessment with all related data
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          organization: {
            include: {
              documents: true,
            },
          },
          template: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
                orderBy: { order: 'asc' },
              },
            },
          },
          answers: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        assessment.organization.userId,
        assessment.organizationId
      );

      // Update assessment status to IN_PROGRESS
      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { status: AssessmentStatus.IN_PROGRESS },
      });

      this.logger.info('Starting AI assessment execution', {
        assessmentId,
        organizationId: assessment.organizationId,
        templateId: assessment.templateId,
        selectedDocumentCount: documentIds.length,
      });

      // Filter to only use selected documents
      const selectedDocuments = assessment.organization.documents.filter(doc =>
        documentIds.includes(doc.id)
      );

      this.logger.info('Filtered documents for analysis', {
        totalDocuments: assessment.organization.documents.length,
        selectedDocuments: selectedDocuments.length,
        documentIds,
      });

      // Parse selected documents if not already parsed
      const parsedDocuments = [];
      for (const doc of selectedDocuments) {
        try {
          if (!doc.parsedContent) {
            const parseResult = await this.documentParser.parseDocument(
              doc.id,
              false,
              context
            );
            if (parseResult.success && parseResult.data.parsedContent) {
              doc.parsedContent = parseResult.data.parsedContent;
            }
          }
          parsedDocuments.push(doc);
        } catch (error) {
          this.logger.warn('Failed to parse document', {
            documentId: doc.id,
            error: error.message,
          });
        }
      }

      // Extract website content if available
      let websiteContent = null;
      if (assessment.organization.website) {
        try {
          const websiteAnalysis = await analyzeWebsite(assessment.organization.website);
          websiteContent = JSON.stringify(websiteAnalysis);
        } catch (error) {
          this.logger.warn('Failed to analyze website', {
            website: assessment.organization.website,
            error: error.message,
          });
        }
      }

      // Collect all questions from all sections
      const allQuestions = [];
      for (const section of assessment.template.sections) {
        allQuestions.push(...section.questions);
      }

      // Track progress
      const progress = {
        totalQuestions: allQuestions.length,
        processedQuestions: 0,
        successfulAnalyses: 0,
        failedAnalyses: 0,
      };

      // Documents are now preprocessed at UPLOAD time, not here!
      // Load preprocessing data from database if available
      const preprocessedDocs = new Map<string, any>();

      for (const doc of parsedDocuments) {
        if (doc.extractedData?.preprocessing) {
          preprocessedDocs.set(doc.id, {
            documentId: doc.id,
            filename: doc.filename,
            summary: doc.extractedData.preprocessing.summary || '',
            keyTopics: doc.extractedData.preprocessing.keyTopics || [],
            embedding: doc.extractedData.preprocessing.embedding || [],
            confidence: doc.extractedData.preprocessing.confidence || 0,
          });
        }
      }

      if (preprocessedDocs.size > 0) {
        this.logger.info('Using preprocessed document data from database', {
          assessmentId,
          preprocessedCount: preprocessedDocs.size,
          totalDocuments: parsedDocuments.length,
        });
      } else {
        this.logger.info('No preprocessed data available, using standard document processing', {
          assessmentId,
          documentCount: parsedDocuments.length,
        });
      }

      // Process each question with AI analysis
      let creditsUsed = 0;
      const batchSize = 5; // Process in batches

      for (let i = 0; i < allQuestions.length; i += batchSize) {
        const batch = allQuestions.slice(i, i + batchSize);
        
        // Parallel processing of batch
        const batchPromises = batch.map(async (question) => {
          try {
            // Check if answer already exists
            const existingAnswer = assessment.answers.find(
              a => a.questionId === question.id
            );

            if (existingAnswer && existingAnswer.status === AnswerStatus.COMPLETE) {
              progress.processedQuestions++;
              return; // Skip already completed answers
            }

            // Perform AI analysis with organization context
            // Use optimized preprocessing method if available, otherwise use legacy
            const analysisResult = preprocessedDocs
              ? await this.aiAnalysis.analyzeQuestionWithPreprocessedDocs(
                  question,
                  preprocessedDocs,
                  websiteContent,
                  assessment.organization,
                  context
                )
              : await this.aiAnalysis.analyzeQuestion(
                  question,
                  parsedDocuments,
                  websiteContent,
                  assessment.organization, // Pass organization data for context
                  context
                );

            if (analysisResult.success && analysisResult.data) {
              const analysis = analysisResult.data;
              
              // Create or update answer
              await answerService.createAnswer(
                assessmentId,
                question.id,
                analysis.score,
                analysis.explanation,
                analysis.sourceReference,
                analysis.status,
                context
              );

              progress.successfulAnalyses++;
              creditsUsed += 1; // Each successful analysis uses 1 credit
            } else {
              progress.failedAnalyses++;
            }

            progress.processedQuestions++;
          } catch (error) {
            this.logger.error('Failed to analyze question', {
              questionId: question.id,
              error: error.message,
            });
            progress.failedAnalyses++;
            progress.processedQuestions++;
          }
        });

        await Promise.all(batchPromises);

        // Log batch progress
        this.logger.info('Batch processing progress', {
          assessmentId,
          processed: progress.processedQuestions,
          total: progress.totalQuestions,
          percentage: Math.round((progress.processedQuestions / progress.totalQuestions) * 100),
        });
      }

      // Log optimization performance summary if preprocessing was used
      if (preprocessedDocs.size > 0) {
        const actualApiCalls = parsedDocuments.length + progress.successfulAnalyses;
        const legacyApiCalls = parsedDocuments.length * progress.totalQuestions;
        const apiCallReduction = Math.round(((legacyApiCalls - actualApiCalls) / legacyApiCalls) * 100);

        this.logger.info('AI optimization performance summary', {
          assessmentId,
          optimizationEnabled: true,
          documentsPreprocessed: preprocessedDocs.size,
          questionsAnalyzed: progress.successfulAnalyses,
          actualApiCalls,
          legacyApiCalls,
          apiCallReduction: `${apiCallReduction}%`,
          estimatedCostSavings: `${apiCallReduction}%`,
          note: 'Documents preprocessed once at upload time, reused for all assessments',
        });
      }

      // Calculate final assessment score
      const answers = await this.prisma.answer.findMany({
        where: { assessmentId },
      });

      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
      const maxScore = answers.length * 5;

      // Update assessment with final status and scores
      // Keep as IN_PROGRESS to allow manual review of low-confidence answers
      // Will be marked COMPLETED after manual review (or when user views results and has no low-confidence answers)
      const finalStatus = progress.failedAnalyses > progress.totalQuestions * 0.3
        ? AssessmentStatus.FAILED
        : AssessmentStatus.IN_PROGRESS;

      // Generate gaps and risks if assessment executed successfully (not FAILED)
      let riskScore = 0;
      if (finalStatus !== AssessmentStatus.FAILED) {
        try {
          // Analyze gaps based on low-scoring questions
          const gaps = await this.generateGapsFromAnswers(assessmentId, answers);
          
          // Analyze risks based on assessment results
          const risks = await this.generateRisksFromAnswers(assessmentId, answers);

          this.logger.info('Risks generated from answers', {
            assessmentId,
            riskCount: risks.length,
            risks: risks.map(r => ({
              category: r.category,
              title: r.title,
              likelihood: r.likelihood,
              impact: r.impact,
              riskLevel: r.riskLevel,
            })),
          });

          // Calculate real risk score using the assessment library
          riskScore = calculateRiskScore(gaps, risks);

          this.logger.info('Risk score calculated', {
            assessmentId,
            riskScore,
            gapCount: gaps.length,
            riskCount: risks.length
          });

          // Store gaps and risks
          for (const gap of gaps) {
            // Map gap category to VendorCategory enum (Story 1.1)
            const mappedCategory = this.mapGapCategoryToVendorCategory(gap.category);
            const finalCategory = mappedCategory || 'RISK_ASSESSMENT'; // Default fallback

            this.logger.info('Gap category mapped for database creation', {
              assessmentId,
              originalCategory: gap.category,
              mappedCategory: finalCategory,
            });

            // Ensure category field is set
            // Only include fields that exist in database schema
            const dbGap = {
              category: finalCategory,
              title: gap.title,
              description: gap.description,
              severity: gap.severity,
              priority: gap.priority,
              estimatedCost: gap.estimatedCost,
              estimatedEffort: gap.estimatedEffort,
              suggestedVendors: gap.suggestedVendors || [],
              assessmentId,
            };

            await this.prisma.gap.create({
              data: dbGap,
            });
          }

          for (const risk of risks) {
            this.logger.info('Processing individual risk for creation', {
              assessmentId,
              risk: {
                category: risk.category,
                title: risk.title,
                description: risk.description ? 'present' : 'MISSING',
                likelihood: risk.likelihood || 'MISSING',
                impact: risk.impact || 'MISSING',
                riskLevel: risk.riskLevel || 'MISSING',
              },
            });

            // Validate risk has all required fields before creating
            if (!risk.category || !risk.title || !risk.description ||
                !risk.likelihood || !risk.impact || !risk.riskLevel) {
              this.logger.warn('Skipping risk with missing required fields', {
                assessmentId,
                risk: {
                  category: risk.category,
                  title: risk.title,
                  description: risk.description ? 'present' : 'MISSING',
                  likelihood: risk.likelihood || 'MISSING',
                  impact: risk.impact || 'MISSING',
                  riskLevel: risk.riskLevel || 'MISSING',
                },
              });
              continue;
            }

            this.logger.info('Creating risk in database', {
              assessmentId,
              riskData: {
                ...risk,
                assessmentId,
              },
            });

            await this.prisma.risk.create({
              data: {
                ...risk,
                assessmentId,
              },
            });
          }
        } catch (error) {
          this.logger.error('Failed to generate gaps and risks', {
            assessmentId,
            error: error.message,
          });
          // Use simple score calculation if gap analysis fails
          riskScore = Math.round((totalScore / maxScore) * 100);
        }
      } else {
        // Use simple score for failed assessments
        riskScore = Math.round((totalScore / maxScore) * 100);
      }

      // Update assessment with calculated risk score
      // Note: completedAt is NOT set here - only set when user confirms completion after manual review
      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: finalStatus,
          riskScore,
          creditsUsed,
          completedAt: null, // Will be set after manual review completion
        },
      });

      // Update subscription credits
      // FREE users within their quota (2 assessments) don't get charged
      if (creditsUsed > 0) {
        // Check if user is FREE and within quota
        const userSubscription = await this.prisma.subscription.findUnique({
          where: { userId: assessment.organization.userId },
          include: {
            user: {
              include: {
                assessmentQuota: true,
              }
            }
          }
        });

        const isFreeWithinQuota =
          userSubscription?.plan === 'FREE' &&
          (userSubscription.user.assessmentQuota?.totalAssessmentsCreated || 0) <= 2;

        if (isFreeWithinQuota) {
          this.logger.info('Skipping credit deduction for FREE user within quota', {
            userId: assessment.organization.userId,
            totalAssessments: userSubscription.user.assessmentQuota?.totalAssessmentsCreated || 0,
            creditsUsed,
          });
        } else {
          // Only charge Premium users or FREE users beyond quota
          try {
            await subscriptionService.deductCredits(
              assessment.organization.userId,
              creditsUsed,
              {
                type: TransactionType.ASSESSMENT,
                description: `Assessment execution credits`,
                assessmentId,
              },
              context
            );
          } catch (error) {
            // Log warning but don't fail - allow assessment to complete
            this.logger.warn('Failed to deduct credits', {
              userId: assessment.organization.userId,
              error: error.message,
            });
          }
        }
      }

      await this.logAudit(
        {
          action: 'ASSESSMENT_EXECUTED',
          entity: 'Assessment',
          entityId: assessmentId,
          newValues: {
            status: finalStatus,
            riskScore,
            creditsUsed,
            questionsProcessed: progress.processedQuestions,
            successfulAnalyses: progress.successfulAnalyses,
          },
        },
        context
      );

      this.logger.info('Assessment execution completed', {
        assessmentId,
        status: finalStatus,
        riskScore,
        creditsUsed,
        progress,
      });

      return this.createResponse(
        true,
        {
          assessmentId,
          status: finalStatus,
          progress,
          creditsUsed,
        },
        finalStatus === AssessmentStatus.FAILED
          ? 'Assessment execution failed'
          : 'Assessment executed successfully - ready for review'
      );
    } catch (error) {
      this.logger.error('Failed to execute assessment', {
        assessmentId,
        error: error.message,
      });
      
      // Update assessment status to FAILED
      try {
        await this.prisma.assessment.update({
          where: { id: assessmentId },
          data: { status: AssessmentStatus.FAILED },
        });
      } catch (updateError) {
        this.logger.error('Failed to update assessment status', {
          assessmentId,
          error: updateError.message,
        });
      }

      if (error.statusCode) throw error;
      throw this.createError('Failed to execute assessment', 500, 'EXECUTION_ERROR');
    }
  }

  /**
   * Generate gaps from assessment answers
   * Enhanced with comprehensive prioritization logic (Story 1.05)
   */
  private async generateGapsFromAnswers(assessmentId: string, answers: any[]): Promise<any[]> {
    const { calculateGapPrioritization } = await import('./gap-prioritization.service.js');
    const gaps = [];

    // Identify low-scoring answers as gaps (threshold: finalScore < 3.0)
    const lowScoringAnswers = answers.filter(a => (a.finalScore || a.score || 0) < 3.0);

    for (const answer of lowScoringAnswers) {
      const question = await this.prisma.question.findUnique({
        where: { id: answer.questionId },
        include: { section: true },
      });

      if (question) {
        // Calculate all prioritization fields using new service
        const prioritization = calculateGapPrioritization({
          score: answer.finalScore || answer.score || 0,
          isFoundational: question.isFoundational || false,
          sectionWeight: question.section.weight || 0.1,
          sectionName: question.section.title,
          questionText: question.text,
        });

        // Calculate gap size based on answer score (0-5 scale -> 0-100 gap size)
        const answerScore = answer.finalScore || answer.score || 0;
        const gapSize = Math.round((5 - answerScore) * 20); // 0/5 = 100% gap, 5/5 = 0% gap
        
        gaps.push({
          category: question.categoryTag || question.section.title,
          title: `Gap in ${question.text.substring(0, 100)}`,
          description: answer.explanation || 'Insufficient evidence or controls identified',
          severity: prioritization.severity,
          priority: prioritization.priority,
          currentState: answer.explanation || 'Not adequately addressed',
          requiredState: 'Fully compliant and documented',
          gapSize,
          estimatedEffort: prioritization.effort,
          estimatedCost: prioritization.cost,
          suggestedActions: [
            'Review and update policies',
            'Implement proper controls',
            'Document procedures',
            'Provide staff training'
          ],
          businessImpact: answerScore === 0 
            ? 'Critical compliance risk requiring immediate attention' 
            : answerScore < 2 
            ? 'Significant compliance gap affecting business operations'
            : 'Moderate compliance gap requiring remediation',
          suggestedVendors: [], // Will be populated by vendor matching service
        });
      }
    }

    return gaps;
  }

  /**
   * Get and prioritize gaps for an assessment
   * Returns gaps sorted by priority (highest first)
   * Story 1.05: Gap Prioritization Enhancement
   *
   * @param assessmentId - The ID of the assessment
   * @param context - Service context for authorization
   * @returns Array of gaps sorted by priority descending
   */
  async prioritizeGaps(assessmentId: string, context?: ServiceContext): Promise<any[]> {
    try {
      // Fetch assessment to verify access
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          organization: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions if context provided
      if (context) {
        this.requirePermission(
          context,
          [UserRole.USER, UserRole.ADMIN],
          undefined,
          assessment.organizationId
        );
      }

      // Fetch all gaps for this assessment
      const gaps = await this.prisma.gap.findMany({
        where: { assessmentId },
        orderBy: [
          // Sort by priority enum (IMMEDIATE > SHORT_TERM > MEDIUM_TERM > LONG_TERM)
          { priority: 'asc' }, // Enum order: IMMEDIATE=1, SHORT_TERM=2, etc.
          // Secondary sort by severity
          { severity: 'asc' }, // CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4
        ],
      });

      this.logger.info('Gaps prioritized', {
        assessmentId,
        gapCount: gaps.length,
      });

      return gaps;
    } catch (error) {
      this.logger.error('Error prioritizing gaps', { assessmentId, error });
      throw error;
    }
  }

  /**
   * Generate risks from assessment answers
   * Enhanced with fallback category logic to ensure risks are always generated
   */
  private async generateRisksFromAnswers(assessmentId: string, answers: any[]): Promise<any[]> {
    const risks = [];

    this.logger.info('Starting generateRisksFromAnswers', {
      assessmentId,
      answerCount: answers.length,
    });

    // Group answers by category to identify systemic risks
    const categoryScores = new Map<string, number[]>();

    for (const answer of answers) {
      const question = await this.prisma.question.findUnique({
        where: { id: answer.questionId },
        include: { section: true }, // Include section for fallback category
      });

      if (question) {
        // Use categoryTag if available, otherwise fall back to section title
        const category = question.categoryTag || question.section?.title || 'General Compliance';

        if (!categoryScores.has(category)) {
          categoryScores.set(category, []);
        }
        categoryScores.get(category).push(answer.score);
      }
    }

    this.logger.info('Categorized answer scores', {
      assessmentId,
      categories: Array.from(categoryScores.entries()).map(([cat, scores]) => ({
        category: cat,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      })),
    });

    // Generate risks for categories with low average scores
    for (const [category, scores] of categoryScores.entries()) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      if (avgScore < 3) {
        const riskCategory = this.mapCategoryToRiskCategory(category);
        const likelihood = this.calculateRiskLikelihood({ score: avgScore }, {});
        const impact = this.calculateRiskImpact({ score: avgScore }, {});
        const riskLevel = this.calculateRiskLevel({ score: avgScore });

        this.logger.info('Creating risk for low-scoring category', {
          assessmentId,
          category,
          avgScore,
          riskCategory,
          likelihood,
          impact,
          riskLevel,
        });

        risks.push({
          category: riskCategory,
          title: `Risk in ${category}`,
          description: `Low compliance scores indicate potential risk in ${category} controls`,
          likelihood,
          impact,
          riskLevel,
          mitigationStrategy: this.generateMitigationStrategy({ question: category }),
          controlEffectiveness: Math.round(avgScore * 20), // Convert 0-5 score to 0-100%
        });
      }
    }

    // Ensure at least one risk is generated if assessment has low-scoring answers
    if (risks.length === 0 && answers.length > 0) {
      const overallAvgScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length;

      if (overallAvgScore < 3) {
        // More balanced approach: low scores indicate risk but not worst-case scenario
        // Control effectiveness now handles the mitigation assessment
        const likelihood = overallAvgScore < 1 ? Likelihood.LIKELY :
                          overallAvgScore < 2 ? Likelihood.LIKELY : Likelihood.POSSIBLE;
        const impact = overallAvgScore < 1 ? Impact.MAJOR :
                      overallAvgScore < 2 ? Impact.MAJOR : Impact.MODERATE;
        const riskLevel = overallAvgScore < 1 ? RiskLevel.HIGH :
                         overallAvgScore < 2 ? RiskLevel.HIGH : RiskLevel.MEDIUM;

        this.logger.info('No category-specific risks generated, creating general operational risk', {
          assessmentId,
          overallAvgScore,
          answerCount: answers.length,
          likelihood,
          impact,
          riskLevel,
        });

        risks.push({
          category: RiskCategory.OPERATIONAL,
          title: 'General Compliance Risk',
          description: `Assessment indicates compliance gaps requiring attention. Average score: ${overallAvgScore.toFixed(1)}/5`,
          likelihood,
          impact,
          riskLevel,
          mitigationStrategy: 'Review low-scoring areas and implement appropriate remediation measures',
          controlEffectiveness: Math.round(overallAvgScore * 20), // Convert 0-5 score to 0-100%
        });
      }
    }

    this.logger.info('Completed generateRisksFromAnswers', {
      assessmentId,
      risksGenerated: risks.length,
      risks: risks.map(r => ({
        category: r.category,
        title: r.title,
        likelihood: r.likelihood,
        impact: r.impact,
        riskLevel: r.riskLevel,
      })),
    });

    return risks;
  }

  /**
   * Map category tag to risk category
   */
  private mapCategoryToRiskCategory(categoryTag: string): RiskCategory {
    const mapping = {
      'transaction': RiskCategory.TRANSACTION,
      'geographic': RiskCategory.GEOGRAPHIC,
      'governance': RiskCategory.GOVERNANCE,
      'operational': RiskCategory.OPERATIONAL,
      'regulatory': RiskCategory.REGULATORY,
      'reputational': RiskCategory.REPUTATIONAL,
    };

    const lowerTag = categoryTag.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (lowerTag.includes(key)) {
        return value;
      }
    }

    return RiskCategory.OPERATIONAL;
  }

  /**
   * Perform comprehensive AI-powered analysis of assessment
   */
  private async performComprehensiveAnalysis({
    assessment,
    responses,
  }: {
    assessment: any;
    responses: Record<string, any>;
  }): Promise<{
    riskScore: number;
    analysis: any;
    recommendations: any;
    strategyMatrix: any;
    gaps: any[];
    risks: any[];
  }> {
    this.logger.info('Starting comprehensive assessment analysis', {
      assessmentId: assessment.id,
      templateId: assessment.templateId,
      organizationId: assessment.organizationId,
    });

    // Get full template structure with questions
    const templateResult = await this.templateService.getTemplateById(
      assessment.templateId,
      false
    );

    if (!templateResult.success || !templateResult.data) {
      throw this.createError('Template not found for analysis', 404, 'TEMPLATE_NOT_FOUND');
    }

    const template = templateResult.data;

    // Get organization documents for context
    const organizationDocuments = await this.prisma.document.findMany({
      where: { organizationId: assessment.organizationId },
      select: {
        id: true,
        filename: true,
        documentType: true,
        parsedContent: true,
        extractedData: true,
        s3Key: true,
      },
      take: 10, // Limit for analysis
    });

    // Analyze organization website if available
    let websiteAnalysis = null;
    if (assessment.organization.website) {
      try {
        websiteAnalysis = await analyzeWebsite(assessment.organization.website);
      } catch (error) {
        this.logger.warn('Website analysis failed', { 
          website: assessment.organization.website, 
          error: error.message 
        });
      }
    }

    // Extract company data using AI
    const companyData = await extractCompanyData({
      organization: assessment.organization,
      website: websiteAnalysis,
      documents: organizationDocuments,
    });

    // Process each question with AI analysis
    const questionAnalyses = await this.analyzeQuestionResponses({
      template,
      responses,
      companyData,
      documents: organizationDocuments,
    });

    // VALIDATION: Check for failed AI analyses
    const failedAnalyses = questionAnalyses.filter(a => a.flags?.includes('analysis_failed'));
    const failureRate = questionAnalyses.length > 0 ? failedAnalyses.length / questionAnalyses.length : 0;

    if (failureRate > 0.5) {
      this.logger.warn('High rate of failed AI analyses detected', {
        assessmentId: assessment.id,
        totalQuestions: questionAnalyses.length,
        failedCount: failedAnalyses.length,
        failureRate: (failureRate * 100).toFixed(1) + '%',
        recommendation: 'Assessment may be unreliable. Consider uploading more relevant documents or providing better evidence.'
      });
    }

    if (failureRate > 0.8) {
      this.logger.error('Critical: Majority of AI analyses failed', {
        assessmentId: assessment.id,
        failureRate: (failureRate * 100).toFixed(1) + '%',
        documentsProvided: organizationDocuments.length,
        message: 'Assessment results will be highly unreliable. Documents may be irrelevant to the assessment template.'
      });
    }

    // Calculate comprehensive risk score
    const riskScoreResult = await this.calculateComprehensiveRiskScore({
      questionAnalyses,
      template,
      organization: assessment.organization,
      companyData,
    });

    // Analyze gaps using AI
    const gapAnalysis = await this.performGapAnalysis({
      questionAnalyses,
      riskScore: riskScoreResult.overallScore,
      template,
      organization: assessment.organization,
      companyData,
    });

    // Generate AI-powered recommendations
    const recommendationResult = await this.generateAIRecommendations({
      gaps: gapAnalysis.gaps,
      risks: gapAnalysis.risks,
      questionAnalyses,
      organization: assessment.organization,
      template,
    });

    // Create strategy matrix
    const strategyMatrix = await this.createAdvancedStrategyMatrix({
      gaps: gapAnalysis.gaps,
      risks: gapAnalysis.risks,
      riskScore: riskScoreResult.overallScore,
    });

    // Generate executive summary
    const executiveSummary = await createExecutiveSummary({
      assessment: assessment,
      riskScore: riskScoreResult.overallScore,
      gaps: gapAnalysis.gaps,
      risks: gapAnalysis.risks,
      recommendations: recommendationResult.recommendations,
    });

    // Compile comprehensive analysis
    const analysis = {
      executiveSummary,
      overallScore: riskScoreResult.overallScore,
      scoreBreakdown: riskScoreResult.breakdown,
      questionAnalyses,
      complianceMatrix: await analyzeComplianceMatrix({
        questionAnalyses,
        template,
        gaps: gapAnalysis.gaps,
      }),
      confidence: this.calculateAnalysisConfidence(questionAnalyses),
      dataQuality: {
        ...this.assessDataQuality({
          responses,
          documents: organizationDocuments,
          website: websiteAnalysis,
        }),
        aiAnalysisMetrics: {
          totalQuestions: questionAnalyses.length,
          successfulAnalyses: questionAnalyses.length - failedAnalyses.length,
          failedAnalyses: failedAnalyses.length,
          failureRate: Math.round(failureRate * 100),
          reliabilityWarning: failureRate > 0.5 ? 'High failure rate detected - results may be unreliable' : null,
          criticalWarning: failureRate > 0.8 ? 'Critical: Majority of analyses failed - results are highly unreliable' : null,
        }
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.info('Assessment analysis completed successfully', {
      assessmentId: assessment.id,
      riskScore: riskScoreResult.overallScore,
      gapsCount: gapAnalysis.gaps.length,
      risksCount: gapAnalysis.risks.length,
    });

    return {
      riskScore: riskScoreResult.overallScore,
      analysis,
      recommendations: recommendationResult,
      strategyMatrix,
      gaps: gapAnalysis.gaps,
      risks: gapAnalysis.risks,
    };
  }

  /**
   * Analyze individual question responses with AI
   */
  private async analyzeQuestionResponses({
    template,
    responses,
    companyData,
    documents,
  }: {
    template: any;
    responses: Record<string, any>;
    companyData: any;
    documents: any[];
  }): Promise<any[]> {
    const analyses = [];

    for (const section of template.sections) {
      for (const question of section.questions) {
        const response = responses[question.id];
        
        if (!response) {
          analyses.push({
            questionId: question.id,
            sectionId: section.id,
            question: question.question,
            response: null,
            score: 0,
            confidence: 0,
            evidence: [],
            reasoning: 'No response provided',
            flags: ['incomplete'],
          });
          continue;
        }

        try {
          // Use AI to analyze this specific question
          let aiPrompt = question.aiPromptHint || 
            `Analyze the following response to the compliance question: "${question.question}". 
             Consider the company context and any available documentation.`;

          // Add context to the prompt
          if (companyData) {
            aiPrompt += `\n\nCompany Context: ${JSON.stringify(companyData, null, 2)}`;
          }

          if (documents.length > 0) {
            aiPrompt += `\n\nAvailable Documents: ${documents.map(d => d.filename).join(', ')}`;
          }

          aiPrompt += `\n\nResponse: ${JSON.stringify(response.value)}`;

          // Analyze with AI (using mock for now)
          const aiAnalysis = await analyzeDocument(aiPrompt, {
            question,
            response,
            context: { companyData, documents },
          });

          // Calculate score based on scoring rules
          const score = this.calculateQuestionScore({
            question,
            response,
            aiAnalysis,
          });

          // Find evidence in documents
          const evidence = this.findEvidence({
            question,
            response,
            documents,
            aiAnalysis,
          });

          analyses.push({
            questionId: question.id,
            sectionId: section.id,
            question: question.question,
            response: response.value,
            score,
            confidence: aiAnalysis.confidence || 0.8,
            evidence,
            reasoning: aiAnalysis.reasoning || 'AI analysis completed',
            flags: this.identifyFlags({ question, response, evidence }),
            aiAnalysis: aiAnalysis,
          });

        } catch (error) {
          this.logger.error('Question analysis failed', {
            questionId: question.id,
            error: error.message,
          });

          // FIX: Changed from score: 2 to score: 0
          // When AI analysis fails, we have no evidence of compliance, so score should be 0
          // This prevents inflated scores when documents are irrelevant or missing
          analyses.push({
            questionId: question.id,
            sectionId: section.id,
            question: question.question,
            response: response.value,
            score: 0, // No evidence = worst score (was 2, causing false "good" scores)
            confidence: 0.1, // Very low confidence since analysis failed
            evidence: [],
            reasoning: 'AI analysis failed - no evidence of compliance found. Score set to 0 due to lack of verifiable compliance evidence.',
            flags: ['analysis_failed', 'no_evidence'],
          });
        }
      }
    }

    return analyses;
  }

  /**
   * Calculate comprehensive risk score
   */
  private async calculateComprehensiveRiskScore({
    questionAnalyses,
    template,
    organization,
    companyData,
  }: {
    questionAnalyses: any[];
    template: any;
    organization: any;
    companyData: any;
  }): Promise<{ overallScore: number; breakdown: any }> {
    const sectionScores = {};
    const weights = ASSESSMENT_CONFIG.scoring.weights;

    // Calculate section scores
    for (const section of template.sections) {
      const sectionAnalyses = questionAnalyses.filter(
        analysis => analysis.sectionId === section.id
      );

      if (sectionAnalyses.length === 0) {
        sectionScores[section.id] = { score: 0, weight: 0 };
        continue;
      }

      const totalScore = sectionAnalyses.reduce((sum, analysis) => sum + analysis.score, 0);
      const maxScore = sectionAnalyses.length * 5; // Assuming 5-point scale
      const sectionScore = (totalScore / maxScore) * 100;

      sectionScores[section.id] = {
        score: sectionScore,
        weight: 1 / template.sections.length, // Equal weighting for now
        questionCount: sectionAnalyses.length,
        averageConfidence: sectionAnalyses.reduce(
          (sum, analysis) => sum + analysis.confidence, 0
        ) / sectionAnalyses.length,
      };
    }

    // Calculate weighted overall score
    let overallScore = 0;
    let totalWeight = 0;

    Object.values(sectionScores).forEach((sectionData: any) => {
      overallScore += sectionData.score * sectionData.weight;
      totalWeight += sectionData.weight;
    });

    overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;

    // Apply company context adjustments
    if (companyData) {
      if (companyData.riskProfile === 'HIGH') {
        overallScore = Math.max(0, overallScore - 10);
      } else if (companyData.riskProfile === 'LOW') {
        overallScore = Math.min(100, overallScore + 5);
      }
    }

    return {
      overallScore: Math.round(overallScore),
      breakdown: sectionScores,
    };
  }

  /**
   * Perform gap analysis using AI
   */
  private async performGapAnalysis({
    questionAnalyses,
    riskScore,
    template,
    organization,
    companyData,
  }: {
    questionAnalyses: any[];
    riskScore: number;
    template: any;
    organization: any;
    companyData: any;
  }): Promise<{ gaps: any[]; risks: any[] }> {
    // Identify gaps from low-scoring questions
    const lowScoreQuestions = questionAnalyses.filter(
      analysis => analysis.score <= 2 // Questions scoring 2 or below
    );

    const gaps = [];
    const risks = [];

    for (const analysis of lowScoreQuestions) {
      // Get human-readable category first, then map to VendorCategory enum (Story 1.1)
      const humanReadableCategory = this.mapQuestionToGapCategory(analysis);
      const mappedCategory = this.mapGapCategoryToVendorCategory(humanReadableCategory);
      const finalCategory = mappedCategory || 'RISK_ASSESSMENT'; // Default fallback

      this.logger.debug('Gap category mapping for analysis', {
        humanReadableCategory,
        mappedCategory: finalCategory,
      });

      const gap = {
        id: `gap-${analysis.questionId}`,
        category: finalCategory,
        title: `Gap identified in: ${analysis.question}`,
        description: `Low score (${analysis.score}/5) indicates potential compliance gap. ${analysis.reasoning}`,
        severity: this.calculateGapSeverity(analysis.score, analysis.confidence),
        priority: this.calculateGapPriority(analysis, riskScore),
        estimatedCost: this.estimateRemediationCost(analysis),
        estimatedEffort: this.estimateRemediationEffort(analysis),
        suggestedVendors: [], // To be filled by vendor matching
        evidence: analysis.evidence,
        confidence: analysis.confidence,
      };

      gaps.push(gap);

      // Generate corresponding risk
      if (analysis.score <= 1) { // Very low scores create risks
        const risk = {
          id: `risk-${analysis.questionId}`,
          category: this.mapQuestionToRiskCategory(analysis),
          title: `Risk from compliance gap: ${analysis.question}`,
          description: `Critical compliance gap may lead to regulatory or operational risks`,
          likelihood: this.calculateRiskLikelihood(analysis, companyData),
          impact: this.calculateRiskImpact(analysis, organization),
          riskLevel: this.calculateRiskLevel(analysis),
          mitigationStrategy: this.generateMitigationStrategy(analysis),
          controlEffectiveness: 0, // Score 0-1 means no evidence of controls
          residualRisk: null, // To be calculated after mitigation
        };

        risks.push(risk);
      }
    }

    // Add company-specific risks from AI analysis
    if (companyData && companyData.risks) {
      this.logger.info('Processing company-specific AI risks', {
        aiRiskCount: companyData.risks.length,
        aiRisks: companyData.risks,
      });

      companyData.risks.forEach((aiRisk: any) => {
        // Validate that required fields are present with valid enum values
        // Skip risks that don't have valid required fields
        if (!aiRisk.category || !aiRisk.title || !aiRisk.description ||
            !aiRisk.likelihood || !aiRisk.impact || !aiRisk.riskLevel) {
          this.logger.warn('Skipping AI-generated risk with missing required fields', {
            risk: {
              category: aiRisk.category || 'MISSING',
              title: aiRisk.title || 'MISSING',
              description: aiRisk.description ? 'present' : 'MISSING',
              likelihood: aiRisk.likelihood || 'MISSING',
              impact: aiRisk.impact || 'MISSING',
              riskLevel: aiRisk.riskLevel || 'MISSING',
            },
          });
          return;
        }

        risks.push({
          id: `company-risk-${risks.length + 1}`,
          category: aiRisk.category,
          title: aiRisk.title,
          description: aiRisk.description,
          likelihood: aiRisk.likelihood,
          impact: aiRisk.impact,
          riskLevel: aiRisk.riskLevel,
          mitigationStrategy: aiRisk.mitigationStrategy || 'Implement appropriate risk mitigation controls',
          controlEffectiveness: aiRisk.controlEffectiveness || 0, // 0-100: AI assessment of existing controls
          residualRisk: null,
        });
      });
    }

    this.logger.info('Gap analysis completed', {
      gapsCount: gaps.length,
      risksCount: risks.length,
      risks: risks.map(r => ({
        id: r.id,
        category: r.category,
        likelihood: r.likelihood,
        impact: r.impact,
        riskLevel: r.riskLevel,
      })),
    });

    return { gaps, risks };
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations({
    gaps,
    risks,
    questionAnalyses,
    organization,
    template,
  }: {
    gaps: any[];
    risks: any[];
    questionAnalyses: any[];
    organization: any;
    template: any;
  }): Promise<any> {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
      strategic: [],
    };

    // Process immediate priorities (Critical and High severity)
    const criticalGaps = gaps.filter(gap => 
      gap.severity === 'CRITICAL' || gap.severity === 'HIGH'
    );

    for (const gap of criticalGaps) {
      recommendations.immediate.push({
        title: `Address ${gap.title}`,
        description: `Immediate attention required: ${gap.description}`,
        priority: gap.priority,
        estimatedCost: gap.estimatedCost,
        estimatedEffort: gap.estimatedEffort,
        category: gap.category,
      });
    }

    // Generate strategic recommendations based on overall analysis
    const overallScore = questionAnalyses.reduce((sum, analysis) => 
      sum + analysis.score, 0
    ) / questionAnalyses.length;

    if (overallScore < 2.5) {
      recommendations.strategic.push({
        title: 'Comprehensive Compliance Program Overhaul',
        description: 'Current compliance maturity is low. Consider a complete program review and enhancement.',
        priority: 'IMMEDIATE',
        estimatedCost: 'VERY_HIGH',
        estimatedEffort: 'QUARTERS',
        category: 'Program Development',
      });
    }

    return recommendations;
  }

  /**
   * Create advanced strategy matrix
   */
  private async createAdvancedStrategyMatrix({
    gaps,
    risks,
    riskScore,
  }: {
    gaps: any[];
    risks: any[];
    riskScore: number;
  }): Promise<any> {
    // Create impact vs effort matrix
    const matrix = {
      highImpactLowEffort: [],
      highImpactHighEffort: [],
      lowImpactLowEffort: [],
      lowImpactHighEffort: [],
    };

    gaps.forEach(gap => {
      const isHighImpact = gap.severity === 'CRITICAL' || gap.severity === 'HIGH';
      const isLowEffort = gap.estimatedEffort === 'DAYS' || gap.estimatedEffort === 'WEEKS';

      if (isHighImpact && isLowEffort) {
        matrix.highImpactLowEffort.push(gap);
      } else if (isHighImpact && !isLowEffort) {
        matrix.highImpactHighEffort.push(gap);
      } else if (!isHighImpact && isLowEffort) {
        matrix.lowImpactLowEffort.push(gap);
      } else {
        matrix.lowImpactHighEffort.push(gap);
      }
    });

    return {
      matrix,
      recommendations: [
        'Focus first on High Impact, Low Effort items for quick wins',
        'Plan resources for High Impact, High Effort strategic initiatives',
        'Consider Low Impact, Low Effort items as time permits',
        'Avoid or defer Low Impact, High Effort items unless required',
      ],
      priorityOrder: [
        'highImpactLowEffort',
        'highImpactHighEffort',
        'lowImpactLowEffort',
        'lowImpactHighEffort',
      ],
    };
  }

  // Helper methods for analysis
  private calculateQuestionScore({ question, response, aiAnalysis }): number {
    // Use scoring rules from template if available
    if (question.scoringRules && question.scoringRules.scale) {
      return this.applyCustomScoringRules(question.scoringRules, response, aiAnalysis);
    }

    // Default scoring logic
    if (aiAnalysis && aiAnalysis.score !== undefined) {
      return Math.max(0, Math.min(5, aiAnalysis.score));
    }

    // Fallback scoring based on response completeness
    if (!response.value || response.value === '') return 0;
    
    // Simple heuristic scoring
    if (typeof response.value === 'string') {
      if (response.value.length < 10) return 1;
      if (response.value.length < 50) return 2;
      if (response.value.length < 100) return 3;
      return 4;
    }

    return 3; // Default moderate score
  }

  private applyCustomScoringRules(rules: any, response: any, aiAnalysis: any): number {
    // Implement custom scoring based on template rules
    // This would be more sophisticated in a real implementation
    return 3;
  }

  private findEvidence({ question, response, documents, aiAnalysis }): any[] {
    const evidence = [];
    
    // Search documents for relevant content
    documents.forEach(doc => {
      if (doc.parsedContent && typeof doc.parsedContent === 'string') {
        // Simple keyword matching - would be more sophisticated in real implementation
        const keywords = this.extractKeywords(question.question);
        keywords.forEach(keyword => {
          if (doc.parsedContent.toLowerCase().includes(keyword.toLowerCase())) {
            evidence.push({
              type: 'document',
              source: doc.filename,
              snippet: this.extractSnippet(doc.parsedContent, keyword),
              confidence: 0.7,
            });
          }
        });
      }
    });

    return evidence;
  }

  private identifyFlags({ question, response, evidence }): string[] {
    const flags = [];
    
    if (!response.value) flags.push('incomplete');
    if (evidence.length === 0) flags.push('no_evidence');
    if (typeof response.value === 'string' && response.value.length < 10) {
      flags.push('insufficient_detail');
    }

    return flags;
  }

  private calculateAnalysisConfidence(questionAnalyses: any[]): number {
    const totalConfidence = questionAnalyses.reduce(
      (sum, analysis) => sum + (analysis.confidence || 0.5), 0
    );
    return totalConfidence / questionAnalyses.length;
  }

  private assessDataQuality({ responses, documents, website }): any {
    return {
      responseCompleteness: Object.keys(responses).length > 0 ? 0.8 : 0.2,
      documentAvailability: documents.length > 0 ? 0.8 : 0.3,
      websiteAnalysis: website ? 0.7 : 0.4,
      overallQuality: 0.65, // Calculated based on above
    };
  }

  // Additional helper methods
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - would use NLP in real implementation
    return text.toLowerCase().split(' ').filter(word => word.length > 3);
  }

  private extractSnippet(text: string, keyword: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + 100);
    return text.substring(start, end);
  }

  /**
   * Map AI-generated descriptive gap category to VendorCategory enum value
   * Story 1.1: Fix Gap Category to Vendor Category Mapping
   *
   * @param gapCategory - AI-generated descriptive category text
   * @returns VendorCategory enum value as string, or null if no match found
   */
  private mapGapCategoryToVendorCategory(gapCategory: string): string | null {
    if (!gapCategory || typeof gapCategory !== 'string' || gapCategory.trim() === '') {
      this.logger.warn('Empty or invalid gap category provided to mapper', { gapCategory });
      return null;
    }

    const normalizedCategory = gapCategory.toLowerCase().trim();

    // Exact match mapping (case-insensitive)
    const exactMappings: Record<string, string> = {
      'geographic risk assessment': 'RISK_ASSESSMENT',
      'product & service risk': 'RISK_ASSESSMENT',
      'transaction risk & monitoring': 'TRANSACTION_MONITORING',
      'transaction monitoring': 'TRANSACTION_MONITORING',
      'governance & controls': 'DATA_GOVERNANCE',
      'data governance': 'DATA_GOVERNANCE',
      'regulatory alignment': 'REGULATORY_REPORTING',
      'regulatory reporting': 'REGULATORY_REPORTING',
      'kyc': 'KYC_AML',
      'aml': 'KYC_AML',
      'kyc/aml': 'KYC_AML',
      'sanctions': 'SANCTIONS_SCREENING',
      'sanctions screening': 'SANCTIONS_SCREENING',
      'trade surveillance': 'TRADE_SURVEILLANCE',
      'compliance training': 'COMPLIANCE_TRAINING',
      'training & awareness': 'COMPLIANCE_TRAINING',
    };

    // Check for exact match first
    if (exactMappings[normalizedCategory]) {
      this.logger.debug('Gap category mapped (exact match)', {
        original: gapCategory,
        mapped: exactMappings[normalizedCategory],
      });
      return exactMappings[normalizedCategory];
    }

    // Fuzzy match by checking if category contains key words
    const fuzzyMappings: Array<{ keywords: string[]; vendorCategory: string }> = [
      { keywords: ['kyc', 'aml', 'know your customer'], vendorCategory: 'KYC_AML' },
      { keywords: ['transaction', 'monitoring', 'payment'], vendorCategory: 'TRANSACTION_MONITORING' },
      { keywords: ['sanction', 'screening', 'embargo'], vendorCategory: 'SANCTIONS_SCREENING' },
      { keywords: ['trade', 'surveillance', 'market'], vendorCategory: 'TRADE_SURVEILLANCE' },
      { keywords: ['risk', 'assessment', 'evaluation'], vendorCategory: 'RISK_ASSESSMENT' },
      { keywords: ['training', 'awareness', 'education'], vendorCategory: 'COMPLIANCE_TRAINING' },
      { keywords: ['regulatory', 'reporting', 'regulator'], vendorCategory: 'REGULATORY_REPORTING' },
      { keywords: ['governance', 'data', 'control'], vendorCategory: 'DATA_GOVERNANCE' },
    ];

    for (const mapping of fuzzyMappings) {
      if (mapping.keywords.some(keyword => normalizedCategory.includes(keyword))) {
        this.logger.debug('Gap category mapped (fuzzy match)', {
          original: gapCategory,
          matched_keyword: mapping.keywords.find(k => normalizedCategory.includes(k)),
          mapped: mapping.vendorCategory,
        });
        return mapping.vendorCategory;
      }
    }

    // No match found
    this.logger.warn('Gap category could not be mapped to VendorCategory', {
      original: gapCategory,
      normalized: normalizedCategory,
    });
    return null;
  }

  private mapQuestionToGapCategory(analysis: any): string {
    // Map based on question tags or content
    const question = analysis.question.toLowerCase();

    if (question.includes('risk') || question.includes('assessment')) return 'Risk Management';
    if (question.includes('policy') || question.includes('procedure')) return 'Policy & Procedures';
    if (question.includes('training') || question.includes('awareness')) return 'Training & Awareness';
    if (question.includes('monitoring') || question.includes('transaction')) return 'Transaction Monitoring';
    if (question.includes('reporting') || question.includes('regulatory')) return 'Regulatory Reporting';

    return 'General Compliance';
  }

  private mapQuestionToRiskCategory(analysis: any): RiskCategory {
    const question = analysis.question.toLowerCase();
    
    if (question.includes('geographic') || question.includes('country')) return RiskCategory.GEOGRAPHIC;
    if (question.includes('transaction') || question.includes('payment')) return RiskCategory.TRANSACTION;
    if (question.includes('governance') || question.includes('oversight')) return RiskCategory.GOVERNANCE;
    if (question.includes('operational') || question.includes('process')) return RiskCategory.OPERATIONAL;
    if (question.includes('regulatory') || question.includes('compliance')) return RiskCategory.REGULATORY;
    if (question.includes('reputation') || question.includes('brand')) return RiskCategory.REPUTATIONAL;
    
    return RiskCategory.OPERATIONAL;
  }

  private calculateGapSeverity(score: number, confidence: number): Severity {
    if (score === 0 && confidence > 0.7) return Severity.CRITICAL;
    if (score <= 1) return Severity.HIGH;
    if (score <= 2) return Severity.MEDIUM;
    return Severity.LOW;
  }

  private calculateGapPriority(analysis: any, riskScore: number): Priority {
    if (analysis.score === 0) return Priority.IMMEDIATE;
    if (analysis.score === 1 && riskScore > 70) return Priority.SHORT_TERM;
    if (analysis.score <= 2) return Priority.MEDIUM_TERM;
    return Priority.LONG_TERM;
  }

  private estimateRemediationCost(analysis: any): any {
    // Simple heuristic - would be more sophisticated in real implementation
    if (analysis.score === 0) return 'HIGH';
    if (analysis.score === 1) return 'MEDIUM';
    if (analysis.score === 2) return 'LOW';
    return 'LOW';
  }

  private estimateRemediationEffort(analysis: any): any {
    if (analysis.score === 0) return 'QUARTERS';
    if (analysis.score === 1) return 'MONTHS';
    if (analysis.score === 2) return 'WEEKS';
    return 'DAYS';
  }

  private calculateRiskLikelihood(analysis: any, companyData: any): Likelihood {
    // More balanced approach: lack of evidence doesn't mean CERTAIN risk
    // It means we should be cautious, but not assume worst case
    if (analysis.score === 0) return Likelihood.LIKELY;      // Changed from CERTAIN
    if (analysis.score === 1) return Likelihood.LIKELY;
    if (analysis.score === 2) return Likelihood.POSSIBLE;
    return Likelihood.UNLIKELY;
  }

  private calculateRiskImpact(analysis: any, organization: any): Impact {
    // More balanced approach: lack of evidence indicates risk but not necessarily catastrophic
    // The control effectiveness field now handles mitigation assessment
    if (analysis.score === 0) return Impact.MAJOR;        // Changed from CATASTROPHIC
    if (analysis.score === 1) return Impact.MAJOR;
    if (analysis.score === 2) return Impact.MODERATE;
    return Impact.MINOR;
  }

  private calculateRiskLevel(analysis: any): RiskLevel {
    // More balanced: missing evidence = HIGH risk, not automatically CRITICAL
    // CRITICAL should be reserved for the most severe cases
    if (analysis.score === 0) return RiskLevel.HIGH;       // Changed from CRITICAL
    if (analysis.score === 1) return RiskLevel.HIGH;
    if (analysis.score === 2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private generateMitigationStrategy(analysis: any): string {
    return `Address the compliance gap identified in: ${analysis.question}. Implement appropriate controls and monitoring mechanisms.`;
  }

  /**
   * Generate and store AI analysis for an assessment (one-time generation)
   * Returns existing content if already generated (idempotent)
   */
  async generateAndStoreAIAnalysis(
    assessmentId: string,
    context?: ServiceContext,
    options?: { forceRegenerate?: boolean }
  ): Promise<ApiResponse<any>> {
    const startTime = Date.now();
    this.logger.info('Starting AI analysis generation', { assessmentId, forceRegenerate: options?.forceRegenerate });

    try {
      // 1. Fetch assessment with all related data
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          gaps: true,
          risks: true,
          organization: true
        }
      });

      if (!assessment) {
        return this.createErrorResponse('Assessment not found');
      }

      // 2. Check if AI content already exists (skip if force regenerate)
      if (!options?.forceRegenerate) {
        if (assessment.aiRiskAnalysis && assessment.aiStrategyMatrix) {
          this.logger.info('AI analysis already exists, returning cached', {
            assessmentId,
            generatedAt: assessment.aiGeneratedAt
          });

          return this.createSuccessResponse({
            riskAnalysis: assessment.aiRiskAnalysis,
            strategyMatrix: assessment.aiStrategyMatrix,
            generatedAt: assessment.aiGeneratedAt
          });
        }
      } else {
        this.logger.info('Force regenerating AI analysis', { assessmentId });
      }

      // 3. Check if there are gaps to analyze
      if (!assessment.gaps || assessment.gaps.length === 0) {
        this.logger.warn('No gaps found for assessment', { assessmentId });
        return this.createErrorResponse('No gaps to analyze');
      }

      // 4. Group gaps by category
      const gapsByCategory = assessment.gaps.reduce((acc: Record<string, any[]>, gap) => {
        if (!acc[gap.category]) {
          acc[gap.category] = [];
        }
        acc[gap.category].push(gap);
        return acc;
      }, {});

      this.logger.info('Grouped gaps by category', {
        assessmentId,
        categories: Object.keys(gapsByCategory),
        totalGaps: assessment.gaps.length
      });

      // 5. Initialize AI service
      const riskAnalysisAI = new RiskAnalysisAIService();

      // 6. Generate AI analysis for each category (with partial failure handling)
      const riskAnalysis: Record<string, any> = {};
      const strategyMatrixRows: any[] = [];
      const failedCategories: string[] = [];

      for (const [category, categoryGaps] of Object.entries(gapsByCategory)) {
        try {
          this.logger.info('Generating AI analysis for category', {
            assessmentId,
            category,
            gapCount: categoryGaps.length
          });

          const categoryRisks = assessment.risks?.filter(r => r.category === category) || [];

          // Generate findings and strategies in parallel
          const [keyFindings, mitigationStrategies] = await Promise.all([
            riskAnalysisAI.generateKeyFindings(category, categoryGaps, context),
            riskAnalysisAI.generateMitigationStrategies(
              category,
              categoryGaps,
              categoryRisks,
              {
                size: assessment.organization?.size,
                industry: assessment.organization?.industry,
                geography: assessment.organization?.geography,
                riskProfile: assessment.organization?.riskProfile,
                annualRevenue: assessment.organization?.annualRevenue,
                complianceTeamSize: assessment.organization?.complianceTeamSize
              },
              context
            )
          ]);

          // Calculate risk score for this category
          const score = this.calculateCategoryRiskScore(categoryGaps);
          const criticalGaps = categoryGaps.filter(g => g.severity === 'CRITICAL').length;

          // Store category analysis
          riskAnalysis[category] = {
            score,
            totalGaps: categoryGaps.length,
            criticalGaps,
            keyFindings,
            mitigationStrategies
          };

          // Build strategy matrix row using AI-generated values
          const immediateStrategy = mitigationStrategies.find(s => s.priority === 'immediate');
          if (immediateStrategy) {
            strategyMatrixRows.push({
              priority: strategyMatrixRows.length + 1,
              riskArea: category.replace(/_/g, '/'),
              adjustedRisk: score >= 7.5 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW',
              urgency: immediateStrategy.priority.toUpperCase(),
              impact: score.toFixed(1),
              primaryMitigation: immediateStrategy.strategy,
              timeline: immediateStrategy.estimatedTimeframe || '3-6 months',
              budget: immediateStrategy.estimatedBudget || 'TBD',
              businessOwner: immediateStrategy.businessOwner || 'Compliance Team',
              gapCount: categoryGaps.length,
              criticalGaps,
              // Include additional AI-generated metrics for frontend
              riskReductionPercent: immediateStrategy.riskReductionPercent || 15,
              remediationDays: immediateStrategy.remediationDays || 90
            });
          }

          this.logger.info('Successfully generated AI analysis for category', {
            assessmentId,
            category,
            findingsCount: keyFindings.length,
            strategiesCount: mitigationStrategies.length
          });

        } catch (error) {
          this.logger.error('Failed to generate AI analysis for category', {
            error,
            assessmentId,
            category
          });
          failedCategories.push(category);
          // Continue with other categories
        }
      }

      // 7. Check if we have any successful results
      if (Object.keys(riskAnalysis).length === 0) {
        return this.createErrorResponse('Failed to generate AI analysis for all categories');
      }

      // 8. Calculate aggregate metrics from AI-generated data
      const totalRiskReduction = strategyMatrixRows.reduce((sum, row) =>
        sum + (row.riskReductionPercent || 0), 0
      );
      const totalRemediationDays = strategyMatrixRows.reduce((sum, row) =>
        sum + (row.remediationDays || 0), 0
      );
      const avgRemediationDays = strategyMatrixRows.length > 0
        ? Math.round(totalRemediationDays / strategyMatrixRows.length)
        : 0;

      // 9. Store in database
      const updatedAssessment = await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          aiRiskAnalysis: riskAnalysis as any,
          aiStrategyMatrix: strategyMatrixRows as any,
          aiGeneratedAt: new Date()
        }
      });

      const duration = Date.now() - startTime;
      this.logger.info('AI analysis generation completed', {
        assessmentId,
        categoriesProcessed: Object.keys(riskAnalysis).length,
        categoriesFailed: failedCategories.length,
        strategyMatrixRows: strategyMatrixRows.length,
        duration
      });

      return this.createSuccessResponse({
        riskAnalysis,
        strategyMatrix: strategyMatrixRows,
        generatedAt: updatedAssessment.aiGeneratedAt,
        partialFailure: failedCategories.length > 0,
        failedCategories: failedCategories.length > 0 ? failedCategories : undefined,
        // Include aggregated AI-generated metrics
        metrics: {
          totalRiskReduction,
          avgRemediationDays,
          totalRemediationDays
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to generate AI analysis', {
        error,
        assessmentId,
        duration
      });
      return this.createErrorResponse('Failed to generate AI analysis');
    }
  }

  /**
   * Calculate risk score for a category based on gap severity
   */
  private calculateCategoryRiskScore(gaps: any[]): number {
    const severityWeights: Record<string, number> = {
      CRITICAL: 10,
      HIGH: 7.5,
      MEDIUM: 5,
      LOW: 2.5
    };

    const totalWeight = gaps.reduce((sum, gap) => {
      return sum + (severityWeights[gap.severity] || 0);
    }, 0);

    const maxWeight = gaps.length * 10;
    return Math.min(10, (totalWeight / maxWeight) * 10);
  }

  // REMOVED: Hardcoded helper methods replaced with AI-generated values
  // - getBusinessOwner(): Now generated by AI based on compliance area
  // - estimateTimeline(): Now generated by AI considering priority and complexity
  // - estimateBudget(): Now generated by AI considering gap count, severity, and org size
}

export const assessmentService = new AssessmentService();