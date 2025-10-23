/**
 * Type definitions for Vendor Matching Algorithm
 * Story 1.07: Enhanced Vendor Matching Service - Base Scoring Algorithm
 */

/**
 * Base score breakdown for vendor matching
 * Total: 0-100 points across 4 categories
 */
export interface BaseScore {
  vendorId: string;
  riskAreaCoverage: number;  // 0-40 points
  sizeFit: number;           // 0-20 points
  geoCoverage: number;       // 0-20 points
  priceScore: number;        // 0-20 points
  totalBase: number;         // Sum of above (0-100)
}

/**
 * Numeric price range for budget comparisons
 */
export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Budget range enum values mapped to numeric ranges
 */
export type BudgetRange =
  | 'UNDER_10K'
  | 'RANGE_10K_50K'
  | 'RANGE_50K_100K'
  | 'RANGE_100K_250K'
  | 'OVER_250K';

/**
 * Scoring constants for the base algorithm
 */
export const SCORING_WEIGHTS = {
  RISK_AREA_COVERAGE: 40,
  SIZE_FIT: 20,
  GEO_COVERAGE: 20,
  PRICE: 20,
} as const;

/**
 * Size fit scoring values
 */
export const SIZE_FIT_SCORES = {
  EXACT_MATCH: 20,
  PARTIAL_MATCH: 15,
  NO_MATCH: 0,
} as const;

/**
 * Price tolerance for scoring
 */
export const PRICE_TOLERANCE = 1.25; // 25% over budget

/**
 * Priority boost breakdown for vendor matching
 * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
 * Total: 0-40 points across 4 categories
 */
export interface PriorityBoost {
  vendorId: string;
  topPriorityBoost: number;       // 0-20 points
  matchedPriority?: string;       // Name of matched priority
  featureBoost: number;           // 0-10 points
  missingFeatures: string[];      // List of missing features
  deploymentBoost: number;        // 0-5 points
  speedBoost: number;             // 0-5 points
  totalBoost: number;             // Sum of above (0-40)
}

/**
 * Combined vendor match score with base + priority boost
 * Story 1.08: Complete vendor scoring
 */
export interface VendorMatchScore {
  vendorId: string;
  vendor: any;                    // Full vendor object (will be typed as Vendor from Prisma)
  baseScore: BaseScore;           // From Story 1.7
  priorityBoost: PriorityBoost;   // Story 1.8
  totalScore: number;             // baseScore.totalBase + priorityBoost.totalBoost
  matchReasons: string[];         // Human-readable explanations
}

/**
 * Scoring constants for priority boost algorithm
 */
export const PRIORITY_BOOST_WEIGHTS = {
  TOP_PRIORITY_RANK_1: 20,
  TOP_PRIORITY_RANK_2: 15,
  TOP_PRIORITY_RANK_3: 10,
  FEATURES_ALL: 10,
  FEATURES_PARTIAL: 5,
  DEPLOYMENT_MATCH: 5,
  SPEED_BOOST: 5,
} as const;

/**
 * Default vendor match threshold
 */
export const DEFAULT_MATCH_THRESHOLD = 80;
