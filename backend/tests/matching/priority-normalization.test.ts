/**
 * Unit Tests for Priority Format Normalization
 * Story 1.2: Normalize Priority Format in Vendor Matching
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePriorityFormat,
  calculateTopPriorityBoost
} from '../../src/matching/priority-boost';
import { PRIORITY_BOOST_WEIGHTS } from '../../src/types/matching.types';

describe('Priority Format Normalization - Story 1.2', () => {
  describe('normalizePriorityFormat()', () => {
    describe('Basic Normalization', () => {
      it('should convert lowercase-hyphen to UPPERCASE_SNAKE_CASE', () => {
        expect(normalizePriorityFormat('transaction-monitoring')).toBe('TRANSACTION_MONITORING');
        expect(normalizePriorityFormat('risk-scoring')).toBe('RISK_SCORING');
        expect(normalizePriorityFormat('fraud-detection')).toBe('FRAUD_DETECTION');
        expect(normalizePriorityFormat('kyc-aml')).toBe('KYC_AML');
      });

      it('should handle single-word priorities', () => {
        expect(normalizePriorityFormat('sanctions')).toBe('SANCTIONS');
        expect(normalizePriorityFormat('compliance')).toBe('COMPLIANCE');
      });

      it('should handle multiple hyphens', () => {
        expect(normalizePriorityFormat('know-your-customer-checks')).toBe('KNOW_YOUR_CUSTOMER_CHECKS');
        expect(normalizePriorityFormat('anti-money-laundering')).toBe('ANTI_MONEY_LAUNDERING');
      });
    });

    describe('Case Handling', () => {
      it('should handle already uppercase strings', () => {
        expect(normalizePriorityFormat('TRANSACTION-MONITORING')).toBe('TRANSACTION_MONITORING');
        expect(normalizePriorityFormat('RISK-SCORING')).toBe('RISK_SCORING');
      });

      it('should handle mixed case strings', () => {
        expect(normalizePriorityFormat('Transaction-Monitoring')).toBe('TRANSACTION_MONITORING');
        expect(normalizePriorityFormat('Risk-Scoring')).toBe('RISK_SCORING');
      });

      it('should handle lowercase without hyphens', () => {
        expect(normalizePriorityFormat('transactionmonitoring')).toBe('TRANSACTIONMONITORING');
      });
    });

    describe('Edge Cases', () => {
      it('should return null for null input', () => {
        expect(normalizePriorityFormat(null)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(normalizePriorityFormat(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(normalizePriorityFormat('')).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        expect(normalizePriorityFormat('   ')).toBeNull();
        expect(normalizePriorityFormat('\t')).toBeNull();
        expect(normalizePriorityFormat('\n')).toBeNull();
      });

      it('should trim whitespace from input', () => {
        expect(normalizePriorityFormat('  transaction-monitoring  ')).toBe('TRANSACTION_MONITORING');
        expect(normalizePriorityFormat('\ttransaction-monitoring\t')).toBe('TRANSACTION_MONITORING');
      });
    });

    describe('Real VendorCategory Enum Values', () => {
      it('should match KYC_AML format', () => {
        expect(normalizePriorityFormat('kyc-aml')).toBe('KYC_AML');
      });

      it('should match TRANSACTION_MONITORING format', () => {
        expect(normalizePriorityFormat('transaction-monitoring')).toBe('TRANSACTION_MONITORING');
      });

      it('should match SANCTIONS_SCREENING format', () => {
        expect(normalizePriorityFormat('sanctions-screening')).toBe('SANCTIONS_SCREENING');
      });

      it('should match TRADE_SURVEILLANCE format', () => {
        expect(normalizePriorityFormat('trade-surveillance')).toBe('TRADE_SURVEILLANCE');
      });

      it('should match RISK_ASSESSMENT format', () => {
        expect(normalizePriorityFormat('risk-assessment')).toBe('RISK_ASSESSMENT');
      });

      it('should match COMPLIANCE_TRAINING format', () => {
        expect(normalizePriorityFormat('compliance-training')).toBe('COMPLIANCE_TRAINING');
      });

      it('should match REGULATORY_REPORTING format', () => {
        expect(normalizePriorityFormat('regulatory-reporting')).toBe('REGULATORY_REPORTING');
      });

      it('should match DATA_GOVERNANCE format', () => {
        expect(normalizePriorityFormat('data-governance')).toBe('DATA_GOVERNANCE');
      });
    });
  });

  describe('calculateTopPriorityBoost()', () => {
    describe('Rank 1 Priority Matching (20 points)', () => {
      it('should award 20 points for rank 1 priority match', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING', 'KYC_AML'] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-scoring', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_1);
        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('transaction-monitoring');
      });

      it('should match KYC_AML from kyc-aml priority', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['KYC_AML'] as any
        };
        const priorities = {
          rankedPriorities: ['kyc-aml']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('kyc-aml');
      });
    });

    describe('Rank 2 Priority Matching (15 points)', () => {
      it('should award 15 points for rank 2 priority match', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['RISK_ASSESSMENT'] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-assessment', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_2);
        expect(result.boost).toBe(15);
        expect(result.matchedPriority).toBe('risk-assessment');
      });

      it('should not check rank 2 if rank 1 matched', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING', 'RISK_ASSESSMENT'] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-assessment']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        // Should return rank 1 match (20 points), not rank 2 (15 points)
        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('transaction-monitoring');
      });
    });

    describe('Rank 3 Priority Matching (10 points)', () => {
      it('should award 10 points for rank 3 priority match', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['COMPLIANCE_TRAINING'] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-assessment', 'compliance-training']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(PRIORITY_BOOST_WEIGHTS.TOP_PRIORITY_RANK_3);
        expect(result.boost).toBe(10);
        expect(result.matchedPriority).toBe('compliance-training');
      });
    });

    describe('No Priority Match (0 points)', () => {
      it('should return 0 points when no priorities match', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['DATA_GOVERNANCE'] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-assessment', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(0);
        expect(result.matchedPriority).toBeNull();
      });

      it('should return 0 points when vendor has no categories', () => {
        const vendor = {
          id: 'vendor1',
          categories: [] as any
        };
        const priorities = {
          rankedPriorities: ['transaction-monitoring']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(0);
        expect(result.matchedPriority).toBeNull();
      });

      it('should return 0 points when priorities are empty', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING'] as any
        };
        const priorities = {
          rankedPriorities: []
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(0);
        expect(result.matchedPriority).toBeNull();
      });
    });

    describe('Case Sensitivity', () => {
      it('should match regardless of priority case', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING'] as any
        };
        const priorities = {
          rankedPriorities: ['Transaction-Monitoring'] // Mixed case
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(20);
      });

      it('should match uppercase priority', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING'] as any
        };
        const priorities = {
          rankedPriorities: ['TRANSACTION-MONITORING'] // All uppercase
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        expect(result.boost).toBe(20);
      });
    });

    describe('Real-world Test Case from Analysis', () => {
      it('should match Napier AI with transaction-monitoring priority', () => {
        // Test case from docs/VENDOR_MATCH_SCORE_ANALYSIS.md
        const napierAI = {
          id: 'napier-ai',
          categories: ['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING'] as any
        };
        const userPriorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-scoring', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(napierAI, userPriorities);

        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('transaction-monitoring');
      });

      it('should match DISCAI with transaction-monitoring priority', () => {
        const discai = {
          id: 'discai',
          categories: ['KYC_AML', 'TRANSACTION_MONITORING'] as any
        };
        const userPriorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-scoring', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(discai, userPriorities);

        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('transaction-monitoring');
      });

      it('should return 0 for vendor without matching categories', () => {
        const kount = {
          id: 'kount',
          categories: ['KYC_AML'] as any // No TRANSACTION_MONITORING
        };
        const userPriorities = {
          rankedPriorities: ['transaction-monitoring', 'risk-scoring', 'fraud-detection']
        } as any;

        const result = calculateTopPriorityBoost(kount, userPriorities);

        expect(result.boost).toBe(0);
        expect(result.matchedPriority).toBeNull();
      });
    });

    describe('Priority Rank Precedence', () => {
      it('should always return highest-ranked match', () => {
        const vendor = {
          id: 'vendor1',
          categories: ['TRANSACTION_MONITORING', 'RISK_ASSESSMENT', 'COMPLIANCE_TRAINING'] as any
        };
        const priorities = {
          rankedPriorities: ['compliance-training', 'risk-assessment', 'transaction-monitoring']
        } as any;

        const result = calculateTopPriorityBoost(vendor, priorities);

        // Should match rank 1 (compliance-training) for 20 points, not rank 2 or 3
        expect(result.boost).toBe(20);
        expect(result.matchedPriority).toBe('compliance-training');
      });
    });
  });
});
