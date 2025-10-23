// Test priorities validation
const { PrioritiesSchema } = require('./backend/src/types/priorities.schema.ts');

// Sample payload that mimics what frontend would send
const samplePayload = {
  // Step 1
  companySize: 'STARTUP',
  annualRevenue: 'FROM_1M_10M',
  complianceTeamSize: 'ONE_TWO',
  jurisdictions: ['FINCEN', 'FCA'],
  existingSystems: ['ACTIMIZE', 'WORLDCHECK'],

  // Step 2
  primaryGoal: 'REGULATORY_COMPLIANCE',
  implementationUrgency: 'PLANNED',

  // Step 3
  selectedUseCases: ['KYC', 'Transaction Monitoring', 'Sanctions Screening'],
  rankedPriorities: ['KYC', 'Transaction Monitoring', 'Sanctions Screening'],

  // Step 4
  budgetRange: 'RANGE_10K_50K',
  deploymentPreference: 'CLOUD',
  mustHaveFeatures: ['REAL_TIME_MONITORING', 'API_INTEGRATION'],
  criticalIntegrations: ['SALESFORCE'],

  // Step 5
  vendorMaturity: 'MID_MARKET',
  geographicRequirements: 'REGIONAL',
  supportModel: 'STANDARD',

  // Step 6
  decisionFactorRanking: [
    'Total Cost of Ownership',
    'Implementation Speed',
    'Feature Completeness',
    'Vendor Reputation & Stability',
    'Integration Capabilities',
    'Scalability & Future-readiness'
  ]
};

console.log('Testing payload:', JSON.stringify(samplePayload, null, 2));

try {
  const result = PrioritiesSchema.parse(samplePayload);
  console.log('✅ Validation passed!');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Validation failed!');
  console.error('Error:', error.errors || error.message);
  console.error('Details:', JSON.stringify(error.errors, null, 2));
}
