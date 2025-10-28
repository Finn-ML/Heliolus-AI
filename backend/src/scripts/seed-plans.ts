/**
 * Seed Plans into Database
 * Creates the Freemium, Premium, and Enterprise plans based on the Pricing page
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting plan seeding...');

  // Check if plans already exist
  const existingPlans = await prisma.plan.count();
  if (existingPlans > 0) {
    console.log(`⚠️  Found ${existingPlans} existing plans. Skipping seed.`);
    console.log('💡 To re-seed, delete existing plans first.');
    return;
  }

  // Create Freemium Plan
  const freemium = await prisma.plan.create({
    data: {
      slug: 'freemium',
      name: 'Freemium',
      description: 'Get started with basic compliance assessment',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'EUR',
      monthlyCredits: 0,
      assessmentCredits: 2, // 2 assessments total
      maxAssessments: 2,
      maxUsers: 1,
      features: [
        'Compliance Score',
        'Vendor Browse',
        '2 Assessments Total',
        'Gap Analysis (Blurred)',
        'Strategy Matrix (Blurred)',
      ],
      trialDays: 0,
      isActive: true,
      isPublic: true,
      displayOrder: 1,
    },
  });
  console.log('✅ Created Freemium plan:', freemium.id);

  // Create Premium Plan
  const premium = await prisma.plan.create({
    data: {
      slug: 'premium',
      name: 'Premium',
      description: 'Full compliance analysis with AI-powered insights',
      monthlyPrice: 599,
      annualPrice: 6490, // 10% discount
      currency: 'EUR',
      monthlyCredits: 2, // 2 assessments per month
      assessmentCredits: 2,
      maxAssessments: -1, // Unlimited (user can buy more)
      maxUsers: 5,
      features: [
        'All Freemium features unlocked',
        'Full Gap Analysis',
        'Strategy Matrix & Priorities',
        'AI Vendor Matching',
        '2 Assessments per month included',
        'Additional assessments: €299 each',
        'Downloadable PDF Reports',
        'Lead Tracking',
      ],
      trialDays: 0,
      isActive: true,
      isPublic: true,
      displayOrder: 2,
    },
  });
  console.log('✅ Created Premium plan:', premium.id);

  // Create Enterprise Plan
  const enterprise = await prisma.plan.create({
    data: {
      slug: 'enterprise',
      name: 'Enterprise',
      description: 'Unlimited assessments with dedicated support',
      monthlyPrice: 0, // Custom pricing
      annualPrice: 0,
      currency: 'EUR',
      monthlyCredits: -1, // Unlimited
      assessmentCredits: -1, // Unlimited
      maxAssessments: -1, // Unlimited
      maxUsers: -1, // Unlimited
      features: [
        'Everything in Premium',
        'Unlimited Assessments',
        'Custom Billing Arrangements',
        'Dedicated Account Manager',
        'Priority Support',
        'Custom Integrations',
      ],
      trialDays: 0,
      isActive: true,
      isPublic: true,
      displayOrder: 3,
    },
  });
  console.log('✅ Created Enterprise plan:', enterprise.id);

  console.log('🎉 Plan seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
