/**
 * Base Scorer Utility Functions
 * Implements the 4-component base scoring algorithm for vendor matching
 * Story 1.07: Enhanced Vendor Matching Service
 */

import type { Vendor, Gap, AssessmentPriorities, CompanySize } from '../generated/prisma/index.js';
import {
  SCORING_WEIGHTS,
  SIZE_FIT_SCORES,
  PRICE_TOLERANCE,
  type BudgetRange,
} from '../types/matching.types.js';
import { convertBudgetRange, priceRangesOverlap, priceWithinTolerance } from './price-converter.js';

/**
 * Calculate Risk Area Coverage score (0-40 points)
 * Measures how many assessment gaps the vendor can address
 *
 * @param vendor - Vendor to score
 * @param gaps - Assessment gaps
 * @returns Score from 0 to 40
 */
export function calculateRiskAreaCoverage(vendor: Vendor, gaps: Gap[]): number {
  // Edge case: No gaps = perfect coverage
  if (gaps.length === 0) {
    return SCORING_WEIGHTS.RISK_AREA_COVERAGE;
  }

  const vendorCategories = vendor.categories || [];

  // Count how many gaps the vendor can cover
  const coveredGaps = gaps.filter((gap) =>
    vendorCategories.some((category) => category === gap.category)
  ).length;

  // Calculate proportional score
  const coverage = coveredGaps / gaps.length;
  return coverage * SCORING_WEIGHTS.RISK_AREA_COVERAGE;
}

/**
 * Get adjacent company size segments for partial matching
 * @param size - Company size
 * @returns Array of adjacent segments
 */
function getAdjacentSegments(size: CompanySize): CompanySize[] {
  const adjacencyMap: Record<CompanySize, CompanySize[]> = {
    STARTUP: ['SMB'],
    SMB: ['STARTUP', 'MIDMARKET'],
    MIDMARKET: ['SMB', 'ENTERPRISE'],
    ENTERPRISE: ['MIDMARKET'],
  };
  return adjacencyMap[size] || [];
}

/**
 * Calculate Company Size Fit score (0-20 points)
 * Measures how well the vendor's target segments match the user's company size
 *
 * @param priorities - Assessment priorities with company size
 * @param vendor - Vendor with target segments
 * @returns Score from 0 to 20
 */
export function calculateSizeFit(priorities: AssessmentPriorities, vendor: Vendor): number {
  const userSize = priorities.companySize;
  const vendorSegments = vendor.targetSegments || [];

  // Edge case: Vendor has no target segments
  if (vendorSegments.length === 0) {
    return SIZE_FIT_SCORES.NO_MATCH;
  }

  // Exact match: vendor targets this company size
  if (vendorSegments.includes(userSize)) {
    return SIZE_FIT_SCORES.EXACT_MATCH;
  }

  // Partial match: vendor targets adjacent segment
  const adjacentSegments = getAdjacentSegments(userSize);
  const hasAdjacentMatch = adjacentSegments.some((segment) =>
    vendorSegments.includes(segment)
  );

  if (hasAdjacentMatch) {
    return SIZE_FIT_SCORES.PARTIAL_MATCH;
  }

  return SIZE_FIT_SCORES.NO_MATCH;
}

/**
 * Calculate Geographic Coverage score (0-20 points)
 * Measures how well the vendor covers required jurisdictions
 *
 * @param priorities - Assessment priorities with jurisdictions
 * @param vendor - Vendor with geographic coverage
 * @returns Score from 0 to 20
 */
export function calculateGeoCoverage(priorities: AssessmentPriorities, vendor: Vendor): number {
  const requiredJurisdictions = priorities.jurisdictions || [];
  const vendorCoverage = vendor.geographicCoverage || [];

  // Edge case: No jurisdictions required
  if (requiredJurisdictions.length === 0) {
    return SCORING_WEIGHTS.GEO_COVERAGE;
  }

  // Global vendor covers everything
  if (vendorCoverage.includes('GLOBAL') || vendorCoverage.includes('Global')) {
    return SCORING_WEIGHTS.GEO_COVERAGE;
  }

  // Count matched jurisdictions (case-insensitive)
  const vendorCoverageLower = vendorCoverage.map((j) => j.toLowerCase());
  const matched = requiredJurisdictions.filter((jurisdiction) =>
    vendorCoverageLower.includes(jurisdiction.toLowerCase())
  ).length;

  // Calculate proportional score
  const coverage = matched / requiredJurisdictions.length;
  return coverage * SCORING_WEIGHTS.GEO_COVERAGE;
}

/**
 * Calculate Price Appropriateness score (0-20 points)
 * Measures how well the vendor's pricing fits the user's budget
 *
 * @param priorities - Assessment priorities with budget range
 * @param vendor - Vendor with pricing range
 * @returns Score from 0 to 20
 */
export function calculatePriceScore(priorities: AssessmentPriorities, vendor: Vendor): number {
  // Edge case: Vendor has no pricing range
  if (!vendor.pricingRange) {
    return SCORING_WEIGHTS.PRICE / 2; // Give partial score for unknown pricing
  }

  const userBudget = convertBudgetRange(priorities.budgetRange as BudgetRange);
  const vendorPrice = convertBudgetRange(vendor.pricingRange as BudgetRange);

  // Check for price range overlap
  if (priceRangesOverlap(userBudget, vendorPrice)) {
    return SCORING_WEIGHTS.PRICE; // Full score: 20 points
  }

  // Check if vendor is within 25% tolerance
  if (priceWithinTolerance(userBudget, vendorPrice, PRICE_TOLERANCE)) {
    return SCORING_WEIGHTS.PRICE / 2; // Half score: 10 points
  }

  return 0; // Over budget tolerance
}
