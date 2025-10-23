import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testApiResponse() {
  try {
    const targetId = 'cmh3fju610001phrlckdz3aa2';

    // First get the organization ID for this assessment
    const targetAssessment = await prisma.assessment.findUnique({
      where: { id: targetId },
      select: { organizationId: true }
    });

    if (!targetAssessment) {
      console.log('Assessment not found');
      return;
    }

    // Simulate the exact query from the API route
    const assessments = await prisma.assessment.findMany({
      where: {
        organizationId: targetAssessment.organizationId
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
      }
    });

    // Find our specific assessment
    const assessment = assessments.find(a => a.id === targetId);

    if (assessment) {
      console.log('\n===== Raw Assessment Data =====');
      console.log('ID:', assessment.id);
      console.log('Status:', assessment.status);
      console.log('Priorities:', assessment.priorities);

      // Simulate the exact mapping from the API route
      const mapped = {
        id: assessment.id,
        status: assessment.status,
        riskScore: assessment.riskScore,
        completedAt: assessment.completedAt,
        updatedAt: assessment.updatedAt,
        template: assessment.template,
        gaps: assessment.gaps || [],
        risks: assessment.risks || [],
        hasPriorities: !!assessment.priorities,
      };

      console.log('\n===== Mapped API Response =====');
      console.log('hasPriorities:', mapped.hasPriorities);
      console.log('hasPriorities type:', typeof mapped.hasPriorities);

      // Check frontend logic
      const isCompleted = mapped.status === 'COMPLETED';
      const hasPriorities = mapped.hasPriorities === true || mapped.hasPriorities === 'true';

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

      console.log('\n===== Frontend Status =====');
      console.log('Should show as:', frontendStatus);

      if (frontendStatus !== 'completed') {
        console.log('\n⚠️ ERROR: Assessment should show as completed but will show as:', frontendStatus);
      } else {
        console.log('✅ Status should correctly show as completed');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse();
