import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  // Get the 5 most recently uploaded documents
  const recentDocs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      filename: true,
      createdAt: true,
      parsedContent: true,
      organizationId: true
    }
  });

  console.log('\n=== MOST RECENT DOCUMENTS ===\n');

  recentDocs.forEach((doc, i) => {
    console.log(`[${i+1}] ${doc.filename}`);
    console.log(`    Uploaded: ${doc.createdAt.toISOString()}`);
    console.log(`    ID: ${doc.id}`);

    if (!doc.parsedContent) {
      console.log('    ❌ parsedContent: NULL - Not parsed yet!');
    } else {
      const content = typeof doc.parsedContent === 'string'
        ? doc.parsedContent
        : JSON.stringify(doc.parsedContent);

      const isMock = content.includes('Mock extracted document text content');
      const length = content.length;

      if (isMock) {
        console.log(`    ❌ parsedContent: MOCK DATA (${length} chars)`);
      } else {
        console.log(`    ✅ parsedContent: REAL CONTENT (${length} chars)`);

        // Show first 200 chars
        const preview = content.substring(0, 200).replace(/\n/g, ' ');
        console.log(`    Preview: ${preview}...`);
      }
    }
    console.log('');
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
