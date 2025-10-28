/**
 * Priorities Service
 * Manages assessment priorities questionnaire data
 * Story 1.06: Priorities Questionnaire Service
 */

import { BaseService } from './base.service.js';
import { PrioritiesSchema, type PrioritiesDTO } from '../types/priorities.schema.js';
import {  ValidationResult, DECISION_FACTORS } from '../types/priorities.types.js';
import type { AssessmentPriorities } from '../generated/prisma/index.js';

export class PrioritiesService extends BaseService {
  /**
   * Submit or update priorities for an assessment
   * @param assessmentId - The ID of the assessment
   * @param data - Priorities questionnaire data
   * @param userId - The ID of the user submitting (for auth check)
   * @returns Created or updated AssessmentPriorities record
   */
  async submitPriorities(
    assessmentId: string,
    data: PrioritiesDTO,
    userId: string
  ): Promise<AssessmentPriorities> {
    try {
      // 1. Schema validation (Zod will throw if invalid)
      const validated = PrioritiesSchema.parse(data);

      // 2. Business rules validation
      const validation = this.validatePriorities(validated);
      if (!validation.valid) {
        throw this.createError(
          `Validation failed: ${validation.errors.join('; ')}`,
          400,
          'VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }

      // 3. Check assessment exists and belongs to user, and get organization data
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          organization: {
            select: {
              size: true,
              annualRevenue: true,
              complianceTeamSize: true,
            },
          },
        },
      });

      if (!assessment) {
        throw this.createError(
          `Assessment ${assessmentId} not found`,
          404,
          'ASSESSMENT_NOT_FOUND'
        );
      }

      if (assessment.userId !== userId) {
        throw this.createError(
          'Not authorized to modify this assessment',
          403,
          'FORBIDDEN'
        );
      }

      // Pull missing fields from organization profile
      const finalData = {
        ...validated,
        companySize: validated.companySize || assessment.organization?.size,
        annualRevenue: validated.annualRevenue || assessment.organization?.annualRevenue,
        complianceTeamSize: validated.complianceTeamSize || assessment.organization?.complianceTeamSize,
      };

      // Validate that required fields are present after merging with organization data
      const missingRequiredFields = [];
      if (!finalData.companySize) missingRequiredFields.push('companySize');
      if (!finalData.annualRevenue) missingRequiredFields.push('annualRevenue');
      if (!finalData.complianceTeamSize) missingRequiredFields.push('complianceTeamSize');

      if (missingRequiredFields.length > 0) {
        throw this.createError(
          `Required organization information is missing: ${missingRequiredFields.join(', ')}. Please complete your business profile first.`,
          400,
          'INCOMPLETE_BUSINESS_PROFILE',
          {
            missingFields: missingRequiredFields,
            message: 'Please complete your business profile with company size, annual revenue, and compliance team size before submitting priorities.'
          }
        );
      }

      // 4. Upsert priorities (create or update)
      const priorities = await this.prisma.assessmentPriorities.upsert({
        where: { assessmentId },
        update: {
          ...finalData,
          updatedAt: new Date(),
        },
        create: {
          assessmentId,
          ...finalData,
        },
      });

      this.logger.info('Priorities submitted successfully', {
        assessmentId,
        userId,
      });

      return priorities;
    } catch (error) {
      this.logger.error('Error submitting priorities', {
        assessmentId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get priorities for an assessment
   * @param assessmentId - The ID of the assessment
   * @returns AssessmentPriorities record or null if not found
   */
  async getPriorities(assessmentId: string): Promise<AssessmentPriorities | null> {
    try {
      const priorities = await this.prisma.assessmentPriorities.findUnique({
        where: { assessmentId },
      });

      return priorities;
    } catch (error) {
      this.logger.error('Error retrieving priorities', {
        assessmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate priorities data using business rules
   * Checks beyond basic schema validation
   * @param data - Validated priorities data
   * @returns Validation result with any errors
   */
  validatePriorities(data: PrioritiesDTO): ValidationResult {
    const errors: string[] = [];

    // Rule 1: Ranked priorities must be subset of selected use cases
    const invalidPriorities = data.rankedPriorities.filter(
      (priority) => !data.selectedUseCases.includes(priority)
    );
    if (invalidPriorities.length > 0) {
      errors.push(
        `Ranked priorities must be from selected use cases. Invalid: ${invalidPriorities.join(', ')}`
      );
    }

    // Rule 2: Decision factors must include all 6 unique factors
    const missingFactors = DECISION_FACTORS.filter(
      (factor) => !data.decisionFactorRanking.includes(factor)
    );
    if (missingFactors.length > 0) {
      errors.push(`Missing decision factors: ${missingFactors.join(', ')}`);
    }

    // Rule 3: Check for duplicate decision factors
    const factorCounts = new Map<string, number>();
    data.decisionFactorRanking.forEach((factor) => {
      factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
    });

    const duplicates = Array.from(factorCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([factor]) => factor);

    if (duplicates.length > 0) {
      errors.push(`Duplicate decision factors: ${duplicates.join(', ')}`);
    }

    // Rule 4: mustHaveFeatures already validated by schema (max 5)
    // Rule 5: rankedPriorities already validated by schema (exactly 3)

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
