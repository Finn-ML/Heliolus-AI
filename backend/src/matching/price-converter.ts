/**
 * Price Converter Utility
 * Converts budget range strings to numeric ranges for comparison
 * Story 1.07: Enhanced Vendor Matching Service
 */

import type { BudgetRange, PriceRange } from '../types/matching.types.js';

/**
 * Convert budget range enum to numeric price range
 * @param range - Budget range string
 * @returns Numeric price range with min/max
 */
export function convertBudgetRange(range: BudgetRange): PriceRange {
  const budgetMap: Record<BudgetRange, PriceRange> = {
    UNDER_10K: { min: 0, max: 10000 },
    RANGE_10K_50K: { min: 10000, max: 50000 },
    RANGE_50K_100K: { min: 50000, max: 100000 },
    RANGE_100K_250K: { min: 100000, max: 250000 },
    OVER_250K: { min: 250000, max: Infinity },
  };

  return budgetMap[range] || { min: 0, max: Infinity };
}

/**
 * Check if two price ranges overlap
 * @param range1 - First price range
 * @param range2 - Second price range
 * @returns true if ranges overlap
 */
export function priceRangesOverlap(range1: PriceRange, range2: PriceRange): boolean {
  return !(range1.min > range2.max || range1.max < range2.min);
}

/**
 * Check if vendor price is within tolerance of user budget
 * @param userBudget - User's budget range
 * @param vendorPrice - Vendor's price range
 * @param tolerance - Tolerance multiplier (default 1.25 = 25%)
 * @returns true if vendor minimum price is within tolerance
 */
export function priceWithinTolerance(
  userBudget: PriceRange,
  vendorPrice: PriceRange,
  tolerance: number = 1.25
): boolean {
  const maxBudgetWithTolerance = userBudget.max * tolerance;
  return vendorPrice.min <= maxBudgetWithTolerance;
}
