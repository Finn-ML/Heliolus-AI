/**
 * Report Service
 * Handles report generation, PDF creation, and report management
 * Uses AI-lib for intelligent report generation and analysis
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseReport,
  ReportType,
  ReportFormat,
  UserRole,
} from '../types/database';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateReport, createExecutiveSummary, analyzeComplianceMatrix } from '../lib/ai';

// AWS S3 Configuration for reports
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_REPORTS_BUCKET = process.env.AWS_S3_REPORTS_BUCKET || 'heliolus-reports';

// Validation schemas
const CreateReportSchema = z.object({
  assessmentId: z.string().cuid('Invalid assessment ID'),
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat).default(ReportFormat.PDF),
  includeExecutiveSummary: z.boolean().default(true),
  includeComplianceMatrix: z.boolean().default(true),
  includeVendorRecommendations: z.boolean().default(true),
  includeRiskAnalysis: z.boolean().default(true),
  customSections: z.array(z.string()).optional(),
});

const UpdateReportSchema = z.object({
  isPublic: z.boolean().optional(),
  summary: z.string().max(1000).optional(),
});

const ShareReportSchema = z.object({
  expiresIn: z.number().min(1).max(30).default(7), // Days
  allowDownload: z.boolean().default(true),
  requirePassword: z.boolean().default(false),
  password: z.string().optional(),
});

export interface ReportWithDetails extends DatabaseReport {
  assessment: {
    id: string;
    status: string;
    riskScore: number | null;
    completedAt: Date | null;
    organization: {
      id: string;
      name: string;
      country: string;
    };
    template: {
      id: string;
      name: string;
      category: string;
    };
  };
}

export interface ReportGenerationOptions {
  includeExecutiveSummary: boolean;
  includeComplianceMatrix: boolean;
  includeVendorRecommendations: boolean;
  includeRiskAnalysis: boolean;
  customSections?: string[];
}

export interface ReportContent {
  executiveSummary?: {
    overview: string;
    keyFindings: string[];
    riskLevel: string;
    recommendations: string[];
  };
  complianceMatrix?: {
    requirements: Array<{
      category: string;
      requirement: string;
      status: 'compliant' | 'partial' | 'non-compliant';
      evidence: string[];
      gaps: string[];
    }>;
    overallScore: number;
  };
  riskAnalysis?: {
    riskScore: number;
    riskFactors: Array<{
      category: string;
      description: string;
      likelihood: string;
      impact: string;
      mitigation: string;
    }>;
    priorityActions: string[];
  };
  vendorRecommendations?: Array<{
    category: string;
    vendors: Array<{
      name: string;
      description: string;
      matchScore: number;
      pricing: string;
      benefits: string[];
    }>;
  }>;
  gapAnalysis?: {
    criticalGaps: Array<{
      title: string;
      description: string;
      severity: string;
      priority: string;
      estimatedCost: string;
      timeline: string;
    }>;
    improvementRoadmap: Array<{
      phase: string;
      duration: string;
      actions: string[];
      expectedOutcome: string;
    }>;
  };
}

export interface ShareableReport {
  reportId: string;
  accessToken: string;
  shareUrl: string;
  expiresAt: Date;
  allowDownload: boolean;
}

export class ReportService extends BaseService {
  /**
   * Generate a comprehensive report from an assessment
   */
  async generateReport(
    data: z.infer<typeof CreateReportSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseReport>> {
    try {
      const validatedData = await this.validateInput(CreateReportSchema, data);

      // Get assessment with full details
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: validatedData.assessmentId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              country: true,
              size: true,
              industry: true,
              userId: true,
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
            orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
          },
          risks: {
            orderBy: { riskLevel: 'desc' },
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

      // Only generate reports for completed assessments
      if (assessment.status !== 'COMPLETED') {
        throw this.createError(
          'Assessment must be completed to generate report',
          400,
          'ASSESSMENT_NOT_COMPLETED'
        );
      }

      // Check if report already exists
      const existingReport = await this.prisma.report.findUnique({
        where: { assessmentId: validatedData.assessmentId },
      });

      if (existingReport) {
        throw this.createError(
          'Report already exists for this assessment',
          409,
          'REPORT_EXISTS'
        );
      }

      // Get vendor matches for recommendations
      const vendorMatches = await this.prisma.vendorMatch.findMany({
        where: {
          gap: {
            assessmentId: validatedData.assessmentId,
          },
        },
        include: {
          vendor: true,
          solution: true,
          gap: true,
        },
        orderBy: { matchScore: 'desc' },
        take: 20,
      });

      // Generate report content using AI
      const options: ReportGenerationOptions = {
        includeExecutiveSummary: validatedData.includeExecutiveSummary,
        includeComplianceMatrix: validatedData.includeComplianceMatrix,
        includeVendorRecommendations: validatedData.includeVendorRecommendations,
        includeRiskAnalysis: validatedData.includeRiskAnalysis,
        customSections: validatedData.customSections,
      };

      const reportContent = await this.generateReportContent(
        assessment,
        vendorMatches,
        options,
        context
      );

      // Generate PDF if requested
      let pdfUrl = null;
      let s3Key = null;
      
      if (validatedData.format === ReportFormat.PDF) {
        try {
          const pdfResult = await this.generatePDFReport(
            assessment,
            reportContent,
            validatedData.type
          );
          pdfUrl = pdfResult.url;
          s3Key = pdfResult.s3Key;
        } catch (pdfError) {
          this.logger.warn('PDF generation failed, continuing with JSON report', {
            error: pdfError.message,
            assessmentId: validatedData.assessmentId,
          });
        }
      }

      // Generate access token for sharing
      const accessToken = this.generateId() + this.generateId(); // Double ID for longer token

      // Create report record
      const report = await this.prisma.report.create({
        data: {
          assessmentId: validatedData.assessmentId,
          type: validatedData.type,
          format: validatedData.format,
          content: reportContent,
          summary: reportContent.executiveSummary?.overview || null,
          isPublic: false,
          accessToken,
          viewCount: 0,
          downloadCount: 0,
          pdfUrl,
          s3Key,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      await this.logAudit(
        {
          action: 'REPORT_GENERATED',
          entity: 'Report',
          entityId: report.id,
          newValues: {
            assessmentId: validatedData.assessmentId,
            type: validatedData.type,
            format: validatedData.format,
          },
        },
        context
      );

      this.logger.info('Report generated successfully', {
        reportId: report.id,
        assessmentId: validatedData.assessmentId,
        type: validatedData.type,
      });

      return this.createResponse(true, report, 'Report generated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'generateReport');
    }
  }

  /**
   * Get report by ID with full details
   */
  async getReportById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<ReportWithDetails>> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id },
        include: {
          assessment: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                  userId: true,
                },
              },
              template: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!report) {
        throw this.createError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        report.assessment.userId,
        report.assessment.organizationId
      );

      // Increment view count
      await this.prisma.report.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      return this.createResponse(true, report);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getReportById');
    }
  }

  /**
   * Get report by access token (for public sharing)
   */
  async getReportByToken(
    token: string,
    password?: string,
    context?: ServiceContext
  ): Promise<ApiResponse<ReportWithDetails>> {
    try {
      const report = await this.prisma.report.findFirst({
        where: {
          accessToken: token,
          expiresAt: { gt: this.now() },
        },
        include: {
          assessment: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                },
              },
              template: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!report) {
        throw this.createError('Report not found or expired', 404, 'REPORT_NOT_FOUND');
      }

      // Check if report is public or user has access
      if (!report.isPublic) {
        this.requirePermission(
          context,
          [UserRole.USER, UserRole.ADMIN],
          report.assessment.userId,
          report.assessment.organizationId
        );
      }

      // TODO: Check password if required
      // if (report.requirePassword && (!password || !verifyPassword(password, report.passwordHash))) {
      //   throw this.createError('Invalid password', 401, 'INVALID_PASSWORD');
      // }

      // Increment view count
      await this.prisma.report.update({
        where: { id: report.id },
        data: { viewCount: { increment: 1 } },
      });

      return this.createResponse(true, report);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getReportByToken');
    }
  }

  /**
   * Update report settings
   */
  async updateReport(
    id: string,
    data: z.infer<typeof UpdateReportSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseReport>> {
    try {
      const validatedData = await this.validateInput(UpdateReportSchema, data);

      const existingReport = await this.prisma.report.findUnique({
        where: { id },
        include: {
          assessment: {
            select: {
              userId: true,
              organizationId: true,
            },
          },
        },
      });

      if (!existingReport) {
        throw this.createError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        existingReport.assessment.userId,
        existingReport.assessment.organizationId
      );

      const updatedReport = await this.prisma.report.update({
        where: { id },
        data: validatedData,
      });

      await this.logAudit(
        {
          action: 'REPORT_UPDATED',
          entity: 'Report',
          entityId: id,
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Report updated successfully', { reportId: id });

      return this.createResponse(true, updatedReport, 'Report updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateReport');
    }
  }

  /**
   * Share report with public access
   */
  async shareReport(
    id: string,
    data: z.infer<typeof ShareReportSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<ShareableReport>> {
    try {
      const validatedData = await this.validateInput(ShareReportSchema, data);

      const report = await this.prisma.report.findUnique({
        where: { id },
        include: {
          assessment: {
            select: {
              userId: true,
              organizationId: true,
            },
          },
        },
      });

      if (!report) {
        throw this.createError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        report.assessment.userId,
        report.assessment.organizationId
      );

      // Generate new access token
      const newAccessToken = this.generateId() + this.generateId();
      const expiresAt = new Date(Date.now() + validatedData.expiresIn * 24 * 60 * 60 * 1000);

      // Update report
      await this.prisma.report.update({
        where: { id },
        data: {
          isPublic: true,
          accessToken: newAccessToken,
          expiresAt,
        },
      });

      const shareUrl = `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/reports/shared/${newAccessToken}`;

      const shareableReport: ShareableReport = {
        reportId: id,
        accessToken: newAccessToken,
        shareUrl,
        expiresAt,
        allowDownload: validatedData.allowDownload,
      };

      await this.logAudit(
        {
          action: 'REPORT_SHARED',
          entity: 'Report',
          entityId: id,
          metadata: {
            expiresIn: validatedData.expiresIn,
            allowDownload: validatedData.allowDownload,
          },
        },
        context
      );

      this.logger.info('Report shared successfully', {
        reportId: id,
        expiresIn: validatedData.expiresIn,
      });

      return this.createResponse(true, shareableReport, 'Report shared successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'shareReport');
    }
  }

  /**
   * Download report PDF
   */
  async downloadReport(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{ url: string; expiresAt: Date }>> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id },
        include: {
          assessment: {
            select: {
              userId: true,
              organizationId: true,
            },
          },
        },
      });

      if (!report) {
        throw this.createError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        report.assessment.userId,
        report.assessment.organizationId
      );

      if (!report.pdfUrl || !report.s3Key) {
        throw this.createError('PDF not available for this report', 404, 'PDF_NOT_FOUND');
      }

      // Generate presigned download URL
      const getCommand = new GetObjectCommand({
        Bucket: S3_REPORTS_BUCKET,
        Key: report.s3Key,
        ResponseContentDisposition: `attachment; filename="report-${report.id}.pdf"`,
      });

      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 hour
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      // Increment download count
      await this.prisma.report.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });

      await this.logAudit(
        {
          action: 'REPORT_DOWNLOADED',
          entity: 'Report',
          entityId: id,
        },
        context
      );

      this.logger.info('Report download URL generated', { reportId: id });

      return this.createResponse(true, { url, expiresAt }, 'Download URL generated');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'downloadReport');
    }
  }

  /**
   * Delete report
   */
  async deleteReport(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id },
        include: {
          assessment: {
            select: {
              userId: true,
              organizationId: true,
            },
          },
        },
      });

      if (!report) {
        throw this.createError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        report.assessment.userId,
        report.assessment.organizationId
      );

      // Delete PDF from S3 if exists
      if (report.s3Key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_REPORTS_BUCKET,
            Key: report.s3Key,
          });
          await s3Client.send(deleteCommand);
        } catch (s3Error) {
          this.logger.warn('Failed to delete report PDF from S3', {
            reportId: id,
            s3Key: report.s3Key,
            error: s3Error.message,
          });
        }
      }

      // Delete report from database
      await this.prisma.report.delete({
        where: { id },
      });

      await this.logAudit(
        {
          action: 'REPORT_DELETED',
          entity: 'Report',
          entityId: id,
        },
        context
      );

      this.logger.info('Report deleted successfully', { reportId: id });

      return this.createResponse(true, undefined, 'Report deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteReport');
    }
  }

  /**
   * List reports for an organization
   */
  async listReports(
    organizationId: string,
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<ReportWithDetails>>> {
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
        organization.userId,
        organization.id
      );

      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where = {
        ...queryOptions.where,
        assessment: {
          organizationId,
        },
      };

      const [reports, total] = await Promise.all([
        this.prisma.report.findMany({
          ...queryOptions,
          include: {
            assessment: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    country: true,
                  },
                },
                template: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.report.count({ where: queryOptions.where }),
      ]);

      const paginatedResponse = this.createPaginatedResponse(
        reports,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listReports');
    }
  }

  /**
   * Generate report content using AI
   */
  private async generateReportContent(
    assessment: any,
    vendorMatches: any[],
    options: ReportGenerationOptions,
    context?: ServiceContext
  ): Promise<ReportContent> {
    const content: ReportContent = {};

    try {
      // Generate executive summary
      if (options.includeExecutiveSummary) {
        const summary = await createExecutiveSummary({
          assessment,
          gaps: assessment.gaps,
          risks: assessment.risks,
          organization: assessment.organization,
        });
        content.executiveSummary = summary;
      }

      // Generate compliance matrix
      if (options.includeComplianceMatrix) {
        const matrix = await analyzeComplianceMatrix({
          assessment,
          template: assessment.template,
          gaps: assessment.gaps,
        });
        content.complianceMatrix = matrix;
      }

      // Generate risk analysis
      if (options.includeRiskAnalysis) {
        content.riskAnalysis = {
          riskScore: assessment.riskScore || 0,
          riskFactors: assessment.risks.map((risk: any) => ({
            category: risk.category,
            description: risk.description,
            likelihood: risk.likelihood,
            impact: risk.impact,
            mitigation: risk.mitigationStrategy || 'Not specified',
          })),
          priorityActions: assessment.recommendations?.priorityActions || [],
        };
      }

      // Generate vendor recommendations
      if (options.includeVendorRecommendations) {
        const recommendations = this.processVendorRecommendations(vendorMatches);
        content.vendorRecommendations = recommendations;
      }

      // Generate gap analysis with improvement roadmap
      content.gapAnalysis = {
        criticalGaps: assessment.gaps
          .filter((gap: any) => gap.severity === 'CRITICAL' || gap.severity === 'HIGH')
          .map((gap: any) => ({
            title: gap.title,
            description: gap.description,
            severity: gap.severity,
            priority: gap.priority,
            estimatedCost: gap.estimatedCost || 'TBD',
            timeline: gap.estimatedEffort || 'TBD',
          })),
        improvementRoadmap: [
          {
            phase: 'Immediate (0-3 months)',
            duration: '3 months',
            actions: assessment.gaps
              .filter((gap: any) => gap.priority === 'IMMEDIATE')
              .map((gap: any) => gap.title),
            expectedOutcome: 'Critical vulnerabilities addressed',
          },
          // Add more phases based on priorities
        ],
      };

    } catch (aiError) {
      this.logger.error('AI report generation failed', {
        error: aiError.message,
        assessmentId: assessment.id,
      });
      
      // Fallback to basic content
      content.executiveSummary = {
        overview: `Risk assessment completed for ${assessment.organization.name}`,
        keyFindings: ['Assessment completed', 'Risk score calculated'],
        riskLevel: assessment.riskScore > 70 ? 'HIGH' : assessment.riskScore > 40 ? 'MEDIUM' : 'LOW',
        recommendations: ['Review identified gaps', 'Implement recommended controls'],
      };
    }

    return content;
  }

  /**
   * Process vendor matches into recommendations
   */
  private processVendorRecommendations(vendorMatches: any[]): any[] {
    const categoryMap = new Map();

    vendorMatches.forEach(match => {
      const category = match.gap.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      categoryMap.get(category).push({
        name: match.vendor.companyName,
        description: match.vendor.shortDescription,
        matchScore: match.matchScore,
        pricing: match.solution?.pricingDetails || 'Contact for pricing',
        benefits: match.solution?.benefits || [],
      });
    });

    return Array.from(categoryMap.entries()).map(([category, vendors]) => ({
      category,
      vendors: vendors.slice(0, 3), // Top 3 vendors per category
    }));
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    assessment: any,
    content: ReportContent,
    reportType: ReportType
  ): Promise<{ url: string; s3Key: string }> {
    // This is a placeholder for PDF generation
    // In a real implementation, you would use a PDF library like Puppeteer, jsPDF, or PDFKit
    
    const s3Key = `reports/${assessment.organizationId}/${assessment.id}/${Date.now()}.pdf`;
    
    // Mock PDF content
    const pdfBuffer = Buffer.from('PDF content would be generated here');
    
    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: S3_REPORTS_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        'assessment-id': assessment.id,
        'organization-id': assessment.organizationId,
        'report-type': reportType,
      },
    });

    await s3Client.send(putCommand);

    // Generate public URL
    const getCommand = new GetObjectCommand({
      Bucket: S3_REPORTS_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 365 * 24 * 3600 }); // 1 year

    return { url, s3Key };
  }
}

export const reportService = new ReportService();