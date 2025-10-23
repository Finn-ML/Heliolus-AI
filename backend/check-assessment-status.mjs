import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAssessmentStatus() {
  try {
    const assessmentId = 'cmh3fju610001phrlckdz3aa2';

    // Get the assessment with priorities
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        priorities: {
          select: {
            id: true,
            assessmentId: true,
            primaryGoal: true,
            budgetRange: true,
            implementationUrgency: true,
            createdAt: true,
            updatedAt: true
          }
        },
        template: {
          select: {
            name: true,
            category: true
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
        }
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    console.log('\n===== Assessment Details =====');
    console.log('ID:', assessment.id);
    console.log('Status:', assessment.status);
    console.log('Risk Score:', assessment.riskScore);
    console.log('Template:', assessment.template?.name);
    console.log('Gaps count:', assessment.gaps?.length || 0);
    console.log('Risks count:', assessment.risks?.length || 0);

    console.log('\n===== Priorities Check =====');
    console.log('Has Priorities Object:', !!assessment.priorities);
    console.log('Priorities:', assessment.priorities);

    // Simulate what the API returns
    const apiResponse = {
      id: assessment.id,
      status: assessment.status,
      riskScore: assessment.riskScore,
      template: assessment.template,
      gaps: assessment.gaps || [],
      risks: assessment.risks || [],
      hasPriorities: !!assessment.priorities,
      completedAt: assessment.completedAt,
      updatedAt: assessment.updatedAt
    };

    console.log('\n===== API Response (hasPriorities) =====');
    console.log('hasPriorities:', apiResponse.hasPriorities);
    console.log('hasPriorities type:', typeof apiResponse.hasPriorities);

    // Check how frontend would interpret it
    const isCompleted = apiResponse.status === 'COMPLETED';
    const hasPriorities = apiResponse.hasPriorities === true || apiResponse.hasPriorities === 'true';

    console.log('\n===== Frontend Logic =====');
    console.log('isCompleted:', isCompleted);
    console.log('hasPriorities (after type check):', hasPriorities);

    let frontendStatus;
    if (apiResponse.status === 'IN_PROGRESS') {
      frontendStatus = 'generating';
    } else if (isCompleted && hasPriorities) {
      frontendStatus = 'completed';
    } else if (isCompleted && !hasPriorities) {
      frontendStatus = 'complete-priorities';
    } else {
      frontendStatus = 'generating';
    }

    console.log('Frontend Status Should Be:', frontendStatus);

    if (frontendStatus !== 'completed' && assessment.priorities) {
      console.log('\n⚠️ ERROR: Assessment has priorities but frontend would show wrong status!');
      console.log('This indicates a data flow issue between backend and frontend.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssessmentStatus();