import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function upgradeToPremium() {
  try {
    // Find the test user (John Doe)
    const user = await prisma.user.findFirst({
      where: {
        email: 'john.doe@example.com'
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.log('❌ User john.doe@example.com not found');
      return;
    }

    console.log(`\n📧 Found user: ${user.email}`);
    console.log(`👤 User ID: ${user.id}`);
    console.log(`📊 Current subscription:`, user.subscription?.plan || 'NONE');

    // Update or create premium subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: 'PREMIUM',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        stripeCustomerId: 'test_customer_' + Date.now(),
        stripeSubscriptionId: 'test_sub_' + Date.now(),
      },
      create: {
        userId: user.id,
        plan: 'PREMIUM',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        stripeCustomerId: 'test_customer_' + Date.now(),
        stripeSubscriptionId: 'test_sub_' + Date.now(),
      },
    });

    console.log('\n✅ User upgraded to PREMIUM successfully!');
    console.log(`📅 Valid until: ${subscription.currentPeriodEnd}`);
    console.log('\n🎉 You can now create RFPs!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeToPremium();
