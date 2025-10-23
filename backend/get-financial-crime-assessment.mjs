import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const latest = await prisma.assessment.findFirst({
    where: {
      riskScore: 5,
      template: {
        name: { contains: 'Financial Crime' }
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true } },
      organization: { select: { name: true } },
      answers: {
        orderBy: { score: 'desc' },
        select: {
          id: true,
          score: true,
          explanation: true,
          sourceReference: true,
          question: {
            select: { text: true, categoryTag: true }
          }
        }
      },
      gaps: {
        take: 10,
        orderBy: { severity: 'desc' },
        select: {
          title: true,
          severity: true,
          category: true,
          description: true
        }
      }
    }
  });

  if (!latest) {
    console.log('No Financial Crime assessment found with score 5');
    process.exit(0);
  }

  console.log('\n=== FINANCIAL CRIME ASSESSMENT (Score: 5) ===');
  console.log('ID:', latest.id);
  console.log('Organization:', latest.organization.name);
  console.log('Template:', latest.template.name);
  console.log('Created:', latest.createdAt.toISOString());
  console.log('Risk Score:', latest.riskScore);

  console.log('\n=== ANSWER DISTRIBUTION ===');
  console.log('Total answers:', latest.answers.length);
  const dist = {};
  latest.answers.forEach(a => dist[a.score] = (dist[a.score] || 0) + 1);
  Object.entries(dist).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).forEach(([s, c]) => {
    console.log(`  Score ${s}/5: ${c} answers (${(c/latest.answers.length*100).toFixed(1)}%)`);
  });

  const avgScore = latest.answers.reduce((sum, a) => sum + a.score, 0) / latest.answers.length;
  console.log(`  Average: ${avgScore.toFixed(2)}/5`);

  // Show scores by category
  console.log('\n=== SCORES BY CATEGORY ===');
  const byCategory = {};
  latest.answers.forEach(a => {
    const cat = a.question.categoryTag || 'NO_CATEGORY';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a.score);
  });

  Object.entries(byCategory).forEach(([cat, scores]) => {
    const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
    console.log(`  ${cat}: ${avg.toFixed(1)}/5 (${scores.length} questions)`);
  });

  console.log('\n=== TOP 10 SCORING ANSWERS ===');
  latest.answers.slice(0, 10).forEach((a, i) => {
    console.log(`\n[${i+1}] Score: ${a.score}/5 | Category: ${a.question.categoryTag || 'N/A'}`);
    console.log(`Question: ${a.question.text.substring(0, 120)}...`);
    console.log(`Answer: ${a.explanation.substring(0, 250)}...`);
    if (a.sourceReference) {
      console.log(`Source: ${a.sourceReference.substring(0, 100)}...`);
    }
  });

  console.log('\n=== BOTTOM 10 SCORING ANSWERS (0 scores) ===');
  const zeroScores = latest.answers.filter(a => a.score === 0).slice(0, 10);
  zeroScores.forEach((a, i) => {
    console.log(`\n[${i+1}] Score: 0/5 | Category: ${a.question.categoryTag || 'N/A'}`);
    console.log(`Question: ${a.question.text.substring(0, 120)}...`);
    console.log(`Answer: ${a.explanation.substring(0, 250)}...`);
  });

  console.log('\n=== TOP 10 GAPS ===');
  latest.gaps.slice(0, 10).forEach((g, i) => {
    console.log(`\n[${i+1}] ${g.severity} - ${g.category}`);
    console.log(`Title: ${g.title.substring(0, 100)}...`);
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
