import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const riskCount = await prisma.risk.count();
  const docDraftCount = await prisma.documentDraft.count();
  const assessmentCount = await prisma.assessment.count();
  const gapCount = await prisma.gap.count();
  const answerCount = await prisma.answer.count();
  const documentCount = await prisma.document.count();

  console.log('=== CURRENT DATABASE CONTENTS ===');
  console.log('Risks:', riskCount);
  console.log('DocumentDrafts:', docDraftCount);
  console.log('Assessments:', assessmentCount);
  console.log('Gaps:', gapCount);
  console.log('Answers:', answerCount);
  console.log('Documents:', documentCount);
  
  console.log('\n=== WHAT WILL CHANGE ===');
  console.log('Risk table: Add nullable "controlEffectiveness" column');
  console.log(`  → ${riskCount} existing risks will have controlEffectiveness = NULL`);
  console.log('DocumentDraft table: Add "uploadConfirmed" column with default false');
  console.log(`  → ${docDraftCount} existing drafts will have uploadConfirmed = false`);
  
  console.log('\n=== WHAT STAYS THE SAME ===');
  console.log('✅ All Risk data (title, description, riskLevel, etc.) - UNCHANGED');
  console.log('✅ All DocumentDraft data (filename, size, etc.) - UNCHANGED');
  console.log('✅ All other tables (Assessment, Gap, Answer, Document) - UNCHANGED');
  console.log('✅ ALL existing values in ALL tables - UNCHANGED');
  console.log('\n💡 These are purely ADDITIVE changes - adding new columns only');

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
