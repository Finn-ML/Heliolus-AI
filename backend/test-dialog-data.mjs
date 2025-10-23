#!/usr/bin/env node

/**
 * Test script to verify dialog data structure
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

const assessmentId = process.argv[2] || 'cmh3fju610001phrlckdz3aa2';

console.log('=== DIALOG DATA VERIFICATION ===\n');

try {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      riskScore: true,
      gaps: {
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          severity: true,
          priority: true,
          estimatedCost: true,
          estimatedEffort: true,
        }
      },
      aiRiskAnalysis: true
    }
  });

  if (!assessment) {
    console.log('❌ Assessment not found');
    process.exit(1);
  }

  console.log(`Assessment: ${assessment.id}`);
  console.log(`Risk Score: ${assessment.riskScore}/100\n`);

  // Check each category
  if (assessment.aiRiskAnalysis) {
    const aiData = assessment.aiRiskAnalysis;

    for (const [category, data] of Object.entries(aiData)) {
      console.log(`\n📊 Category: ${category}`);
      console.log('━'.repeat(60));

      // Get gaps for this category
      const categoryGaps = assessment.gaps.filter(g => g.category === category);

      console.log(`\n✅ GAPS (${categoryGaps.length} total):`);
      categoryGaps.forEach(gap => {
        console.log(`  - ${gap.title} (${gap.severity}/${gap.priority})`);
      });

      // Check key findings
      console.log(`\n📌 KEY FINDINGS (${data.keyFindings?.length || 0} total):`);
      if (data.keyFindings && data.keyFindings.length > 0) {
        data.keyFindings.slice(0, 2).forEach(finding => {
          console.log(`  - ${finding.finding} (${finding.severity})`);
        });
      }

      // Check mitigation strategies
      console.log(`\n🎯 MITIGATION STRATEGIES (${data.mitigationStrategies?.length || 0} total):`);
      if (data.mitigationStrategies && data.mitigationStrategies.length > 0) {
        data.mitigationStrategies.slice(0, 2).forEach(strategy => {
          console.log(`  - ${strategy.strategy}`);
          if (strategy.priority) console.log(`    Priority: ${strategy.priority}`);
          if (strategy.estimatedTimeframe) console.log(`    Timeline: ${strategy.estimatedTimeframe}`);
        });
      }

      console.log(`\n📈 Metrics:`);
      console.log(`  - Score: ${data.score}/10`);
      console.log(`  - Critical Gaps: ${data.criticalGaps}`);
      console.log(`  - Total Gaps: ${data.totalGaps}`);
    }
  } else {
    console.log('⚠️  No AI risk analysis found');
  }

  console.log('\n✅ Data structure verification complete!');
  console.log('\nThe dialog should now display:');
  console.log('1. Gaps tab - All gaps for the category');
  console.log('2. Key Findings tab - AI-generated findings');
  console.log('3. Strategies tab - AI-generated mitigation strategies');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await prisma.$disconnect();
}