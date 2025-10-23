import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testPrioritiesEndpoint() {
  try {
    const assessmentId = 'cmh3fju610001phrlckdz3aa2';

    console.log('===== Testing Priorities Endpoint =====\n');

    // 1. Direct database query
    const priorities = await prisma.assessmentPriorities.findUnique({
      where: { assessmentId },
    });

    console.log('Direct Database Query:');
    if (priorities) {
      console.log('✅ Priorities found in database:', priorities);
    } else {
      console.log('❌ No priorities found in database');
    }

    // 2. Test what the service would do
    console.log('\n===== Service getPriorities Simulation =====');
    const servicePriorities = await prisma.assessmentPriorities.findUnique({
      where: { assessmentId },
    });

    if (servicePriorities) {
      console.log('✅ Service would return:', servicePriorities);
      console.log('\nAPI Response should be:');
      console.log(JSON.stringify({
        success: true,
        data: servicePriorities
      }, null, 2));
    } else {
      console.log('❌ Service would return null');
      console.log('\nAPI Response would be 404 with:');
      console.log(JSON.stringify({
        success: false,
        error: 'Priorities not found for this assessment'
      }, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrioritiesEndpoint();
