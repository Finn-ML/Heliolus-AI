import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

try {
  // Find John Doe
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'john.doe', mode: 'insensitive' } },
        { email: { contains: 'johndoe', mode: 'insensitive' } },
        { firstName: 'John', lastName: 'Doe' }
      ]
    },
    include: {
      subscription: true
    }
  });

  if (!user) {
    console.log('John Doe not found');
    process.exit(0);
  }

  console.log('=== John Doe Info ===');
  console.log('User ID:', user.id);
  console.log('Plan:', user.subscription?.plan);
  console.log('Status:', user.subscription?.status);

  // Get his latest assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      priorities: true,
      template: {
        select: {
          name: true
        }
      }
    }
  });

  if (!assessment) {
    console.log('\n=== No Assessment Found ===');
    process.exit(0);
  }

  console.log('\n=== Latest Assessment ===');
  console.log('Assessment ID:', assessment.id);
  console.log('Template:', assessment.template?.name);
  console.log('Status:', assessment.status);
  console.log('Created:', assessment.createdAt);

  if (assessment.priorities) {
    console.log('\n=== Priorities Data ===');
    console.log('Priorities ID:', assessment.priorities.id);
    console.log('Assessment ID:', assessment.priorities.assessmentId);
    console.log('\n--- Organizational Context ---');
    console.log('Company Size:', assessment.priorities.companySize);
    console.log('Annual Revenue:', assessment.priorities.annualRevenue);
    console.log('Compliance Team Size:', assessment.priorities.complianceTeamSize);
    console.log('Jurisdictions:', assessment.priorities.jurisdictions);
    console.log('Existing Systems:', assessment.priorities.existingSystems);
    console.log('\n--- Goals & Timeline ---');
    console.log('Primary Goal:', assessment.priorities.primaryGoal);
    console.log('Implementation Urgency:', assessment.priorities.implementationUrgency);
    console.log('\n--- Use Case Prioritization ---');
    console.log('Selected Use Cases:', assessment.priorities.selectedUseCases);
    console.log('Ranked Priorities:', assessment.priorities.rankedPriorities);
    console.log('\n--- Solution Requirements ---');
    console.log('Budget Range:', assessment.priorities.budgetRange);
    console.log('Deployment Preference:', assessment.priorities.deploymentPreference);
    console.log('Must Have Features:', assessment.priorities.mustHaveFeatures);
    console.log('Critical Integrations:', assessment.priorities.criticalIntegrations);
    console.log('\n--- Vendor Preferences ---');
    console.log('Vendor Maturity:', assessment.priorities.vendorMaturity);
    console.log('Geographic Requirements:', assessment.priorities.geographicRequirements);
    console.log('Support Model:', assessment.priorities.supportModel);
    console.log('\n--- Decision Factors ---');
    console.log('Decision Factor Ranking:', assessment.priorities.decisionFactorRanking);
    console.log('\n--- Metadata ---');
    console.log('Created At:', assessment.priorities.createdAt);
    console.log('Updated At:', assessment.priorities.updatedAt);

    // Check if all required fields are filled
    const requiredFields = [
      'companySize', 'annualRevenue', 'complianceTeamSize', 'jurisdictions',
      'existingSystems', 'primaryGoal', 'implementationUrgency', 'selectedUseCases',
      'rankedPriorities', 'budgetRange', 'deploymentPreference', 'mustHaveFeatures',
      'criticalIntegrations', 'vendorMaturity', 'geographicRequirements',
      'supportModel', 'decisionFactorRanking'
    ];

    const emptyFields = requiredFields.filter(field => {
      const value = assessment.priorities[field];
      return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    });

    console.log('\n=== Completeness Check ===');
    if (emptyFields.length === 0) {
      console.log('✓ All required fields are filled');
    } else {
      console.log('✗ Missing or empty fields:', emptyFields.length);
      console.log('Empty fields:', emptyFields.join(', '));
    }
  } else {
    console.log('\n=== No Priorities Found ===');
  }

  // Check for gaps (needed for vendor matching)
  const gapsCount = await prisma.gap.count({
    where: {
      assessmentId: assessment.id
    }
  });

  console.log('\n=== Gaps ===');
  console.log('Total Gaps:', gapsCount);

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
} finally {
  await prisma.$disconnect();
}
