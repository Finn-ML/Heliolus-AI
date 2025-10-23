import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const latest = await prisma.assessment.findFirst({
    where: { riskScore: 2 },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true } },
      organization: { select: { name: true } },
      risks: {
        select: {
          id: true,
          title: true,
          riskLevel: true,
          likelihood: true,
          impact: true,
          controlEffectiveness: true,
        },
        orderBy: { riskLevel: 'desc' },
      },
      answers: {
        select: { score: true },
      },
    },
  });

  if (!latest) {
    console.log('No assessment found with score 2');
    process.exit(0);
  }

  console.log('\n=== LATEST ASSESSMENT (Score: 2) ===');
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

  console.log('\n=== RISK ANALYSIS ===');
  console.log('Total risks:', latest.risks.length);

  const riskDist = {};
  latest.risks.forEach(r => riskDist[r.riskLevel] = (riskDist[r.riskLevel] || 0) + 1);
  console.log('Risk Level Distribution:', riskDist);

  console.log('\n=== CONTROL EFFECTIVENESS CHECK ===');
  const withEffectiveness = latest.risks.filter(r => r.controlEffectiveness !== null);
  const withoutEffectiveness = latest.risks.filter(r => r.controlEffectiveness === null);

  console.log(`Risks WITH controlEffectiveness: ${withEffectiveness.length}`);
  console.log(`Risks WITHOUT controlEffectiveness (NULL): ${withoutEffectiveness.length}`);

  if (withEffectiveness.length > 0) {
    const avgEffectiveness = withEffectiveness.reduce((sum, r) => sum + r.controlEffectiveness, 0) / withEffectiveness.length;
    console.log(`Average controlEffectiveness: ${avgEffectiveness.toFixed(1)}%`);

    console.log('\nControl Effectiveness Distribution:');
    withEffectiveness.forEach(r => {
      console.log(`  [${r.riskLevel}] ${r.controlEffectiveness}% - ${r.title.substring(0, 60)}...`);
    });
  }

  console.log('\n=== TOP 10 RISKS ===');
  latest.risks.slice(0, 10).forEach((r, i) => {
    console.log(`\n[${i+1}] ${r.riskLevel} - ${r.title.substring(0, 80)}`);
    console.log(`    Likelihood: ${r.likelihood}, Impact: ${r.impact}`);
    console.log(`    Control Effectiveness: ${r.controlEffectiveness !== null ? r.controlEffectiveness + '%' : 'NULL'}`);
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
