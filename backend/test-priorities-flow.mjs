import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testPrioritiesFlow() {
  try {
    const assessmentId = 'cmh3fju610001phrlckdz3aa2';

    console.log('===== Testing Priorities Flow =====\n');

    // 1. Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        status: true,
        riskScore: true,
        template: {
          select: { name: true }
        }
      }
    });

    if (!assessment) {
      console.log('❌ Assessment not found!');
      return;
    }

    console.log('✅ Assessment found:');
    console.log('   ID:', assessment.id);
    console.log('   Status:', assessment.status);
    console.log('   Risk Score:', assessment.riskScore);
    console.log('   Template:', assessment.template?.name);

    // 2. Check if priorities exist
    const priorities = await prisma.assessmentPriorities.findUnique({
      where: { assessmentId },
      select: {
        id: true,
        primaryGoal: true,
        budgetRange: true,
        implementationUrgency: true,
        vendorMaturity: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('\n===== Priorities Check =====');
    if (priorities) {
      console.log('✅ Priorities found:');
      console.log('   ID:', priorities.id);
      console.log('   Primary Goal:', priorities.primaryGoal);
      console.log('   Budget Range:', priorities.budgetRange);
      console.log('   Implementation Urgency:', priorities.implementationUrgency);
      console.log('   Vendor Maturity:', priorities.vendorMaturity);
      console.log('   Created:', priorities.createdAt);
      console.log('   Updated:', priorities.updatedAt);
    } else {
      console.log('❌ No priorities found for this assessment');
    }

    // 3. Check what the API endpoint would return
    console.log('\n===== What Results Page Should Show =====');
    if (assessment.status === 'COMPLETED' && priorities) {
      console.log('✅ Should show: "View Matched Vendors" button');
      console.log('   - Assessment is COMPLETED');
      console.log('   - Priorities are filled');
    } else if (assessment.status === 'COMPLETED' && !priorities) {
      console.log('⚠️ Should show: "Complete Your Priorities Questionnaire" card');
      console.log('   - Assessment is COMPLETED');
      console.log('   - Priorities are NOT filled');
    } else {
      console.log('⏳ Assessment not yet completed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrioritiesFlow();
