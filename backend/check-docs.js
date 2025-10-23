const { PrismaClient } = require('./src/generated/prisma');

async function checkDocuments() {
  const prisma = new PrismaClient();

  try {
    const docs = await prisma.document.findMany({
      select: {
        id: true,
        filename: true,
        evidenceTier: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log('Recent documents:');
    console.table(docs);

    const withoutTier = docs.filter(d => !d.evidenceTier);
    console.log(`\nDocuments without tier: ${withoutTier.length}`);

  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments();
