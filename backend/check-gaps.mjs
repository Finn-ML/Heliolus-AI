import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkGaps() {
  try {
    const assessmentId = 'cmhanasgy00c3qmmuwf8shscq';

    const gaps = await prisma.gap.findMany({
      where: { assessmentId },
      take: 3,
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        severity: true,
        priority: true,
        priorityScore: true,
        estimatedCost: true,
        estimatedEffort: true,
      }
    });

    console.log('Gap structure for assessment:', assessmentId);
    console.log(JSON.stringify(gaps, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGaps();
