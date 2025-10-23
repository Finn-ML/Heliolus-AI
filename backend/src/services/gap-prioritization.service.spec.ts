/**
 * Unit Tests for Gap Prioritization Service
 * Story 1.05: Gap Prioritization Enhancement
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGapSeverity,
  calculatePriorityScore,
  calculateGapPriority,
  estimateEffort,
  estimateCost,
  calculateGapPrioritization,
} from './gap-prioritization.service.js';
import { Severity, Priority, EffortRange, CostRange } from '../types/gap-prioritization.types.js';

describe('Gap Prioritization Service', () => {
  describe('calculateGapSeverity', () => {
    it('should return CRITICAL for score <1.5', () => {
      expect(calculateGapSeverity(0.0)).toBe(Severity.CRITICAL);
      expect(calculateGapSeverity(0.5)).toBe(Severity.CRITICAL);
      expect(calculateGapSeverity(1.2)).toBe(Severity.CRITICAL);
      expect(calculateGapSeverity(1.4)).toBe(Severity.CRITICAL);
    });

    it('should return HIGH for score 1.5-2.5', () => {
      expect(calculateGapSeverity(1.5)).toBe(Severity.HIGH);
      expect(calculateGapSeverity(2.0)).toBe(Severity.HIGH);
      expect(calculateGapSeverity(2.4)).toBe(Severity.HIGH);
    });

    it('should return MEDIUM for score 2.5-3.5', () => {
      expect(calculateGapSeverity(2.5)).toBe(Severity.MEDIUM);
      expect(calculateGapSeverity(3.0)).toBe(Severity.MEDIUM);
      expect(calculateGapSeverity(3.4)).toBe(Severity.MEDIUM);
    });

    it('should return LOW for score 3.5+', () => {
      expect(calculateGapSeverity(3.5)).toBe(Severity.LOW);
      expect(calculateGapSeverity(4.0)).toBe(Severity.LOW);
      expect(calculateGapSeverity(5.0)).toBe(Severity.LOW);
    });
  });

  describe('calculatePriorityScore', () => {
    it('should calculate base priority from score correctly', () => {
      // Score 0 → (5-0)*2 = 10
      const result1 = calculatePriorityScore({
        score: 0,
        isFoundational: false,
        sectionWeight: 0,
      });
      expect(result1).toBe(10);

      // Score 2.5 → (5-2.5)*2 = 5
      const result2 = calculatePriorityScore({
        score: 2.5,
        isFoundational: false,
        sectionWeight: 0,
      });
      expect(result2).toBe(5);

      // Score 5 → (5-5)*2 = 0 → clamped to 1
      const result3 = calculatePriorityScore({
        score: 5.0,
        isFoundational: false,
        sectionWeight: 0,
      });
      expect(result3).toBe(1);
    });

    it('should add +2 for foundational questions', () => {
      // Score 2.0, foundational → (5-2)*2 + 2 = 6 + 2 = 8
      const result = calculatePriorityScore({
        score: 2.0,
        isFoundational: true,
        sectionWeight: 0,
      });
      expect(result).toBe(8);
    });

    it('should add section weight boost', () => {
      // Score 2.0, weight 0.20 → (5-2)*2 + 0.20*5 = 6 + 1 = 7
      const result = calculatePriorityScore({
        score: 2.0,
        isFoundational: false,
        sectionWeight: 0.20,
      });
      expect(result).toBe(7);
    });

    it('should combine all factors correctly', () => {
      // Score 1.5, foundational, weight 0.20 → (5-1.5)*2 + 2 + 0.20*5 = 7 + 2 + 1 = 10
      const result = calculatePriorityScore({
        score: 1.5,
        isFoundational: true,
        sectionWeight: 0.20,
      });
      expect(result).toBe(10);
    });

    it('should cap priority at 10', () => {
      // Score 0, foundational, weight 0.30 → (5-0)*2 + 2 + 0.30*5 = 10 + 2 + 1.5 = 13.5 → capped at 10
      const result = calculatePriorityScore({
        score: 0,
        isFoundational: true,
        sectionWeight: 0.30,
      });
      expect(result).toBe(10);
    });

    it('should clamp minimum priority to 1', () => {
      // Perfect score shouldn't result in 0
      const result = calculatePriorityScore({
        score: 5.0,
        isFoundational: false,
        sectionWeight: 0,
      });
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should calculate priority for story example 1', () => {
      // Score 2.8, non-foundational, weight 0.10 → (5-2.8)*2 + 0 + 0.10*5 = 4.4 + 0.5 = 4.9 → 5
      const result = calculatePriorityScore({
        score: 2.8,
        isFoundational: false,
        sectionWeight: 0.10,
      });
      expect(result).toBe(5);
    });

    it('should calculate priority for story example 2', () => {
      // Score 2.0, foundational, weight 0.30 → (5-2.0)*2 + 2 + 0.30*5 = 6 + 2 + 1.5 = 9.5 → 10 (capped)
      const result = calculatePriorityScore({
        score: 2.0,
        isFoundational: true,
        sectionWeight: 0.30,
      });
      expect(result).toBe(10);
    });
  });

  describe('calculateGapPriority', () => {
    it('should map high priority scores to IMMEDIATE', () => {
      const result = calculateGapPriority({
        score: 1.0,
        isFoundational: true,
        sectionWeight: 0.20,
      });
      expect(result).toBe(Priority.IMMEDIATE);
    });

    it('should map medium-high scores to SHORT_TERM', () => {
      const result = calculateGapPriority({
        score: 2.5,
        isFoundational: true,
        sectionWeight: 0.10,
      });
      expect(result).toBe(Priority.SHORT_TERM);
    });

    it('should map medium scores to MEDIUM_TERM', () => {
      const result = calculateGapPriority({
        score: 3.0,
        isFoundational: false,
        sectionWeight: 0.10,
      });
      expect(result).toBe(Priority.MEDIUM_TERM);
    });

    it('should map low scores to LONG_TERM', () => {
      const result = calculateGapPriority({
        score: 4.5,
        isFoundational: false,
        sectionWeight: 0.05,
      });
      expect(result).toBe(Priority.LONG_TERM);
    });
  });

  describe('estimateEffort', () => {
    it('should return SMALL for low weight non-foundational', () => {
      expect(estimateEffort(0.10, false, 2.0)).toBe(EffortRange.SMALL);
      expect(estimateEffort(0.14, false, 3.0)).toBe(EffortRange.SMALL);
    });

    it('should return MEDIUM for moderate weight', () => {
      expect(estimateEffort(0.15, false, 2.5)).toBe(EffortRange.MEDIUM);
      expect(estimateEffort(0.20, false, 2.5)).toBe(EffortRange.MEDIUM);
      expect(estimateEffort(0.25, false, 2.5)).toBe(EffortRange.MEDIUM);
    });

    it('should return MEDIUM for foundational regardless of weight if not LARGE criteria', () => {
      expect(estimateEffort(0.10, true, 2.5)).toBe(EffortRange.MEDIUM);
      expect(estimateEffort(0.14, true, 2.5)).toBe(EffortRange.MEDIUM);
    });

    it('should return LARGE for high weight + foundational + low score', () => {
      expect(estimateEffort(0.30, true, 1.5)).toBe(EffortRange.LARGE);
      expect(estimateEffort(0.26, true, 1.9)).toBe(EffortRange.LARGE);
      expect(estimateEffort(0.40, true, 0.5)).toBe(EffortRange.LARGE);
    });

    it('should NOT return LARGE if score >= 2.0', () => {
      // High weight + foundational but score not low enough
      expect(estimateEffort(0.30, true, 2.0)).toBe(EffortRange.MEDIUM);
      expect(estimateEffort(0.30, true, 2.5)).toBe(EffortRange.MEDIUM);
    });

    it('should NOT return LARGE if not foundational', () => {
      // High weight but not foundational -> doesn't meet LARGE criteria (needs foundational)
      // Weight 0.30 is >0.25 but not foundational, so doesn't meet LARGE requirements
      // Weight >0.25 falls outside MEDIUM range (0.15-0.25), and not foundational
      // So it returns SMALL
      expect(estimateEffort(0.30, false, 1.5)).toBe(EffortRange.SMALL);
    });
  });

  describe('estimateCost', () => {
    it('should return UNDER_10K for SMALL effort', () => {
      expect(estimateCost(EffortRange.SMALL, Severity.LOW, 0.10, false)).toBe(CostRange.UNDER_10K);
      expect(estimateCost(EffortRange.SMALL, Severity.MEDIUM, 0.10, false)).toBe(CostRange.UNDER_10K);
    });

    it('should return RANGE_10K_50K for SMALL + foundational', () => {
      expect(estimateCost(EffortRange.SMALL, Severity.MEDIUM, 0.10, true)).toBe(CostRange.RANGE_10K_50K);
    });

    it('should return RANGE_10K_50K for MEDIUM effort', () => {
      expect(estimateCost(EffortRange.MEDIUM, Severity.MEDIUM, 0.20, false)).toBe(CostRange.RANGE_10K_50K);
    });

    it('should return RANGE_50K_100K for MEDIUM + foundational', () => {
      expect(estimateCost(EffortRange.MEDIUM, Severity.HIGH, 0.20, true)).toBe(CostRange.RANGE_50K_100K);
    });

    it('should return RANGE_50K_100K for LARGE effort', () => {
      expect(estimateCost(EffortRange.LARGE, Severity.MEDIUM, 0.30, true)).toBe(CostRange.RANGE_50K_100K);
    });

    it('should return RANGE_100K_250K for LARGE + CRITICAL', () => {
      expect(estimateCost(EffortRange.LARGE, Severity.CRITICAL, 0.20, true)).toBe(CostRange.RANGE_100K_250K);
    });

    it('should return OVER_250K for LARGE + CRITICAL + high weight', () => {
      expect(estimateCost(EffortRange.LARGE, Severity.CRITICAL, 0.25, true)).toBe(CostRange.OVER_250K);
      expect(estimateCost(EffortRange.LARGE, Severity.CRITICAL, 0.30, true)).toBe(CostRange.OVER_250K);
    });

    it('should NOT return OVER_250K if weight <= 0.20', () => {
      expect(estimateCost(EffortRange.LARGE, Severity.CRITICAL, 0.20, true)).toBe(CostRange.RANGE_100K_250K);
      expect(estimateCost(EffortRange.LARGE, Severity.CRITICAL, 0.15, true)).toBe(CostRange.RANGE_100K_250K);
    });
  });

  describe('calculateGapPrioritization', () => {
    it('should calculate all fields correctly for low-severity gap', () => {
      const result = calculateGapPrioritization({
        score: 2.8,
        isFoundational: false,
        sectionWeight: 0.10,
      });

      expect(result.severity).toBe(Severity.MEDIUM);
      expect(result.priorityScore).toBe(5);
      expect(result.priority).toBe(Priority.MEDIUM_TERM);
      expect(result.effort).toBe(EffortRange.SMALL);
      expect(result.cost).toBe(CostRange.UNDER_10K);
    });

    it('should calculate all fields correctly for high-severity gap', () => {
      const result = calculateGapPrioritization({
        score: 1.2,
        isFoundational: true,
        sectionWeight: 0.20,
      });

      expect(result.severity).toBe(Severity.CRITICAL);
      expect(result.priorityScore).toBe(10);
      expect(result.priority).toBe(Priority.IMMEDIATE);
      expect(result.effort).toBe(EffortRange.MEDIUM); // Not LARGE because score > 2.0 not met
      expect(result.cost).toBe(CostRange.RANGE_50K_100K); // MEDIUM + foundational
    });

    it('should calculate all fields correctly for maximum-priority gap', () => {
      const result = calculateGapPrioritization({
        score: 0.5,
        isFoundational: true,
        sectionWeight: 0.30,
      });

      expect(result.severity).toBe(Severity.CRITICAL);
      expect(result.priorityScore).toBe(10); // Capped at 10
      expect(result.priority).toBe(Priority.IMMEDIATE);
      expect(result.effort).toBe(EffortRange.LARGE);
      expect(result.cost).toBe(CostRange.OVER_250K);
    });

    it('should handle edge case: missing answer (score 0)', () => {
      const result = calculateGapPrioritization({
        score: 0,
        isFoundational: false,
        sectionWeight: 0.10,
      });

      expect(result.severity).toBe(Severity.CRITICAL);
      expect(result.priorityScore).toBe(10);
      expect(result.priority).toBe(Priority.IMMEDIATE);
      expect(result.effort).toBe(EffortRange.SMALL);
      expect(result.cost).toBe(CostRange.UNDER_10K);
    });

    it('should handle edge case: perfect score (no gap should exist)', () => {
      // This shouldn't normally happen as gaps are only created for score < 3.0
      const result = calculateGapPrioritization({
        score: 5.0,
        isFoundational: false,
        sectionWeight: 0.10,
      });

      expect(result.severity).toBe(Severity.LOW);
      expect(result.priorityScore).toBe(1); // Minimum
      expect(result.priority).toBe(Priority.LONG_TERM);
      expect(result.effort).toBe(EffortRange.SMALL);
      expect(result.cost).toBe(CostRange.UNDER_10K);
    });
  });

  describe('Integration scenarios', () => {
    it('should prioritize foundational question gaps higher', () => {
      const nonFoundational = calculateGapPrioritization({
        score: 2.0,
        isFoundational: false,
        sectionWeight: 0.15,
      });

      const foundational = calculateGapPrioritization({
        score: 2.0,
        isFoundational: true,
        sectionWeight: 0.15,
      });

      expect(foundational.priorityScore).toBeGreaterThan(nonFoundational.priorityScore);
    });

    it('should prioritize high-weight section gaps higher', () => {
      // Score 2.0: (5-2)*2 = 6
      // Low weight 0.10: 6 + 0.10*5 = 6.5 → 7
      const lowWeight = calculateGapPrioritization({
        score: 2.0,
        isFoundational: false,
        sectionWeight: 0.10,
      });

      // High weight 0.30: 6 + 0.30*5 = 7.5 → 8
      const highWeight = calculateGapPrioritization({
        score: 2.0,
        isFoundational: false,
        sectionWeight: 0.30,
      });

      expect(highWeight.priorityScore).toBeGreaterThan(lowWeight.priorityScore);
    });

    it('should prioritize lower scores higher', () => {
      const moderateGap = calculateGapPrioritization({
        score: 2.5,
        isFoundational: false,
        sectionWeight: 0.15,
      });

      const severeGap = calculateGapPrioritization({
        score: 1.0,
        isFoundational: false,
        sectionWeight: 0.15,
      });

      expect(severeGap.priorityScore).toBeGreaterThan(moderateGap.priorityScore);
    });
  });
});
