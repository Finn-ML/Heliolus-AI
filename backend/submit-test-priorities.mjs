import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function submitTestPriorities() {
  try {
    // Get a completed assessment without priorities
    const assessment = await prisma.assessment.findFirst({
      where: {
        status: 'COMPLETED',
        priorities: {
          is: null
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    if (!assessment) {
      console.log('No completed assessments without priorities found');
      return;
    }

    console.log('Found assessment without priorities:', assessment.id);

    // Create test priorities data
    const prioritiesData = {
      assessmentId: assessment.id,
      // Organizational Context
      companySize: 'ENTERPRISE',
      annualRevenue: 'OVER_100M',
      complianceTeamSize: 'OVER_TEN',
      jurisdictions: ['FINCEN', 'FCA', 'EBA'],
      existingSystems: ['ACTIMIZE', 'COMPLYADVANTAGE'],

      // Goals and Timeline
      primaryGoal: 'RISK_REDUCTION',
      implementationUrgency: 'IMMEDIATE',

      // Use Case Prioritization
      selectedUseCases: ['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING'],
      rankedPriorities: ['TRANSACTION_MONITORING', 'KYC_AML', 'SANCTIONS_SCREENING'],

      // Solution Requirements
      budgetRange: 'OVER_250K',
      deploymentPreference: 'CLOUD',
      mustHaveFeatures: ['REAL_TIME_MONITORING', 'AI_ML_DETECTION', 'CASE_MANAGEMENT'],
      criticalIntegrations: ['Core Banking', 'Payment Gateway'],

      // Vendor Preferences
      vendorMaturity: 'ENTERPRISE',
      geographicRequirements: 'Global coverage needed',
      supportModel: 'Premium support',

      // Decision Factors
      decisionFactorRanking: [
        'Feature Completeness',
        'Vendor Reputation & Stability',
        'Integration Capabilities',
        'Total Cost of Ownership',
        'Implementation Speed',
        'Scalability & Future-readiness'
      ]
    };

    // Create priorities record
    const priorities = await prisma.assessmentPriorities.create({
      data: prioritiesData
    });

    console.log('\n===== Priorities Created =====');
    console.log('Priorities ID:', priorities.id);
    console.log('Assessment ID:', priorities.assessmentId);
    console.log('Primary Goal:', priorities.primaryGoal);
    console.log('Budget Range:', priorities.budgetRange);
    console.log('Created At:', priorities.createdAt);

    // Verify the assessment now has priorities
    const updatedAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        priorities: {
          select: {
            id: true
          }
        }
      }
    });

    console.log('\n===== Verification =====');
    console.log('Assessment has priorities:', !!updatedAssessment?.priorities);
    console.log('Priorities ID:', updatedAssessment?.priorities?.id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

submitTestPriorities();