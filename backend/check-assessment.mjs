import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAssessment() {
  try {
    const assessmentId = 'cmh1x1s500001nan4zaakof37';

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        template: {
          select: { name: true, category: true }
        },
        answers: {
          include: {
            question: {
              select: {
                text: true,
                weight: true,
                section: {
                  select: { title: true, weight: true }
                }
              }
            }
          }
        },
        gaps: {
          select: { description: true, severity: true, category: true }
        },
        risks: {
          select: { description: true, likelihood: true, impact: true, riskLevel: true }
        }
      }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    console.log('\n=== ASSESSMENT OVERVIEW ===');
    console.log(`ID: ${assessment.id}`);
    console.log(`Template: ${assessment.template.name}`);
    console.log(`Status: ${assessment.status}`);
    console.log(`Risk Score: ${assessment.riskScore}`);
    console.log(`Compliance Score: ${assessment.complianceScore}`);
    console.log(`Total Answers: ${assessment.answers.length}`);
    console.log(`Total Gaps: ${assessment.gaps.length}`);
    console.log(`Total Risks: ${assessment.risks.length}`);

    console.log('\n=== AI ANALYSIS SUMMARY ===');
    if (assessment.aiAnalysis && typeof assessment.aiAnalysis === 'object') {
      console.log(JSON.stringify(assessment.aiAnalysis, null, 2));
    } else {
      console.log('No AI analysis data');
    }

    console.log('\n=== ANSWERS BREAKDOWN ===');
    assessment.answers.forEach((answer, idx) => {
      console.log(`\n[${idx + 1}] ${answer.question.text.substring(0, 100)}...`);
      console.log(`   Section: ${answer.question.section.title} (weight: ${answer.question.section.weight})`);
      console.log(`   Question Weight: ${answer.question.weight}`);
      console.log(`   Score: ${answer.score}`);
      console.log(`   Answer: ${answer.answerText?.substring(0, 150)}...`);
      console.log(`   Evidence: ${answer.evidenceText?.substring(0, 150) || 'None'}...`);
      console.log(`   AI Explanation: ${answer.aiExplanation?.substring(0, 150) || 'None'}...`);
    });

    console.log('\n=== GAPS ===');
    assessment.gaps.forEach((gap, idx) => {
      console.log(`[${idx + 1}] ${gap.description} (${gap.severity} - ${gap.category})`);
    });

    console.log('\n=== RISKS ===');
    assessment.risks.forEach((risk, idx) => {
      console.log(`[${idx + 1}] ${risk.description} (${risk.riskLevel} - L:${risk.likelihood}/I:${risk.impact})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssessment();
