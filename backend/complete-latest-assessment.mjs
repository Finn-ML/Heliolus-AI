import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function completeLatestAssessment() {
  try {
    // Get the latest assessment
    const assessment = await prisma.assessment.findFirst({
      where: {
        status: 'IN_PROGRESS'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!assessment) {
      console.log('No IN_PROGRESS assessments found');
      return;
    }

    console.log('Found assessment:', assessment.id);
    console.log('Current status:', assessment.status);

    // Update status to COMPLETED
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    console.log('Updated status to:', updated.status);
    console.log('Completed at:', updated.completedAt);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeLatestAssessment();