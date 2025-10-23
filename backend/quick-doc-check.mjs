import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const assessment = await prisma.assessment.findUnique({
    where: { id: 'cmh259eqb00i9nab8skr2jte3' },
    select: { organizationId: true }
  });

  const docs = await prisma.document.findMany({
    where: { organizationId: assessment.organizationId },
    select: { id: true, filename: true, parsedContent: true },
    take: 5
  });

  console.log('\n=== DOCUMENT PARSED CONTENT CHECK ===\n');
  docs.forEach(d => {
    const hasContent = d.parsedContent !== null && d.parsedContent !== undefined;
    const contentLength = hasContent ? JSON.stringify(d.parsedContent).length : 0;
    console.log(d.filename + ': ' + (hasContent ? '✅ HAS CONTENT (' + contentLength + ' chars)' : '❌ NULL - AI CANNOT SEE THIS!'));
  });

  const nullCount = docs.filter(d => !d.parsedContent).length;
  console.log('\n' + nullCount + ' / ' + docs.length + ' documents have NULL parsedContent!');

} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
