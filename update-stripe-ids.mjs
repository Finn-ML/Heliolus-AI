#!/usr/bin/env node

/**
 * Update Stripe IDs for Plans
 *
 * This script updates the Premium plan with Stripe product and price IDs.
 *
 * Products:
 * - Premium: prod_TKfXdcpl8QasRC
 * - Additional Assessment: prod_TKfYP66XZTYhF9 (this might be a separate product)
 *
 * Usage:
 * node update-stripe-ids.mjs <monthly_price_id> <annual_price_id>
 *
 * Or set environment variables:
 * STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
 * STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_xxx
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateStripePlans() {
  console.log('=== Updating Stripe IDs for Plans ===\n');

  // Get price IDs from arguments or environment variables
  const monthlyPriceId = process.argv[2] || process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
  const annualPriceId = process.argv[3] || process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID;

  if (!monthlyPriceId || !annualPriceId) {
    console.error('❌ Missing price IDs!');
    console.error('\nUsage:');
    console.error('  node update-stripe-ids.mjs <monthly_price_id> <annual_price_id>');
    console.error('\nOr set environment variables:');
    console.error('  STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx');
    console.error('  STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_xxx');
    process.exit(1);
  }

  try {
    // Update Premium plan
    console.log('Updating Premium plan...');
    const premiumPlan = await prisma.plan.update({
      where: { slug: 'premium' },
      data: {
        stripeProductId: 'prod_TKfXdcpl8QasRC',
        stripeMonthlyPriceId: monthlyPriceId,
        stripeAnnualPriceId: annualPriceId,
      },
    });

    console.log('✅ Premium plan updated successfully!');
    console.log(`  - Product ID: ${premiumPlan.stripeProductId}`);
    console.log(`  - Monthly Price ID: ${premiumPlan.stripeMonthlyPriceId}`);
    console.log(`  - Annual Price ID: ${premiumPlan.stripeAnnualPriceId}`);

    // Show current state of all plans
    console.log('\n=== All Plans ===');
    const allPlans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    for (const plan of allPlans) {
      console.log(`\n${plan.name} (${plan.slug}):`);
      console.log(`  - Product ID: ${plan.stripeProductId || 'NOT SET'}`);
      console.log(`  - Monthly Price ID: ${plan.stripeMonthlyPriceId || 'NOT SET'}`);
      console.log(`  - Annual Price ID: ${plan.stripeAnnualPriceId || 'NOT SET'}`);
      console.log(`  - Monthly Price: $${plan.monthlyPrice}`);
      console.log(`  - Annual Price: $${plan.annualPrice}`);
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error updating plans:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateStripePlans();
