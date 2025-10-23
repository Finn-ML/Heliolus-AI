/**
 * Zod validation schema for Assessment Priorities Questionnaire
 * Story 1.06: Priorities Questionnaire Service
 */

import { z } from 'zod';
import { CompanySize, AnnualRevenue, ComplianceTeamSize } from '../generated/prisma/index.js';

/**
 * Zod schema for priorities questionnaire data
 * Validates all required fields and constraints
 * Note: companySize, annualRevenue, and complianceTeamSize are optional as they come from business profile
 */
export const PrioritiesSchema = z.object({
  // Step 1: Organizational Context
  companySize: z.nativeEnum(CompanySize).optional(), // From business profile
  annualRevenue: z.nativeEnum(AnnualRevenue).optional(), // From business profile
  complianceTeamSize: z.nativeEnum(ComplianceTeamSize).optional(), // From business profile
  jurisdictions: z
    .array(z.string().min(1))
    .min(1, 'At least one jurisdiction is required'),
  existingSystems: z.array(z.string()),

  // Step 2: Goals & Timeline
  primaryGoal: z.string().min(1, 'Primary goal is required'),
  implementationUrgency: z.enum(['IMMEDIATE', 'PLANNED', 'STRATEGIC', 'LONG_TERM']),

  // Step 3: Use Case Prioritization
  selectedUseCases: z
    .array(z.string().min(1))
    .min(3, 'Select at least 3 use cases'),
  rankedPriorities: z
    .array(z.string().min(1))
    .length(3, 'Must rank exactly 3 priorities'),

  // Step 4: Solution Requirements
  budgetRange: z.enum(
    ['UNDER_10K', 'RANGE_10K_50K', 'RANGE_50K_100K', 'RANGE_100K_250K', 'OVER_250K']
  ),
  deploymentPreference: z.enum(['CLOUD', 'ON_PREMISE', 'HYBRID', 'FLEXIBLE']),
  mustHaveFeatures: z
    .array(z.string().min(1))
    .max(5, 'Maximum 5 must-have features allowed'),
  criticalIntegrations: z.array(z.string()),

  // Step 5: Vendor Preferences
  vendorMaturity: z.enum(['ENTERPRISE', 'MID_MARKET', 'STARTUP', 'ANY']),
  geographicRequirements: z.string(),
  supportModel: z.string(),

  // Step 6: Decision Factors
  decisionFactorRanking: z
    .array(z.string().min(1))
    .length(6, 'Must rank all 6 decision factors'),
});

/**
 * Infer TypeScript type from Zod schema
 */
export type PrioritiesDTO = z.infer<typeof PrioritiesSchema>;
