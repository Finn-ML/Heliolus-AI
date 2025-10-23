#!/usr/bin/env node

/**
 * Debug script to see actual data structure for gaps and AI analysis
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

const assessmentId = process.argv[2] || 'cmh3fju610001phrlckdz3aa2';

console.log('=== DEBUGGING ASSESSMENT DATA ===\n');
console.log(`Assessment ID: ${assessmentId}\n`);

try {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      gaps: {
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          severity: true,
          priority: true,
        }
      }
    }
  });

  if (!assessment) {
    console.log('❌ Assessment not found');
    process.exit(1);
  }

  // Show gap categories
  console.log('📊 GAP CATEGORIES:');
  const categories = [...new Set(assessment.gaps.map(g => g.category))];
  categories.forEach(cat => {
    const gapsInCat = assessment.gaps.filter(g => g.category === cat);
    console.log(`  ${cat}: ${gapsInCat.length} gaps`);
  });
  console.log();

  // Show AI analysis structure if exists
  if (assessment.aiRiskAnalysis) {
    console.log('🤖 AI RISK ANALYSIS KEYS:');
    const analysisKeys = Object.keys(assessment.aiRiskAnalysis);
    analysisKeys.forEach(key => {
      const data = assessment.aiRiskAnalysis[key];
      console.log(`\n  Category: ${key}`);
      console.log(`    - score: ${data.score}`);
      console.log(`    - totalGaps: ${data.totalGaps}`);
      console.log(`    - criticalGaps: ${data.criticalGaps}`);
      console.log(`    - keyFindings: ${data.keyFindings ? data.keyFindings.length : 0} items`);
      console.log(`    - mitigationStrategies: ${data.mitigationStrategies ? data.mitigationStrategies.length : 0} items`);

      if (data.keyFindings && data.keyFindings.length > 0) {
        console.log(`    Sample finding:`, JSON.stringify(data.keyFindings[0], null, 2));
      }
    });
  } else {
    console.log('⚠️  No AI risk analysis found');
  }

  // Check for category mismatch
  console.log('\n🔍 CATEGORY MATCHING CHECK:');
  const aiCategories = assessment.aiRiskAnalysis ? Object.keys(assessment.aiRiskAnalysis) : [];

  console.log('Gap categories:', categories);
  console.log('AI categories:', aiCategories);

  // Check if they match
  categories.forEach(gapCat => {
    const hasAI = aiCategories.includes(gapCat);
    console.log(`  ${gapCat}: ${hasAI ? '✅ Has AI data' : '❌ No AI data'}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await prisma.$disconnect();
}