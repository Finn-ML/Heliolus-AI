/**
 * Fix Stuck Assessments Script
 *
 * Updates assessments that are stuck in IN_PROGRESS status but should be COMPLETED
 * This happens when the completeAssessment transaction rolled back due to credit deduction failures
 *
 * Usage: npx tsx prisma/fix-stuck-assessments.ts
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding assessments stuck in IN_PROGRESS status...\n');

  // Find assessments that are IN_PROGRESS but have indicators of completion
  const stuckAssessments = await prisma.assessment.findMany({
    where: {
      status: 'IN_PROGRESS',
      OR: [
        // Has completedAt timestamp
        { completedAt: { not: null } },
        // Has risk score
        { riskScore: { not: null } },
        // Has AI analysis
        { aiAnalysis: { not: null } },
        // Has gaps
        {
          gaps: {
            some: {}
          }
        },
        // Has risks
        {
          risks: {
            some: {}
          }
        }
      ]
    },
    include: {
      template: {
        select: {
          id: true,
          name: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      gaps: true,
      risks: true
    }
  });

  if (stuckAssessments.length === 0) {
    console.log('✅ No stuck assessments found! All assessments have correct status.\n');
    return;
  }

  console.log(`⚠️  Found ${stuckAssessments.length} assessments stuck in IN_PROGRESS status:\n`);

  // Display details
  stuckAssessments.forEach((assessment, index) => {
    console.log(`${index + 1}. Assessment ID: ${assessment.id}`);
    console.log(`   Organization: ${assessment.organization?.name || 'Unknown'}`);
    console.log(`   Template: ${assessment.template?.name || 'Unknown'}`);
    console.log(`   Created: ${assessment.createdAt.toLocaleDateString()}`);
    console.log(`   Completed At: ${assessment.completedAt ? assessment.completedAt.toLocaleDateString() : 'Not set'}`);
    console.log(`   Risk Score: ${assessment.riskScore !== null ? assessment.riskScore : 'Not set'}`);
    console.log(`   Gaps: ${assessment.gaps?.length || 0}`);
    console.log(`   Risks: ${assessment.risks?.length || 0}`);
    console.log(`   AI Analysis: ${assessment.aiAnalysis ? 'Present' : 'Missing'}`);
    console.log('');
  });

  // Ask for confirmation
  console.log(`\n🔧 Ready to fix ${stuckAssessments.length} assessments by updating status to COMPLETED`);
  console.log('   This will make them visible and viewable in the Reports page.');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('📝 Updating assessments to COMPLETED status...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const assessment of stuckAssessments) {
    try {
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          status: 'COMPLETED',
          completedAt: assessment.completedAt || new Date(), // Set completedAt if missing
        }
      });

      console.log(`✅ Fixed assessment ${assessment.id} (${assessment.template?.name})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to fix assessment ${assessment.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✨ Fix Complete!`);
  console.log(`   ✅ Successfully fixed: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }
  console.log('');
  console.log('📊 Your reports should now be visible in the Reports page!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error running fix script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
