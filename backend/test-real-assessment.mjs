#!/usr/bin/env node

/**
 * Test Real Assessment Creation with Structured Output
 *
 * This creates a mini-assessment with 5 questions to verify
 * the structured JSON output is working in production.
 */

import { PrismaClient } from './src/generated/prisma/index.js';
import { AIAnalysisService } from './src/services/ai-analysis.service.js';

const prisma = new PrismaClient();
const aiService = new AIAnalysisService();

console.log('=== Real Assessment Integration Test ===\n');

try {
  // Get organization with documents
  const org = await prisma.organization.findFirst({
    where: { name: 'ExpertChatSolutions' },
    include: {
      documents: {
        select: {
          id: true,
          filename: true,
          parsedContent: true
        },
        take: 12
      }
    }
  });

  if (!org) {
    console.log('❌ Organization not found');
    process.exit(1);
  }

  console.log(`📊 Organization: ${org.name}`);
  console.log(`📄 Documents: ${org.documents.length}\n`);

  // Sample questions covering different categories
  const testQuestions = [
    {
      id: 'test-1',
      text: 'Does your organization have automated sanctions screening across multiple jurisdictions?',
      aiPromptHint: 'Look for OFAC, EU, UN sanctions screening',
      type: 'BOOLEAN',
      required: true
    },
    {
      id: 'test-2',
      text: 'What governance framework does your organization use for financial crime compliance?',
      aiPromptHint: 'Look for three lines of defense, board oversight, MLRO',
      type: 'TEXT',
      required: true
    },
    {
      id: 'test-3',
      text: 'How does your organization conduct risk assessments?',
      aiPromptHint: 'Look for EWRA, risk methodology, assessment frequency',
      type: 'TEXT',
      required: true
    },
    {
      id: 'test-4',
      text: 'What customer due diligence procedures are in place?',
      aiPromptHint: 'Look for KYC, UBO identification, enhanced due diligence',
      type: 'TEXT',
      required: true
    },
    {
      id: 'test-5',
      text: 'How is staff trained on financial crime compliance?',
      aiPromptHint: 'Look for training programs, completion rates, frequency',
      type: 'TEXT',
      required: true
    }
  ];

  console.log(`🧪 Testing ${testQuestions.length} questions with structured output...\n`);

  const results = [];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];

    console.log(`[${i+1}/${testQuestions.length}] ${question.text.substring(0, 80)}...`);

    try {
      const response = await aiService.analyzeQuestion(
        question,
        org.documents,
        undefined,
        {
          name: org.name,
          industry: org.industry,
          size: org.size,
          geography: org.geography
        }
      );

      const result = response.data;

      results.push({
        question: question.text.substring(0, 60),
        score: result.score,
        evidenceCount: result.evidence.length,
        status: result.status
      });

      console.log(`   Score: ${result.score}/5 | Evidence: ${result.evidence.length} sources | Status: ${result.status}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        question: question.text.substring(0, 60),
        score: 0,
        evidenceCount: 0,
        status: 'ERROR'
      });
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(80) + '\n');

  const scoreDistribution = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0
  };

  results.forEach(r => scoreDistribution[r.score]++);

  console.log('Score Distribution:');
  for (let score = 5; score >= 0; score--) {
    const count = scoreDistribution[score];
    const percentage = ((count / results.length) * 100).toFixed(1);
    const bar = '█'.repeat(count * 2);
    console.log(`  ${score}/5: ${count} (${percentage}%) ${bar}`);
  }

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgEvidence = results.reduce((sum, r) => sum + r.evidenceCount, 0) / results.length;
  const zeroScorePercent = (scoreDistribution[0] / results.length) * 100;

  console.log(`\nAverage Score: ${avgScore.toFixed(2)}/5 (${(avgScore * 20).toFixed(1)}%)`);
  console.log(`Average Evidence Sources: ${avgEvidence.toFixed(1)}`);
  console.log(`Zero Scores: ${zeroScorePercent.toFixed(1)}%`);

  console.log('\n' + '═'.repeat(80));
  console.log('🎯 EVALUATION');
  console.log('═'.repeat(80) + '\n');

  if (zeroScorePercent > 50) {
    console.log('❌ FAILED: >50% scoring 0/5');
    console.log('   The structured output fix is NOT working in production.');
    console.log('   Evidence extraction is still broken.');
  } else if (zeroScorePercent > 20) {
    console.log('⚠️  WARNING: 20-50% scoring 0/5');
    console.log('   Structured output may be partially working.');
    console.log('   Some evidence extraction issues remain.');
  } else if (avgScore < 2.0) {
    console.log('⚠️  WARNING: Average score < 2.0/5');
    console.log('   Evidence extraction working but scores are low.');
    console.log('   May indicate legitimate compliance gaps or prompt issues.');
  } else {
    console.log('✅ SUCCESS: Structured output is working!');
    console.log(`   - Only ${zeroScorePercent.toFixed(1)}% scoring 0/5 (target <20%)`);
    console.log(`   - Average score ${avgScore.toFixed(2)}/5 (healthy)`);
    console.log(`   - Evidence being found and scored correctly`);
  }

  console.log('\n✅ Test complete!\n');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
