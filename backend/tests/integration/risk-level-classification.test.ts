/**
 * Integration Tests for Risk Level Classification
 * Ensures frontend and backend use consistent risk level thresholds
 */

import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from '../../src/lib/assessment/scorer';
import { RiskLevel } from '../../src/types/database';

describe('Risk Level Classification', () => {
  const scorer = new ScoreCalculator();

  describe('Score-to-RiskLevel mapping', () => {
    it('should classify 0-29 as CRITICAL RISK', () => {
      expect(scorer.getRiskLevelFromScore(0)).toBe(RiskLevel.CRITICAL);
      expect(scorer.getRiskLevelFromScore(15)).toBe(RiskLevel.CRITICAL);
      expect(scorer.getRiskLevelFromScore(29)).toBe(RiskLevel.CRITICAL);
    });

    it('should classify 30-59 as HIGH RISK', () => {
      expect(scorer.getRiskLevelFromScore(30)).toBe(RiskLevel.HIGH);
      expect(scorer.getRiskLevelFromScore(45)).toBe(RiskLevel.HIGH);
      expect(scorer.getRiskLevelFromScore(59)).toBe(RiskLevel.HIGH);
    });

    it('should classify 60-79 as MEDIUM RISK', () => {
      expect(scorer.getRiskLevelFromScore(60)).toBe(RiskLevel.MEDIUM);
      expect(scorer.getRiskLevelFromScore(65)).toBe(RiskLevel.MEDIUM);
      expect(scorer.getRiskLevelFromScore(70)).toBe(RiskLevel.MEDIUM);
      expect(scorer.getRiskLevelFromScore(79)).toBe(RiskLevel.MEDIUM);
    });

    it('should classify 80-100 as LOW RISK', () => {
      expect(scorer.getRiskLevelFromScore(80)).toBe(RiskLevel.LOW);
      expect(scorer.getRiskLevelFromScore(90)).toBe(RiskLevel.LOW);
      expect(scorer.getRiskLevelFromScore(100)).toBe(RiskLevel.LOW);
    });
  });

  describe('NovaPay test case validation', () => {
    it('should classify NovaPay expected score (65) as MEDIUM RISK', () => {
      const riskLevel = scorer.getRiskLevelFromScore(65);
      expect(riskLevel).toBe(RiskLevel.MEDIUM);
    });

    it('should classify NovaPay actual score (70) as MEDIUM RISK', () => {
      const riskLevel = scorer.getRiskLevelFromScore(70);
      expect(riskLevel).toBe(RiskLevel.MEDIUM);
    });
  });

  describe('Boundary conditions', () => {
    it('should handle exact threshold boundaries correctly', () => {
      // Lower boundary of CRITICAL
      expect(scorer.getRiskLevelFromScore(0)).toBe(RiskLevel.CRITICAL);

      // Upper boundary of CRITICAL / lower boundary of HIGH
      expect(scorer.getRiskLevelFromScore(29)).toBe(RiskLevel.CRITICAL);
      expect(scorer.getRiskLevelFromScore(30)).toBe(RiskLevel.HIGH);

      // Upper boundary of HIGH / lower boundary of MEDIUM
      expect(scorer.getRiskLevelFromScore(59)).toBe(RiskLevel.HIGH);
      expect(scorer.getRiskLevelFromScore(60)).toBe(RiskLevel.MEDIUM);

      // Upper boundary of MEDIUM / lower boundary of LOW
      expect(scorer.getRiskLevelFromScore(79)).toBe(RiskLevel.MEDIUM);
      expect(scorer.getRiskLevelFromScore(80)).toBe(RiskLevel.LOW);

      // Upper boundary of LOW
      expect(scorer.getRiskLevelFromScore(100)).toBe(RiskLevel.LOW);
    });

    it('should handle edge case scores gracefully', () => {
      // Negative scores (shouldn't happen, but handle gracefully)
      expect(scorer.getRiskLevelFromScore(-10)).toBe(RiskLevel.CRITICAL);

      // Scores above 100 (shouldn't happen, but handle gracefully)
      expect(scorer.getRiskLevelFromScore(110)).toBe(RiskLevel.LOW);
    });
  });

  describe('Risk level semantics', () => {
    it('should confirm that higher score = better compliance = lower risk', () => {
      const score10 = scorer.getRiskLevelFromScore(10);   // CRITICAL
      const score40 = scorer.getRiskLevelFromScore(40);   // HIGH
      const score70 = scorer.getRiskLevelFromScore(70);   // MEDIUM
      const score90 = scorer.getRiskLevelFromScore(90);   // LOW

      // Risk level order: CRITICAL > HIGH > MEDIUM > LOW
      expect(score10).toBe(RiskLevel.CRITICAL);
      expect(score40).toBe(RiskLevel.HIGH);
      expect(score70).toBe(RiskLevel.MEDIUM);
      expect(score90).toBe(RiskLevel.LOW);

      // Verify LOW risk is the best outcome
      expect(score90).toBe(RiskLevel.LOW);
      expect(score10).not.toBe(RiskLevel.LOW);
    });
  });

  describe('Common score ranges', () => {
    it('should correctly classify typical assessment scores', () => {
      // Poor compliance
      expect(scorer.getRiskLevelFromScore(25)).toBe(RiskLevel.CRITICAL);

      // Fair compliance
      expect(scorer.getRiskLevelFromScore(45)).toBe(RiskLevel.HIGH);

      // Good compliance (most common)
      expect(scorer.getRiskLevelFromScore(65)).toBe(RiskLevel.MEDIUM);
      expect(scorer.getRiskLevelFromScore(72)).toBe(RiskLevel.MEDIUM);

      // Excellent compliance
      expect(scorer.getRiskLevelFromScore(85)).toBe(RiskLevel.LOW);
      expect(scorer.getRiskLevelFromScore(95)).toBe(RiskLevel.LOW);
    });
  });
});
