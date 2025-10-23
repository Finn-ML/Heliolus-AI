/**
 * Unit Tests for Priorities Service
 * Story 1.06: Priorities Questionnaire Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrioritiesService } from './priorities.service.js';
import { PrioritiesSchema } from '../types/priorities.schema.js';
import { CompanySize, AnnualRevenue, ComplianceTeamSize } from '../generated/prisma/index.js';
import { ZodError } from 'zod';

// Mock Prisma Client
const mockPrisma = {
  assessment: {
    findUnique: vi.fn(),
  },
  assessmentPriorities: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
};

// Valid test data
const validPrioritiesData = {
  companySize: CompanySize.SMB,
  annualRevenue: AnnualRevenue.FROM_1M_10M,
  complianceTeamSize: ComplianceTeamSize.ONE_TWO,
  jurisdictions: ['US', 'EU'],
  existingSystems: ['System1', 'System2'],
  primaryGoal: 'Improve compliance',
  implementationUrgency: 'PLANNED' as const,
  selectedUseCases: ['AML', 'KYC', 'Transaction Monitoring', 'Sanctions Screening'],
  rankedPriorities: ['AML', 'KYC', 'Transaction Monitoring'],
  budgetRange: 'RANGE_50K_100K' as const,
  deploymentPreference: 'CLOUD' as const,
  mustHaveFeatures: ['Feature1', 'Feature2', 'Feature3'],
  criticalIntegrations: ['Integration1'],
  vendorMaturity: 'MID_MARKET' as const,
  geographicRequirements: 'Global',
  supportModel: '24/7',
  decisionFactorRanking: ['Price', 'Features', 'Ease of Use', 'Support', 'Reputation', 'Integration'],
};

describe('PrioritiesService', () => {
  let service: PrioritiesService;

  beforeEach(() => {
    service = new PrioritiesService();
    (service as any).prisma = mockPrisma;
    vi.clearAllMocks();
  });

  describe('Zod Schema Validation', () => {
    it('should pass validation with valid data', () => {
      expect(() => PrioritiesSchema.parse(validPrioritiesData)).not.toThrow();
    });

    it('should fail validation when companySize is missing', () => {
      const { companySize, ...invalidData } = validPrioritiesData;
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation when jurisdictions is empty array', () => {
      const invalidData = { ...validPrioritiesData, jurisdictions: [] };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation when selectedUseCases has fewer than 3 items', () => {
      const invalidData = { ...validPrioritiesData, selectedUseCases: ['AML', 'KYC'] };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation when rankedPriorities does not have exactly 3 items', () => {
      const invalidData = { ...validPrioritiesData, rankedPriorities: ['AML', 'KYC'] };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation when mustHaveFeatures exceeds 5 items', () => {
      const invalidData = {
        ...validPrioritiesData,
        mustHaveFeatures: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
      };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation when decisionFactorRanking does not have exactly 6 items', () => {
      const invalidData = {
        ...validPrioritiesData,
        decisionFactorRanking: ['Price', 'Features', 'Ease of Use'],
      };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation with invalid companySize enum', () => {
      const invalidData = { ...validPrioritiesData, companySize: 'INVALID' };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should fail validation with invalid budgetRange enum', () => {
      const invalidData = { ...validPrioritiesData, budgetRange: 'INVALID' };
      expect(() => PrioritiesSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should pass validation with exactly 5 mustHaveFeatures', () => {
      const validData = {
        ...validPrioritiesData,
        mustHaveFeatures: ['F1', 'F2', 'F3', 'F4', 'F5'],
      };
      expect(() => PrioritiesSchema.parse(validData)).not.toThrow();
    });
  });

  describe('validatePriorities', () => {
    it('should return valid when all business rules pass', () => {
      const result = service.validatePriorities(validPrioritiesData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when rankedPriorities are not subset of selectedUseCases', () => {
      const invalidData = {
        ...validPrioritiesData,
        selectedUseCases: ['AML', 'KYC', 'Transaction Monitoring'],
        rankedPriorities: ['AML', 'KYC', 'Sanctions Screening'], // Sanctions not in selected
      };

      const result = service.validatePriorities(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Ranked priorities must be from selected use cases');
      expect(result.errors[0]).toContain('Sanctions Screening');
    });

    it('should fail when decisionFactorRanking is missing factors', () => {
      const invalidData = {
        ...validPrioritiesData,
        decisionFactorRanking: ['Price', 'Features', 'Ease of Use', 'Support', 'Reputation', 'Other'],
      };

      const result = service.validatePriorities(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Missing decision factors');
      expect(result.errors[0]).toContain('Integration');
    });

    it('should fail when decisionFactorRanking has duplicates', () => {
      const invalidData = {
        ...validPrioritiesData,
        decisionFactorRanking: ['Price', 'Price', 'Features', 'Support', 'Reputation', 'Integration'],
      };

      const result = service.validatePriorities(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should have error for duplicate Price AND missing factor (Ease of Use)
      const hasError = result.errors.some(e => e.includes('Duplicate') || e.includes('Missing'));
      expect(hasError).toBe(true);
    });

    it('should fail with multiple errors when multiple rules violated', () => {
      const invalidData = {
        ...validPrioritiesData,
        rankedPriorities: ['AML', 'KYC', 'InvalidUseCase'],
        decisionFactorRanking: ['Price', 'Price', 'Features', 'Support', 'Reputation', 'Other'],
      };

      const result = service.validatePriorities(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('submitPriorities', () => {
    const assessmentId = 'assess123';
    const userId = 'user123';

    it('should successfully create priorities', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue({
        id: assessmentId,
        userId,
      });

      mockPrisma.assessmentPriorities.upsert.mockResolvedValue({
        id: 'priorities123',
        assessmentId,
        ...validPrioritiesData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.submitPriorities(assessmentId, validPrioritiesData, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe('priorities123');
      expect(mockPrisma.assessment.findUnique).toHaveBeenCalledWith({
        where: { id: assessmentId },
        select: { id: true, userId: true },
      });
      expect(mockPrisma.assessmentPriorities.upsert).toHaveBeenCalled();
    });

    it('should successfully update priorities (upsert behavior)', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue({
        id: assessmentId,
        userId,
      });

      const existingId = 'existing123';
      mockPrisma.assessmentPriorities.upsert.mockResolvedValue({
        id: existingId,
        assessmentId,
        ...validPrioritiesData,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      });

      const result = await service.submitPriorities(assessmentId, validPrioritiesData, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(existingId);
      expect(mockPrisma.assessmentPriorities.upsert).toHaveBeenCalledWith({
        where: { assessmentId },
        update: expect.objectContaining(validPrioritiesData),
        create: expect.objectContaining({ assessmentId, ...validPrioritiesData }),
      });
    });

    it('should throw error when assessment not found', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue(null);

      await expect(
        service.submitPriorities(assessmentId, validPrioritiesData, userId)
      ).rejects.toThrow('Assessment assess123 not found');
    });

    it('should throw error when user is not authorized', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue({
        id: assessmentId,
        userId: 'differentUser',
      });

      await expect(
        service.submitPriorities(assessmentId, validPrioritiesData, userId)
      ).rejects.toThrow('Not authorized to modify this assessment');
    });

    it('should throw error when validation fails (business rules)', async () => {
      const invalidData = {
        ...validPrioritiesData,
        rankedPriorities: ['AML', 'KYC', 'InvalidUseCase'],
      };

      mockPrisma.assessment.findUnique.mockResolvedValue({
        id: assessmentId,
        userId,
      });

      await expect(
        service.submitPriorities(assessmentId, invalidData, userId)
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error when Zod schema validation fails', async () => {
      const invalidData = {
        ...validPrioritiesData,
        companySize: 'INVALID_SIZE',
      };

      await expect(
        service.submitPriorities(assessmentId, invalidData as any, userId)
      ).rejects.toThrow();
    });
  });

  describe('getPriorities', () => {
    const assessmentId = 'assess123';

    it('should return priorities when they exist', async () => {
      const mockPriorities = {
        id: 'priorities123',
        assessmentId,
        ...validPrioritiesData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.assessmentPriorities.findUnique.mockResolvedValue(mockPriorities);

      const result = await service.getPriorities(assessmentId);

      expect(result).toBeDefined();
      expect(result).toEqual(mockPriorities);
      expect(mockPrisma.assessmentPriorities.findUnique).toHaveBeenCalledWith({
        where: { assessmentId },
      });
    });

    it('should return null when priorities do not exist', async () => {
      mockPrisma.assessmentPriorities.findUnique.mockResolvedValue(null);

      const result = await service.getPriorities(assessmentId);

      expect(result).toBeNull();
    });
  });
});
