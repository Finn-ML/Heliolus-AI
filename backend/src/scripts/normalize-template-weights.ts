/**
 * Script to normalize existing template weights
 * Run this once to ensure all templates have properly normalized weights
 *
 * Usage: npx tsx src/scripts/normalize-template-weights.ts
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function normalizeTemplateWeights() {
  console.log('🔧 Starting weight normalization...\n');

  try {
    // Get all templates with their sections and questions
    const templates = await prisma.template.findMany({
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    console.log(`📋 Found ${templates.length} templates to process\n`);

    for (const template of templates) {
      console.log(`\n📦 Processing template: ${template.name} (${template.id})`);

      // Normalize section weights
      if (template.sections.length > 0) {
        const totalSectionWeight = template.sections.reduce((sum, s) => sum + s.weight, 0);

        if (Math.abs(totalSectionWeight - 1.0) > 0.01) {
          console.log(`  ⚠️  Section weights sum to ${totalSectionWeight.toFixed(4)}, normalizing...`);

          for (const section of template.sections) {
            const normalizedWeight = section.weight / totalSectionWeight;
            await prisma.section.update({
              where: { id: section.id },
              data: { weight: normalizedWeight },
            });
          }
          console.log(`  ✅ Normalized ${template.sections.length} section weights`);
        } else {
          console.log(`  ✓ Section weights already normalized (sum: ${totalSectionWeight.toFixed(4)})`);
        }

        // Normalize question weights within each section
        for (const section of template.sections) {
          if (section.questions.length > 0) {
            const totalQuestionWeight = section.questions.reduce((sum, q) => sum + q.weight, 0);

            if (Math.abs(totalQuestionWeight - 1.0) > 0.01) {
              console.log(`  ⚠️  Section "${section.title}" question weights sum to ${totalQuestionWeight.toFixed(4)}, normalizing...`);

              for (const question of section.questions) {
                const normalizedWeight = question.weight / totalQuestionWeight;
                await prisma.question.update({
                  where: { id: question.id },
                  data: { weight: normalizedWeight },
                });
              }
              console.log(`    ✅ Normalized ${section.questions.length} question weights in section "${section.title}"`);
            } else {
              console.log(`    ✓ Question weights in "${section.title}" already normalized (sum: ${totalQuestionWeight.toFixed(4)})`);
            }
          }
        }
      }
    }

    console.log('\n\n✅ Weight normalization complete!');
    console.log('\nSummary:');
    console.log(`  - Processed ${templates.length} templates`);
    console.log(`  - All section weights now sum to 1.0 per template`);
    console.log(`  - All question weights now sum to 1.0 per section`);

  } catch (error) {
    console.error('❌ Error during weight normalization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
normalizeTemplateWeights()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
