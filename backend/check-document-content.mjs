import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    // Get the assessment with documents
    const assessment = await prisma.assessment.findFirst({
      where: { id: 'cmh259eqb00i9nab8skr2jte3' },
      include: {
        documents: {
          take: 5,
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            parsedContent: true,
            extractedData: true
          }
        }
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    const documents = assessment.documents;

    console.log('\n=== DOCUMENT CONTENT CHECK ===');
    console.log('Total documents found:', documents.length);
    console.log('');

    documents.forEach((doc, i) => {
      console.log(`[${i+1}] ${doc.filename}`);
      console.log(`    Type: ${doc.mimeType}, Size: ${(doc.size / 1024).toFixed(2)} KB`);
      console.log(`    parsedContent: ${doc.parsedContent ? JSON.stringify(doc.parsedContent).length + ' chars' : 'NULL ⚠️'}`);
      console.log(`    extractedData: ${doc.extractedData ? 'YES' : 'NO'}`);

      if (doc.parsedContent) {
        const contentStr = typeof doc.parsedContent === 'string'
          ? doc.parsedContent
          : JSON.stringify(doc.parsedContent);
        console.log(`    First 200 chars: ${contentStr.substring(0, 200)}...`);
      } else {
        console.log(`    ⚠️⚠️⚠️  parsedContent is NULL - AI CANNOT SEE THIS DOCUMENT!`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments();
