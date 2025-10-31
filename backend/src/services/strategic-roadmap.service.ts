/**
 * Strategic Roadmap Service
 * Aggregates data from multiple sources to provide strategic context for RFP auto-population
 * Sources: Organization, Assessment, AssessmentPriorities, Gaps
 */

import { BaseService } from './base.service.js';
import {
  Organization,
  Assessment,
  AssessmentPriorities,
  Gap,
  Severity,
} from '../generated/prisma/index.js';

// ==================== TYPE DEFINITIONS ====================

export interface OrganizationProfile {
  name: string;
  industry: string | null;
  size: string | null;
  country: string;
  description: string | null;
  annualRevenue: string | null;
  complianceTeamSize: string | null;
  geography: string | null;
}

export interface AssessmentContext {
  assessmentId: string;
  completedAt: Date | null;
  goals: string[];
  timeline: string | null;
  urgency: string | null;
  useCases: string[];
  budget: string | null;
  vendorPreferences: string | null;
}

export interface TopGap {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  priority: string;
  affectedArea: string | null;
}

export interface PhasedRoadmap {
  phase1_0to6months: string[];
  phase2_6to18months: string[];
  phase3_18monthsPlus: string[];
}

export interface StrategicRoadmapData {
  organizationProfile: OrganizationProfile;
  assessmentContext: AssessmentContext | null;
  topGaps: TopGap[];
  phasedRoadmap: PhasedRoadmap | null;
  hasCompletedAssessment: boolean;
}

// ==================== STRATEGIC ROADMAP SERVICE ====================

export class StrategicRoadmapService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get strategic roadmap data for RFP auto-population
   * Aggregates data from Organization, Assessment, Priorities, and Gaps
   *
   * @param organizationId - Organization ID
   * @param userId - User ID (for authorization)
   * @returns Strategic roadmap data
   */
  async getStrategicRoadmap(
    organizationId: string,
    userId: string
  ): Promise<StrategicRoadmapData> {
    try {
      // Get organization with authorization check
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
          userId: userId, // Ensure user owns the organization
        },
      });

      if (!organization) {
        throw this.createError(
          'Organization not found or access denied',
          404,
          'ORGANIZATION_NOT_FOUND'
        );
      }

      // Build organization profile
      const organizationProfile: OrganizationProfile = {
        name: organization.name,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        description: organization.description,
        annualRevenue: organization.annualRevenue,
        complianceTeamSize: organization.complianceTeamSize,
        geography: organization.geography,
      };

      // Get latest completed assessment
      const latestAssessment = await this.prisma.assessment.findFirst({
        where: {
          organizationId,
          status: 'COMPLETED',
        },
        include: {
          priorities: true,
          template: {
            select: {
              name: true,
              category: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      let assessmentContext: AssessmentContext | null = null;
      let topGaps: TopGap[] = [];
      let phasedRoadmap: PhasedRoadmap | null = null;

      if (latestAssessment) {
        // Build assessment context
        if (latestAssessment.priorities) {
          const priorities = latestAssessment.priorities;
          assessmentContext = {
            assessmentId: latestAssessment.id,
            completedAt: latestAssessment.completedAt,
            goals: this.parseJsonField<string[]>((priorities as any).goals, []),
            timeline: (priorities as any).timeline || null,
            urgency: (priorities as any).urgency || null,
            useCases: this.parseJsonField<string[]>((priorities as any).useCases, []),
            budget: (priorities as any).budget || null,
            vendorPreferences: (priorities as any).vendorPreferences || null,
          };
        }

        // Get top 5 prioritized gaps (HIGH or CRITICAL severity)
        const gaps = await this.prisma.gap.findMany({
          where: {
            assessmentId: latestAssessment.id,
            severity: {
              in: [Severity.HIGH, Severity.CRITICAL],
            },
          },
          orderBy: [
            { severity: 'desc' },
            { priority: 'asc' },
          ],
          take: 5,
        });

        topGaps = gaps.map((gap) => ({
          id: gap.id,
          title: gap.title,
          description: gap.description,
          category: gap.category,
          severity: gap.severity,
          priority: gap.priority,
          affectedArea: (gap as any).affectedArea,
        }));

        // Build phased roadmap from gaps
        phasedRoadmap = this.buildPhasedRoadmap(gaps);
      }

      return {
        organizationProfile,
        assessmentContext,
        topGaps,
        phasedRoadmap,
        hasCompletedAssessment: !!latestAssessment,
      };
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      return this.handleDatabaseError(error, 'getStrategicRoadmap');
    }
  }

  /**
   * Build phased roadmap from gaps based on priority
   * - IMMEDIATE: 0-6 months (Phase 1)
   * - SHORT_TERM: 0-6 months (Phase 1)
   * - MEDIUM_TERM: 6-18 months (Phase 2)
   * - LONG_TERM: 18+ months (Phase 3)
   *
   * @param gaps - Array of gaps
   * @returns Phased roadmap
   */
  private buildPhasedRoadmap(gaps: Gap[]): PhasedRoadmap {
    const phase1: string[] = [];
    const phase2: string[] = [];
    const phase3: string[] = [];

    gaps.forEach((gap) => {
      const item = `${gap.title} (${gap.severity})`;

      switch (gap.priority) {
        case 'IMMEDIATE':
        case 'SHORT_TERM':
          phase1.push(item);
          break;
        case 'MEDIUM_TERM':
          phase2.push(item);
          break;
        case 'LONG_TERM':
          phase3.push(item);
          break;
        default:
          phase1.push(item); // Default to immediate if priority unknown
      }
    });

    return {
      phase1_0to6months: phase1,
      phase2_6to18months: phase2,
      phase3_18monthsPlus: phase3,
    };
  }

  /**
   * Safely parse JSON field with fallback
   *
   * @param field - JSON field to parse
   * @param fallback - Fallback value if parsing fails
   * @returns Parsed value or fallback
   */
  private parseJsonField<T>(field: any, fallback: T): T {
    try {
      if (typeof field === 'string') {
        return JSON.parse(field);
      }
      if (Array.isArray(field) || typeof field === 'object') {
        return field as T;
      }
      return fallback;
    } catch (error) {
      this.logger.warn('Failed to parse JSON field', { field, error });
      return fallback;
    }
  }

  /**
   * Format strategic roadmap for RFP auto-population
   * Returns formatted strings ready for RFP form fields
   *
   * @param data - Strategic roadmap data
   * @returns Formatted strings for RFP fields
   */
  formatForRFP(data: StrategicRoadmapData): {
    companyOverview: string;
    projectObjectives: string;
    suggestedRequirements: string;
  } {
    // Format company overview
    const companyOverview = this.formatCompanyOverview(data.organizationProfile);

    // Format project objectives
    const projectObjectives = this.formatProjectObjectives(
      data.organizationProfile,
      data.assessmentContext,
      data.topGaps
    );

    // Format suggested requirements
    const suggestedRequirements = this.formatSuggestedRequirements(
      data.topGaps,
      data.phasedRoadmap
    );

    return {
      companyOverview,
      projectObjectives,
      suggestedRequirements,
    };
  }

  /**
   * Format company overview for RFP
   */
  private formatCompanyOverview(profile: OrganizationProfile): string {
    const parts: string[] = [];

    parts.push(`${profile.name} is a ${profile.size || 'company'} operating in the ${profile.industry || 'industry'} sector.`);

    if (profile.geography) {
      parts.push(`We operate ${profile.geography.toLowerCase()}.`);
    }

    if (profile.description) {
      parts.push(profile.description);
    }

    if (profile.complianceTeamSize) {
      parts.push(`Our compliance team consists of ${profile.complianceTeamSize.toLowerCase().replace('_', ' ')}.`);
    }

    return parts.join(' ');
  }

  /**
   * Format project objectives for RFP
   */
  private formatProjectObjectives(
    profile: OrganizationProfile,
    context: AssessmentContext | null,
    gaps: TopGap[]
  ): string {
    const parts: string[] = [];

    if (context?.goals && context.goals.length > 0) {
      parts.push('Our key objectives are:');
      parts.push(...context.goals.map((goal) => `- ${goal}`));
      parts.push('');
    }

    if (gaps.length > 0) {
      parts.push('We need to address the following compliance gaps:');
      parts.push(...gaps.slice(0, 3).map((gap) => `- ${gap.title} (${gap.severity})`));
      parts.push('');
    }

    if (context?.timeline) {
      parts.push(`Timeline: ${context.timeline}`);
    }

    if (context?.urgency) {
      parts.push(`Urgency: ${context.urgency}`);
    }

    return parts.join('\n');
  }

  /**
   * Format suggested requirements for RFP
   */
  private formatSuggestedRequirements(
    gaps: TopGap[],
    roadmap: PhasedRoadmap | null
  ): string {
    const parts: string[] = [];

    if (gaps.length > 0) {
      parts.push('The solution must address:');
      gaps.forEach((gap) => {
        parts.push(`- ${gap.description} (${gap.category})`);
      });
      parts.push('');
    }

    if (roadmap && roadmap.phase1_0to6months.length > 0) {
      parts.push('Immediate priorities (0-6 months):');
      parts.push(...roadmap.phase1_0to6months.map((item) => `- ${item}`));
      parts.push('');
    }

    parts.push('Additional requirements:');
    parts.push('- Integration with existing systems');
    parts.push('- Training and support');
    parts.push('- Compliance reporting and documentation');
    parts.push('- Ongoing maintenance and updates');

    return parts.join('\n');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default StrategicRoadmapService;
