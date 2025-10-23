import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAnswers() {
  try {
    // Get most recent assessment
    const assessment = await prisma.assessment.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          take: 20, // First 20 answers
          orderBy: { createdAt: 'asc' },
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
      console.log('No assessments found');
      return;
    }

    console.log('\n=== MOST RECENT ASSESSMENT ===');
    console.log(`ID: ${assessment.id}`);
    console.log(`Risk Score: ${assessment.riskScore}`);
    console.log(`Created: ${assessment.createdAt}`);
    console.log(`Total Answers: ${assessment.answers.length}`);
    console.log('\n=== ANSWER DETAILS (First 20) ===\n');

    const scoreDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    assessment.answers.forEach((answer, idx) => {
      console.log(`[${idx + 1}] Score: ${answer.score}/5`);
      console.log(`    Question: ${answer.question.text.substring(0, 80)}...`);
      console.log(`    Explanation: ${answer.explanation.substring(0, 150)}...`);
      console.log(`    Source: ${answer.sourceReference || 'None'}`);
      console.log('');

      scoreDistribution[answer.score]++;
    });

    console.log('\n=== SCORE DISTRIBUTION (First 20) ===');
    Object.entries(scoreDistribution).forEach(([score, count]) => {
      if (count > 0) {
        const bar = '█'.repeat(count);
        console.log(`Score ${score}: ${count} ${bar}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnswers();
