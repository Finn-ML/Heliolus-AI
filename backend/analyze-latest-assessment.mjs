#!/usr/bin/env node

/**
 * Analyze Latest Assessment
 *
 * Pulls the most recent completed assessment and analyzes:
 * - Overall score and fairness
 * - Answer distribution
 * - Evidence extraction quality
 * - Risk/gap calculations
 * - Control effectiveness
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('=== Latest Assessment Analysis ===\n');

try {
  // Get specific assessment ID from command line, or latest
  const assessmentId = process.argv[2];

  const whereClause = assessmentId
    ? { id: assessmentId }
    : { riskScore: { not: null } };

  const assessment = await prisma.assessment.findFirst({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      template: {
        select: {
          name: true,
          category: true
        }
      },
      organization: {
        select: {
          name: true,
          industry: true,
          size: true,
          geography: true,
          documents: {
            select: {
              id: true,
              filename: true,
              parsedContent: true
            }
          }
        }
      },
      answers: {
        include: {
          question: {
            select: {
              text: true,
              categoryTag: true,
              weight: true
            }
          }
        }
      },
      gaps: {
        select: {
          id: true,
          title: true,
          severity: true,
          priority: true,
          category: true
        }
      },
      risks: {
        select: {
          id: true,
          title: true,
          category: true,
          likelihood: true,
          impact: true,
          riskLevel: true,
          controlEffectiveness: true
        }
      }
    }
  });

  if (!assessment) {
    console.log('❌ No completed assessments found');
    process.exit(1);
  }

  console.log('📊 Assessment Overview');
  console.log('━'.repeat(80));
  console.log(`ID: ${assessment.id}`);
  console.log(`Organization: ${assessment.organization.name}`);
  console.log(`Template: ${assessment.template.name}`);
  console.log(`Completed: ${assessment.completedAt?.toISOString()}`);
  console.log(`Risk Score: ${assessment.riskScore}/100`);
  console.log(`Status: ${assessment.status}`);
  console.log();

  // Analyze documents
  console.log('📄 Documents');
  console.log('━'.repeat(80));
  const documents = assessment.organization.documents || [];
  console.log(`Total Documents: ${documents.length}`);
  documents.forEach((doc, i) => {
    const hasParsedContent = doc.parsedContent && typeof doc.parsedContent === 'object' && doc.parsedContent.text;
    const contentLength = hasParsedContent ? doc.parsedContent.text.length : 0;
    console.log(`  [${i+1}] ${doc.filename}`);
    console.log(`      Parsed: ${hasParsedContent ? 'YES' : 'NO'}`);
    if (hasParsedContent) {
      console.log(`      Length: ${contentLength} chars`);
      console.log(`      Preview: ${doc.parsedContent.text.substring(0, 80)}...`);
    }
  });
  console.log();

  // Analyze answer distribution
  console.log('📝 Answer Distribution');
  console.log('━'.repeat(80));

  const answersByScore = {
    5: [],
    4: [],
    3: [],
    2: [],
    1: [],
    0: []
  };

  assessment.answers.forEach(answer => {
    if (answersByScore[answer.score]) {
      answersByScore[answer.score].push(answer);
    }
  });

  const totalAnswers = assessment.answers.length;

  for (let score = 5; score >= 0; score--) {
    const count = answersByScore[score].length;
    const percentage = ((count / totalAnswers) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`Score ${score}/5: ${count.toString().padStart(3)} answers (${percentage.padStart(5)}%) ${bar}`);
  }

  const avgScore = assessment.answers.reduce((sum, a) => sum + a.score, 0) / totalAnswers;
  console.log(`\nAverage Score: ${avgScore.toFixed(2)}/5 (${(avgScore * 20).toFixed(1)}%)`);
  console.log();

  // Show sample high-scoring answers
  console.log('✅ Sample High-Scoring Answers (5/5)');
  console.log('━'.repeat(80));
  const highScores = answersByScore[5].slice(0, 3);
  if (highScores.length === 0) {
    console.log('  None found');
  } else {
    highScores.forEach((answer, i) => {
      console.log(`\n[${i+1}] Question: ${answer.question.text.substring(0, 100)}...`);
      console.log(`    Category: ${answer.question.categoryTag}`);
      console.log(`    Explanation: ${answer.explanation.substring(0, 200)}...`);
    });
  }
  console.log();

  // Show sample zero-scoring answers
  console.log('❌ Sample Zero-Scoring Answers (0/5)');
  console.log('━'.repeat(80));
  const zeroScores = answersByScore[0].slice(0, 5);
  if (zeroScores.length === 0) {
    console.log('  None found (GOOD!)');
  } else {
    zeroScores.forEach((answer, i) => {
      console.log(`\n[${i+1}] Question: ${answer.question.text.substring(0, 100)}...`);
      console.log(`    Category: ${answer.question.categoryTag}`);
      console.log(`    Explanation: ${answer.explanation.substring(0, 200)}...`);
    });
  }
  console.log();

  // Analyze risks
  console.log('⚠️  Risk Analysis');
  console.log('━'.repeat(80));
  console.log(`Total Risks: ${assessment.risks.length}`);

  const risksByLevel = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  assessment.risks.forEach(risk => {
    if (risksByLevel[risk.riskLevel]) {
      risksByLevel[risk.riskLevel].push(risk);
    }
  });

  console.log(`  CRITICAL: ${risksByLevel.CRITICAL.length}`);
  console.log(`  HIGH: ${risksByLevel.HIGH.length}`);
  console.log(`  MEDIUM: ${risksByLevel.MEDIUM.length}`);
  console.log(`  LOW: ${risksByLevel.LOW.length}`);

  const avgControlEffectiveness = assessment.risks.reduce((sum, r) => sum + (r.controlEffectiveness || 0), 0) / assessment.risks.length;
  console.log(`\nAverage Control Effectiveness: ${avgControlEffectiveness.toFixed(1)}%`);
  console.log();

  // Sample risks
  console.log('Sample Risks:');
  assessment.risks.slice(0, 3).forEach((risk, i) => {
    console.log(`\n[${i+1}] ${risk.title}`);
    console.log(`    Risk Level: ${risk.riskLevel} | Likelihood: ${risk.likelihood} | Impact: ${risk.impact}`);
    console.log(`    Control Effectiveness: ${(risk.controlEffectiveness || 0).toFixed(0)}%`);
  });
  console.log();

  // Analyze gaps
  console.log('🔍 Gap Analysis');
  console.log('━'.repeat(80));
  console.log(`Total Gaps: ${assessment.gaps.length}`);

  const gapsBySeverity = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  assessment.gaps.forEach(gap => {
    if (gapsBySeverity[gap.severity]) {
      gapsBySeverity[gap.severity].push(gap);
    }
  });

  console.log(`  CRITICAL: ${gapsBySeverity.CRITICAL.length}`);
  console.log(`  HIGH: ${gapsBySeverity.HIGH.length}`);
  console.log(`  MEDIUM: ${gapsBySeverity.MEDIUM.length}`);
  console.log(`  LOW: ${gapsBySeverity.LOW.length}`);
  console.log();

  // Assessment scoring fairness
  console.log('⚖️  Score Fairness Assessment');
  console.log('━'.repeat(80));

  const expectedScore = avgScore * 20; // Convert 0-5 scale to 0-100
  const actualScore = assessment.riskScore;
  const scoreDelta = actualScore - expectedScore;

  console.log(`Expected Score (from answers): ${expectedScore.toFixed(1)}/100`);
  console.log(`Actual Score: ${actualScore}/100`);
  console.log(`Delta: ${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(1)} points`);
  console.log();

  // Fairness determination
  console.log('🎯 Fairness Analysis');
  console.log('━'.repeat(80));

  const issues = [];
  const strengths = [];

  // Check answer distribution
  const zeroScorePercentage = (answersByScore[0].length / totalAnswers) * 100;
  if (zeroScorePercentage > 50) {
    issues.push(`❌ ${zeroScorePercentage.toFixed(1)}% of answers scored 0/5 (expect <20%)`);
  } else if (zeroScorePercentage > 20) {
    issues.push(`⚠️  ${zeroScorePercentage.toFixed(1)}% of answers scored 0/5 (target <20%)`);
  } else {
    strengths.push(`✅ Only ${zeroScorePercentage.toFixed(1)}% scored 0/5 (healthy)`);
  }

  // Check control effectiveness
  if (avgControlEffectiveness < 20) {
    issues.push(`❌ Average control effectiveness ${avgControlEffectiveness.toFixed(0)}% (expect 40-70%)`);
  } else if (avgControlEffectiveness < 40) {
    issues.push(`⚠️  Average control effectiveness ${avgControlEffectiveness.toFixed(0)}% (target 40-70%)`);
  } else {
    strengths.push(`✅ Control effectiveness ${avgControlEffectiveness.toFixed(0)}% (healthy)`);
  }

  // Check risk count
  if (assessment.risks.length > 50) {
    issues.push(`❌ ${assessment.risks.length} risks generated (expect 10-20)`);
  } else if (assessment.risks.length > 30) {
    issues.push(`⚠️  ${assessment.risks.length} risks generated (target 10-20)`);
  } else {
    strengths.push(`✅ ${assessment.risks.length} risks (healthy)`);
  }

  // Check document parsing
  const unparsedDocs = documents.filter(doc => {
    return !doc.parsedContent || typeof doc.parsedContent !== 'object' || !doc.parsedContent.text;
  });
  if (unparsedDocs.length > 0) {
    issues.push(`❌ ${unparsedDocs.length}/${documents.length} documents not parsed`);
  } else if (documents.length > 0) {
    strengths.push(`✅ All ${documents.length} documents parsed`);
  }

  // Check HIGH risk concentration
  const highRiskPercentage = (risksByLevel.HIGH.length / assessment.risks.length) * 100;
  if (highRiskPercentage > 70) {
    issues.push(`❌ ${highRiskPercentage.toFixed(0)}% risks are HIGH level (expect 30-50%)`);
  } else if (highRiskPercentage > 60) {
    issues.push(`⚠️  ${highRiskPercentage.toFixed(0)}% risks are HIGH level (target 30-50%)`);
  } else {
    strengths.push(`✅ ${highRiskPercentage.toFixed(0)}% HIGH level risks (balanced)`);
  }

  console.log('Issues Found:');
  if (issues.length === 0) {
    console.log('  None - Score appears fair!');
  } else {
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  console.log();

  console.log('Strengths:');
  if (strengths.length === 0) {
    console.log('  None identified');
  } else {
    strengths.forEach(strength => console.log(`  ${strength}`));
  }
  console.log();

  // Final verdict
  console.log('📊 Final Verdict');
  console.log('━'.repeat(80));

  if (issues.filter(i => i.startsWith('❌')).length > 0) {
    console.log('❌ UNFAIR SCORE - Critical issues detected');
    console.log('\nThe score appears artificially low due to:');
    issues.filter(i => i.startsWith('❌')).forEach(issue => {
      console.log(`  ${issue}`);
    });
    console.log('\nRecommended actions:');
    if (zeroScorePercentage > 50) {
      console.log('  1. Investigate why AI is not finding evidence in documents');
      console.log('  2. Check if documents are being passed to AI correctly');
      console.log('  3. Review OpenAI prompt effectiveness');
    }
    if (avgControlEffectiveness < 20) {
      console.log('  1. Verify answer scores are being used for control effectiveness');
      console.log('  2. Check risk calculation formula');
    }
    if (assessment.risks.length > 50) {
      console.log('  1. Review risk generation thresholds');
      console.log('  2. Consolidate duplicate/similar risks');
    }
  } else if (issues.filter(i => i.startsWith('⚠️')).length > 0) {
    console.log('⚠️  QUESTIONABLE SCORE - Some concerns');
    console.log('\nThe score may be slightly low, but within acceptable variance.');
    console.log('Consider reviewing these areas for improvement.');
  } else {
    console.log('✅ FAIR SCORE - Assessment appears accurate');
    console.log('\nThe score reflects the actual compliance evidence found in documents.');
    console.log('No systemic issues detected.');
  }

} catch (error) {
  console.error('❌ Error analyzing assessment:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
