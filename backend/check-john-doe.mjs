import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find John Doe user
    const user = await prisma.user.findFirst({
      where: {
        firstName: 'John',
        lastName: 'Doe'
      },
      include: {
        subscription: true,
        organization: true
      }
    });

    if (!user) {
      console.log('❌ John Doe user not found');
      return;
    }

    console.log('✅ John Doe found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('');
    
    if (user.subscription) {
      console.log('✅ Subscription found:');
      console.log('  Plan:', user.subscription.plan);
      console.log('  Status:', user.subscription.status);
      console.log('  Credits Balance:', user.subscription.creditsBalance);
      console.log('  Current Period Start:', user.subscription.currentPeriodStart);
      console.log('  Current Period End:', user.subscription.currentPeriodEnd);
    } else {
      console.log('❌ No subscription found for John Doe');
    }

    if (user.organization) {
      console.log('');
      console.log('Organization:');
      console.log('  Name:', user.organization.name);
      console.log('  ID:', user.organization.id);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
