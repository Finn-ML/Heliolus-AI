import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkGapsRisks() {
  try {
    const orgId = 'cmgjfhato0001qdjgtxd3cr1b';

    // Find COMPLETED assessments
    const completed = await prisma.assessment.findMany({
      where: {
        organizationId: orgId,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        riskScore: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    console.log(`Found ${completed.length} COMPLETED assessments\n`);

    for (const assessment of completed) {
      console.log(`Assessment: ${assessment.id}`);
      console.log(`  Risk Score: ${assessment.riskScore}`);
      console.log(`  Completed At: ${assessment.completedAt}`);

      // Count gaps
      const gapCount = await prisma.gap.count({
        where: { assessmentId: assessment.id }
      });
      console.log(`  Gaps: ${gapCount}`);

      // Count risks
      const riskCount = await prisma.risk.count({
        where: { assessmentId: assessment.id }
      });
      console.log(`  Risks: ${riskCount}\n`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGapsRisks();
