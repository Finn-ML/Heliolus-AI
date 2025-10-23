#!/usr/bin/env node

/**
 * Compare Before/After Assessment Results
 * Shows the impact of the company name mismatch fix
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

const BEFORE_ID = 'cmh3dqp7u0001td1rnb4066hy'; // Before fix
const AFTER_ID = 'cmh3fju610001phrlckdz3aa2';  // After fix

console.log('=== BEFORE/AFTER COMPARISON ===\n');

const [before, after] = await Promise.all([
  prisma.assessment.findUnique({
    where: { id: BEFORE_ID },
    include: {
      answers: { include: { question: { select: { text: true, categoryTag: true } } } },
      gaps: true,
      risks: true,
      organization: { select: { name: true } }
    }
  }),
  prisma.assessment.findUnique({
    where: { id: AFTER_ID },
    include: {
      answers: { include: { question: { select: { text: true, categoryTag: true } } } },
      gaps: true,
      risks: true,
      organization: { select: { name: true } }
    }
  })
]);

console.log('📊 OVERALL SCORES');
console.log('━'.repeat(80));
console.log(`Before: ${before.riskScore}/100`);
console.log(`After:  ${after.riskScore}/100`);
console.log(`Change: +${after.riskScore - before.riskScore} points (${((after.riskScore - before.riskScore) / before.riskScore * 100).toFixed(1)}% improvement)\n`);

console.log('📝 ANSWER DISTRIBUTION');
console.log('━'.repeat(80));

const getDistribution = (answers) => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  answers.forEach(a => dist[a.score]++);
  return dist;
};

const beforeDist = getDistribution(before.answers);
const afterDist = getDistribution(after.answers);

console.log('Score | Before | After  | Change');
console.log('------|--------|--------|--------');
for (let score = 5; score >= 0; score--) {
  const beforeCount = beforeDist[score];
  const afterCount = afterDist[score];
  const change = afterCount - beforeCount;
  const changeStr = change > 0 ? `+${change}` : change.toString();
  const beforePct = ((beforeCount / before.answers.length) * 100).toFixed(1);
  const afterPct = ((afterCount / after.answers.length) * 100).toFixed(1);
  console.log(`  ${score}/5 | ${beforeCount.toString().padStart(2)} (${beforePct.padStart(4)}%) | ${afterCount.toString().padStart(2)} (${afterPct.padStart(4)}%) | ${changeStr.padStart(3)}`);
}

const beforeAvg = before.answers.reduce((sum, a) => sum + a.score, 0) / before.answers.length;
const afterAvg = after.answers.reduce((sum, a) => sum + a.score, 0) / after.answers.length;
console.log(`\nAverage: ${beforeAvg.toFixed(2)}/5 → ${afterAvg.toFixed(2)}/5 (+${(afterAvg - beforeAvg).toFixed(2)})\n`);

console.log('⚠️  RISK ANALYSIS');
console.log('━'.repeat(80));

const getRiskDist = (risks) => {
  const dist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  risks.forEach(r => dist[r.riskLevel]++);
  return dist;
};

const beforeRisks = getRiskDist(before.risks);
const afterRisks = getRiskDist(after.risks);

console.log(`Total Risks: ${before.risks.length} → ${after.risks.length} (${after.risks.length - before.risks.length})`);
console.log('\nLevel    | Before | After  | Change');
console.log('---------|--------|--------|--------');
['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
  const beforeCount = beforeRisks[level];
  const afterCount = afterRisks[level];
  const change = afterCount - beforeCount;
  const changeStr = change > 0 ? `+${change}` : change.toString();
  console.log(`${level.padEnd(8)} | ${beforeCount.toString().padStart(6)} | ${afterCount.toString().padStart(6)} | ${changeStr.padStart(7)}`);
});

const beforeAvgCtrl = before.risks.reduce((sum, r) => sum + (r.controlEffectiveness || 0), 0) / before.risks.length;
const afterAvgCtrl = after.risks.reduce((sum, r) => sum + (r.controlEffectiveness || 0), 0) / after.risks.length;
console.log(`\nControl Effectiveness: ${beforeAvgCtrl.toFixed(1)}% → ${afterAvgCtrl.toFixed(1)}% (+${(afterAvgCtrl - beforeAvgCtrl).toFixed(1)}%)\n`);

console.log('🔍 GAP ANALYSIS');
console.log('━'.repeat(80));

const getGapDist = (gaps) => {
  const dist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  gaps.forEach(g => dist[g.severity]++);
  return dist;
};

const beforeGaps = getGapDist(before.gaps);
const afterGaps = getGapDist(after.gaps);

console.log(`Total Gaps: ${before.gaps.length} → ${after.gaps.length} (${after.gaps.length - before.gaps.length})`);
console.log('\nSeverity | Before | After  | Change');
console.log('---------|--------|--------|--------');
['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
  const beforeCount = beforeGaps[level];
  const afterCount = afterGaps[level];
  const change = afterCount - beforeCount;
  const changeStr = change > 0 ? `+${change}` : change.toString();
  console.log(`${level.padEnd(8)} | ${beforeCount.toString().padStart(6)} | ${afterCount.toString().padStart(6)} | ${changeStr.padStart(7)}`);
});

console.log('\n\n📊 QUESTIONS THAT IMPROVED FROM 0/5');
console.log('━'.repeat(80));

// Find questions that went from 0 to non-zero
const beforeZeroMap = new Map();
before.answers.filter(a => a.score === 0).forEach(a => {
  beforeZeroMap.set(a.questionId, a);
});

const improved = [];
after.answers.forEach(afterAns => {
  const beforeAns = beforeZeroMap.get(afterAns.questionId);
  if (beforeAns && afterAns.score > 0) {
    improved.push({
      question: afterAns.question.text,
      category: afterAns.question.categoryTag,
      beforeScore: beforeAns.score,
      afterScore: afterAns.score,
      improvement: afterAns.score - beforeAns.score
    });
  }
});

console.log(`Found ${improved.length} questions that improved from 0/5:\n`);

improved.slice(0, 10).forEach((q, i) => {
  console.log(`[${i + 1}] ${q.question.substring(0, 80)}...`);
  console.log(`    Category: ${q.category}`);
  console.log(`    Score: 0/5 → ${q.afterScore}/5 (+${q.improvement})`);
  console.log();
});

if (improved.length > 10) {
  console.log(`... and ${improved.length - 10} more\n`);
}

console.log('\n📊 REMAINING 0/5 SCORES (LEGITIMATE GAPS)');
console.log('━'.repeat(80));

const remainingZeros = after.answers.filter(a => a.score === 0);
console.log(`Total: ${remainingZeros.length} questions\n`);

remainingZeros.forEach((ans, i) => {
  console.log(`[${i + 1}] ${ans.question.text.substring(0, 80)}...`);
  console.log(`    Category: ${ans.question.categoryTag}`);
  console.log(`    Explanation: ${ans.explanation.substring(0, 150)}...`);
  console.log();
});

await prisma.$disconnect();
