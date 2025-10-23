import fetch from 'node-fetch';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testApiResponse() {
  try {
    // First get a valid user from the database
    const user = await prisma.user.findFirst({
      include: {
        organization: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    if (!user.organization) {
      console.log('User has no organization');
      return;
    }

    console.log('User:', user.email);
    console.log('Organization:', user.organization.name);

    // Actually, let's just query the database directly
    const assessments = await prisma.assessment.findMany({
      where: {
        organizationId: user.organization.id
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

    console.log('\n===== All Assessments =====');

    assessments.forEach(assessment => {
      console.log('\n--- Assessment ---');
      console.log('ID:', assessment.id);
      console.log('Status:', assessment.status);
      console.log('Risk Score:', assessment.riskScore);
      console.log('Template:', assessment.template?.name || 'None');
      console.log('Gaps Count:', assessment.gaps?.length || 0);
      console.log('Risks Count:', assessment.risks?.length || 0);
      console.log('Has Priorities:', !!assessment.priorities);
      console.log('Priorities ID:', assessment.priorities?.id || 'None');
      console.log('Completed At:', assessment.completedAt);

      // Determine what status this would be on frontend
      const isCompleted = assessment.status === 'COMPLETED';
      const hasPriorities = !!assessment.priorities;

      let status;
      if (assessment.status === 'IN_PROGRESS') {
        status = 'generating';
      } else if (isCompleted && hasPriorities) {
        status = 'completed';
      } else if (isCompleted && !hasPriorities) {
        status = 'complete-priorities';
      } else {
        status = 'generating';
      }

      console.log('Frontend Status Should Be:', status);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse();