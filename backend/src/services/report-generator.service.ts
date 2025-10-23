/**
 * Report Generator Service
 * Handles PDF report generation for assessments
 */

import PDFDocument from 'pdfkit';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  DatabaseAssessment,
  UserRole,
  AssessmentStatus,
  Severity,
  Priority,
  RiskLevel,
  RiskCategory,
} from '../types/database';
import { assessmentService } from './assessment.service';
import { ObjectStorageService } from '../objectStorage';
import { FreemiumService } from './freemium.service';

// Brand colors - Heliolus design system
const BRAND_COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  primaryLight: '#8b9df7',
  // Neutral palette
  neutral900: '#111827',
  neutral700: '#374151',
  neutral500: '#6b7280',
  neutral200: '#e5e7eb',
  neutral100: '#f3f4f6',
  neutral50: '#f9fafb'
};

// Professional Typography System
const FONTS = {
  heading: 'Helvetica-Bold',
  body: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique'
};

const FONT_SIZES = {
  title: 32,
  subtitle: 20,
  sectionTitle: 18,
  heading: 14,
  subheading: 12,
  body: 11,
  small: 10,
  caption: 9
};

// Risk level colors - professional palette
const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a',
};

// Priority text labels - NO EMOJIS
const PRIORITY_LABELS = {
  IMMEDIATE: 'IMMEDIATE ACTION',
  SHORT_TERM: '30-DAY PRIORITY',
  MEDIUM_TERM: '90-DAY PRIORITY',
  LONG_TERM: 'PLANNED',
  immediate: 'IMMEDIATE ACTION',
  'short-term': '30-DAY PRIORITY',
  'medium-term': '90-DAY PRIORITY',
  'long-term': 'PLANNED',
};

interface ReportData {
  assessment: any;
  organization: any;
  template: any;
  riskScore: number;
  riskBreakdown: any;
  gaps: any[];
  risks: any[];
  recommendations: any[];
  strategyMatrix: any;
  aiRiskAnalysis: any;
  answers: any[];
  generatedAt: Date;
  companyLogo?: string;
}

export class ReportGeneratorService extends BaseService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    super();
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Generate PDF report for an assessment
   */
  async generatePDFReport(
    assessmentId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{ url: string; filename: string }>> {
    try {
      // Get assessment with full details
      const assessmentResult = await assessmentService.getAssessmentById(assessmentId, context);
      
      if (!assessmentResult.success || !assessmentResult.data) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      const assessment = assessmentResult.data;

      // Debug logging
      console.log('[DEBUG-PDF] ID:', assessment.id);
      console.log('[DEBUG-PDF] status:', assessment.status);
      console.log('[DEBUG-PDF] riskScore:', assessment.riskScore);
      console.log('[DEBUG-PDF] typeof riskScore:', typeof assessment.riskScore);
      console.log('[DEBUG-PDF] !!riskScore:', !!assessment.riskScore);
      console.log('[DEBUG-PDF] status !== COMPLETED:', assessment.status !== AssessmentStatus.COMPLETED);
      console.log('[DEBUG-PDF] !riskScore:', !assessment.riskScore);
      console.log('[DEBUG-PDF] Will throw error:', assessment.status !== AssessmentStatus.COMPLETED && !assessment.riskScore);

      // Check if assessment has results (either COMPLETED or has risk score from analysis)
      if (assessment.status !== AssessmentStatus.COMPLETED && !assessment.riskScore) {
        throw this.createError(
          'Assessment must be completed or have analysis results to generate report',
          400,
          'ASSESSMENT_NOT_COMPLETED'
        );
      }

      // Check user permissions and subscription
      const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(context?.userId!);
      const canGeneratePDF = true; // Simplified for now - assume premium users can generate PDFs

      if (!canGeneratePDF) {
        throw this.createError(
          'PDF reports are only available for premium users',
          403,
          'PREMIUM_FEATURE'
        );
      }

      // Get additional data for report
      const [answers, gaps, risks, recommendations] = await Promise.all([
        this.getAssessmentAnswers(assessmentId),
        this.getAssessmentGaps(assessmentId),
        this.getAssessmentRisks(assessmentId),
        this.getAssessmentRecommendations(assessmentId),
      ]);

      // Get risk score breakdown
      const riskBreakdown = await assessmentService.getRiskScoreBreakdown(assessmentId, context);

      // Get AI-generated strategy matrix and risk analysis
      let strategyMatrix = null;
      let aiRiskAnalysis = null;
      try {
        const aiAnalysisResult = await assessmentService.generateAndStoreAIAnalysis(assessmentId, context);
        if (aiAnalysisResult.success) {
          strategyMatrix = aiAnalysisResult.data?.strategyMatrix || assessment.aiStrategyMatrix;
          aiRiskAnalysis = aiAnalysisResult.data?.riskAnalysis || assessment.aiRiskAnalysis;
        } else {
          // Fallback to stored values if generation fails
          strategyMatrix = assessment.aiStrategyMatrix;
          aiRiskAnalysis = assessment.aiRiskAnalysis;
        }
      } catch (error) {
        this.logger.warn('Failed to get AI analysis for report, using stored data', { error: error.message });
        strategyMatrix = assessment.aiStrategyMatrix;
        aiRiskAnalysis = assessment.aiRiskAnalysis;
      }

      // Prepare report data
      const reportData: ReportData = {
        assessment,
        organization: assessment.organization,
        template: assessment.template,
        riskScore: assessment.riskScore || 0,
        riskBreakdown: riskBreakdown.data,
        gaps: gaps || [],
        risks: risks || [],
        recommendations: recommendations || [],
        strategyMatrix: strategyMatrix,
        aiRiskAnalysis: aiRiskAnalysis,
        answers: answers || [],
        generatedAt: new Date(),
      };

      // Generate PDF directly with pdfkit
      const pdfBuffer = await this.generatePDFWithPDFKit(reportData);

      // Save PDF to object storage (use fixed filename to simplify download)
      const filename = `assessment-report-${assessmentId}.pdf`;
      const url = await this.savePDFToStorage(pdfBuffer, filename, assessmentId);

      // Log report generation
      await this.logAudit(
        {
          action: 'REPORT_GENERATED',
          entity: 'Assessment',
          entityId: assessmentId,
          newValues: {
            filename,
            generatedAt: new Date(),
          },
        },
        context
      );

      this.logger.info('PDF report generated successfully', {
        assessmentId,
        filename,
      });

      return this.createResponse(
        true,
        { url, filename },
        'Report generated successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.logger.error('Failed to generate PDF report', {
        assessmentId,
        error: error.message,
      });
      throw this.createError('Failed to generate report', 500, 'REPORT_GENERATION_FAILED');
    }
  }

  /**
   * Generate PDF using PDFKit
   */
  private async generatePDFWithPDFKit(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Risk Assessment Report - ${data.organization.name}`,
            Author: 'Heliolus Platform',
            Subject: 'Risk Assessment',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header Section
        this.addHeader(doc, data);

        // Overview Section
        this.addOverview(doc, data);

        // Risk Score Breakdown
        if (data.riskBreakdown) {
          this.addRiskBreakdown(doc, data);
        }

        // Gap Analysis Section
        if (data.gaps && data.gaps.length > 0) {
          this.addGapAnalysis(doc, data);
        }

        // Risk Analysis Section
        if (data.risks && data.risks.length > 0) {
          this.addRiskAnalysis(doc, data);
        }

        // AI Strategy Matrix Section
        if (data.aiRiskAnalysis) {
          this.addAIStrategyMatrix(doc, data);
        }

        // Strategy Matrix Summary
        if (data.strategyMatrix) {
          this.addStrategyMatrixSummary(doc, data);
        }

        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: typeof PDFDocument.prototype, data: ReportData): void {
    // Professional header with gradient effect simulation
    doc
      .fillColor(BRAND_COLORS.primary)
      .fontSize(FONT_SIZES.title)
      .font(FONTS.heading)
      .text('Risk Assessment Report', { align: 'center' });

    doc
      .moveDown(0.5)
      .fillColor(BRAND_COLORS.primaryDark)
      .fontSize(FONT_SIZES.subtitle)
      .font(FONTS.heading)
      .text(data.organization?.name || 'Organization', { align: 'center' });

    // Add organization details if available
    if (data.organization?.country || data.organization?.industry) {
      doc
        .moveDown(0.2)
        .fillColor(BRAND_COLORS.neutral700)
        .fontSize(FONT_SIZES.body)
        .font(FONTS.body)
        .text(
          [data.organization?.industry, data.organization?.country].filter(Boolean).join(' • '),
          { align: 'center' }
        );
    }

    doc
      .moveDown(0.3)
      .fillColor(BRAND_COLORS.neutral500)
      .fontSize(FONT_SIZES.body)
      .font(FONTS.body)
      .text(`Generated on ${data.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    // Add a professional divider line
    doc
      .moveDown(1)
      .strokeColor(BRAND_COLORS.primary)
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(2);
  }

  /**
   * Add overview section
   */
  private addOverview(doc: typeof PDFDocument.prototype, data: ReportData): void {
    doc
      .fillColor('#333333')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Executive Summary');

    doc.moveDown(0.5);

    // Risk Score Display
    const riskColor = RISK_COLORS[data.assessment.riskLevel] || '#6b7280';
    doc
      .fillColor(riskColor)
      .fontSize(48)
      .font('Helvetica-Bold')
      .text(data.riskScore.toString(), { align: 'center' });

    doc
      .fillColor('#666666')
      .fontSize(14)
      .font('Helvetica')
      .text('Risk Score', { align: 'center' });

    doc.moveDown(1);

    // Key Metrics - add more details
    const metrics = [
      { label: 'Risk Level', value: data.assessment.riskLevel || 'N/A', color: riskColor },
      { label: 'Template', value: data.template?.name || 'Standard Assessment' },
      { label: 'Total Gaps', value: data.gaps?.length?.toString() || '0' },
      { label: 'Total Risks', value: data.risks?.length?.toString() || '0' },
      { label: 'Company Size', value: data.organization?.size || 'Not specified' },
      { label: 'Assessment Date', value: new Date(data.assessment.createdAt).toLocaleDateString() },
    ];

    const startY = doc.y;
    const columnWidth = (doc.page.width - 100) / 2;

    metrics.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 50 + col * columnWidth;
      const y = startY + row * 80; // Increased spacing between rows

      // Draw card background
      doc
        .rect(x, y, columnWidth - 20, 65) // Increased height for better spacing
        .fillAndStroke('#f8f9fa', '#e5e7eb');

      // Save current position
      const savedY = doc.y;

      // Draw label - fixed positioning within card
      doc
        .fillColor(BRAND_COLORS.neutral500)
        .fontSize(FONT_SIZES.caption)
        .font(FONTS.body)
        .text(metric.label, x + 15, y + 12, {
          width: columnWidth - 40,
          height: 20,
          ellipsis: true
        });

      // Draw value - ensure it doesn't overflow
      doc
        .fillColor(metric.color || BRAND_COLORS.neutral900)
        .fontSize(18) // Larger for emphasis
        .font(FONTS.bold)
        .text(metric.value || 'N/A', x + 15, y + 32, {
          width: columnWidth - 40,
          height: 25,
          ellipsis: true
        });

      // Restore Y position
      doc.y = savedY;
    });

    // Adjust final Y position based on rows
    const totalRows = Math.ceil(metrics.length / 2);
    doc.y = startY + (totalRows * 80) + 20;
    doc.moveDown(0.5);

    // Summary text
    doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(
        `This comprehensive risk assessment for ${data.organization.name} has identified a risk score of ${data.riskScore}, indicating a ${data.assessment.riskLevel} risk level. The assessment uncovered ${data.gaps.length} compliance gaps and ${data.risks.length} risk areas requiring attention.`,
        { align: 'left', lineGap: 4 }
      );

    doc.moveDown(2);
  }

  /**
   * Add risk breakdown section
   */
  private addRiskBreakdown(doc: typeof PDFDocument.prototype, data: ReportData): void {
    this.addSectionTitle(doc, 'Risk Score Breakdown');

    const categories = Object.entries(data.riskBreakdown?.categories || {});

    if (categories.length === 0) {
      doc
        .fillColor(BRAND_COLORS.neutral500)
        .fontSize(10)
        .font('Helvetica')
        .text('No category breakdown available', { align: 'center' });
      doc.moveDown(2);
      return;
    }

    const startY = doc.y;
    const columnWidth = (doc.page.width - 100) / 3;

    categories.forEach(([ category, details]: [string, any], index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 50 + col * columnWidth;
      const y = startY + row * 75; // Increased spacing

      if (y > doc.page.height - 100) {
        doc.addPage();
        doc.y = 50;
      }

      // Fixed NaN issue - check for valid score
      const score = details?.score ?? 0;
      const displayScore = isNaN(score) ? 0 : Math.round(score);

      // Professional card design with better spacing
      doc
        .rect(x, y, columnWidth - 15, 65)
        .fillAndStroke(BRAND_COLORS.neutral50, BRAND_COLORS.neutral200);

      // Save position for proper text layout
      const savedY = doc.y;

      // Category label
      doc
        .fillColor(BRAND_COLORS.neutral700)
        .fontSize(FONT_SIZES.small)
        .font(FONTS.body)
        .text(category || 'Unknown', x + 12, y + 10, {
          width: columnWidth - 30,
          height: 18,
          ellipsis: true
        });

      // Color-coded score based on value
      const scoreColor = displayScore >= 80 ? RISK_COLORS.CRITICAL :
                        displayScore >= 60 ? RISK_COLORS.HIGH :
                        displayScore >= 40 ? RISK_COLORS.MEDIUM :
                        RISK_COLORS.LOW;

      // Score value with proper positioning
      doc
        .fillColor(scoreColor)
        .fontSize(20)
        .font(FONTS.bold)
        .text(`${displayScore}%`, x + 12, y + 30, {
          width: columnWidth - 30,
          height: 25
        });

      // Restore Y position
      doc.y = savedY;
    });

    // Adjust Y position properly
    const totalRows = Math.ceil(categories.length / 3);
    doc.y = startY + (totalRows * 75) + 20;
    doc.moveDown(1);
  }

  /**
   * Add gap analysis section
   */
  private addGapAnalysis(doc: typeof PDFDocument.prototype, data: ReportData): void {
    this.addSectionTitle(doc, 'Gap Analysis');

    data.gaps.forEach((gap, index) => {
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      const severityColor = RISK_COLORS[gap.severity] || BRAND_COLORS.neutral500;
      const priorityLabel = PRIORITY_LABELS[gap.priority] || 'UNSPECIFIED';

      // Gap card - professional spacing
      doc.y += 10;

      // Category badge with better formatting
      doc
        .fillColor(severityColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(gap.category.replace(/_/g, ' '), 60, doc.y);

      doc.moveDown(0.3);

      // Severity and priority labels - professional format
      doc
        .fillColor(BRAND_COLORS.neutral700)
        .fontSize(8)
        .font('Helvetica')
        .text(`${gap.severity} SEVERITY • ${priorityLabel}`, 60, doc.y);

      doc.moveDown(0.5);

      // Title
      doc
        .fillColor('#333333')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(gap.title, 60, doc.y, { width: doc.page.width - 120 });

      doc.moveDown(0.3);

      // Description
      doc
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(gap.description, 60, doc.y, { width: doc.page.width - 120, lineGap: 2 });

      doc.moveDown(0.5);

      // Cost and Effort - Professional formatting with bullets
      doc
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(`Cost: ${gap.estimatedCost}  •  Effort: ${gap.estimatedEffort}`, 60, doc.y);

      doc.moveDown(1.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add risk analysis section
   */
  private addRiskAnalysis(doc: typeof PDFDocument.prototype, data: ReportData): void {
    this.addSectionTitle(doc, 'Risk Analysis');

    data.risks.forEach((risk) => {
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      const riskColor = RISK_COLORS[risk.riskLevel] || '#6b7280';

      // Risk card background
      const cardY = doc.y;
      doc.y = cardY + 10;

      // Category and risk level - Clean professional formatting
      doc
        .fillColor(riskColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${risk.category} — ${risk.riskLevel} RISK`, 60, doc.y);

      doc.moveDown(0.5);

      // Title
      doc
        .fillColor('#333333')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(risk.title, 60, doc.y, { width: doc.page.width - 120 });

      doc.moveDown(0.3);

      // Description
      doc
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(risk.description, 60, doc.y, { width: doc.page.width - 120, lineGap: 2 });

      doc.moveDown(0.5);

      // Likelihood and Impact - Professional bullet formatting
      doc
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(`Likelihood: ${risk.likelihood}  •  Impact: ${risk.impact}`, 60, doc.y);

      // Mitigation strategy
      if (risk.mitigationStrategy) {
        doc.moveDown(0.5);
        doc
          .fillColor('#0369a1')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Mitigation Strategy:', 60, doc.y);

        doc.moveDown(0.2);
        doc
          .fillColor('#666666')
          .fontSize(10)
          .font('Helvetica')
          .text(risk.mitigationStrategy, 60, doc.y, { width: doc.page.width - 120, lineGap: 2 });
      }

      doc.moveDown(1.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add AI strategy matrix section
   */
  private addAIStrategyMatrix(doc: typeof PDFDocument.prototype, data: ReportData): void {
    this.addSectionTitle(doc, 'AI-Powered Mitigation Strategies');

    Object.entries(data.aiRiskAnalysis).forEach(([complianceArea, analysis]: [string, any]) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      // Compliance area heading
      doc
        .fillColor('#667eea')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${complianceArea} Compliance`, 60, doc.y);

      doc.moveDown(0.5);

      // Mitigation strategies
      (analysis.mitigationStrategies || []).forEach((strategy: any) => {
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }

        const priorityColor =
          strategy.priority === 'immediate' ? RISK_COLORS.CRITICAL :
          strategy.priority === 'short-term' ? RISK_COLORS.HIGH :
          strategy.priority === 'medium-term' ? RISK_COLORS.MEDIUM : RISK_COLORS.LOW;

        const priorityLabel = PRIORITY_LABELS[strategy.priority] || 'UNSPECIFIED';

        // Strategy card - professional spacing
        const cardY = doc.y;
        doc.y = cardY + 8;

        // Priority label with clean formatting
        doc
          .fillColor(priorityColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(priorityLabel, 70, doc.y);

        // Impact label on same line if exists
        if (strategy.impact) {
          doc
            .fillColor(BRAND_COLORS.neutral700)
            .fontSize(10)
            .font('Helvetica')
            .text(` • ${strategy.impact.toUpperCase()} IMPACT`, doc.x, doc.y);
        }

        doc.moveDown(0.5);

        // Strategy title
        doc
          .fillColor('#333333')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(strategy.strategy, 70, doc.y, { width: doc.page.width - 140 });

        doc.moveDown(0.3);

        // Rationale
        if (strategy.rationale) {
          doc
            .fillColor('#666666')
            .fontSize(9)
            .font('Helvetica')
            .text(`Rationale: ${strategy.rationale}`, 70, doc.y, { width: doc.page.width - 140, lineGap: 2 });
          doc.moveDown(0.3);
        }

        // Metrics - Professional bullet separation
        const metricsText = [
          strategy.businessOwner && `Owner: ${strategy.businessOwner}`,
          strategy.estimatedTimeframe && `Timeline: ${strategy.estimatedTimeframe}`,
          strategy.estimatedBudget && `Budget: ${strategy.estimatedBudget}`,
          strategy.riskReductionPercent && `Risk Reduction: ${strategy.riskReductionPercent}%`,
          strategy.remediationDays && `Days: ${strategy.remediationDays}`,
        ].filter(Boolean).join('  •  ');

        if (metricsText) {
          doc
            .fillColor('#666666')
            .fontSize(9)
            .font('Helvetica')
            .text(metricsText, 70, doc.y);
          doc.moveDown(0.3);
        }

        // Key actions
        if (strategy.keyActions && strategy.keyActions.length > 0) {
          doc
            .fillColor('#667eea')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Key Actions:', 70, doc.y);
          doc.moveDown(0.2);

          strategy.keyActions.forEach((action: string) => {
            doc
              .fillColor('#333333')
              .fontSize(9)
              .font('Helvetica')
              .text(`• ${action}`, 80, doc.y, { width: doc.page.width - 150 });
            doc.moveDown(0.2);
          });
        }

        doc.moveDown(1);
      });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add strategy matrix summary
   */
  private addStrategyMatrixSummary(doc: typeof PDFDocument.prototype, data: ReportData): void {
    if (!data.strategyMatrix?.priorityAreas || data.strategyMatrix.priorityAreas.length === 0) {
      return;
    }

    this.addSectionTitle(doc, 'Strategy Matrix Summary');

    data.strategyMatrix.priorityAreas.forEach((area: any) => {
      doc
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${area.category}:`, 60, doc.y);

      doc.moveDown(0.2);

      doc
        .fillColor('#333333')
        .fontSize(10)
        .font('Helvetica')
        .text(area.action, 70, doc.y, { width: doc.page.width - 130 });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add footer
   */
  private addFooter(doc: typeof PDFDocument.prototype, data: ReportData): void {
    // Add a subtle separator line
    doc
      .moveDown(2)
      .strokeColor(BRAND_COLORS.neutral200)
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Confidentiality notice
    doc
      .fillColor(BRAND_COLORS.neutral500)
      .fontSize(FONT_SIZES.caption)
      .font(FONTS.body)
      .text(`This report is confidential and proprietary to ${data.organization.name}`, { align: 'center' });

    // Platform credit
    doc
      .fillColor(BRAND_COLORS.neutral500)
      .fontSize(FONT_SIZES.caption)
      .text('Powered by Heliolus Platform • Enterprise Risk Management', { align: 'center' });
  }

  /**
   * Add section title
   */
  private addSectionTitle(doc: typeof PDFDocument.prototype, title: string): void {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc
      .fillColor(BRAND_COLORS.neutral900)
      .fontSize(FONT_SIZES.sectionTitle)
      .font(FONTS.heading)
      .text(title, 50, doc.y);

    doc
      .strokeColor(BRAND_COLORS.primary)
      .lineWidth(2)
      .moveTo(50, doc.y + 5)
      .lineTo(doc.page.width - 50, doc.y + 5)
      .stroke();

    doc.moveDown(1.5);
  }

  /**
   * Save PDF to object storage
   */
  private async savePDFToStorage(
    pdfBuffer: Buffer,
    filename: string,
    assessmentId: string
  ): Promise<string> {
    const privateDir = this.objectStorageService.getPrivateObjectDir();
    const objectPath = `${privateDir}/reports/${assessmentId}/${filename}`;
    
    // Get upload URL
    const uploadUrl = await this.objectStorageService.getDocumentUploadURL(objectPath);
    
    // Upload the PDF
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: pdfBuffer as any,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload PDF: ${response.statusText}`);
    }

    // Return the download path
    return `/api/v1/assessments/${assessmentId}/report/download`;
  }

  /**
   * Get assessment answers
   */
  private async getAssessmentAnswers(assessmentId: string): Promise<any[]> {
    const answers = await this.prisma.answer.findMany({
      where: { assessmentId },
      include: {
        question: {
          include: {
            section: true,
          },
        },
      },
      orderBy: [
        { question: { section: { order: 'asc' } } },
        { question: { order: 'asc' } },
      ],
    });

    return answers.map(answer => ({
      questionText: answer.question.text,
      sectionTitle: answer.question.section.title,
      score: answer.score,
      explanation: answer.explanation,
      sourceReference: answer.sourceReference,
      status: answer.status,
    }));
  }

  /**
   * Get assessment gaps
   */
  private async getAssessmentGaps(assessmentId: string): Promise<any[]> {
    return await this.prisma.gap.findMany({
      where: { assessmentId },
      orderBy: [
        { severity: 'desc' },
        { priority: 'asc' },
      ],
    });
  }

  /**
   * Get assessment risks
   */
  private async getAssessmentRisks(assessmentId: string): Promise<any[]> {
    return await this.prisma.risk.findMany({
      where: { assessmentId },
      orderBy: [
        { riskLevel: 'desc' },
        { likelihood: 'desc' },
      ],
    });
  }

  /**
   * Get assessment recommendations
   */
  private async getAssessmentRecommendations(assessmentId: string): Promise<string[]> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { recommendations: true },
    });

    if (!assessment?.recommendations) {
      return [];
    }

    // Recommendations are stored as JSON
    if (typeof assessment.recommendations === 'object' && Array.isArray(assessment.recommendations)) {
      return assessment.recommendations as string[];
    }

    return [];
  }
}

// Export singleton instance
export const reportGeneratorService = new ReportGeneratorService();