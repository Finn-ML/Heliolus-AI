/**
 * Match Reasons Generation
 * Story 1.08: Enhanced Vendor Matching Service - Priority Boost Algorithm
 *
 * Generates human-readable explanations for vendor match scores
 */

import type { Vendor } from '../generated/prisma/index.js';
import type { BaseScore, PriorityBoost } from '../types/matching.types.js';

/**
 * Generate match reasons for a vendor
 * Creates 5-8 human-readable reasons explaining why this vendor matches
 *
 * @param vendor - Vendor object
 * @param baseScore - Base score breakdown
 * @param priorityBoost - Priority boost breakdown
 * @returns Array of match reason strings
 */
export function generateMatchReasons(
  vendor: Vendor,
  baseScore: BaseScore,
  priorityBoost: PriorityBoost
): string[] {
  const reasons: string[] = [];

  // Priority coverage
  if (priorityBoost.matchedPriority) {
    const rank = priorityBoost.topPriorityBoost === 20 ? '#1' :
                 priorityBoost.topPriorityBoost === 15 ? '#2' : '#3';
    reasons.push(`Covers your ${rank} priority: ${priorityBoost.matchedPriority}`);
  }

  // Gap coverage
  const gapCoverage = baseScore.riskAreaCoverage;
  if (gapCoverage >= 30) {
    const percentage = Math.round((gapCoverage / 40) * 100);
    reasons.push(`Addresses ${percentage}% of your identified compliance gaps`);
  }

  // Must-have features
  if (priorityBoost.featureBoost === 10) {
    reasons.push('Has all must-have features you specified');
  } else if (priorityBoost.featureBoost === 5) {
    const missingCount = priorityBoost.missingFeatures.length;
    const missingList = priorityBoost.missingFeatures.join(', ');
    if (missingCount === 1) {
      reasons.push(`Has most features, missing: ${missingList}`);
    } else {
      reasons.push(`Has most features, missing ${missingCount}: ${missingList}`);
    }
  }

  // Company size fit
  if (baseScore.sizeFit === 20) {
    reasons.push('Designed for companies your size');
  } else if (baseScore.sizeFit === 15) {
    reasons.push('Well-suited for companies your size');
  }

  // Geographic coverage
  if (baseScore.geoCoverage === 20) {
    reasons.push('Full coverage for all your jurisdictions');
  } else if (baseScore.geoCoverage >= 15) {
    reasons.push('Covers most of your required jurisdictions');
  } else if (baseScore.geoCoverage >= 10) {
    reasons.push('Partial coverage for your jurisdictions');
  }

  // Price appropriateness
  if (baseScore.priceScore === 20) {
    reasons.push('Within your budget range');
  } else if (baseScore.priceScore === 10) {
    reasons.push('Slightly above budget but within 25% tolerance');
  }

  // Deployment match
  if (priorityBoost.deploymentBoost === 5) {
    reasons.push('Supports your preferred deployment model');
  }

  // Speed to deploy
  if (priorityBoost.speedBoost === 5) {
    reasons.push('Fast implementation timeline (≤90 days)');
  }

  return reasons;
}

/**
 * Generate concise summary reason
 * Creates a one-line summary of the match
 *
 * @param totalScore - Total match score
 * @param baseScore - Base score breakdown
 * @param priorityBoost - Priority boost breakdown
 * @returns Summary string
 */
export function generateMatchSummary(
  totalScore: number,
  baseScore: BaseScore,
  priorityBoost: PriorityBoost
): string {
  if (totalScore >= 120) {
    return 'Excellent match - Highly recommended';
  } else if (totalScore >= 100) {
    return 'Strong match - Recommended';
  } else if (totalScore >= 80) {
    return 'Good match - Worth considering';
  } else {
    return 'Partial match - May require evaluation';
  }
}
