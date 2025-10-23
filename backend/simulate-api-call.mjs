import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function simulateApiCall() {
  try {
    // Get the organization for this assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id: 'cmh3fju610001phrlckdz3aa2' },
      select: {
        organizationId: true
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    // Simulate the exact query the API endpoint uses
    const assessments = await prisma.assessment.findMany({
      where: {
        organizationId: assessment.organizationId
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
        gaps: {
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
            priority: true,
          }
        },
        risks: {
          select: {
            id: true,
            category: true,
            title: true,
            riskLevel: true,
          }
        },
        priorities: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100  // Same as API
    });

    // Find our specific assessment
    const targetAssessment = assessments.find(a => a.id === 'cmh3fju610001phrlckdz3aa2');

    if (targetAssessment) {
      console.log('\n===== Target Assessment (cmh3fju610001phrlckdz3aa2) =====');
      console.log('Status:', targetAssessment.status);
      console.log('Priorities object:', targetAssessment.priorities);
      console.log('Has Priorities (!!priorities):', !!targetAssessment.priorities);
      console.log('Gaps count:', targetAssessment.gaps?.length);
      console.log('Risks count:', targetAssessment.risks?.length);

      // Simulate the mapping done in the API route
      const mapped = {
        id: targetAssessment.id,
        status: targetAssessment.status,
        riskScore: targetAssessment.riskScore,
        template: targetAssessment.template,
        gaps: targetAssessment.gaps || [],
        risks: targetAssessment.risks || [],
        hasPriorities: !!targetAssessment.priorities,
      };

      console.log('\n===== After API Mapping =====');
      console.log('hasPriorities:', mapped.hasPriorities);
      console.log('status:', mapped.status);

      // Simulate frontend logic
      const isCompleted = mapped.status === 'COMPLETED';
      const hasPriorities = mapped.hasPriorities === true;

      console.log('\n===== Frontend Logic =====');
      console.log('isCompleted:', isCompleted);
      console.log('hasPriorities:', hasPriorities);

      let frontendStatus;
      if (mapped.status === 'IN_PROGRESS') {
        frontendStatus = 'generating';
      } else if (isCompleted && hasPriorities) {
        frontendStatus = 'completed';
      } else if (isCompleted && !hasPriorities) {
        frontendStatus = 'complete-priorities';
      } else {
        frontendStatus = 'generating';
      }

      console.log('Frontend Status Should Be:', frontendStatus);

      if (frontendStatus === 'complete-priorities' && mapped.hasPriorities === true) {
        console.log('\n⚠️ WARNING: Mismatch detected! Assessment has priorities but would show as "Complete Priorities"');
      }
    } else {
      console.log('Target assessment not found in results');
    }

    // Also check all COMPLETED assessments
    console.log('\n===== All COMPLETED Assessments =====');
    const completed = assessments.filter(a => a.status === 'COMPLETED');
    completed.forEach(a => {
      const hasPri = !!a.priorities;
      console.log(`${a.id}: hasPriorities=${hasPri}, status=${a.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateApiCall();