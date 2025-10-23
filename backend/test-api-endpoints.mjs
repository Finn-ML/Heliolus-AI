import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testApiEndpoints() {
  try {
    // Get all completed assessments with their priorities
    const assessments = await prisma.assessment.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        priorities: {
          select: {
            id: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5
    });

    console.log('\n===== Completed Assessments with Priorities Check =====');
    assessments.forEach((assessment, index) => {
      console.log(`\n${index + 1}. Assessment ID: ${assessment.id}`);
      console.log(`   Template: ${assessment.template?.name}`);
      console.log(`   Has Priorities: ${!!assessment.priorities}`);
      console.log(`   Priorities ID: ${assessment.priorities?.id || 'None'}`);
      console.log(`   Risk Score: ${assessment.riskScore}`);
      console.log(`   Completed At: ${assessment.completedAt}`);
    });

    // Test getting priorities for specific assessments
    console.log('\n\n===== Testing Direct Priorities Fetch =====');

    for (const assessment of assessments.slice(0, 3)) {
      const priorities = await prisma.assessmentPriorities.findUnique({
        where: {
          assessmentId: assessment.id
        }
      });

      console.log(`\nAssessment ${assessment.id}:`);
      if (priorities) {
        console.log('  ✓ Priorities found');
        console.log('    - Primary Goal:', priorities.primaryGoal);
        console.log('    - Budget Range:', priorities.budgetRange);
        console.log('    - Implementation Urgency:', priorities.implementationUrgency);
      } else {
        console.log('  ✗ No priorities found');
      }
    }

    // Check the data structure that the API would return
    console.log('\n\n===== API Response Simulation =====');
    const apiResponse = assessments.slice(0, 2).map(assessment => ({
      id: assessment.id,
      status: assessment.status,
      riskScore: assessment.riskScore,
      completedAt: assessment.completedAt?.toISOString(),
      template: assessment.template,
      hasPriorities: !!assessment.priorities
    }));

    console.log('API Response (first 2):', JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiEndpoints();