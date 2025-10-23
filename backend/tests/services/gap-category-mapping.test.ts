/**
 * Unit Tests for Gap Category Mapping
 * Story 1.1: Fix Gap Category to Vendor Category Mapping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentService } from '../../src/services/assessment.service';

describe('Gap Category Mapping - Story 1.1', () => {
  let assessmentService: AssessmentService;

  beforeEach(() => {
    assessmentService = new AssessmentService();
  });

  describe('Exact Matches', () => {
    it('should map "Geographic Risk Assessment" to RISK_ASSESSMENT', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Geographic Risk Assessment');
      expect(result).toBe('RISK_ASSESSMENT');
    });

    it('should map "Product & Service Risk" to RISK_ASSESSMENT', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Product & Service Risk');
      expect(result).toBe('RISK_ASSESSMENT');
    });

    it('should map "Transaction Risk & Monitoring" to TRANSACTION_MONITORING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Transaction Risk & Monitoring');
      expect(result).toBe('TRANSACTION_MONITORING');
    });

    it('should map "Transaction Monitoring" to TRANSACTION_MONITORING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Transaction Monitoring');
      expect(result).toBe('TRANSACTION_MONITORING');
    });

    it('should map "Governance & Controls" to DATA_GOVERNANCE', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Governance & Controls');
      expect(result).toBe('DATA_GOVERNANCE');
    });

    it('should map "Regulatory Alignment" to REGULATORY_REPORTING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Regulatory Alignment');
      expect(result).toBe('REGULATORY_REPORTING');
    });

    it('should map "KYC" to KYC_AML', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('KYC');
      expect(result).toBe('KYC_AML');
    });

    it('should map "AML" to KYC_AML', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('AML');
      expect(result).toBe('KYC_AML');
    });

    it('should map "Sanctions" to SANCTIONS_SCREENING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Sanctions');
      expect(result).toBe('SANCTIONS_SCREENING');
    });

    it('should map "Sanctions Screening" to SANCTIONS_SCREENING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Sanctions Screening');
      expect(result).toBe('SANCTIONS_SCREENING');
    });

    it('should map "Trade Surveillance" to TRADE_SURVEILLANCE', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Trade Surveillance');
      expect(result).toBe('TRADE_SURVEILLANCE');
    });

    it('should map "Compliance Training" to COMPLIANCE_TRAINING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Compliance Training');
      expect(result).toBe('COMPLIANCE_TRAINING');
    });

    it('should map "Training & Awareness" to COMPLIANCE_TRAINING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Training & Awareness');
      expect(result).toBe('COMPLIANCE_TRAINING');
    });
  });

  describe('Case-Insensitive Matching', () => {
    it('should map "transaction risk & monitoring" (lowercase) to TRANSACTION_MONITORING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('transaction risk & monitoring');
      expect(result).toBe('TRANSACTION_MONITORING');
    });

    it('should map "GOVERNANCE & CONTROLS" (uppercase) to DATA_GOVERNANCE', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('GOVERNANCE & CONTROLS');
      expect(result).toBe('DATA_GOVERNANCE');
    });

    it('should map "Kyc" (mixed case) to KYC_AML', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Kyc');
      expect(result).toBe('KYC_AML');
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match category containing "kyc" to KYC_AML', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Customer KYC Procedures');
      expect(result).toBe('KYC_AML');
    });

    it('should match category containing "transaction" to TRANSACTION_MONITORING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Real-time Transaction Analysis');
      expect(result).toBe('TRANSACTION_MONITORING');
    });

    it('should match category containing "sanction" to SANCTIONS_SCREENING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('International Sanction Lists');
      expect(result).toBe('SANCTIONS_SCREENING');
    });

    it('should match category containing "risk" to RISK_ASSESSMENT', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Customer Risk Evaluation');
      expect(result).toBe('RISK_ASSESSMENT');
    });

    it('should match category containing "training" to COMPLIANCE_TRAINING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Staff Training Programs');
      expect(result).toBe('COMPLIANCE_TRAINING');
    });

    it('should match category containing "regulatory" to REGULATORY_REPORTING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Regulatory Compliance Reporting');
      expect(result).toBe('REGULATORY_REPORTING');
    });

    it('should match category containing "governance" to DATA_GOVERNANCE', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Corporate Governance Framework');
      expect(result).toBe('DATA_GOVERNANCE');
    });
  });

  describe('Edge Cases', () => {
    it('should return null for empty string', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory(undefined);
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('   ');
      expect(result).toBeNull();
    });

    it('should return null for unmapped category', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Completely Unknown Category');
      expect(result).toBeNull();
    });

    it('should handle category with extra whitespace', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('  Transaction Monitoring  ');
      expect(result).toBe('TRANSACTION_MONITORING');
    });
  });

  describe('Priority Keywords (fuzzy matching precedence)', () => {
    it('should prioritize KYC over AML when both present', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('KYC and AML Procedures');
      expect(result).toBe('KYC_AML');
    });

    it('should match payment-related to TRANSACTION_MONITORING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Payment Processing Monitoring');
      expect(result).toBe('TRANSACTION_MONITORING');
    });

    it('should match embargo to SANCTIONS_SCREENING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Embargo Compliance');
      expect(result).toBe('SANCTIONS_SCREENING');
    });

    it('should match market surveillance to TRADE_SURVEILLANCE', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Market Surveillance Tools');
      expect(result).toBe('TRADE_SURVEILLANCE');
    });

    it('should match education to COMPLIANCE_TRAINING', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Staff Education Programs');
      expect(result).toBe('COMPLIANCE_TRAINING');
    });
  });

  describe('Real-world AI-generated categories', () => {
    it('should handle verbose AI-generated descriptions', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory(
        'Assessment and evaluation of customer risk profiles'
      );
      expect(result).toBe('RISK_ASSESSMENT');
    });

    it('should handle policy-related categories', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Policy & Procedures');
      // This should fuzzy match "governance" or "data" keywords
      // Since it doesn't contain those, it may return null or match another category
      // Let's verify the behavior
      expect(['DATA_GOVERNANCE', null]).toContain(result);
    });

    it('should handle risk management categories', () => {
      const result = (assessmentService as any).mapGapCategoryToVendorCategory('Risk Management');
      expect(result).toBe('RISK_ASSESSMENT');
    });
  });
});
