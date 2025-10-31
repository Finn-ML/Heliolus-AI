import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInvoices() {
  console.log('\n=== Checking Invoice Records ===\n');

  const totalInvoices = await prisma.invoice.count();
  console.log('Total Invoices:', totalInvoices);

  const invoicesWithSubs = await prisma.invoice.count({
    where: {
      subscriptionId: { not: null }
    }
  });
  console.log('Invoices with Subscription:', invoicesWithSubs);

  const invoicesWithoutSubs = await prisma.invoice.count({
    where: {
      subscriptionId: null
    }
  });
  console.log('Invoices WITHOUT Subscription:', invoicesWithoutSubs);

  const sampleInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: {
        include: {
          user: {
            select: {
              email: true,
              organization: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log('\n=== Sample Invoices ===\n');
  for (let i = 0; i < sampleInvoices.length; i++) {
    const inv = sampleInvoices[i];
    console.log((i + 1) + '. Invoice', inv.number);
    console.log('   Amount: €' + inv.amount);
    console.log('   Status:', inv.status);
    console.log('   Subscription ID:', inv.subscriptionId || 'NULL');
    console.log('   Organization:', inv.subscription?.user?.organization?.name || 'N/A');
    console.log('   Created:', inv.createdAt);
    console.log('');
  }

  if (invoicesWithoutSubs > 0) {
    console.log('\n=== Orphaned Invoices (no subscription) ===\n');
    const orphaned = await prisma.invoice.findMany({
      where: { subscriptionId: null },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    for (let i = 0; i < orphaned.length; i++) {
      const inv = orphaned[i];
      console.log((i + 1) + '.', inv.stripeInvoiceId, '- €' + inv.amount, '-', inv.status);
    }
  }

  await prisma.$disconnect();
}

checkInvoices().catch(console.error);
