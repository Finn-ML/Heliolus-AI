import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function completeMoreAssessments() {
  try {
    // Complete a few more assessments WITHOUT priorities to test "complete priorities" state
    const assessmentsToComplete = [
      'cmh3dqp7u0001td1rnb4066hy',  // Second most recent
      'cmh3de3160001tdhrla52hfi0',  // Third most recent
      'cmh3crv9l0001tdnxnuirbbz3',  // Fourth most recent
    ];

    for (const assessmentId of assessmentsToComplete) {
      const updated = await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      console.log(`Updated assessment ${updated.id} to ${updated.status}`);
    }

    // Now check the status distribution
    const completed = await prisma.assessment.count({
      where: { status: 'COMPLETED' }
    });

    const completedWithPriorities = await prisma.assessment.count({
      where: {
        status: 'COMPLETED',
        priorities: {
          isNot: null
        }
      }
    });

    const completedWithoutPriorities = await prisma.assessment.count({
      where: {
        status: 'COMPLETED',
        priorities: {
          is: null
        }
      }
    });

    console.log('\n--- Status Summary ---');
    console.log('Total COMPLETED:', completed);
    console.log('With priorities (should show as "Completed"):', completedWithPriorities);
    console.log('Without priorities (should show as "Complete Priorities"):', completedWithoutPriorities);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeMoreAssessments();