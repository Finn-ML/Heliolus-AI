import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAnswer() {
  try {
    const assessment = await prisma.assessment.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          where: {
            score: { gte: 3 }  // Find answers scoring 3 or higher
          },
          include: {
            question: {
              select: {
                text: true
              }
            }
          }
        }
      }
    });

    if (!assessment) {
      console.log('No assessment found');
      return;
    }

    console.log('\n=== HIGH-SCORING ANSWERS (Score >= 3) ===');
    console.log(`Assessment ID: ${assessment.id}`);
    console.log(`Risk Score: ${assessment.riskScore}`);
    console.log(`High-scoring answers: ${assessment.answers.length}\n`);

    assessment.answers.forEach((answer, idx) => {
      console.log(`[${idx + 1}] Score: ${answer.score}/5`);
      console.log(`    Question: ${answer.question.text}`);
      console.log(`    Full Explanation:`);
      console.log(answer.explanation);
      console.log(`    Source: ${answer.sourceReference}`);
      console.log('\n' + '='.repeat(80) + '\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnswer();
