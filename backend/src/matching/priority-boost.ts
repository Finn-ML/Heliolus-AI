/**
 * Priority Boost Algorithm Implementation
 * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
 *
 * Calculates 0-40 points boost based on user priorities:
 * - Top Priority Coverage: 0-20 points
 * - Must-Have Features: 0-10 points
 * - Deployment Match: 0-5 points
 * - Speed to Deploy: 0-5 points
 */

import type { Vendor, AssessmentPriorities } from '../generated/prisma/index.js';
import type { PriorityBoost } from '../types/matching.types.js';
import { PRIORITY_BOOST_WEIGHTS } from '../types/matching.types.js';

/**
 * Normalize priority format from lowercase-hyphenated to UPPERCASE_SNAKE_CASE
 * to match VendorCategory enum format
 * Story 1.2: Normalize Priority Format in Vendor Matching
 *
 * @param priority - Priority string in lowercase-hyphen format (e.g., "transaction-monitoring")
 * @returns Normalized priority in UPPERCASE_SNAKE_CASE format (e.g., "TRANSACTION_MONITORING"), or null if invalid
 *
 * @example
 * normalizePriorityFormat("transaction-monitoring") // "TRANSACTION_MONITORING"
 * normalizePriorityFormat("risk-scoring") // "RISK_SCORING"
 * normalizePriorityFormat(null) // null
 */
export function normalizePriorityFormat(priority: string | null | undefined): string | null {
  if (!priority || typeof priority !== 'string' || priority.trim() === '') {
    return null;
  }

  // Convert lowercase-hyphen to UPPERCASE_SNAKE_CASE
  return priority
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');
}

/**
 * Calculate top priority coverage boost
 * Checks if vendor categories match user's ranked priorities (#1, #2, #3)
 * Returns highest-ranked match only (no stacking)
 * Story 1.2: Fixed to normalize priority format before comparison
 *
 * @param vendor - Vendor to evaluate
 * @param priorities - User's assessment priorities
 * @returns Boost score (0-20) and matched priority name
 */
export function calculateTopPriorityBoost(
  vendor: Vendor,
  priorities: AssessmentPriorities
): { boost: number; matchedPriority: string | null } {
  const rankedPriorities = priorities.rankedPriorities || [];
  const vendorCategories = (vendor.categories || []).map(cat => cat.toString());

  // Check #1 priority (20 points)
  const normalizedPriority1 = normalizePriorityFormat(rankedPriorities[0]);
  if (normalizedPriority1 && vendorCategories.includes(normalizedPriority1)) {
    return {
      boost: PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_1,
      matchedPriority: rankedPriorities[0] // Keep original for display
    };
  }

  // Check #2 priority (10 points)
  const normalizedPriority2 = normalizePriorityFormat(rankedPriorities[1]);
  if (normalizedPriority2 && vendorCategories.includes(normalizedPriority2)) {
    return {
      boost: PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_2,
      matchedPriority: rankedPriorities[1] // Keep original for display
    };
  }

  // Check #3 priority (5 points)
  const normalizedPriority3 = normalizePriorityFormat(rankedPriorities[2]);
  if (normalizedPriority3 && vendorCategories.includes(normalizedPriority3)) {
    return {
      boost: PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_3,
      matchedPriority: rankedPriorities[2] // Keep original for display
    };
  }

  return { boost: 0, matchedPriority: null };
}

/**
 * Calculate must-have features boost
 * Compares required features against vendor features
 *
 * @param vendor - Vendor to evaluate
 * @param priorities - User's assessment priorities
 * @returns Boost score (0-10) and list of missing features
 */
export function calculateFeatureBoost(
  vendor: Vendor,
  priorities: AssessmentPriorities
): { boost: number; missingFeatures: string[] } {
  const requiredFeatures = priorities.mustHaveFeatures || [];
  const vendorFeatures = vendor.features || [];

  // If no features required, vendor gets full points
  if (requiredFeatures.length === 0) {
    return { boost: PRIORITY_BOOST_WEIGHTS.FEATURES_ALL, missingFeatures: [] };
  }

  // Find missing features
  const missing = requiredFeatures.filter(
    feature => !vendorFeatures.includes(feature)
  );

  // All features present
  if (missing.length === 0) {
    return { boost: PRIORITY_BOOST_WEIGHTS.FEATURES_ALL, missingFeatures: [] };
  }

  // Missing 1-2 features: partial credit
  if (missing.length <= 2) {
    return { boost: PRIORITY_BOOST_WEIGHTS.FEATURES_PARTIAL, missingFeatures: missing };
  }

  // Missing 3+ features: no points
  return { boost: 0, missingFeatures: missing };
}

/**
 * Calculate deployment preference match boost
 * Checks if vendor supports user's preferred deployment model
 *
 * @param vendor - Vendor to evaluate
 * @param priorities - User's assessment priorities
 * @returns Boost score (0-5)
 */
export function calculateDeploymentBoost(
  vendor: Vendor,
  priorities: AssessmentPriorities
): number {
  const preference = priorities.deploymentPreference;
  const vendorOptions = vendor.deploymentOptions || '';

  // User is flexible: all vendors qualify
  if (preference === 'FLEXIBLE' || preference === 'Flexible') {
    return PRIORITY_BOOST_WEIGHTS.DEPLOYMENT_MATCH;
  }

  // Check if vendor supports user preference
  // Note: deploymentOptions is a string field, so we check if it includes the preference
  if (vendorOptions.toLowerCase().includes(preference.toLowerCase())) {
    return PRIORITY_BOOST_WEIGHTS.DEPLOYMENT_MATCH;
  }

  return 0;
}

/**
 * Calculate speed to deploy boost
 * Rewards vendors with fast implementation when urgency is immediate
 *
 * @param vendor - Vendor to evaluate
 * @param priorities - User's assessment priorities
 * @returns Boost score (0-5)
 */
export function calculateSpeedBoost(
  vendor: Vendor,
  priorities: AssessmentPriorities
): number {
  const urgency = priorities.implementationUrgency;

  // Only apply if user needs immediate implementation
  if (urgency !== 'IMMEDIATE' && urgency !== 'Immediate') {
    return 0;
  }

  const vendorTimeline = vendor.implementationTimeline || 365; // Default 1 year

  // Fast implementation (≤90 days)
  if (vendorTimeline <= 90) {
    return PRIORITY_BOOST_WEIGHTS.SPEED_BOOST;
  }

  return 0;
}

/**
 * Calculate complete priority boost for a vendor
 * Combines all boost components into total score
 *
 * @param vendor - Vendor to evaluate
 * @param priorities - User's assessment priorities
 * @returns Complete priority boost breakdown
 */
export function calculatePriorityBoost(
  vendor: Vendor,
  priorities: AssessmentPriorities
): PriorityBoost {
  // Calculate individual components
  const topPriority = calculateTopPriorityBoost(vendor, priorities);
  const features = calculateFeatureBoost(vendor, priorities);
  const deploymentBoost = calculateDeploymentBoost(vendor, priorities);
  const speedBoost = calculateSpeedBoost(vendor, priorities);

  // Sum all boosts
  const totalBoost =
    topPriority.boost +
    features.boost +
    deploymentBoost +
    speedBoost;

  return {
    vendorId: vendor.id,
    topPriorityBoost: topPriority.boost,
    matchedPriority: topPriority.matchedPriority || undefined,
    featureBoost: features.boost,
    missingFeatures: features.missingFeatures,
    deploymentBoost,
    speedBoost,
    totalBoost,
  };
}
