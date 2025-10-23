import { z } from 'zod';

// Recreate the validation schema
const PrioritiesSchema = z.object({
  // Step 1: Organizational Context
  companySize: z.enum(['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE']),
  annualRevenue: z.enum(['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M']),
  complianceTeamSize: z.enum(['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN']),
  jurisdictions: z
    .array(z.string().min(1))
    .min(1, 'At least one jurisdiction is required'),
  existingSystems: z.array(z.string()),

  // Step 2: Goals & Timeline
  primaryGoal: z.string().min(1, 'Primary goal is required'),
  implementationUrgency: z.enum(['IMMEDIATE', 'PLANNED', 'STRATEGIC', 'LONG_TERM']),

  // Step 3: Use Case Prioritization
  selectedUseCases: z
    .array(z.string().min(1))
    .min(3, 'Select at least 3 use cases'),
  rankedPriorities: z
    .array(z.string().min(1))
    .length(3, 'Must rank exactly 3 priorities'),

  // Step 4: Solution Requirements
  budgetRange: z.enum(
    ['UNDER_10K', 'RANGE_10K_50K', 'RANGE_50K_100K', 'RANGE_100K_250K', 'OVER_250K']
  ),
  deploymentPreference: z.enum(['CLOUD', 'ON_PREMISE', 'HYBRID', 'FLEXIBLE']),
  mustHaveFeatures: z
    .array(z.string().min(1))
    .max(5, 'Maximum 5 must-have features allowed'),
  criticalIntegrations: z.array(z.string()),

  // Step 5: Vendor Preferences
  vendorMaturity: z.enum(['ENTERPRISE', 'MID_MARKET', 'STARTUP', 'ANY']),
  geographicRequirements: z.string(),
  supportModel: z.string(),

  // Step 6: Decision Factors
  decisionFactorRanking: z
    .array(z.string().min(1))
    .length(6, 'Must rank all 6 decision factors'),
});

// Sample payload
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

console.log('Testing sample payload...\n');
console.log('Payload:', JSON.stringify(samplePayload, null, 2));
console.log('\n---\n');

try {
  const result = PrioritiesSchema.parse(samplePayload);
  console.log('✅ Validation PASSED!');
  console.log('Valid data:', result);
} catch (error) {
  console.log('❌ Validation FAILED!');
  console.log('\nError details:');
  if (error.errors) {
    error.errors.forEach((err, i) => {
      console.log(`\n${i + 1}. Field: ${err.path.join('.')}`);
      console.log(`   Message: ${err.message}`);
      console.log(`   Received: ${JSON.stringify(err.received)}`);
      console.log(`   Expected: ${JSON.stringify(err.expected) || err.code}`);
    });
  } else {
    console.log(error);
  }
}
