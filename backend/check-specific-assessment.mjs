import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkSpecificAssessment() {
  try {
    const assessmentId = 'cmh3fju610001phrlckdz3aa2';

    // Get the assessment with all relevant data
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        priorities: true,
        template: {
          select: {
            name: true
          }
        },
        gaps: {
          select: {
            id: true
          }
        },
        risks: {
          select: {
            id: true
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    console.log('\n===== Assessment Details =====');
    console.log('ID:', assessment.id);
    console.log('Organization:', assessment.organization?.name);
    console.log('Template:', assessment.template?.name);
    console.log('Status:', assessment.status);
    console.log('Risk Score:', assessment.riskScore);
    console.log('Completed At:', assessment.completedAt);
    console.log('Gaps Count:', assessment.gaps?.length || 0);
    console.log('Risks Count:', assessment.risks?.length || 0);

    console.log('\n===== Priorities Status =====');
    console.log('Has Priorities:', !!assessment.priorities);

    if (assessment.priorities) {
      console.log('Priorities ID:', assessment.priorities.id);
      console.log('Assessment ID (in priorities):', assessment.priorities.assessmentId);
      console.log('Primary Goal:', assessment.priorities.primaryGoal);
      console.log('Implementation Urgency:', assessment.priorities.implementationUrgency);
      console.log('Budget Range:', assessment.priorities.budgetRange);
      console.log('Vendor Maturity:', assessment.priorities.vendorMaturity);
      console.log('Created At:', assessment.priorities.createdAt);
      console.log('Updated At:', assessment.priorities.updatedAt);

      // Check the actual values stored
      console.log('\n===== Stored Values Check =====');
      console.log('Selected Use Cases:', assessment.priorities.selectedUseCases);
      console.log('Ranked Priorities:', assessment.priorities.rankedPriorities);
      console.log('Decision Factor Ranking:', assessment.priorities.decisionFactorRanking);
    } else {
      console.log('NO PRIORITIES FOUND');
    }

    // Simulate what the API would return
    console.log('\n===== API Response Simulation =====');
    const apiResponse = {
      id: assessment.id,
      status: assessment.status,
      riskScore: assessment.riskScore,
      completedAt: assessment.completedAt?.toISOString(),
      template: assessment.template ? {
        id: assessment.template.id,
        name: assessment.template.name,
      } : null,
      gaps: assessment.gaps || [],
      risks: assessment.risks || [],
      hasPriorities: !!assessment.priorities
    };

    console.log('hasPriorities field:', apiResponse.hasPriorities);
    console.log('\nFrontend should show:');
    if (assessment.status === 'COMPLETED' && apiResponse.hasPriorities) {
      console.log('✓ Status: "Completed" (green badge)');
    } else if (assessment.status === 'COMPLETED' && !apiResponse.hasPriorities) {
      console.log('⚠ Status: "Complete Priorities" (yellow badge)');
    } else if (assessment.status === 'IN_PROGRESS') {
      console.log('⏰ Status: "Generating" (blue badge)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificAssessment();