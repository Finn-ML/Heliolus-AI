#!/usr/bin/env node

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

const assessmentId = 'cmh3dqp7u0001td1rnb4066hy';

console.log('=== SCORE 4/5 RAW DATA ===\n');
const answer4 = await prisma.answer.findFirst({
  where: { assessmentId, score: 4 },
  select: { score: true, evidenceData: true, explanation: true }
});
console.log('Score 4/5:');
console.log(JSON.stringify(answer4, null, 2));

console.log('\n\n=== SCORE 0/5 RAW DATA ===\n');
const answer0 = await prisma.answer.findFirst({
  where: { assessmentId, score: 0 },
  select: { score: true, evidenceData: true, explanation: true }
});
console.log('Score 0/5:');
console.log(JSON.stringify(answer0, null, 2));

await prisma.$disconnect();
