/**
 * Vendor Matching Service
 * Implements base scoring algorithm for vendor-to-assessment matching
 * Story 1.07: Enhanced Vendor Matching Service - Base Scoring Algorithm
 */

import { BaseService } from './base.service.js';
import type { Vendor, Assessment, AssessmentPriorities, Gap } from '../generated/prisma/index.js';
import type { BaseScore, PriorityBoost, VendorMatchScore } from '../types/matching.types.js';
import {
  calculateRiskAreaCoverage,
  calculateSizeFit,
  calculateGeoCoverage,
  calculatePriceScore,
} from '../matching/base-scorer.js';
import { calculatePriorityBoost as calcPriorityBoost } from '../matching/priority-boost.js';
import { generateMatchReasons } from '../matching/match-reasons.js';

export class VendorMatchingService extends BaseService {
  /**
   * Calculate base score for a single vendor against an assessment
   * @param vendor - Vendor to score
   * @param assessment - Assessment (not currently used, kept for interface consistency)
   * @param priorities - Assessment priorities
   * @param gaps - Assessment gaps
   * @returns Base score breakdown
   */
  async calculateBaseScore(
    vendor: Vendor,
    assessment: Assessment,
    priorities: AssessmentPriorities,
    gaps: Gap[]
  ): Promise<BaseScore> {
    try {
      // Calculate individual component scores
      const riskAreaCoverage = calculateRiskAreaCoverage(vendor, gaps);
      const sizeFit = calculateSizeFit(priorities, vendor);
      const geoCoverage = calculateGeoCoverage(priorities, vendor);
      const priceScore = calculatePriceScore(priorities, vendor);

      // Sum all components for total base score
      const totalBase = riskAreaCoverage + sizeFit + geoCoverage + priceScore;

      return {
        vendorId: vendor.id,
        riskAreaCoverage,
        sizeFit,
        geoCoverage,
        priceScore,
        totalBase,
      };
    } catch (error) {
      this.logger.error('Error calculating base score', {
        vendorId: vendor.id,
        assessmentId: assessment.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Score all vendors for a given assessment
   * Optimized for performance with batch data fetching and parallel processing
   *
   * @param assessmentId - Assessment ID
   * @param priorities - Assessment priorities
   * @returns Array of base scores for all active vendors
   */
  async scoreAllVendors(
    assessmentId: string,
    priorities: AssessmentPriorities
  ): Promise<BaseScore[]> {
    try {
      // Batch fetch data once for all vendors
      const [vendors, gaps, assessment] = await Promise.all([
        this.prisma.vendor.findMany({
          where: {
            status: 'APPROVED', // Only score approved vendors
          },
        }),
        this.prisma.gap.findMany({
          where: { assessmentId },
          select: { id: true, category: true },
        }),
        this.prisma.assessment.findUnique({
          where: { id: assessmentId },
        }),
      ]);

      if (!assessment) {
        throw this.createError(
          `Assessment ${assessmentId} not found`,
          404,
          'ASSESSMENT_NOT_FOUND'
        );
      }

      // Score all vendors in parallel
      const scores = await Promise.all(
        vendors.map((vendor) => this.calculateBaseScore(vendor, assessment, priorities, gaps))
      );

      this.logger.info('Scored all vendors', {
        assessmentId,
        vendorCount: vendors.length,
        gapCount: gaps.length,
      });

      return scores;
    } catch (error) {
      this.logger.error('Error scoring all vendors', {
        assessmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get top matching vendors for an assessment
   * @param assessmentId - Assessment ID
   * @param priorities - Assessment priorities
   * @param limit - Maximum number of vendors to return (default: 15)
   * @param minScore - Minimum score threshold (default: 0)
   * @returns Array of base scores sorted by totalBase descending
   */
  async getTopVendorMatches(
    assessmentId: string,
    priorities: AssessmentPriorities,
    limit: number = 15,
    minScore: number = 0
  ): Promise<BaseScore[]> {
    try {
      // Score all vendors
      const scores = await this.scoreAllVendors(assessmentId, priorities);

      // Filter by minimum score and sort descending
      const topMatches = scores
        .filter((score) => score.totalBase >= minScore)
        .sort((a, b) => b.totalBase - a.totalBase)
        .slice(0, limit);

      this.logger.info('Retrieved top vendor matches', {
        assessmentId,
        totalScored: scores.length,
        topMatches: topMatches.length,
        minScore,
      });

      return topMatches;
    } catch (error) {
      this.logger.error('Error getting top vendor matches', {
        assessmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate priority boost for a single vendor
   * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
   *
   * @param vendor - Vendor to score
   * @param priorities - Assessment priorities
   * @param gaps - Assessment gaps (not currently used but kept for future expansion)
   * @returns Priority boost breakdown
   */
  async calculatePriorityBoost(
    vendor: Vendor,
    priorities: AssessmentPriorities,
    gaps: Gap[]
  ): Promise<PriorityBoost> {
    try {
      const boost = calcPriorityBoost(vendor, priorities);

      this.logger.debug('Calculated priority boost', {
        vendorId: vendor.id,
        totalBoost: boost.totalBoost,
        breakdown: {
          topPriority: boost.topPriorityBoost,
          features: boost.featureBoost,
          deployment: boost.deploymentBoost,
          speed: boost.speedBoost,
        },
      });

      return boost;
    } catch (error) {
      this.logger.error('Error calculating priority boost', {
        vendorId: vendor.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate total score combining base and priority boost
   * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
   *
   * @param baseScore - Base score breakdown
   * @param priorityBoost - Priority boost breakdown
   * @returns Total score (capped at 140)
   */
  calculateTotalScore(
    baseScore: BaseScore,
    priorityBoost: PriorityBoost
  ): number {
    const total = baseScore.totalBase + priorityBoost.totalBoost;
    // Cap at 140 (max possible: 100 base + 40 boost)
    return Math.min(total, 140);
  }

  /**
   * Match all vendors to an assessment with full scoring (base + priority boost)
   * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
   *
   * @param assessmentId - Assessment ID
   * @param prioritiesId - Priorities ID
   * @returns Array of complete vendor match scores sorted by totalScore descending
   */
  async matchVendorsToAssessment(
    assessmentId: string,
    prioritiesId: string
  ): Promise<VendorMatchScore[]> {
    try {
      // Fetch all required data
      const [assessment, priorities, vendors, gaps] = await Promise.all([
        this.prisma.assessment.findUnique({
          where: { id: assessmentId },
        }),
        this.prisma.assessmentPriorities.findUnique({
          where: { id: prioritiesId },
        }),
        this.prisma.vendor.findMany({
          where: { status: 'APPROVED' },
        }),
        this.prisma.gap.findMany({
          where: { assessmentId },
        }),
      ]);

      if (!assessment) {
        throw this.createError(
          `Assessment ${assessmentId} not found`,
          404,
          'ASSESSMENT_NOT_FOUND'
        );
      }

      if (!priorities) {
        throw this.createError(
          `Priorities ${prioritiesId} not found`,
          404,
          'PRIORITIES_NOT_FOUND'
        );
      }

      // Score all vendors with both base and priority boost
      const scores = await Promise.all(
        vendors.map(async (vendor) => {
          // Calculate base score
          const baseScore = await this.calculateBaseScore(
            vendor,
            assessment,
            priorities,
            gaps
          );

          // Calculate priority boost
          const priorityBoost = await this.calculatePriorityBoost(
            vendor,
            priorities,
            gaps
          );

          // Calculate total score
          const totalScore = this.calculateTotalScore(baseScore, priorityBoost);

          // Generate match reasons
          const matchReasons = generateMatchReasons(vendor, baseScore, priorityBoost);

          return {
            vendorId: vendor.id,
            vendor,
            baseScore,
            priorityBoost,
            totalScore,
            matchReasons,
          };
        })
      );

      // Sort by total score descending
      const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);

      this.logger.info('Matched vendors to assessment', {
        assessmentId,
        vendorCount: vendors.length,
        topScore: sortedScores[0]?.totalScore || 0,
      });

      return sortedScores;
    } catch (error) {
      this.logger.error('Error matching vendors to assessment', {
        assessmentId,
        prioritiesId,
        error: error.message,
      });
      throw error;
    }
  }
}
