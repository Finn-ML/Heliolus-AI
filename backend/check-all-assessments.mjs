import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAllAssessments() {
  try {
    console.log('=== All Assessments Status ===\n');

    const assessments = await prisma.assessment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        template: { select: { name: true } },
        _count: {
          select: {
            answers: true,
            gaps: true,
            risks: true,
          }
        }
      }
    });

    console.log(`Total assessments: ${assessments.length}\n`);

    // Group by status
    const byStatus = assessments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n=== Assessment Details ===\n');

    assessments.forEach((assessment, index) => {
      console.log(`${index + 1}. ${assessment.id}`);
      console.log(`   Organization: ${assessment.organization.name}`);
      console.log(`   Template: ${assessment.template.name}`);
      console.log(`   Status: ${assessment.status}`);
      console.log(`   Risk Score: ${assessment.riskScore || 'N/A'}`);
      console.log(`   Answers: ${assessment._count.answers}`);
      console.log(`   Gaps: ${assessment._count.gaps}`);
      console.log(`   Risks: ${assessment._count.risks}`);
      console.log(`   Completed At: ${assessment.completedAt || 'N/A'}`);
      console.log(`   Updated: ${assessment.updatedAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllAssessments();
