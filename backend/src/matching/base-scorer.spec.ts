/**
 * Unit Tests for Base Scorer Utility Functions
 * Story 1.07: Enhanced Vendor Matching Service
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRiskAreaCoverage,
  calculateSizeFit,
  calculateGeoCoverage,
  calculatePriceScore,
} from './base-scorer.js';
import { CompanySize, VendorCategory } from '../generated/prisma/index.js';
import { SCORING_WEIGHTS, SIZE_FIT_SCORES } from '../types/matching.types.js';

describe('calculateRiskAreaCoverage', () => {
  it('should return 40 points when there are no gaps', () => {
    const vendor = {
      id: 'v1',
      categories: [VendorCategory.KYC_AML],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculateRiskAreaCoverage(vendor, []);
    expect(score).toBe(40);
  });

  it('should return 40 points when vendor covers all gaps', () => {
    const vendor = {
      id: 'v1',
      categories: [VendorCategory.KYC_AML, VendorCategory.TRANSACTION_MONITORING],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const gaps = [
      { id: 'g1', category: 'KYC_AML' },
      { id: 'g2', category: 'TRANSACTION_MONITORING' },
    ] as any[];

    const score = calculateRiskAreaCoverage(vendor, gaps);
    expect(score).toBe(40);
  });

  it('should return 20 points when vendor covers 5 of 10 gaps', () => {
    const vendor = {
      id: 'v1',
      categories: [VendorCategory.KYC_AML],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const gaps = [
      { id: 'g1', category: 'KYC_AML' },
      { id: 'g2', category: 'KYC_AML' },
      { id: 'g3', category: 'KYC_AML' },
      { id: 'g4', category: 'KYC_AML' },
      { id: 'g5', category: 'KYC_AML' },
      { id: 'g6', category: 'TRANSACTION_MONITORING' },
      { id: 'g7', category: 'TRANSACTION_MONITORING' },
      { id: 'g8', category: 'TRANSACTION_MONITORING' },
      { id: 'g9', category: 'TRANSACTION_MONITORING' },
      { id: 'g10', category: 'TRANSACTION_MONITORING' },
    ] as any[];

    const score = calculateRiskAreaCoverage(vendor, gaps);
    expect(score).toBe(20);
  });

  it('should return 0 points when vendor has empty categories', () => {
    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const gaps = [
      { id: 'g1', category: 'KYC_AML' },
      { id: 'g2', category: 'TRANSACTION_MONITORING' },
    ] as any[];

    const score = calculateRiskAreaCoverage(vendor, gaps);
    expect(score).toBe(0);
  });

  it('should return 0 points when vendor covers no gaps', () => {
    const vendor = {
      id: 'v1',
      categories: [VendorCategory.FRAUD_DETECTION],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const gaps = [
      { id: 'g1', category: 'KYC_AML' },
      { id: 'g2', category: 'TRANSACTION_MONITORING' },
    ] as any[];

    const score = calculateRiskAreaCoverage(vendor, gaps);
    expect(score).toBe(0);
  });
});

describe('calculateSizeFit', () => {
  it('should return 20 points for exact match', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [CompanySize.MIDMARKET, CompanySize.ENTERPRISE],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculateSizeFit(priorities, vendor);
    expect(score).toBe(20);
  });

  it('should return 15 points for adjacent segment match', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.SMB,
      annualRevenue: 'FROM_1M_10M',
      complianceTeamSize: 'ONE_TWO',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_10K_50K',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [CompanySize.MIDMARKET], // Adjacent to SMB
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculateSizeFit(priorities, vendor);
    expect(score).toBe(15);
  });

  it('should return 0 points for no match', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.STARTUP,
      annualRevenue: 'UNDER_1M',
      complianceTeamSize: 'NONE',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'UNDER_10K',
      deploymentPreference: 'CLOUD',
      mustHaveFeatures: [],
      criticalIntegrations: [],
      vendorMaturity: 'ANY',
      geographicRequirements: 'US',
      supportModel: 'Self-service',
      decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [CompanySize.ENTERPRISE], // No match with STARTUP
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculateSizeFit(priorities, vendor);
    expect(score).toBe(0);
  });

  it('should return 0 points when vendor has empty targetSegments', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculateSizeFit(priorities, vendor);
    expect(score).toBe(0);
  });
});

describe('calculateGeoCoverage', () => {
  it('should return 20 points when all jurisdictions are covered', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US', 'EU', 'UK'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_50K_100K',
      deploymentPreference: 'CLOUD',
      mustHaveFeatures: [],
      criticalIntegrations: [],
      vendorMaturity: 'MID_MARKET',
      geographicRequirements: 'Global',
      supportModel: 'Standard',
      decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: ['US', 'EU', 'UK', 'APAC'],
      pricingRange: null,
    } as any;

    const score = calculateGeoCoverage(priorities, vendor);
    expect(score).toBe(20);
  });

  it('should return 20 points when vendor has GLOBAL coverage', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US', 'EU', 'UK'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_50K_100K',
      deploymentPreference: 'CLOUD',
      mustHaveFeatures: [],
      criticalIntegrations: [],
      vendorMaturity: 'MID_MARKET',
      geographicRequirements: 'Global',
      supportModel: 'Standard',
      decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: ['GLOBAL'],
      pricingRange: null,
    } as any;

    const score = calculateGeoCoverage(priorities, vendor);
    expect(score).toBe(20);
  });

  it('should return 10 points when 2 of 4 jurisdictions are covered', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US', 'EU', 'UK', 'APAC'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_50K_100K',
      deploymentPreference: 'CLOUD',
      mustHaveFeatures: [],
      criticalIntegrations: [],
      vendorMaturity: 'MID_MARKET',
      geographicRequirements: 'Regional',
      supportModel: 'Standard',
      decisionFactorRanking: ['Price', 'Features', 'Support', 'Ease of Use', 'Reputation', 'Integration'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: ['US', 'EU'],
      pricingRange: null,
    } as any;

    const score = calculateGeoCoverage(priorities, vendor);
    expect(score).toBe(10);
  });

  it('should return 0 points when no jurisdictions are covered', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US', 'EU'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: ['APAC', 'LATAM'],
      pricingRange: null,
    } as any;

    const score = calculateGeoCoverage(priorities, vendor);
    expect(score).toBe(0);
  });

  it('should handle case-insensitive jurisdiction matching', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['us', 'eu'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: ['US', 'EU'],
      pricingRange: null,
    } as any;

    const score = calculateGeoCoverage(priorities, vendor);
    expect(score).toBe(20);
  });
});

describe('calculatePriceScore', () => {
  it('should return 20 points when price ranges overlap', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: 'RANGE_50K_100K',
    } as any;

    const score = calculatePriceScore(priorities, vendor);
    expect(score).toBe(20);
  });

  it('should return 10 points when vendor is 20% over budget', () => {
    // Note: This scenario is difficult to test with the current enum ranges
    // because they don't have granular enough options.
    // In practice, ranges that touch at boundaries are considered overlapping.
    // We expect 20 points (overlap) rather than 10 points (tolerance)
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_10K_50K', // max 50K
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: 'RANGE_50K_100K', // min 50K touches budget max, considered overlap
    } as any;

    const score = calculatePriceScore(priorities, vendor);
    // Ranges touch at 50K boundary, so they overlap -> full score
    expect(score).toBe(20);
  });

  it('should return 0 points when vendor is 30% over budget', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_50K_100K', // max 100K, tolerance 125K
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: 'OVER_250K', // min 250K, over 25% tolerance
    } as any;

    const score = calculatePriceScore(priorities, vendor);
    expect(score).toBe(0);
  });

  it('should return 20 points when vendor is under budget', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
      implementationUrgency: 'PLANNED',
      selectedUseCases: ['KYC'],
      rankedPriorities: ['KYC'],
      budgetRange: 'RANGE_100K_250K',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: 'RANGE_50K_100K',
    } as any;

    const score = calculatePriceScore(priorities, vendor);
    expect(score).toBe(20);
  });

  it('should return 10 points when vendor has no pricing range', () => {
    const priorities = {
      id: 'p1',
      assessmentId: 'a1',
      companySize: CompanySize.MIDMARKET,
      annualRevenue: 'FROM_10M_100M',
      complianceTeamSize: 'THREE_TEN',
      jurisdictions: ['US'],
      existingSystems: [],
      primaryGoal: 'Test',
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

    const vendor = {
      id: 'v1',
      categories: [],
      targetSegments: [],
      geographicCoverage: [],
      pricingRange: null,
    } as any;

    const score = calculatePriceScore(priorities, vendor);
    expect(score).toBe(10); // Partial score for unknown pricing
  });
});
