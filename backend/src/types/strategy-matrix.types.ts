/**
 * Type definitions for Strategy Matrix Service
 * Story 1.09: Strategy Matrix Service - Timeline-Based Gap Organization
 */

import type { Gap, Vendor } from '../generated/prisma/index.js';
import type { EffortRange } from '../generated/prisma/index.js';

/**
 * Vendor recommendation with gap coverage details
 */
export interface VendorRecommendation {
  vendor: Vendor;
  gapsCovered: number;
  coveredGapIds: string[];
}

/**
 * Timeline bucket containing gaps and aggregated metrics
 */
export interface TimelineBucket {
  timeline: string;             // "0-6 months", "6-18 months", "18+ months"
  gaps: Gap[];                  // Full gap objects
  gapCount: number;             // Total gaps in bucket
  effortDistribution: {
    SMALL: number;
    MEDIUM: number;
    LARGE: number;
  };
  estimatedCostRange: string;   // "€50K-€150K estimated"
  topVendors: VendorRecommendation[];  // Top 3 vendors
}

/**
 * Complete strategy matrix with all three timeline buckets
 */
export interface StrategyMatrix {
  assessmentId: string;
  generatedAt: Date;
  immediate: TimelineBucket;    // 0-6 months (priority 8-10)
  nearTerm: TimelineBucket;     // 6-18 months (priority 4-7)
  strategic: TimelineBucket;    // 18+ months (priority 1-3)
}

/**
 * Cost range midpoints for summing estimates
 */
export const COST_RANGE_MIDPOINTS: Record<string, number> = {
  UNDER_10K: 5000,
  RANGE_10K_50K: 30000,
  RANGE_50K_100K: 75000,
  RANGE_100K_250K: 175000,
  OVER_250K: 400000,
};
