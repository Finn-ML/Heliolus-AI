/**
 * Type definitions for gap prioritization logic
 * Story 1.05: Gap Prioritization Enhancement
 */

import { Severity, Priority, CostRange, EffortRange } from '../generated/prisma/index.js';

export { Severity, Priority, CostRange, EffortRange };

/**
 * Numeric priority score (1-10) used for sorting and comparison
 * Maps to Priority enum for database storage
 */
export type PriorityScore = number; // 1-10

/**
 * Gap with enriched prioritization fields
 */
export interface EnrichedGap {
  id?: string;
  assessmentId: string;
  category: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  priorityScore: PriorityScore; // Numeric score for sorting
  estimatedEffort: EffortRange;
  estimatedCost: CostRange;
  suggestedVendors?: string[];
}

/**
 * Gap prioritization input parameters
 */
export interface GapPrioritizationInput {
  score: number; // finalScore from Answer (0-5 scale)
  isFoundational: boolean; // From Question
  sectionWeight: number; // From Section (0-1 scale)
  sectionName?: string;
  questionText?: string;
}

/**
 * Priority enum to numeric score mapping
 */
export const PriorityToScore: Record<Priority, number> = {
  [Priority.IMMEDIATE]: 10,
  [Priority.SHORT_TERM]: 7,
  [Priority.MEDIUM_TERM]: 4,
  [Priority.LONG_TERM]: 2,
};

/**
 * Numeric score to Priority enum mapping
 * Thresholds: 9-10=IMMEDIATE, 6-8=SHORT_TERM, 3-5=MEDIUM_TERM, 1-2=LONG_TERM
 */
export function scoreToPriority(score: number): Priority {
  if (score >= 9) return Priority.IMMEDIATE;
  if (score >= 6) return Priority.SHORT_TERM;
  if (score >= 3) return Priority.MEDIUM_TERM;
  return Priority.LONG_TERM;
}
