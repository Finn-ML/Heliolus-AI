#!/usr/bin/env node
/**
 * Stripe Integration Diagnostic Tool
 * Tests all components of the Stripe integration
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('🔍 Stripe Integration Diagnostic\n');
console.log('='.repeat(50));

async function checkEnvironment() {
  console.log('\n1️⃣  Checking Environment Variables...');

  const requiredVars = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_PUBLISHABLE_KEY': process.env.STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET
  };

  let allGood = true;

  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      const masked = value.substring(0, 12) + '...' + value.substring(value.length - 4);
      console.log(`   ✅ ${key}: ${masked}`);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      allGood = false;
    }
  }

  return allGood;
}

async function checkDatabase() {
  console.log('\n2️⃣  Checking Database Connection...');

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connected');

    const userCount = await prisma.user.count();
    console.log(`   ✅ Found ${userCount} users`);

    const subCount = await prisma.subscription.count();
    console.log(`   ✅ Found ${subCount} subscriptions`);

    return true;
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return false;
  }
}

async function checkUser() {
  console.log('\n3️⃣  Checking Test User...');

  try {
    const user = await prisma.user.findFirst({
      include: {
        subscription: true,
        organization: true
      }
    });

    if (!user) {
      console.log('   ❌ No users found');
      return null;
    }

    console.log(`   ✅ User ID: ${user.id}`);
    console.log(`   ✅ Email: ${user.email}`);
    console.log(`   ✅ Name: ${user.firstName} ${user.lastName}`);
    console.log(`   ✅ Role: ${user.role}`);
    console.log(`   ✅ Organization: ${user.organization ? user.organization.name : 'None'}`);

    if (user.subscription) {
      console.log(`   ✅ Has subscription: ${user.subscription.plan}`);
      console.log(`   ✅ Credits: ${user.subscription.creditsBalance}`);
    } else {
      console.log('   ⚠️  No subscription found');
    }

    return user;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function checkStripeConnection() {
  console.log('\n4️⃣  Testing Stripe API Connection...');

  try {
    // Dynamic import to avoid initialization issues
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil'
    });

    // Try to list customers (will work with test key)
    const customers = await stripe.customers.list({ limit: 1 });
    console.log('   ✅ Stripe API connected successfully');
    console.log(`   ✅ Found ${customers.data.length > 0 ? 'customers' : 'no customers'} in test mode`);

    return true;
  } catch (error) {
    console.log(`   ❌ Stripe API error: ${error.message}`);
    return false;
  }
}

async function checkPaymentLib() {
  console.log('\n5️⃣  Checking Payment Library...');

  try {
    // Check if files exist
    const fs = await import('fs');
    const path = await import('path');

    const paymentFiles = [
      'src/lib/payment/index.ts',
      'src/lib/payment/config.ts',
      'src/lib/payment/stripe.ts',
      'src/lib/payment/compat.ts',
      'src/lib/payment/types.ts'
    ];

    for (const file of paymentFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - NOT FOUND`);
      }
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function generateTestCommands(user) {
  if (!user) return;

  console.log('\n6️⃣  Test Commands...');
  console.log('\n   Login to get JWT token:');
  console.log(`   curl -X POST http://localhost:8543/v1/auth/login \\`);
  console.log(`     -H 'Content-Type: application/json' \\`);
  console.log(`     -d '{"email": "${user.email}", "password": "your-password"}'`);

  console.log('\n   Then set token:');
  console.log(`   export JWT_TOKEN="paste-token-here"`);

  console.log('\n   Get billing info:');
  console.log(`   curl http://localhost:8543/v1/subscriptions/${user.id}/billing-info \\`);
  console.log(`     -H "Authorization: Bearer $JWT_TOKEN"`);

  console.log('\n   Create subscription:');
  console.log(`   curl -X POST http://localhost:8543/v1/subscriptions \\`);
  console.log(`     -H "Authorization: Bearer $JWT_TOKEN" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"plan": "PREMIUM", "billingCycle": "MONTHLY"}'`);
}

async function main() {
  const envOk = await checkEnvironment();
  const dbOk = await checkDatabase();
  const user = await checkUser();
  const stripeOk = await checkStripeConnection();
  const libOk = await checkPaymentLib();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Diagnostic Summary:\n');
  console.log(`   Environment Variables: ${envOk ? '✅' : '❌'}`);
  console.log(`   Database Connection: ${dbOk ? '✅' : '❌'}`);
  console.log(`   Test User: ${user ? '✅' : '❌'}`);
  console.log(`   Stripe API: ${stripeOk ? '✅' : '❌'}`);
  console.log(`   Payment Library: ${libOk ? '✅' : '❌'}`);

  if (envOk && dbOk && user && stripeOk && libOk) {
    console.log('\n   🎉 All checks passed! Stripe integration is ready.');
    await generateTestCommands(user);
  } else {
    console.log('\n   ⚠️  Some checks failed. Review the errors above.');
  }

  console.log('\n' + '='.repeat(50));

  await prisma.$disconnect();
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
