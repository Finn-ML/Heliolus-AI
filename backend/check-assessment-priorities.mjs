import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkLatestAssessmentWithPriorities() {
  try {
    // Get the latest assessment (any status)
    const assessment = await prisma.assessment.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        template: true,
        priorities: {
          select: {
            id: true,
            primaryGoal: true,
            implementationUrgency: true,
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
      console.log('No assessments found');
      return;
    }

    console.log('\n===== Latest Assessment =====');
    console.log('Assessment ID:', assessment.id);
    console.log('Template:', assessment.template?.name || 'None');
    console.log('Status:', assessment.status);
    console.log('Risk Score:', assessment.riskScore);
    console.log('Completed At:', assessment.completedAt);
    console.log('\nGaps Count:', assessment.gaps?.length || 0);
    console.log('Risks Count:', assessment.risks?.length || 0);
    console.log('\n--- Priorities Status ---');
    console.log('Has Priorities:', !!assessment.priorities);

    if (assessment.priorities) {
      console.log('Priorities ID:', assessment.priorities.id);
      console.log('Primary Goal:', assessment.priorities.primaryGoal);
      console.log('Implementation Urgency:', assessment.priorities.implementationUrgency);
    } else {
      console.log('No priorities submitted yet');
    }

    // Check how many assessments have priorities
    const assessmentsWithPriorities = await prisma.assessment.count({
      where: {
        status: 'COMPLETED',
        priorities: {
          isNot: null
        }
      }
    });

    const totalCompleted = await prisma.assessment.count({
      where: {
        status: 'COMPLETED'
      }
    });

    console.log('\n--- Overall Statistics ---');
    console.log(`Completed assessments with priorities: ${assessmentsWithPriorities}/${totalCompleted}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestAssessmentWithPriorities();