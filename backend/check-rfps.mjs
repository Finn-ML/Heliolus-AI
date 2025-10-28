import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkRFPs() {
  try {
    const rfps = await prisma.rFP.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\n📋 Found ${rfps.length} RFPs in database:\n`);

    if (rfps.length === 0) {
      console.log('❌ No RFPs found in the database.');
      console.log('\nThis means the RFP creation may have failed or not been saved.');
    } else {
      rfps.forEach((rfp, index) => {
        console.log(`${index + 1}. ${rfp.title}`);
        console.log(`   ID: ${rfp.id}`);
        console.log(`   User: ${rfp.user.firstName} ${rfp.user.lastName} (${rfp.user.email})`);
        console.log(`   Organization: ${rfp.organization?.name || 'N/A'}`);
        console.log(`   Status: ${rfp.status}`);
        console.log(`   Vendors: ${rfp.vendorIds.length} vendor(s)`);
        console.log(`   Documents: ${rfp.documents?.length || 0} document(s)`);
        console.log(`   Created: ${rfp.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRFPs();
