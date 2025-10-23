import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAssessmentDetails() {
  try {
    const assessmentId = 'cmgp8u48'; // Current stuck assessment

    console.log(`=== Assessment Details: ${assessmentId} ===\n`);

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        organization: {
          include: {
            documents: {
              select: {
                id: true,
                filename: true,
                parsedContent: true,
              }
            }
          }
        },
        template: {
          include: {
            sections: {
              include: {
                questions: {
                  select: {
                    id: true,
                    text: true,
                    categoryTag: true,
                  },
                  take: 3, // Just first 3 questions
                }
              }
            }
          }
        },
        answers: true,
      }
    });

    if (!assessment) {
      console.log('❌ Assessment not found');
      return;
    }

    console.log('📊 Assessment Status:');
    console.log(`  Status: ${assessment.status}`);
    console.log(`  Created: ${assessment.createdAt}`);
    console.log(`  Updated: ${assessment.updatedAt}`);
    console.log(`  Template: ${assessment.template.name}`);
    console.log('');

    console.log('📄 Documents:');
    console.log(`  Total: ${assessment.organization.documents.length}`);
    console.log(`  With parsed content: ${assessment.organization.documents.filter(d => d.parsedContent).length}`);
    assessment.organization.documents.forEach(doc => {
      const hasContent = doc.parsedContent ? '✅' : '❌';
      const contentLength = doc.parsedContent ? ` (${typeof doc.parsedContent === 'string' ? doc.parsedContent.length : 'N/A'} chars)` : '';
      console.log(`    ${hasContent} ${doc.filename}${contentLength}`);
    });
    console.log('');

    console.log('❓ Questions:');
    const totalQuestions = assessment.template.sections.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`  Total sections: ${assessment.template.sections.length}`);
    console.log(`  Total questions: ${totalQuestions}`);
    console.log(`  Sample questions (first 3):`);
    assessment.template.sections[0]?.questions.slice(0, 3).forEach((q, i) => {
      console.log(`    ${i + 1}. ${q.text.substring(0, 80)}...`);
      console.log(`       categoryTag: ${q.categoryTag || 'NULL'}`);
    });
    console.log('');

    console.log('✅ Answers Generated:');
    console.log(`  Count: ${assessment.answers.length}`);
    if (assessment.answers.length > 0) {
      console.log(`  Latest answer: ${assessment.answers[assessment.answers.length - 1].createdAt}`);
    }
    console.log('');

    // Check for audit logs
    console.log('📝 Recent Audit Logs:');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: assessmentId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (auditLogs.length > 0) {
      auditLogs.forEach(log => {
        console.log(`  ${log.createdAt.toISOString()} - ${log.action}`);
        if (log.metadata) {
          console.log(`    Metadata: ${JSON.stringify(log.metadata)}`);
        }
      });
    } else {
      console.log('  No audit logs found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssessmentDetails();
