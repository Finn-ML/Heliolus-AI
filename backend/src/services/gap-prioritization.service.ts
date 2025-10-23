/**
 * Gap Prioritization Service
 * Calculates severity, priority, effort, and cost for compliance gaps
 * Story 1.05: Gap Prioritization Enhancement
 */

import {
  Severity,
  Priority,
  EffortRange,
  CostRange,
  GapPrioritizationInput,
  PriorityScore,
  scoreToPriority,
} from '../types/gap-prioritization.types.js';

/**
 * Calculate gap severity based on score
 * @param score - Final score from Answer (0-5 scale)
 * @returns Severity classification
 */
export function calculateGapSeverity(score: number): Severity {
  if (score < 1.5) {
    return Severity.CRITICAL;
  } else if (score < 2.5) {
    return Severity.HIGH;
  } else if (score < 3.5) {
    return Severity.MEDIUM;
  } else {
    return Severity.LOW;
  }
}

/**
 * Calculate numeric priority score (1-10) based on multiple factors
 * Formula:
 *   priority = (5 - score) * 2                    // Base: 0-10 from score
 *   priority += question.isFoundational ? 2 : 0   // Boost foundational
 *   priority += section.weight * 5                // Boost high-weight sections
 *   priority = Math.min(10, Math.round(priority)) // Cap at 10
 *
 * @param input - Gap prioritization input parameters
 * @returns Numeric priority score (1-10)
 */
export function calculatePriorityScore(input: GapPrioritizationInput): PriorityScore {
  const { score, isFoundational, sectionWeight } = input;

  // Base priority from score (lower score = higher priority)
  // Score range 0-5 maps to priority 0-10
  let priority = (5 - score) * 2;

  // Boost for foundational questions
  if (isFoundational) {
    priority += 2;
  }

  // Boost based on section regulatory importance
  priority += sectionWeight * 5;

  // Cap at maximum priority of 10, minimum of 1
  return Math.max(1, Math.min(10, Math.round(priority)));
}

/**
 * Calculate gap priority enum from numeric score
 * @param input - Gap prioritization input parameters
 * @returns Priority enum value
 */
export function calculateGapPriority(input: GapPrioritizationInput): Priority {
  const score = calculatePriorityScore(input);
  return scoreToPriority(score);
}

/**
 * Estimate effort required to remediate gap
 * Logic:
 *   - LARGE: weight >0.25 AND foundational AND score <2.0
 *   - MEDIUM: weight 0.15-0.25 OR foundational
 *   - SMALL: everything else
 *
 * @param sectionWeight - Section weight (0-1 scale)
 * @param isFoundational - Whether question is foundational
 * @param score - Final score from Answer (0-5 scale)
 * @returns Effort range classification
 */
export function estimateEffort(
  sectionWeight: number,
  isFoundational: boolean,
  score: number
): EffortRange {
  // Large effort: major section + foundational + severe gap
  if (sectionWeight > 0.25 && isFoundational && score < 2.0) {
    return EffortRange.LARGE;
  }

  // Medium effort: moderate section OR foundational question
  if (sectionWeight >= 0.15 && sectionWeight <= 0.25) {
    return EffortRange.MEDIUM;
  }
  if (isFoundational) {
    return EffortRange.MEDIUM;
  }

  // Small effort: everything else
  return EffortRange.SMALL;
}

/**
 * Estimate cost range to remediate gap
 * Logic based on effort, severity, and section weight:
 *   - OVER_250K: LARGE + CRITICAL + weight >0.20
 *   - RANGE_100K_250K: LARGE + CRITICAL
 *   - RANGE_50K_100K: LARGE OR (MEDIUM + foundational)
 *   - RANGE_10K_50K: MEDIUM OR (SMALL + foundational)
 *   - UNDER_10K: SMALL
 *
 * @param effort - Estimated effort range
 * @param severity - Gap severity
 * @param sectionWeight - Section weight (0-1 scale)
 * @param isFoundational - Whether question is foundational
 * @returns Cost range classification
 */
export function estimateCost(
  effort: EffortRange,
  severity: Severity,
  sectionWeight: number,
  isFoundational: boolean
): CostRange {
  // Highest cost: large effort + critical severity + major section
  if (effort === EffortRange.LARGE && severity === Severity.CRITICAL && sectionWeight > 0.20) {
    return CostRange.OVER_250K;
  }

  // Very high cost: large effort + critical severity
  if (effort === EffortRange.LARGE && severity === Severity.CRITICAL) {
    return CostRange.RANGE_100K_250K;
  }

  // High cost: large effort OR (medium effort + foundational)
  if (effort === EffortRange.LARGE || (effort === EffortRange.MEDIUM && isFoundational)) {
    return CostRange.RANGE_50K_100K;
  }

  // Moderate cost: medium effort OR (small effort + foundational)
  if (effort === EffortRange.MEDIUM || (effort === EffortRange.SMALL && isFoundational)) {
    return CostRange.RANGE_10K_50K;
  }

  // Low cost: small effort only
  return CostRange.UNDER_10K;
}

/**
 * Calculate all gap prioritization fields at once
 * Convenience function that combines all calculations
 *
 * @param input - Gap prioritization input parameters
 * @returns Object with all prioritization fields
 */
export function calculateGapPrioritization(input: GapPrioritizationInput): {
  severity: Severity;
  priority: Priority;
  priorityScore: PriorityScore;
  effort: EffortRange;
  cost: CostRange;
} {
  const severity = calculateGapSeverity(input.score);
  const priorityScore = calculatePriorityScore(input);
  const priority = scoreToPriority(priorityScore);
  const effort = estimateEffort(input.sectionWeight, input.isFoundational, input.score);
  const cost = estimateCost(effort, severity, input.sectionWeight, input.isFoundational);

  return {
    severity,
    priority,
    priorityScore,
    effort,
    cost,
  };
}
