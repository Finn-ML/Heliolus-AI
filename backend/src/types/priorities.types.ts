/**
 * Type definitions for Assessment Priorities Questionnaire
 * Story 1.06: Priorities Questionnaire Service
 */

import { CompanySize, AnnualRevenue, ComplianceTeamSize } from '../generated/prisma/index.js';

export { CompanySize, AnnualRevenue, ComplianceTeamSize };

/**
 * Validation result for business rules
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Standard decision factors that must be ranked
 */
export const DECISION_FACTORS = [
  'Total Cost of Ownership',
  'Implementation Speed',
  'Feature Completeness',
  'Vendor Reputation & Stability',
  'Integration Capabilities',
  'Scalability & Future-readiness',
] as const;

export type DecisionFactor = typeof DECISION_FACTORS[number];
