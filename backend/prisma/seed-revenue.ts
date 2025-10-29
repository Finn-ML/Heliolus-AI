/**
 * Revenue Test Data Seeding Script
 *
 * Generates realistic invoice records spanning 12 months for development/testing
 * of the revenue analytics dashboard (Epic 13).
 *
 * Usage: npm run db:seed:revenue
 */

import { PrismaClient } from '../src/generated/prisma';
import { InvoiceStatus, SubscriptionPlan, BillingCycle } from '../src/types/database';
import { PRICING } from '../src/services/subscription.service';

const prisma = new PrismaClient();

/**
 * Calculate invoice amount based on plan and billing cycle
 * IMPORTANT: PRICING constants are in CENTS, Invoice.amount must be in EUROS
 */
function calculateInvoiceAmount(plan: SubscriptionPlan, cycle: BillingCycle): number {
  const pricingMap: Record<string, number> = {
    'PREMIUM_MONTHLY': PRICING.PREMIUM_MONTHLY.price / 100,     // €599.00
    'PREMIUM_ANNUAL': PRICING.PREMIUM_ANNUAL.price / 100,       // €6,469.20
    'ENTERPRISE_MONTHLY': PRICING.ENTERPRISE_MONTHLY.price / 100, // €1,999.00
    'ENTERPRISE_ANNUAL': PRICING.ENTERPRISE_ANNUAL.price / 100,
  };

  const key = `${plan}_${cycle}`;
  return pricingMap[key] || 0;
}

/**
 * Generate random date within range
 */
function generateRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Get random invoice status with weighted distribution
 * 80% PAID, 10% OPEN, 5% VOID, 5% DRAFT
 */
function getRandomStatus(): InvoiceStatus {
  const rand = Math.random();
  if (rand < 0.80) return InvoiceStatus.PAID;
  if (rand < 0.90) return InvoiceStatus.OPEN;
  if (rand < 0.95) return InvoiceStatus.VOID;
  return InvoiceStatus.DRAFT;
}

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(4, '0');
  return `INV-${year}-${paddedIndex}`;
}

/**
 * Main seeding function
 */
async function seedRevenueData() {
  console.log('🌱 Seeding revenue data...\n');

  try {
    // Check if seed data already exists (idempotent)
    const existingSeedInvoices = await prisma.invoice.count({
      where: { stripeInvoiceId: { startsWith: 'in_test_' } }
    });

    if (existingSeedInvoices > 0) {
      console.log(`⚠️  Seed data already exists (${existingSeedInvoices} invoices with in_test_* prefix)`);
      console.log('   Skipping to avoid duplicates. Delete existing test invoices first if needed.\n');
      return;
    }

    // Fetch existing subscriptions with billing information
    const subscriptions = await prisma.subscription.findMany({
      where: {
        billingCycle: {
          not: null
        }
      },
      include: {
        user: {
          include: {
            Organization: true
          }
        }
      }
    });

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions with billing cycles found!');
      console.log('   Run the main seed script first: npm run db:seed\n');
      return;
    }

    // Check for minimum organization diversity
    const organizationCount = new Set(
      subscriptions.map(sub => sub.user.Organization?.id).filter(Boolean)
    ).size;

    if (organizationCount < 5) {
      console.log(`⚠️  Warning: Only ${organizationCount} distinct organizations found.`);
      console.log('   Recommend at least 5-10 for meaningful customer analytics.\n');
    }

    console.log(`✅ Found ${subscriptions.length} subscriptions across ${organizationCount} organizations\n`);

    // Calculate date range: 12 months ago to today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    console.log(`📅 Generating invoices from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    // Generate 50+ invoices
    const invoiceCount = 60;
    const invoicesToCreate = [];
    const statusCounts = {
      PAID: 0,
      OPEN: 0,
      VOID: 0,
      DRAFT: 0
    };
    let totalRevenue = 0;

    for (let i = 0; i < invoiceCount; i++) {
      // Randomly select a subscription
      const subscription = subscriptions[Math.floor(Math.random() * subscriptions.length)];

      // Generate random date within 12-month range
      const createdDate = generateRandomDate(startDate, endDate);

      // Calculate period dates (30 days for monthly, 365 for annual)
      const billingCycleDays = subscription.billingCycle === BillingCycle.MONTHLY ? 30 : 365;
      const periodStart = new Date(createdDate);
      const periodEnd = new Date(createdDate);
      periodEnd.setDate(periodEnd.getDate() + billingCycleDays);

      // Calculate due date (7 days after period end)
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + 7);

      // Determine status
      const status = getRandomStatus();
      statusCounts[status]++;

      // Calculate paid date for PAID invoices (random 0-14 days after due date)
      let paidAt = null;
      if (status === InvoiceStatus.PAID) {
        paidAt = new Date(dueDate);
        paidAt.setDate(paidAt.getDate() + Math.floor(Math.random() * 15));
      }

      // Calculate amount based on subscription plan and cycle
      const amount = calculateInvoiceAmount(subscription.plan, subscription.billingCycle!);

      // Track total revenue (only PAID invoices count)
      if (status === InvoiceStatus.PAID) {
        totalRevenue += amount;
      }

      // Generate test Stripe invoice ID
      const randomId = Math.random().toString(36).substring(2, 15);
      const stripeInvoiceId = `in_test_${randomId}`;

      invoicesToCreate.push({
        subscriptionId: subscription.id,
        stripeInvoiceId,
        number: generateInvoiceNumber(i + 1),
        amount,
        currency: 'EUR',
        status,
        periodStart,
        periodEnd,
        dueDate,
        paidAt,
        createdAt: createdDate
      });
    }

    // Bulk insert invoices
    console.log(`💾 Creating ${invoiceCount} invoices in database...\n`);

    await prisma.invoice.createMany({
      data: invoicesToCreate
    });

    // Display summary
    console.log('✅ Revenue data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total invoices: ${invoiceCount}`);
    console.log(`   Organizations: ${organizationCount}`);
    console.log(`   Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    console.log('   Status distribution:');
    console.log(`   - ${statusCounts.PAID} PAID invoices (€${totalRevenue.toFixed(2)})`);
    console.log(`   - ${statusCounts.OPEN} OPEN invoices`);
    console.log(`   - ${statusCounts.VOID} VOID invoices`);
    console.log(`   - ${statusCounts.DRAFT} DRAFT invoices\n`);
    console.log(`   💰 Total test revenue: €${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`);

  } catch (error) {
    console.error('❌ Error seeding revenue data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedRevenueData()
  .then(() => {
    console.log('✨ Seeding complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
