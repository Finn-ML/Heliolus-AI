import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkDistribution() {
  try {
    const assessment = await prisma.assessment.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          orderBy: { score: 'desc' }
        },
        gaps: true,
        risks: true
      }
    });

    if (!assessment) {
      console.log('No assessment found');
      return;
    }

    console.log('\n=== ASSESSMENT OVERVIEW ===');
    console.log(`ID: ${assessment.id}`);
    console.log(`Risk Score: ${assessment.riskScore}`);
    console.log(`Total Answers: ${assessment.answers.length}`);
    console.log(`Total Gaps: ${assessment.gaps.length}`);
    console.log(`Total Risks: ${assessment.risks.length}`);

    // Calculate score distribution
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    assessment.answers.forEach(a => distribution[a.score]++);

    console.log('\n=== FULL SCORE DISTRIBUTION (All Answers) ===');
    Object.entries(distribution).forEach(([score, count]) => {
      const pct = ((count / assessment.answers.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 2));
      console.log(`Score ${score}: ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
    });

    // Calculate average
    const totalScore = assessment.answers.reduce((sum, a) => sum + a.score, 0);
    const avgScore = totalScore / assessment.answers.length;
    const maxScore = assessment.answers.length * 5;
    const compliancePct = (totalScore / maxScore) * 100;

    console.log('\n=== SCORE METRICS ===');
    console.log(`Average Answer Score: ${avgScore.toFixed(2)}/5`);
    console.log(`Total Score: ${totalScore}/${maxScore}`);
    console.log(`Compliance %: ${compliancePct.toFixed(1)}%`);
    console.log(`Risk Score: ${assessment.riskScore}`);

    console.log('\n=== GAPS SUMMARY ===');
    const gapsBySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    assessment.gaps.forEach(g => {
      if (g.severity in gapsBySeverity) {
        gapsBySeverity[g.severity]++;
      }
    });

    Object.entries(gapsBySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        console.log(`${severity}: ${count}`);
      }
    });

    console.log('\n=== RISKS SUMMARY ===');
    const risksByLevel = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    assessment.risks.forEach(r => {
      if (r.riskLevel in risksByLevel) {
        risksByLevel[r.riskLevel]++;
      }
    });

    Object.entries(risksByLevel).forEach(([level, count]) => {
      if (count > 0) {
        console.log(`${level}: ${count}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDistribution();
