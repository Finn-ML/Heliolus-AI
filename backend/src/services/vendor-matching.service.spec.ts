/**
 * Unit Tests for Vendor Matching Service
 * Story 1.07: Enhanced Vendor Matching Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorMatchingService } from './vendor-matching.service.js';
import { CompanySize, VendorCategory, VendorStatus } from '../generated/prisma/index.js';

// Mock Prisma Client
const mockPrisma = {
  vendor: {
    findMany: vi.fn(),
  },
  gap: {
    findMany: vi.fn(),
  },
  assessment: {
    findUnique: vi.fn(),
  },
  assessmentPriorities: {
    findUnique: vi.fn(),
  },
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
};

describe('VendorMatchingService', () => {
  let service: VendorMatchingService;

  beforeEach(() => {
    service = new VendorMatchingService();
    (service as any).prisma = mockPrisma;
    vi.clearAllMocks();
  });

  describe('calculateBaseScore', () => {
    it('should calculate all score components correctly', async () => {
      const vendor = {
        id: 'v1',
        companyName: 'Test Vendor',
        categories: [VendorCategory.KYC_AML],
        targetSegments: [CompanySize.MIDMARKET],
        geographicCoverage: ['US', 'EU'],
        pricingRange: 'RANGE_50K_100K',
        status: VendorStatus.APPROVED,
      } as any;

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'DRAFT',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
        annualRevenue: 'FROM_10M_100M',
        complianceTeamSize: 'THREE_TEN',
        jurisdictions: ['US', 'EU'],
        existingSystems: [],
        primaryGoal: 'Compliance',
        implementationUrgency: 'PLANNED',
        selectedUseCases: ['KYC'],
        rankedPriorities: ['KYC'],
        budgetRange: 'RANGE_50K_100K',
        deploymentPreference: 'CLOUD',
        mustHaveFeatures: [],
        criticalIntegrations: [],
        vendorMaturity: 'MID_MARKET',
        geographicRequirements: 'US/EU',
        supportModel: 'Standard',
        decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const gaps = [
        { id: 'g1', category: 'KYC_AML' },
        { id: 'g2', category: 'KYC_AML' },
      ] as any[];

      const score = await service.calculateBaseScore(vendor, assessment, priorities, gaps);

      expect(score).toBeDefined();
      expect(score.vendorId).toBe('v1');
      expect(score.riskAreaCoverage).toBe(40); // Covers all gaps
      expect(score.sizeFit).toBe(20); // Exact match
      expect(score.geoCoverage).toBe(20); // Covers all jurisdictions
      expect(score.priceScore).toBe(20); // Exact price match
      expect(score.totalBase).toBe(100); // Perfect score
    });

    it('should handle partial matches correctly', async () => {
      const vendor = {
        id: 'v2',
        companyName: 'Test Vendor 2',
        categories: [VendorCategory.TRANSACTION_MONITORING],
        targetSegments: [CompanySize.ENTERPRISE],
        geographicCoverage: ['US'],
        pricingRange: 'RANGE_100K_250K',
        status: VendorStatus.APPROVED,
      } as any;

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'DRAFT',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET, // Adjacent to ENTERPRISE
        annualRevenue: 'FROM_10M_100M',
        complianceTeamSize: 'THREE_TEN',
        jurisdictions: ['US', 'EU'],
        existingSystems: [],
        primaryGoal: 'Compliance',
        implementationUrgency: 'PLANNED',
        selectedUseCases: ['KYC', 'TM'],
        rankedPriorities: ['KYC', 'TM'],
        budgetRange: 'RANGE_50K_100K',
        deploymentPreference: 'CLOUD',
        mustHaveFeatures: [],
        criticalIntegrations: [],
        vendorMaturity: 'MID_MARKET',
        geographicRequirements: 'US/EU',
        supportModel: 'Standard',
        decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const gaps = [
        { id: 'g1', category: 'KYC_AML' },
        { id: 'g2', category: 'TRANSACTION_MONITORING' },
      ] as any[];

      const score = await service.calculateBaseScore(vendor, assessment, priorities, gaps);

      expect(score).toBeDefined();
      expect(score.vendorId).toBe('v2');
      expect(score.riskAreaCoverage).toBe(20); // Covers 1 of 2 gaps
      expect(score.sizeFit).toBe(15); // Adjacent match
      expect(score.geoCoverage).toBe(10); // Covers 1 of 2 jurisdictions
      expect(score.priceScore).toBe(20); // Ranges touch at boundary, considered overlap
      expect(score.totalBase).toBe(65);
    });
  });

  describe('scoreAllVendors', () => {
    it('should score all approved vendors', async () => {
      const vendors = [
        {
          id: 'v1',
          companyName: 'Vendor 1',
          categories: [VendorCategory.KYC_AML],
          targetSegments: [CompanySize.MIDMARKET],
          geographicCoverage: ['US'],
          pricingRange: 'RANGE_50K_100K',
          status: VendorStatus.APPROVED,
        },
        {
          id: 'v2',
          companyName: 'Vendor 2',
          categories: [VendorCategory.TRANSACTION_MONITORING],
          targetSegments: [CompanySize.ENTERPRISE],
          geographicCoverage: ['GLOBAL'],
          pricingRange: 'RANGE_100K_250K',
          status: VendorStatus.APPROVED,
        },
      ] as any[];

      const gaps = [{ id: 'g1', category: 'KYC_AML' }] as any[];

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'DRAFT',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
        annualRevenue: 'FROM_10M_100M',
        complianceTeamSize: 'THREE_TEN',
        jurisdictions: ['US'],
        existingSystems: [],
        primaryGoal: 'Compliance',
        implementationUrgency: 'PLANNED',
        selectedUseCases: ['KYC'],
        rankedPriorities: ['KYC'],
        budgetRange: 'RANGE_50K_100K',
        deploymentPreference: 'CLOUD',
        mustHaveFeatures: [],
        criticalIntegrations: [],
        vendorMaturity: 'MID_MARKET',
        geographicRequirements: 'US',
        supportModel: 'Standard',
        decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockPrisma.vendor.findMany.mockResolvedValue(vendors);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.assessment.findUnique.mockResolvedValue(assessment);

      const scores = await service.scoreAllVendors('a1', priorities);

      expect(scores).toHaveLength(2);
      expect(scores[0].vendorId).toBe('v1');
      expect(scores[1].vendorId).toBe('v2');
      expect(mockPrisma.vendor.findMany).toHaveBeenCalledWith({
        where: { status: 'APPROVED' },
      });
    });

    it('should throw error when assessment not found', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([]);
      mockPrisma.gap.findMany.mockResolvedValue([]);
      mockPrisma.assessment.findUnique.mockResolvedValue(null);

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
      } as any;

      await expect(service.scoreAllVendors('a1', priorities)).rejects.toThrow(
        'Assessment a1 not found'
      );
    });
  });

  describe('getTopVendorMatches', () => {
    it('should return top matches sorted by score', async () => {
      const vendors = [
        {
          id: 'v1',
          companyName: 'Vendor 1',
          categories: [VendorCategory.KYC_AML],
          targetSegments: [CompanySize.MIDMARKET],
          geographicCoverage: ['US'],
          pricingRange: 'RANGE_50K_100K',
          status: VendorStatus.APPROVED,
        },
        {
          id: 'v2',
          companyName: 'Vendor 2',
          categories: [VendorCategory.KYC_AML, VendorCategory.TRANSACTION_MONITORING],
          targetSegments: [CompanySize.MIDMARKET, CompanySize.ENTERPRISE],
          geographicCoverage: ['GLOBAL'],
          pricingRange: 'RANGE_50K_100K',
          status: VendorStatus.APPROVED,
        },
      ] as any[];

      const gaps = [
        { id: 'g1', category: 'KYC_AML' },
        { id: 'g2', category: 'TRANSACTION_MONITORING' },
      ] as any[];

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'DRAFT',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
        annualRevenue: 'FROM_10M_100M',
        complianceTeamSize: 'THREE_TEN',
        jurisdictions: ['US'],
        existingSystems: [],
        primaryGoal: 'Compliance',
        implementationUrgency: 'PLANNED',
        selectedUseCases: ['KYC', 'TM'],
        rankedPriorities: ['KYC', 'TM'],
        budgetRange: 'RANGE_50K_100K',
        deploymentPreference: 'CLOUD',
        mustHaveFeatures: [],
        criticalIntegrations: [],
        vendorMaturity: 'MID_MARKET',
        geographicRequirements: 'US',
        supportModel: 'Standard',
        decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockPrisma.vendor.findMany.mockResolvedValue(vendors);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.assessment.findUnique.mockResolvedValue(assessment);

      const matches = await service.getTopVendorMatches('a1', priorities, 10, 0);

      expect(matches).toHaveLength(2);
      // Vendor 2 should score higher (covers more gaps + GLOBAL coverage)
      expect(matches[0].totalBase).toBeGreaterThanOrEqual(matches[1].totalBase);
    });

    it('should filter by minimum score', async () => {
      const vendors = [
        {
          id: 'v1',
          companyName: 'Vendor 1',
          categories: [],
          targetSegments: [],
          geographicCoverage: [],
          pricingRange: null,
          status: VendorStatus.APPROVED,
        },
      ] as any[];

      const gaps = [{ id: 'g1', category: 'KYC_AML' }] as any[];

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'DRAFT',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
        annualRevenue: 'FROM_10M_100M',
        complianceTeamSize: 'THREE_TEN',
        jurisdictions: ['US'],
        existingSystems: [],
        primaryGoal: 'Compliance',
        implementationUrgency: 'PLANNED',
        selectedUseCases: ['KYC'],
        rankedPriorities: ['KYC'],
        budgetRange: 'RANGE_50K_100K',
        deploymentPreference: 'CLOUD',
        mustHaveFeatures: [],
        criticalIntegrations: [],
        vendorMaturity: 'MID_MARKET',
        geographicRequirements: 'US',
        supportModel: 'Standard',
        decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockPrisma.vendor.findMany.mockResolvedValue(vendors);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.assessment.findUnique.mockResolvedValue(assessment);

      const matches = await service.getTopVendorMatches('a1', priorities, 10, 50);

      // Vendor with empty data will score low, should be filtered out
      expect(matches).toHaveLength(0);
    });
  });

  describe('calculatePriorityBoost - Story 1.08', () => {
    it('should calculate all boost components correctly', async () => {
      const vendor = {
        id: 'v1',
        companyName: 'Test Vendor',
        categories: ['SANCTIONS_SCREENING'],
        features: ['Real-time monitoring', 'API integration'],
        deploymentOptions: 'Cloud, Hybrid',
        implementationTimeline: 60,
        status: VendorStatus.APPROVED,
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        rankedPriorities: ['SANCTIONS_SCREENING', 'KYC_AML', 'TRANSACTION_MONITORING'],
        mustHaveFeatures: ['Real-time monitoring', 'API integration'],
        deploymentPreference: 'Cloud',
        implementationUrgency: 'IMMEDIATE',
      } as any;

      const gaps = [] as any[];

      const boost = await service.calculatePriorityBoost(vendor, priorities, gaps);

      expect(boost.vendorId).toBe('v1');
      expect(boost.topPriorityBoost).toBe(20); // #1 priority match
      expect(boost.featureBoost).toBe(10); // All features present
      expect(boost.deploymentBoost).toBe(5); // Deployment match
      expect(boost.speedBoost).toBe(5); // Fast implementation
      expect(boost.totalBoost).toBe(40); // Max possible
      expect(boost.matchedPriority).toBe('SANCTIONS_SCREENING');
      expect(boost.missingFeatures).toEqual([]);
    });

    it('should calculate partial boost correctly', async () => {
      const vendor = {
        id: 'v2',
        companyName: 'Test Vendor 2',
        categories: ['KYC_AML'],
        features: ['Real-time monitoring'],
        deploymentOptions: 'On-Premise',
        implementationTimeline: 180,
        status: VendorStatus.APPROVED,
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        rankedPriorities: ['SANCTIONS_SCREENING', 'KYC_AML', 'TRANSACTION_MONITORING'],
        mustHaveFeatures: ['Real-time monitoring', 'API integration'],
        deploymentPreference: 'Cloud',
        implementationUrgency: 'IMMEDIATE',
      } as any;

      const gaps = [] as any[];

      const boost = await service.calculatePriorityBoost(vendor, priorities, gaps);

      expect(boost.topPriorityBoost).toBe(15); // #2 priority match
      expect(boost.featureBoost).toBe(5); // Missing 1 feature
      expect(boost.deploymentBoost).toBe(0); // No deployment match
      expect(boost.speedBoost).toBe(0); // Too slow
      expect(boost.totalBoost).toBe(20);
      expect(boost.matchedPriority).toBe('KYC_AML');
      expect(boost.missingFeatures).toEqual(['API integration']);
    });
  });

  describe('calculateTotalScore - Story 1.08', () => {
    it('should combine base and priority boost scores', () => {
      const baseScore = {
        vendorId: 'v1',
        riskAreaCoverage: 35,
        sizeFit: 20,
        geoCoverage: 20,
        priceScore: 20,
        totalBase: 95,
      };

      const priorityBoost = {
        vendorId: 'v1',
        topPriorityBoost: 20,
        featureBoost: 10,
        deploymentBoost: 5,
        speedBoost: 5,
        totalBoost: 40,
        missingFeatures: [],
      };

      const totalScore = service.calculateTotalScore(baseScore, priorityBoost);

      expect(totalScore).toBe(135); // 95 + 40
    });

    it('should cap total score at 140', () => {
      const baseScore = {
        vendorId: 'v1',
        riskAreaCoverage: 40,
        sizeFit: 20,
        geoCoverage: 20,
        priceScore: 20,
        totalBase: 100,
      };

      const priorityBoost = {
        vendorId: 'v1',
        topPriorityBoost: 20,
        featureBoost: 10,
        deploymentBoost: 5,
        speedBoost: 5,
        totalBoost: 40,
        missingFeatures: [],
      };

      const totalScore = service.calculateTotalScore(baseScore, priorityBoost);

      expect(totalScore).toBe(140); // Capped at max
    });
  });

  describe('matchVendorsToAssessment - Story 1.08', () => {
    it('should return complete vendor match scores sorted by total score', async () => {
      const vendors = [
        {
          id: 'v1',
          companyName: 'High Scorer',
          categories: ['SANCTIONS_SCREENING'],
          features: ['Real-time monitoring', 'API integration'],
          deploymentOptions: 'Cloud',
          implementationTimeline: 60,
          targetSegments: [CompanySize.MIDMARKET],
          geographicCoverage: ['US', 'EU'],
          pricingRange: 'RANGE_50K_100K',
          status: VendorStatus.APPROVED,
        },
        {
          id: 'v2',
          companyName: 'Low Scorer',
          categories: ['DATA_GOVERNANCE'],
          features: [],
          deploymentOptions: 'On-Premise',
          implementationTimeline: 365,
          targetSegments: [],
          geographicCoverage: [],
          pricingRange: null,
          status: VendorStatus.APPROVED,
        },
      ] as any[];

      const assessment = {
        id: 'a1',
        userId: 'u1',
        organizationId: 'o1',
        templateId: 't1',
        status: 'COMPLETED',
      } as any;

      const priorities = {
        id: 'p1',
        assessmentId: 'a1',
        companySize: CompanySize.MIDMARKET,
        rankedPriorities: ['SANCTIONS_SCREENING', 'KYC_AML'],
        mustHaveFeatures: ['Real-time monitoring', 'API integration'],
        deploymentPreference: 'Cloud',
        implementationUrgency: 'IMMEDIATE',
        jurisdictions: ['US', 'EU'],
        budgetRange: 'RANGE_50K_100K',
      } as any;

      const gaps = [
        { id: 'g1', category: 'SANCTIONS_SCREENING' },
      ] as any[];

      mockPrisma.assessment.findUnique.mockResolvedValue(assessment);
      mockPrisma.assessmentPriorities.findUnique.mockResolvedValue(priorities);
      mockPrisma.vendor.findMany.mockResolvedValue(vendors);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);

      const matches = await service.matchVendorsToAssessment('a1', 'p1');

      expect(matches).toHaveLength(2);
      expect(matches[0].vendorId).toBe('v1'); // High scorer first
      expect(matches[0].totalScore).toBeGreaterThan(matches[1].totalScore);
      expect(matches[0]).toHaveProperty('vendor');
      expect(matches[0]).toHaveProperty('baseScore');
      expect(matches[0]).toHaveProperty('priorityBoost');
      expect(matches[0]).toHaveProperty('matchReasons');
      expect(matches[0].matchReasons.length).toBeGreaterThan(0);
    });

    it('should throw error when assessment not found', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue(null);
      mockPrisma.assessmentPriorities.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.vendor.findMany.mockResolvedValue([]);
      mockPrisma.gap.findMany.mockResolvedValue([]);

      await expect(
        service.matchVendorsToAssessment('a1', 'p1')
      ).rejects.toThrow('Assessment a1 not found');
    });

    it('should throw error when priorities not found', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue({ id: 'a1' });
      mockPrisma.assessmentPriorities.findUnique.mockResolvedValue(null);
      mockPrisma.vendor.findMany.mockResolvedValue([]);
      mockPrisma.gap.findMany.mockResolvedValue([]);

      await expect(
        service.matchVendorsToAssessment('a1', 'p1')
      ).rejects.toThrow('Priorities p1 not found');
    });
  });
});
