#!/usr/bin/env node

import { PrismaClient } from './backend/src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkPlans() {
  console.log('=== Checking Plans in Database ===\n');

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    console.log(`Found ${plans.length} plans:\n`);

    for (const plan of plans) {
      console.log(`Plan: ${plan.name} (${plan.tier})`);
      console.log(`  - ID: ${plan.id}`);
      console.log(`  - stripePriceId: ${plan.stripePriceId || 'NOT SET ❌'}`);
      console.log(`  - stripeProductId: ${plan.stripeProductId || 'NOT SET ❌'}`);
      console.log(`  - Price: $${plan.price}/month`);
      console.log(`  - Credits: ${plan.creditsIncluded}`);
      console.log(`  - Active: ${plan.isActive ? '✅' : '❌'}`);
      console.log('');
    }

    // Summary
    const plansWithStripe = plans.filter(p => p.stripePriceId && p.stripeProductId).length;
    const activePlans = plans.filter(p => p.isActive).length;

    console.log('=== Summary ===');
    console.log(`Total plans: ${plans.length}`);
    console.log(`Plans with Stripe IDs: ${plansWithStripe}/${plans.length}`);
    console.log(`Active plans: ${activePlans}/${plans.length}`);

    if (plansWithStripe < plans.length) {
      console.log('\n⚠️  ISSUE: Some plans are missing Stripe IDs');
      console.log('The frontend Pricing page requires Stripe IDs to create checkout sessions.');
      console.log('\nTo fix this:');
      console.log('1. Create products in Stripe Dashboard: https://dashboard.stripe.com/products');
      console.log('2. For each product, create a recurring price');
      console.log('3. Copy the Price ID (starts with price_) and Product ID (starts with prod_)');
      console.log('4. Update each plan in the Admin panel with these IDs');
    } else {
      console.log('\n✅ All plans have Stripe configuration');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
