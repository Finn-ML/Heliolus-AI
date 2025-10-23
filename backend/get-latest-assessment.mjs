import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const latest = await prisma.assessment.findFirst({
    where: { riskScore: 46 },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true } },
      organization: { select: { name: true } },
      answers: {
        orderBy: { score: 'desc' },
        take: 10,
        select: {
          id: true,
          score: true,
          explanation: true,
          sourceReference: true,
          question: {
            select: { text: true }
          }
        }
      },
      risks: {
        take: 5,
        orderBy: { riskLevel: 'desc' },
        select: {
          title: true,
          description: true,
          riskLevel: true,
          likelihood: true,
          impact: true
        }
      },
      gaps: {
        take: 5,
        orderBy: { severity: 'desc' },
        select: {
          title: true,
          description: true,
          severity: true,
          priority: true
        }
      }
    }
  });

  if (!latest) {
    console.log('No assessment found with score 46');
    process.exit(0);
  }

  console.log('\n=== LATEST ASSESSMENT (Score: 46) ===');
  console.log('ID:', latest.id);
  console.log('Organization:', latest.organization.name);
  console.log('Template:', latest.template.name);
  console.log('Created:', latest.createdAt.toISOString());
  console.log('Risk Score:', latest.riskScore);

  // Get all answers stats
  const allAnswers = await prisma.answer.findMany({
    where: { assessmentId: latest.id },
    select: { score: true }
  });

  console.log('\n=== ANSWER DISTRIBUTION ===');
  console.log('Total answers:', allAnswers.length);
  const dist = {};
  allAnswers.forEach(a => dist[a.score] = (dist[a.score] || 0) + 1);
  Object.entries(dist).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).forEach(([s, c]) => {
    console.log(`  Score ${s}/5: ${c} answers (${(c/allAnswers.length*100).toFixed(1)}%)`);
  });

  const avgScore = allAnswers.reduce((sum, a) => sum + a.score, 0) / allAnswers.length;
  console.log(`  Average: ${avgScore.toFixed(2)}/5`);

  console.log('\n=== TOP 10 SCORING ANSWERS ===');
  latest.answers.forEach((a, i) => {
    console.log(`\n[${i+1}] Score: ${a.score}/5`);
    console.log(`Question: ${a.question.text.substring(0, 100)}...`);
    console.log(`Answer: ${a.explanation.substring(0, 300)}...`);
    if (a.sourceReference) {
      console.log(`Source: ${a.sourceReference.substring(0, 150)}...`);
    }
  });

  console.log('\n=== TOP 5 RISKS ===');
  latest.risks.forEach((r, i) => {
    console.log(`\n[${i+1}] ${r.riskLevel} - ${r.title}`);
    console.log(`    Likelihood: ${r.likelihood}, Impact: ${r.impact}`);
    console.log(`    ${r.description.substring(0, 200)}...`);
  });

  console.log('\n=== TOP 5 GAPS ===');
  latest.gaps.forEach((g, i) => {
    console.log(`\n[${i+1}] ${g.severity} - ${g.title}`);
    console.log(`    Priority: ${g.priority}`);
    console.log(`    ${g.description.substring(0, 200)}...`);
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
