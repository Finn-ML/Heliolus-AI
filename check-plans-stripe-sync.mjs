#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/v1';

// Get admin token (you'll need to provide valid admin credentials)
async function getAdminToken() {
  // For now, let's just check the plans without auth
  return null;
}

async function checkPlansAndStripe() {
  console.log('=== Checking Plans Configuration ===\n');

  try {
    // 1. Check public plans endpoint
    console.log('1. Fetching public plans...');
    const plansResponse = await fetch(`${API_BASE}/public/plans`);
    const plansData = await plansResponse.json();

    if (!plansData.success) {
      console.error('❌ Failed to fetch plans:', plansData.message);
      return;
    }

    const plans = plansData.data;
    console.log(`✅ Found ${plans.length} plans\n`);

    // 2. Check each plan's Stripe configuration
    console.log('2. Checking Stripe configuration for each plan:\n');

    for (const plan of plans) {
      console.log(`Plan: ${plan.name} (${plan.tier})`);
      console.log(`  - stripePriceId: ${plan.stripePriceId || 'NOT SET ❌'}`);
      console.log(`  - stripeProductId: ${plan.stripeProductId || 'NOT SET ❌'}`);
      console.log(`  - Price: $${plan.price}/month`);
      console.log(`  - Credits: ${plan.creditsIncluded}`);
      console.log(`  - Active: ${plan.isActive ? '✅' : '❌'}`);

      if (!plan.stripePriceId || !plan.stripeProductId) {
        console.log(`  ⚠️  WARNING: This plan is missing Stripe IDs!\n`);
      } else {
        console.log(`  ✅ Stripe configuration looks good\n`);
      }
    }

    // 3. Check if Stripe environment variables are set
    console.log('3. Checking Stripe environment variables...');
    const hasStripeKey = process.env.STRIPE_SECRET_KEY ? '✅' : '❌';
    const hasWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌';

    console.log(`  - STRIPE_SECRET_KEY: ${hasStripeKey}`);
    console.log(`  - STRIPE_WEBHOOK_SECRET: ${hasWebhookSecret}`);

    // 4. Summary
    console.log('\n=== Summary ===');
    const plansWithStripe = plans.filter(p => p.stripePriceId && p.stripeProductId).length;
    const activePlans = plans.filter(p => p.isActive).length;

    console.log(`Total plans: ${plans.length}`);
    console.log(`Plans with Stripe IDs: ${plansWithStripe}/${plans.length}`);
    console.log(`Active plans: ${activePlans}/${plans.length}`);

    if (plansWithStripe < plans.length) {
      console.log('\n⚠️  ISSUE FOUND: Some plans are missing Stripe IDs');
      console.log('Plans need to be synced with Stripe products and prices.');
      console.log('\nTo fix this:');
      console.log('1. Go to https://dashboard.stripe.com/products');
      console.log('2. Create products and prices for each plan');
      console.log('3. Update the plans in Admin panel with the Stripe IDs');
    } else {
      console.log('\n✅ All plans have Stripe configuration');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  }
}

checkPlansAndStripe();
