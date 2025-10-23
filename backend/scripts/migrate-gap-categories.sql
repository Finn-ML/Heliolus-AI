-- Story 1.1: Fix Gap Category to Vendor Category Mapping
-- Migration script to update existing gap categories to use VendorCategory enum values
-- Run this script against the production database to fix existing gaps

-- Log start of migration
DO $$
BEGIN
  RAISE NOTICE 'Starting gap category migration - Story 1.1';
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- Update "Geographic Risk Assessment" gaps
UPDATE "Gap"
SET category = 'RISK_ASSESSMENT'
WHERE LOWER(category) IN ('geographic risk assessment', 'product & service risk', 'risk management');

-- Update "Transaction Risk & Monitoring" gaps
UPDATE "Gap"
SET category = 'TRANSACTION_MONITORING'
WHERE LOWER(category) IN ('transaction risk & monitoring', 'transaction monitoring');

-- Update "Governance & Controls" gaps
UPDATE "Gap"
SET category = 'DATA_GOVERNANCE'
WHERE LOWER(category) IN ('governance & controls', 'data governance', 'policy & procedures');

-- Update "Regulatory Alignment" gaps
UPDATE "Gap"
SET category = 'REGULATORY_REPORTING'
WHERE LOWER(category) IN ('regulatory alignment', 'regulatory reporting');

-- Update "KYC/AML" gaps
UPDATE "Gap"
SET category = 'KYC_AML'
WHERE LOWER(category) LIKE '%kyc%' OR LOWER(category) LIKE '%aml%';

-- Update "Sanctions" gaps
UPDATE "Gap"
SET category = 'SANCTIONS_SCREENING'
WHERE LOWER(category) LIKE '%sanction%' OR LOWER(category) LIKE '%screening%';

-- Update "Trade Surveillance" gaps
UPDATE "Gap"
SET category = 'TRADE_SURVEILLANCE'
WHERE LOWER(category) LIKE '%trade%' OR LOWER(category) LIKE '%surveillance%';

-- Update "Training & Awareness" gaps
UPDATE "Gap"
SET category = 'COMPLIANCE_TRAINING'
WHERE LOWER(category) IN ('training & awareness', 'compliance training');

-- Fallback: Update any remaining unmapped categories to RISK_ASSESSMENT
UPDATE "Gap"
SET category = 'RISK_ASSESSMENT'
WHERE category NOT IN (
  'KYC_AML',
  'TRANSACTION_MONITORING',
  'SANCTIONS_SCREENING',
  'TRADE_SURVEILLANCE',
  'RISK_ASSESSMENT',
  'COMPLIANCE_TRAINING',
  'REGULATORY_REPORTING',
  'DATA_GOVERNANCE'
);

-- Log completion statistics
DO $$
DECLARE
  total_gaps INTEGER;
  kyc_count INTEGER;
  txn_mon_count INTEGER;
  sanctions_count INTEGER;
  trade_count INTEGER;
  risk_count INTEGER;
  training_count INTEGER;
  regulatory_count INTEGER;
  governance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_gaps FROM "Gap";
  SELECT COUNT(*) INTO kyc_count FROM "Gap" WHERE category = 'KYC_AML';
  SELECT COUNT(*) INTO txn_mon_count FROM "Gap" WHERE category = 'TRANSACTION_MONITORING';
  SELECT COUNT(*) INTO sanctions_count FROM "Gap" WHERE category = 'SANCTIONS_SCREENING';
  SELECT COUNT(*) INTO trade_count FROM "Gap" WHERE category = 'TRADE_SURVEILLANCE';
  SELECT COUNT(*) INTO risk_count FROM "Gap" WHERE category = 'RISK_ASSESSMENT';
  SELECT COUNT(*) INTO training_count FROM "Gap" WHERE category = 'COMPLIANCE_TRAINING';
  SELECT COUNT(*) INTO regulatory_count FROM "Gap" WHERE category = 'REGULATORY_REPORTING';
  SELECT COUNT(*) INTO governance_count FROM "Gap" WHERE category = 'DATA_GOVERNANCE';

  RAISE NOTICE '=== Gap Category Migration Complete ===';
  RAISE NOTICE 'Total gaps: %', total_gaps;
  RAISE NOTICE 'KYC_AML: %', kyc_count;
  RAISE NOTICE 'TRANSACTION_MONITORING: %', txn_mon_count;
  RAISE NOTICE 'SANCTIONS_SCREENING: %', sanctions_count;
  RAISE NOTICE 'TRADE_SURVEILLANCE: %', trade_count;
  RAISE NOTICE 'RISK_ASSESSMENT: %', risk_count;
  RAISE NOTICE 'COMPLIANCE_TRAINING: %', training_count;
  RAISE NOTICE 'REGULATORY_REPORTING: %', regulatory_count;
  RAISE NOTICE 'DATA_GOVERNANCE: %', governance_count;
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;
