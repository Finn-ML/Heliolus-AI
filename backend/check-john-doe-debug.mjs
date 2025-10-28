import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'john.doe', mode: 'insensitive' } },
        { email: { contains: 'johndoe', mode: 'insensitive' } },
        { firstName: 'John', lastName: 'Doe' }
      ]
    },
    include: {
      organization: true,
      subscription: true
    }
  });

  if (!user) {
    console.log('John Doe not found');
    process.exit(0);
  }

  console.log('=== John Doe User Info ===');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Name:', user.firstName, user.lastName);
  console.log('Organization ID:', user.organizationId);

  if (user.subscription) {
    console.log('\n=== Subscription Info ===');
    console.log('Plan:', user.subscription.plan);
    console.log('Status:', user.subscription.status);
    console.log('Credits Balance:', user.subscription.creditsBalance);
    console.log('Credits Used:', user.subscription.creditsUsed);
  } else {
    console.log('\n=== No Subscription Found ===');
  }

  // Now get latest assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      priorities: true
    }
  });

  if (assessment) {
    console.log('\n=== Latest Assessment ===');
    console.log('ID:', assessment.id);
    console.log('Status:', assessment.status);
    console.log('Created:', assessment.createdAt);
    console.log('Organization ID:', assessment.organizationId);
    console.log('Has Priorities:', !!assessment.priorities);
    if (assessment.priorities) {
      console.log('Priorities Status:', assessment.priorities.status);
      console.log('Priorities Completed:', assessment.priorities.completedAt ? 'Yes' : 'No');
    }
  } else {
    console.log('\n=== No Assessment Found ===');
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await prisma.$disconnect();
}
