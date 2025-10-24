import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUserQuotas() {
  console.log('🔄 Seeding UserAssessmentQuota records for existing users...');

  const users = await prisma.user.findMany({
    select: { id: true }
  });

  console.log(`📊 Found ${users.length} existing users`);

  await prisma.userAssessmentQuota.createMany({
    data: users.map(user => ({
      userId: user.id,
      totalAssessmentsCreated: 0,
      assessmentsThisMonth: 0,
      assessmentsUsedThisMonth: 0
    })),
    skipDuplicates: true
  });

  console.log(`✅ Created quota records for ${users.length} users`);
}

seedUserQuotas()
  .catch(e => {
    console.error('❌ Error seeding quotas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
