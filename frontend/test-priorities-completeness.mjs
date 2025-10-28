// Test the priorities completeness check logic

const arePrioritiesComplete = (priorities) => {
  if (!priorities) return false;

  // Check all required array fields have at least one item
  const requiredArrays = [
    'selectedUseCases',
    'rankedPriorities',
  ];

  const arrayFieldsComplete = requiredArrays.every(field =>
    Array.isArray(priorities[field]) && priorities[field].length > 0
  );

  // Check all required string fields are not empty
  const requiredStrings = [
    'primaryGoal',
    'implementationUrgency',
    'budgetRange',
    'deploymentPreference',
    'vendorMaturity',
    'geographicRequirements',
    'supportModel',
  ];

  const stringFieldsComplete = requiredStrings.every(field =>
    priorities[field] && priorities[field].trim().length > 0
  );

  return arrayFieldsComplete && stringFieldsComplete;
};

// Test with John Doe's actual data
const johnDoePriorities = {
  companySize: 'SMB',
  annualRevenue: 'FROM_1M_10M',
  complianceTeamSize: 'ONE_TWO',
  jurisdictions: ['US', 'EU'],
  existingSystems: [],
  primaryGoal: 'Regulatory compliance',
  implementationUrgency: 'MEDIUM',
  selectedUseCases: [], // EMPTY
  rankedPriorities: [], // EMPTY
  budgetRange: 'RANGE_10K_50K',
  deploymentPreference: 'CLOUD',
  mustHaveFeatures: [],
  criticalIntegrations: [],
  vendorMaturity: 'ESTABLISHED',
  geographicRequirements: 'GLOBAL',
  supportModel: 'STANDARD',
  decisionFactorRanking: [],
};

// Test with complete priorities
const completePriorities = {
  ...johnDoePriorities,
  selectedUseCases: ['KYC', 'AML'],
  rankedPriorities: ['KYC', 'AML'],
};

console.log('=== Test Results ===');
console.log('John Doe (incomplete):', arePrioritiesComplete(johnDoePriorities)); // Should be false
console.log('Complete priorities:', arePrioritiesComplete(completePriorities)); // Should be true
console.log('Null priorities:', arePrioritiesComplete(null)); // Should be false
console.log('Undefined priorities:', arePrioritiesComplete(undefined)); // Should be false

if (!arePrioritiesComplete(johnDoePriorities)) {
  console.log('\n✓ Correctly identified John Doe\'s priorities as INCOMPLETE');
} else {
  console.log('\n✗ ERROR: Should have identified priorities as incomplete');
}

if (arePrioritiesComplete(completePriorities)) {
  console.log('✓ Correctly identified complete priorities as COMPLETE');
} else {
  console.log('✗ ERROR: Should have identified priorities as complete');
}
