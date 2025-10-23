import { calculateRiskScore } from './src/lib/assessment/index.js';
import { ScoreCalculator } from './src/lib/assessment/scorer.js';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testScorer() {
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { id: 'cmh259eqb00i9nab8skr2jte3' }, // Latest with many docs
      include: {
        gaps: true,
        risks: true
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    console.log('\n=== TESTING RISK SCORE CALCULATION ===');
    console.log(`Assessment ID: ${assessment.id}`);
    console.log(`Stored Risk Score: ${assessment.riskScore}`);
    console.log(`\nInput Data:`);
    console.log(`  Gaps: ${assessment.gaps.length}`);
    console.log(`  Risks: ${assessment.risks.length}`);

    // Show gap details
    console.log(`\n  Gap Severities:`);
    const gapSeverities = {};
    assessment.gaps.forEach(g => {
      gapSeverities[g.severity] = (gapSeverities[g.severity] || 0) + 1;
      // Check gapSize
      if (g.gapSize === null || g.gapSize === undefined) {
        console.log(`    Gap ${g.id.substring(0, 8)}... has gapSize: ${g.gapSize}`);
      }
    });
    Object.entries(gapSeverities).forEach(([sev, count]) => {
      console.log(`    ${sev}: ${count}`);
    });

    console.log(`\n  Risk Levels:`);
    const riskLevels = {};
    assessment.risks.forEach(r => {
      riskLevels[r.riskLevel] = (riskLevels[r.riskLevel] || 0) + 1;
    });
    Object.entries(riskLevels).forEach(([level, count]) => {
      console.log(`    ${level}: ${count}`);
    });

    // Calculate using the function
    console.log(`\nRecalculating with fixed code...`);
    const calculatedScore = calculateRiskScore(assessment.gaps, assessment.risks);

    // Calculate component scores
    const calculator = new ScoreCalculator();
    const complianceScore = calculator['calculateComplianceScore'](assessment.gaps);
    const riskScore = calculator['calculateRiskScore'](assessment.risks);
    const maturityScore = calculator['calculateMaturityScore'](assessment.gaps, assessment.risks);
    const documentationScore = calculator['calculateDocumentationScore'](assessment.gaps);

    console.log(`\n=== COMPONENT SCORES ===`);
    console.log(`Compliance Score: ${complianceScore} (weight: 30%)`);
    console.log(`Risk Score: ${riskScore} (weight: 40%)`);
    console.log(`Maturity Score: ${maturityScore} (weight: 20%)`);
    console.log(`Documentation Score: ${documentationScore} (weight: 10%)`);

    const manualCalc = Math.round(
      (complianceScore * 0.3) +
      (riskScore * 0.4) +
      (maturityScore * 0.2) +
      (documentationScore * 0.1)
    );
    console.log(`\nManual Calculation: ${complianceScore}*0.3 + ${riskScore}*0.4 + ${maturityScore}*0.2 + ${documentationScore}*0.1 = ${manualCalc}`);

    console.log(`\n=== RESULTS ===`);
    console.log(`Calculated Risk Score: ${calculatedScore}`);
    console.log(`Stored Risk Score: ${assessment.riskScore}`);
    console.log(`Match: ${calculatedScore === assessment.riskScore ? 'YES' : 'NO'}`);

    if (calculatedScore !== assessment.riskScore) {
      console.log(`\n⚠️  Scores don't match!`);
      console.log(`   This means the stored score was calculated with old code.`);
      console.log(`   New assessments should get score: ${calculatedScore}`);
    }

  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testScorer();
