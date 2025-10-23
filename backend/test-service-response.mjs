import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testServiceQuery() {
  try {
    const orgId = 'cmgjfhato0001qdjgtxd3cr1b';

    console.log('Testing Prisma query (same as listAssessments service)...\n');

    const assessments = await prisma.assessment.findMany({
      where: { organizationId: orgId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            size: true,
            country: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        gaps: {
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
            priority: true,
          },
          take: 5,
        },
        risks: {
          select: {
            id: true,
            category: true,
            title: true,
            riskLevel: true,
          },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    console.log(`Found ${assessments.length} assessments\n`);

    if (assessments.length > 0) {
      const first = assessments[0];
      console.log('First assessment:');
      console.log('  ID:', first.id);
      console.log('  Status:', first.status);
      console.log('  Risk Score:', first.riskScore);
      console.log('  Has template?', !!first.template);
      if (first.template) {
        console.log('    Template name:', first.template.name);
      }
      console.log('  Gaps:', first.gaps?.length || 0);
      console.log('  Risks:', first.risks?.length || 0);
      console.log('');

      // Find a completed one
      const completed = assessments.find(a => a.status === 'COMPLETED');
      if (completed) {
        console.log('First COMPLETED assessment:');
        console.log('  ID:', completed.id);
        console.log('  Risk Score:', completed.riskScore);
        console.log('  Template:', completed.template?.name || 'N/A');
        console.log('  Gaps:', completed.gaps?.length || 0);
        console.log('  Risks:', completed.risks?.length || 0);
      } else {
        console.log('No COMPLETED assessments in first 10 results');
      }
    }

    // Check total completed
    const completedCount = await prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: 'COMPLETED'
      }
    });

    console.log(`\nTotal COMPLETED assessments: ${completedCount}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceQuery();
