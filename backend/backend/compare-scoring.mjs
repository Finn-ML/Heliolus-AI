import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

try {
  const trade = await prisma.assessment.findFirst({
    where: { riskScore: 46 },
    include: {
      template: { select: { name: true } },
      answers: { select: { score: true } },
      gaps: { select: { severity: true } },
      risks: { select: { riskLevel: true } }
    }
  });

  const financial = await prisma.assessment.findFirst({
    where: { riskScore: 5 },
    include: {
      template: { select: { name: true } },
      answers: { select: { score: true } },
      gaps: { select: { severity: true } },
      risks: { select: { riskLevel: true } }
    }
  });

  console.log('=== TRADE COMPLIANCE ASSESSMENT ===');
  console.log('Template:', trade.template.name);
  console.log('Overall Score:', trade.riskScore);
  console.log('Total Answers:', trade.answers.length);
  const tradeAvg = trade.answers.reduce((sum, a) => sum + a.score, 0) / trade.answers.length;
  console.log('Average Answer Score:', tradeAvg.toFixed(2));
  
  const tradeDist = {};
  trade.answers.forEach(a => tradeDist[a.score] = (tradeDist[a.score] || 0) + 1);
  console.log('Score Distribution:', tradeDist);
  
  console.log('\nGaps:', trade.gaps.length);
  const tradeGapSev = {};
  trade.gaps.forEach(g => tradeGapSev[g.severity] = (tradeGapSev[g.severity] || 0) + 1);
  console.log('Gap Severities:', tradeGapSev);
  
  console.log('\nRisks:', trade.risks.length);
  const tradeRiskLevel = {};
  trade.risks.forEach(r => tradeRiskLevel[r.riskLevel] = (tradeRiskLevel[r.riskLevel] || 0) + 1);
  console.log('Risk Levels:', tradeRiskLevel);

  console.log('\n=== FINANCIAL CRIME ASSESSMENT ===');
  console.log('Template:', financial.template.name);
  console.log('Overall Score:', financial.riskScore);
  console.log('Total Answers:', financial.answers.length);
  const finAvg = financial.answers.reduce((sum, a) => sum + a.score, 0) / financial.answers.length;
  console.log('Average Answer Score:', finAvg.toFixed(2));
  
  const finDist = {};
  financial.answers.forEach(a => finDist[a.score] = (finDist[a.score] || 0) + 1);
  console.log('Score Distribution:', finDist);
  
  console.log('\nGaps:', financial.gaps.length);
  const finGapSev = {};
  financial.gaps.forEach(g => finGapSev[g.severity] = (finGapSev[g.severity] || 0) + 1);
  console.log('Gap Severities:', finGapSev);
  
  console.log('\nRisks:', financial.risks.length);
  const finRiskLevel = {};
  financial.risks.forEach(r => finRiskLevel[r.riskLevel] = (finRiskLevel[r.riskLevel] || 0) + 1);
  console.log('Risk Levels:', finRiskLevel);

  console.log('\n=== COMPARISON ===');
  console.log('Average Answer Score: Trade=' + tradeAvg.toFixed(2) + ' vs Financial=' + finAvg.toFixed(2));
  console.log('Financial has ' + (finAvg > tradeAvg ? 'HIGHER' : 'LOWER') + ' answer quality');
  console.log('But Trade scores ' + (46-5) + ' points higher overall!');
  console.log('\n*** THIS IS THE BUG! ***');

} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
