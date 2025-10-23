import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testListAssessments() {
  try {
    const orgId = 'cmgjfhato0001qdjgtxd3cr1b'; // Payverge Technologies Inc.

    console.log('=== Testing Assessment Listing ===\n');
    console.log(`Organization ID: ${orgId}\n`);

    // This mimics what the listAssessments service method does
    const assessments = await prisma.assessment.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
        gaps: true,
        risks: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`Total assessments found: ${assessments.length}\n`);

    // Group by status
    const byStatus = assessments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Filter like the Reports page does: only COMPLETED and IN_PROGRESS
    const filteredAssessments = assessments.filter(a =>
      a.status === 'COMPLETED' || a.status === 'IN_PROGRESS'
    );

    console.log(`\nAfter filtering (COMPLETED + IN_PROGRESS): ${filteredAssessments.length}\n`);

    console.log('=== First 5 Filtered Assessments ===\n');
    filteredAssessments.slice(0, 5).forEach((a, i) => {
      console.log(`${i + 1}. ${a.id}`);
      console.log(`   Template: ${a.template?.name || 'N/A'}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Risk Score: ${a.riskScore || 'N/A'}`);
      console.log(`   Gaps: ${a.gaps?.length || 0}`);
      console.log(`   Risks: ${a.risks?.length || 0}`);
      console.log(`   Completed At: ${a.completedAt || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testListAssessments();
