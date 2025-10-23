/**
 * Unit Tests for Strategy Matrix Service
 * Story 1.09: Strategy Matrix Service - Timeline-Based Gap Organization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyMatrixService } from './strategy-matrix.service.js';
import { Severity, VendorStatus } from '../generated/prisma/index.js';

// Mock Prisma Client
const mockPrisma = {
  gap: {
    findMany: vi.fn(),
  },
  vendor: {
    findMany: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock Redis
const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
};

describe('StrategyMatrixService', () => {
  let service: StrategyMatrixService;

  beforeEach(() => {
    service = new StrategyMatrixService();
    (service as any).prisma = mockPrisma;
    (service as any).setRedis(mockRedis);
    vi.clearAllMocks();
  });

  describe('generateStrategyMatrix', () => {
    it('should partition gaps into correct timeline buckets', async () => {
      const gaps = [
        // Immediate: priority 8-10
        { id: 'g1', assessmentId: 'a1', category: 'KYC', priority: 'IMMEDIATE', priorityScore: 10, estimatedEffort: 'LARGE', estimatedCost: 'RANGE_100K_250K', severity: Severity.CRITICAL },
        { id: 'g2', assessmentId: 'a1', category: 'AML', priority: 'IMMEDIATE', priorityScore: 9, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_50K_100K', severity: Severity.HIGH },
        { id: 'g3', assessmentId: 'a1', category: 'Sanctions', priority: 'IMMEDIATE', priorityScore: 8, estimatedEffort: 'SMALL', estimatedCost: 'RANGE_10K_50K', severity: Severity.HIGH },
        // Near-term: priority 4-7
        { id: 'g4', assessmentId: 'a1', category: 'Transaction Monitoring', priority: 'SHORT_TERM', priorityScore: 6, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_50K_100K', severity: Severity.MEDIUM },
        { id: 'g5', assessmentId: 'a1', category: 'Adverse Media', priority: 'SHORT_TERM', priorityScore: 5, estimatedEffort: 'SMALL', estimatedCost: 'UNDER_10K', severity: Severity.LOW },
        // Strategic: priority 1-3
        { id: 'g6', assessmentId: 'a1', category: 'Data Governance', priority: 'LONG_TERM', priorityScore: 3, estimatedEffort: 'SMALL', estimatedCost: 'UNDER_10K', severity: Severity.LOW },
        { id: 'g7', assessmentId: 'a1', category: 'Training', priority: 'LONG_TERM', priorityScore: 2, estimatedEffort: 'SMALL', estimatedCost: 'UNDER_10K', severity: Severity.LOW },
      ] as any[];

      const vendors = [] as any[];

      mockRedis.get.mockResolvedValue(null); // Cache miss
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.vendor.findMany.mockResolvedValue(vendors);

      const matrix = await service.generateStrategyMatrix('a1');

      expect(matrix.immediate.gapCount).toBe(3); // priority 8-10
      expect(matrix.nearTerm.gapCount).toBe(2); // priority 4-7
      expect(matrix.strategic.gapCount).toBe(2); // priority 1-3
      expect(matrix.assessmentId).toBe('a1');
      expect(matrix.generatedAt).toBeInstanceOf(Date);
    });

    it('should calculate effort distribution correctly', async () => {
      const gaps = [
        { id: 'g1', assessmentId: 'a1', category: 'KYC', priorityScore: 10, estimatedEffort: 'LARGE', estimatedCost: 'RANGE_100K_250K' },
        { id: 'g2', assessmentId: 'a1', category: 'AML', priorityScore: 9, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_50K_100K' },
        { id: 'g3', assessmentId: 'a1', category: 'Sanctions', priorityScore: 8, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_10K_50K' },
        { id: 'g4', assessmentId: 'a1', category: 'TM', priorityScore: 9, estimatedEffort: 'SMALL', estimatedCost: 'UNDER_10K' },
      ] as any[];

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.vendor.findMany.mockResolvedValue([]);

      const matrix = await service.generateStrategyMatrix('a1');

      expect(matrix.immediate.effortDistribution.LARGE).toBe(1);
      expect(matrix.immediate.effortDistribution.MEDIUM).toBe(2);
      expect(matrix.immediate.effortDistribution.SMALL).toBe(1);
    });

    it('should calculate cost range estimates correctly', async () => {
      const gaps = [
        { id: 'g1', assessmentId: 'a1', category: 'KYC', priorityScore: 10, estimatedEffort: 'LARGE', estimatedCost: 'RANGE_100K_250K' },
        { id: 'g2', assessmentId: 'a1', category: 'AML', priorityScore: 9, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_50K_100K' },
      ] as any[];

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.vendor.findMany.mockResolvedValue([]);

      const matrix = await service.generateStrategyMatrix('a1');

      // 175K + 75K = 250K midpoint, range ±30%: 175K-325K
      expect(matrix.immediate.estimatedCostRange).toContain('K');
      expect(matrix.immediate.estimatedCostRange).toContain('estimated');
    });

    it('should rank vendors by gap coverage', async () => {
      const gaps = [
        { id: 'g1', assessmentId: 'a1', category: 'KYC_AML', priorityScore: 10, estimatedEffort: 'LARGE', estimatedCost: 'RANGE_100K_250K' },
        { id: 'g2', assessmentId: 'a1', category: 'SANCTIONS_SCREENING', priorityScore: 9, estimatedEffort: 'MEDIUM', estimatedCost: 'RANGE_50K_100K' },
        { id: 'g3', assessmentId: 'a1', category: 'TRANSACTION_MONITORING', priorityScore: 8, estimatedEffort: 'SMALL', estimatedCost: 'RANGE_10K_50K' },
      ] as any[];

      const vendors = [
        {
          id: 'v1',
          companyName: 'Vendor 1',
          categories: ['KYC_AML', 'SANCTIONS_SCREENING'],
          status: VendorStatus.APPROVED,
        },
        {
          id: 'v2',
          companyName: 'Vendor 2',
          categories: ['KYC_AML'],
          status: VendorStatus.APPROVED,
        },
        {
          id: 'v3',
          companyName: 'Vendor 3',
          categories: ['TRANSACTION_MONITORING'],
          status: VendorStatus.APPROVED,
        },
      ] as any[];

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.gap.findMany.mockResolvedValue(gaps);
      mockPrisma.vendor.findMany.mockResolvedValue(vendors);

      const matrix = await service.generateStrategyMatrix('a1');

      // Vendor 1 covers 2 gaps, should be ranked first
      expect(matrix.immediate.topVendors).toHaveLength(3);
      expect(matrix.immediate.topVendors[0].vendor.id).toBe('v1');
      expect(matrix.immediate.topVendors[0].gapsCovered).toBe(2);
    });

    it('should use cache on second call', async () => {
      const cachedMatrix = {
        assessmentId: 'a1',
        generatedAt: new Date(),
        immediate: { gapCount: 3 },
        nearTerm: { gapCount: 2 },
        strategic: { gapCount: 1 },
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedMatrix));

      const matrix = await service.generateStrategyMatrix('a1');

      expect(matrix.assessmentId).toBe('a1');
      expect(mockPrisma.gap.findMany).not.toHaveBeenCalled(); // Should use cache
    });

    it('should handle empty gaps correctly', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.gap.findMany.mockResolvedValue([]);
      mockPrisma.vendor.findMany.mockResolvedValue([]);

      const matrix = await service.generateStrategyMatrix('a1');

      expect(matrix.immediate.gapCount).toBe(0);
      expect(matrix.nearTerm.gapCount).toBe(0);
      expect(matrix.strategic.gapCount).toBe(0);
      expect(matrix.immediate.estimatedCostRange).toBe('€0');
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache key', async () => {
      await service.invalidateCache('a1');

      expect(mockRedis.del).toHaveBeenCalledWith('strategy_matrix:a1');
    });
  });
});
