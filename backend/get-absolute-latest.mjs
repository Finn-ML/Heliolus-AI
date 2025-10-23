import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const latest = await prisma.assessment.findFirst({
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
        select: { score: true, questionId: true },
      },
    },
  });

  console.log('\n=== ABSOLUTE LATEST ASSESSMENT ===');
  console.log('ID:', latest.id);
  console.log('Organization:', latest.organization.name);
  console.log('Template:', latest.template.name);
  console.log('Created:', latest.createdAt.toISOString());
  console.log('Risk Score:', latest.riskScore);

  console.log('\n=== ANSWER STATS ===');
  const dist = {};
  latest.answers.forEach(a => dist[a.score] = (dist[a.score] || 0) + 1);
  Object.entries(dist).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).forEach(([s, c]) => {
    console.log(`  Score ${s}/5: ${c} answers (${(c/latest.answers.length*100).toFixed(1)}%)`);
  });
  const avgScore = latest.answers.reduce((sum, a) => sum + a.score, 0) / latest.answers.length;
  console.log(`  Average: ${avgScore.toFixed(2)}/5`);

  console.log('\n=== RISK STATS ===');
  console.log('Total risks:', latest.risks.length);
  const riskDist = {};
  latest.risks.forEach(r => riskDist[r.riskLevel] = (riskDist[r.riskLevel] || 0) + 1);
  console.log('Risk Distribution:', riskDist);

  const withEffectiveness = latest.risks.filter(r => r.controlEffectiveness !== null);
  if (withEffectiveness.length > 0) {
    const avgEff = withEffectiveness.reduce((sum, r) => sum + r.controlEffectiveness, 0) / withEffectiveness.length;
    console.log(`Average Control Effectiveness: ${avgEff.toFixed(1)}%`);
  }

  console.log('\n=== SAMPLE RISKS (Top 5) ===');
  latest.risks.slice(0, 5).forEach((r, i) => {
    console.log(`[${i+1}] ${r.riskLevel} | ${r.likelihood} | ${r.impact} | Controls: ${r.controlEffectiveness}%`);
    console.log(`    ${r.title.substring(0, 70)}...`);
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
