/**
 * Freemium Service
 * Handles subscription restrictions and content filtering for free vs paid users
 */

import { UserRole } from '../types/database';

export interface FreemiumLimitations {
  canAccessDetailed: boolean;
  canDownloadReports: boolean;
  canExportData: boolean;
  maxAssessmentsPerMonth: number;
  canAccessAIAnalysis: boolean;
  canViewGapAnalysis: boolean;
  canViewRiskBreakdown: boolean;
  creditsPerAssessment: number;
  maxCreditsPerMonth: number;
}

export interface UserSubscriptionStatus {
  userId: string;
  userRole: UserRole;
  subscriptionType: 'FREE' | 'PAID' | 'PREMIUM';
  creditsUsed: number;
  creditsLimit: number;
  assessmentsThisMonth: number;
  maxAssessmentsPerMonth: number;
}

export class FreemiumService {
  /**
   * Get limitations based on user subscription type
   */
  static getLimitations(subscriptionType: 'FREE' | 'PAID' | 'PREMIUM'): FreemiumLimitations {
    switch (subscriptionType) {
      case 'FREE':
        return {
          canAccessDetailed: false,
          canDownloadReports: false,
          canExportData: false,
          maxAssessmentsPerMonth: 1,
          canAccessAIAnalysis: false,
          canViewGapAnalysis: false,
          canViewRiskBreakdown: false,
          creditsPerAssessment: 5,
          maxCreditsPerMonth: 5,
        };

      case 'PAID':
        return {
          canAccessDetailed: true,
          canDownloadReports: true,
          canExportData: true,
          maxAssessmentsPerMonth: 10,
          canAccessAIAnalysis: true,
          canViewGapAnalysis: true,
          canViewRiskBreakdown: true,
          creditsPerAssessment: 5,
          maxCreditsPerMonth: 50,
        };

      case 'PREMIUM':
        return {
          canAccessDetailed: true,
          canDownloadReports: true,
          canExportData: true,
          maxAssessmentsPerMonth: 2, // 2 assessments per month
          canAccessAIAnalysis: true,
          canViewGapAnalysis: true,
          canViewRiskBreakdown: true,
          creditsPerAssessment: 50, // 50 credits per assessment
          maxCreditsPerMonth: 100, // 100 credits per month (enough for 2 assessments)
        };

      default:
        return this.getLimitations('FREE');
    }
  }

  /**
   * Check if user can perform a specific action
   */
  static canPerformAction(
    subscriptionType: 'FREE' | 'PAID' | 'PREMIUM',
    action: keyof FreemiumLimitations
  ): boolean {
    const limitations = this.getLimitations(subscriptionType);
    return limitations[action] as boolean;
  }

  /**
   * Check if user has sufficient credits for assessment
   */
  static checkCreditLimits(
    userStatus: UserSubscriptionStatus,
    requiredCredits: number
  ): { canProceed: boolean; reason?: string } {
    const limitations = this.getLimitations(userStatus.subscriptionType);

    // Check monthly credit limit (if not unlimited)
    if (limitations.maxCreditsPerMonth > 0) {
      if (userStatus.creditsUsed + requiredCredits > limitations.maxCreditsPerMonth) {
        return {
          canProceed: false,
          reason: `Monthly credit limit exceeded. You have used ${userStatus.creditsUsed} out of ${limitations.maxCreditsPerMonth} credits.`,
        };
      }
    }

    // Check assessment count limit (if not unlimited)
    if (limitations.maxAssessmentsPerMonth > 0) {
      if (userStatus.assessmentsThisMonth >= limitations.maxAssessmentsPerMonth) {
        return {
          canProceed: false,
          reason: `Monthly assessment limit reached. You can perform ${limitations.maxAssessmentsPerMonth} assessments per month.`,
        };
      }
    }

    return { canProceed: true };
  }

  /**
   * Filter assessment results based on subscription
   */
  static filterAssessmentResults(
    results: any,
    subscriptionType: 'FREE' | 'PAID' | 'PREMIUM'
  ): any {
    const limitations = this.getLimitations(subscriptionType);

    if (subscriptionType === 'FREE') {
      // For free users, provide high-level information + AI analysis
      return {
        id: results.id,
        userId: results.userId, // Include userId for authorization checks
        organizationId: results.organizationId, // Include organizationId for authorization checks
        templateId: results.templateId,
        template: results.template,
        organization: results.organization,
        user: results.user,
        status: results.status,
        riskScore: results.riskScore,
        completedAt: results.completedAt,
        createdAt: results.createdAt,
        updatedAt: results.updatedAt,
        gaps: results.gaps,
        risks: results.risks,
        // Include AI analysis fields (Story 3.5)
        aiRiskAnalysis: results.aiRiskAnalysis,
        aiStrategyMatrix: results.aiStrategyMatrix,
        aiGeneratedAt: results.aiGeneratedAt,
        // Basic risk categories only - detailed data hidden
        riskCategories: results.riskCategories?.map((cat: any) => ({
          category: cat.category,
          level: cat.level,
          // Hide detailed breakdown, mitigation strategies, etc.
        })) || [],
        // Hide detailed responses, gaps, and evidence
        isRestricted: true,
        upgradeMessage: 'Upgrade to access detailed analysis, gap identification, and remediation recommendations',
      };
    }

    // Paid/Premium users get full access
    return {
      ...results,
      isRestricted: false,
    };
  }

  /**
   * Filter gap analysis results
   */
  static filterGapResults(
    gaps: any[],
    subscriptionType: 'FREE' | 'PAID' | 'PREMIUM'
  ): any[] {
    const limitations = this.getLimitations(subscriptionType);

    if (!limitations.canViewGapAnalysis) {
      return [
        {
          id: 'restricted',
          title: 'Upgrade Required',
          description: 'Gap analysis is available for paid subscribers',
          severity: 'HIGH',
          category: 'SUBSCRIPTION',
          isRestricted: true,
        },
      ];
    }

    return gaps.map((gap) => ({
      ...gap,
      isRestricted: false,
    }));
  }

  /**
   * Filter risk breakdown results
   */
  static filterRiskBreakdown(
    breakdown: any,
    subscriptionType: 'FREE' | 'PAID' | 'PREMIUM'
  ): any {
    const limitations = this.getLimitations(subscriptionType);

    if (!limitations.canViewRiskBreakdown) {
      return {
        overallScore: breakdown?.overallScore || 0,
        categories: ['Overall risk assessment available'],
        isRestricted: true,
        upgradeMessage: 'Upgrade to view detailed risk breakdown by category',
      };
    }

    return {
      ...breakdown,
      isRestricted: false,
    };
  }

  /**
   * Get user subscription status (mock implementation for now)
   * In production, this would fetch from the database
   */
  static async getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
    // Mock implementation - in production, fetch from database
    return {
      userId,
      userRole: 'USER',
      subscriptionType: 'FREE', // Default to free for now
      creditsUsed: 0,
      creditsLimit: 5,
      assessmentsThisMonth: 0,
      maxAssessmentsPerMonth: 1,
    };
  }

  /**
   * Update user's credit usage after assessment
   */
  static async updateCreditUsage(
    userId: string,
    creditsUsed: number
  ): Promise<{ success: boolean; newBalance: number }> {
    // Mock implementation - in production, update database
    return {
      success: true,
      newBalance: creditsUsed,
    };
  }

  /**
   * Get subscription upgrade recommendations
   */
  static getUpgradeRecommendations(subscriptionType: 'FREE' | 'PAID' | 'PREMIUM'): {
    title: string;
    benefits: string[];
    ctaText: string;
  } {
    switch (subscriptionType) {
      case 'FREE':
        return {
          title: 'Unlock Full Assessment Power',
          benefits: [
            'Detailed risk analysis and evidence review',
            'Gap identification with remediation steps',
            'AI-powered document analysis',
            'Downloadable compliance reports',
            'Up to 10 assessments per month',
          ],
          ctaText: 'Upgrade to Professional',
        };

      case 'PAID':
        return {
          title: 'Scale Your Compliance Program',
          benefits: [
            '2 assessments per month (100 credits)',
            'Priority AI analysis',
            'Advanced reporting features',
            'Multi-organization support',
            'Dedicated compliance advisor',
          ],
          ctaText: 'Upgrade to Premium',
        };

      default:
        return {
          title: 'You have full access',
          benefits: [],
          ctaText: '',
        };
    }
  }
}