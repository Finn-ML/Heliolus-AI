import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkRecentAssessments() {
  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        riskScore: true,
        status: true,
        createdAt: true,
        completedAt: true,
        template: {
          select: { name: true }
        },
        answers: {
          select: {
            id: true,
            score: true,
            explanation: true,
            sourceReference: true,
          },
          take: 3
        }
      }
    });

    console.log('\n=== RECENT ASSESSMENTS (Last 5) ===\n');

    assessments.forEach((assessment, idx) => {
      console.log(`[${idx + 1}] ${assessment.id}`);
      console.log(`    Template: ${assessment.template.name}`);
      console.log(`    Status: ${assessment.status}`);
      console.log(`    Risk Score: ${assessment.riskScore}`);
      console.log(`    Created: ${assessment.createdAt}`);
      console.log(`    Completed: ${assessment.completedAt || 'Not completed'}`);

      if (assessment.answers.length > 0) {
        console.log(`    Sample Answer Scores: ${assessment.answers.map(a => a.score).join(', ')}`);
        console.log(`    Has Source Reference: ${assessment.answers.some(a => a.sourceReference) ? 'Yes' : 'No'}`);
        console.log(`    Has AI Explanation: ${assessment.answers.some(a => a.explanation) ? 'Yes' : 'No'}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentAssessments();
