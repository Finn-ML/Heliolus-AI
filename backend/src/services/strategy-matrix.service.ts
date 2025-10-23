/**
 * Strategy Matrix Service
 * Organizes compliance gaps into timeline-based remediation buckets
 * Story 1.09: Strategy Matrix Service - Timeline-Based Gap Organization
 */

import { BaseService } from './base.service.js';
import type { Gap, Vendor } from '../generated/prisma/index.js';
import type {
  StrategyMatrix,
  TimelineBucket,
  VendorRecommendation,
} from '../types/strategy-matrix.types.js';
import { COST_RANGE_MIDPOINTS } from '../types/strategy-matrix.types.js';
import type Redis from 'ioredis';

export class StrategyMatrixService extends BaseService {
  private redis?: Redis;

  constructor() {
    super();
    // Redis will be injected if available
    this.redis = undefined;
  }

  /**
   * Set Redis client for caching
   * @param redis - Redis client instance
   */
  setRedis(redis: Redis): void {
    this.redis = redis;
  }

  /**
   * Assign timeline bucket based on numeric priority score
   * @param priorityScore - Numeric priority (1-10)
   * @returns Timeline bucket name
   */
  private assignBucket(priorityScore: number): 'immediate' | 'nearTerm' | 'strategic' {
    if (priorityScore >= 8) return 'immediate';   // Priority 8-10: Urgent
    if (priorityScore >= 4) return 'nearTerm';    // Priority 4-7: Planned
    return 'strategic';                            // Priority 1-3: Long-term
  }

  /**
   * Sum cost ranges and convert to human-readable estimate
   * @param gaps - Array of gaps
   * @returns Human-readable cost range estimate
   */
  private sumCostRanges(gaps: Gap[]): string {
    if (gaps.length === 0) return '€0';

    // Convert cost ranges to numeric midpoints and sum
    const totalCost = gaps.reduce((sum, gap) => {
      const costRange = gap.estimatedCost || 'UNDER_10K';
      return sum + (COST_RANGE_MIDPOINTS[costRange] || 0);
    }, 0);

    // Convert back to human-readable range (±30% variance)
    const lowerBound = Math.round(totalCost * 0.7);
    const upperBound = Math.round(totalCost * 1.3);

    if (totalCost < 10000) {
      return `€${Math.round(totalCost / 1000)}K estimated`;
    }

    return `€${Math.round(lowerBound / 1000)}K-€${Math.round(upperBound / 1000)}K estimated`;
  }

  /**
   * Aggregate bucket metrics
   * @param gaps - Gaps in the bucket
   * @returns Aggregated metrics
   */
  private aggregateBucket(gaps: Gap[]): {
    gapCount: number;
    effortDistribution: { SMALL: number; MEDIUM: number; LARGE: number };
    estimatedCostRange: string;
  } {
    const effortDist = {
      SMALL: gaps.filter((g) => g.estimatedEffort === 'SMALL').length,
      MEDIUM: gaps.filter((g) => g.estimatedEffort === 'MEDIUM').length,
      LARGE: gaps.filter((g) => g.estimatedEffort === 'LARGE').length,
    };

    const estimatedCost = this.sumCostRanges(gaps);

    return {
      gapCount: gaps.length,
      effortDistribution: effortDist,
      estimatedCostRange: estimatedCost,
    };
  }

  /**
   * Find top vendors covering gaps in a bucket
   * @param gaps - Gaps in the bucket
   * @param limit - Maximum number of vendors to return (default: 3)
   * @returns Array of vendor recommendations sorted by gap coverage
   */
  private async findTopVendors(gaps: Gap[], limit: number = 3): Promise<VendorRecommendation[]> {
    if (gaps.length === 0) {
      return [];
    }

    // Extract unique gap categories
    const gapCategories = Array.from(new Set(gaps.map((g) => g.category)));

    // Fetch vendors covering these categories
    const vendors = await this.prisma.vendor.findMany({
      where: {
        status: 'APPROVED',
        categories: { hasSome: gapCategories },
      },
    });

    // Score vendors by gaps covered
    const scoredVendors = vendors.map((vendor) => {
      const vendorCategories = vendor.categories.map((cat) => cat.toString());
      const coveredGaps = gaps.filter((gap) => vendorCategories.includes(gap.category));

      return {
        vendor,
        gapsCovered: coveredGaps.length,
        coveredGapIds: coveredGaps.map((g) => g.id),
      };
    });

    // Sort by gaps covered (descending) and return top N
    return scoredVendors
      .sort((a, b) => b.gapsCovered - a.gapsCovered)
      .slice(0, limit);
  }

  /**
   * Build a complete timeline bucket with all metrics
   * @param gaps - Gaps for this bucket
   * @param timeline - Timeline label
   * @returns Complete timeline bucket
   */
  private async buildBucket(gaps: Gap[], timeline: string): Promise<TimelineBucket> {
    const metrics = this.aggregateBucket(gaps);
    const topVendors = await this.findTopVendors(gaps, 3);

    return {
      timeline,
      gaps,
      gapCount: gaps.length,
      effortDistribution: metrics.effortDistribution,
      estimatedCostRange: metrics.estimatedCostRange,
      topVendors,
    };
  }

  /**
   * Generate complete strategy matrix for an assessment
   * @param assessmentId - Assessment ID
   * @returns Strategy matrix with three timeline buckets
   */
  async generateStrategyMatrix(assessmentId: string): Promise<StrategyMatrix> {
    try {
      // Check cache first
      if (this.redis) {
        const cacheKey = `strategy_matrix:${assessmentId}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
          this.logger.info(`Strategy matrix cache hit for ${assessmentId}`);
          return JSON.parse(cached);
        }
      }

      // Generate matrix
      const matrix = await this._generateMatrix(assessmentId);

      // Cache for 7 days
      if (this.redis) {
        const TTL = 7 * 24 * 60 * 60; // 7 days in seconds
        const cacheKey = `strategy_matrix:${assessmentId}`;
        await this.redis.setex(cacheKey, TTL, JSON.stringify(matrix));
        this.logger.info(`Strategy matrix generated and cached for ${assessmentId}`);
      }

      return matrix;
    } catch (error) {
      this.logger.error('Error generating strategy matrix', {
        assessmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Internal method to generate strategy matrix
   * @param assessmentId - Assessment ID
   * @returns Strategy matrix
   */
  private async _generateMatrix(assessmentId: string): Promise<StrategyMatrix> {
    // Fetch all gaps with priority score
    const gaps = await this.prisma.gap.findMany({
      where: { assessmentId },
      orderBy: { priorityScore: 'desc' },
    });

    // Partition gaps into buckets based on priorityScore
    const immediate = gaps.filter((g) => g.priorityScore && g.priorityScore >= 8);
    const nearTerm = gaps.filter((g) => g.priorityScore && g.priorityScore >= 4 && g.priorityScore < 8);
    const strategic = gaps.filter((g) => g.priorityScore && g.priorityScore < 4);

    // Build each bucket in parallel
    const [immediateBucket, nearTermBucket, strategicBucket] = await Promise.all([
      this.buildBucket(immediate, '0-6 months'),
      this.buildBucket(nearTerm, '6-18 months'),
      this.buildBucket(strategic, '18+ months'),
    ]);

    return {
      assessmentId,
      generatedAt: new Date(),
      immediate: immediateBucket,
      nearTerm: nearTermBucket,
      strategic: strategicBucket,
    };
  }

  /**
   * Invalidate cache for an assessment's strategy matrix
   * @param assessmentId - Assessment ID
   */
  async invalidateCache(assessmentId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const cacheKey = `strategy_matrix:${assessmentId}`;
      await this.redis.del(cacheKey);
      this.logger.info(`Strategy matrix cache invalidated for ${assessmentId}`);
    } catch (error) {
      this.logger.error('Error invalidating strategy matrix cache', {
        assessmentId,
        error: error.message,
      });
    }
  }
}
