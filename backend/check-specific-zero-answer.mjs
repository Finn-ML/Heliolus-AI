#!/usr/bin/env node

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

const assessmentId = 'cmh3dqp7u0001td1rnb4066hy';

const answer = await prisma.answer.findFirst({
  where: {
    assessmentId,
    score: 0
  },
  include: {
    question: {
      select: {
        text: true,
        aiPromptHint: true,
        categoryTag: true
      }
    }
  }
});

console.log('=== ZERO-SCORE ANSWER ANALYSIS ===\n');
console.log('Question:', answer.question.text);
console.log('\nCategory:', answer.question.categoryTag);
console.log('\nAI Prompt Hint:', answer.question.aiPromptHint || 'None');
console.log('\n--- Full Explanation ---');
console.log(answer.explanation);
console.log('\n--- Evidence Data ---');
console.log('Evidence Count:', answer.evidenceData?.evidence?.length || 0);
if (answer.evidenceData?.evidence?.length > 0) {
  console.log('\nEvidence Sources:');
  answer.evidenceData.evidence.forEach((ev, i) => {
    console.log(`\n[${i+1}] Source: ${ev.source}`);
    console.log(`    Relevance: ${ev.relevance}`);
    console.log(`    Content Preview: ${ev.content.substring(0, 300)}...`);
  });
}

await prisma.$disconnect();
