import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkLatest() {
  try {
    const latest = await prisma.assessment.findFirst({
      where: {
        status: 'IN_PROGRESS',
        riskScore: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { name: true } },
        answers: {
          take: 10,
          orderBy: { score: 'desc' },
          select: {
            id: true,
            score: true,
            explanation: true
          }
        },
        risks: {
          take: 5,
          select: { riskLevel: true, likelihood: true, impact: true }
        },
        gaps: {
          take: 5,
          select: { severity: true }
        }
      }
    });

    if (!latest) {
      console.log('No assessments found');
      return;
    }

    console.log('\n=== LATEST ASSESSMENT ===');
    console.log('ID:', latest.id);
    console.log('Template:', latest.template.name);
    console.log('Created:', latest.createdAt.toISOString());
    console.log('Risk Score:', latest.riskScore);
    console.log('Status:', latest.status);

    // Get all answers with scores
    const allAnswers = await prisma.answer.findMany({
      where: { assessmentId: latest.id },
      select: { score: true }
    });

    console.log('\n=== ANSWER SCORE DISTRIBUTION ===');
    console.log('Total answers:', allAnswers.length);
    const distribution = {};
    allAnswers.forEach(a => {
      distribution[a.score] = (distribution[a.score] || 0) + 1;
    });
    Object.entries(distribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([score, count]) => {
      console.log(`  Score ${score}: ${count} answers`);
    });

    const avgScore = allAnswers.reduce((sum, a) => sum + a.score, 0) / allAnswers.length;
    console.log(`  Average score: ${avgScore.toFixed(2)}`);

    console.log('\n=== TOP 10 SCORING ANSWERS ===');
    latest.answers.forEach((a, i) => {
      console.log(`[${i+1}] Score: ${a.score}/5`);
      console.log(`    Explanation: ${a.explanation.substring(0, 150)}...`);
      console.log('');
    });

    console.log('=== RISKS (First 5) ===');
    latest.risks.forEach((r, i) => {
      console.log(`[${i+1}] ${r.riskLevel} - Likelihood: ${r.likelihood}, Impact: ${r.impact}`);
    });

    console.log('\n=== GAPS (First 5) ===');
    latest.gaps.forEach((g, i) => {
      console.log(`[${i+1}] Severity: ${g.severity}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatest();
