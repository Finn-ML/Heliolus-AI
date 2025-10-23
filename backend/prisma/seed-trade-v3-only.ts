/**
 * Standalone script to add Trade Compliance v3.0 template
 * WITHOUT deleting any existing data
 *
 * Usage: npx tsx prisma/seed-trade-v3-only.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { seedTradeComplianceV3 } from './seed-templates-trade-v3';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding Trade Compliance v3.0 template (preserving existing data)...\n');

  try {
    // Check if template already exists
    const existing = await prisma.template.findUnique({
      where: { slug: 'trade-compliance-assessment-v3' }
    });

    if (existing) {
      console.log('⚠️  Trade Compliance v3.0 template already exists!');
      console.log(`   Template ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Version: ${existing.version}`);
      console.log('\n✅ No changes needed - template already in database.\n');
      return;
    }

    // Seed the template
    console.log('📋 Creating Trade Compliance v3.0 template...');
    const template = await seedTradeComplianceV3();

    // Get section and question counts
    const sections = await prisma.section.count({
      where: { templateId: template.id }
    });

    const questions = await prisma.question.count({
      where: {
        section: {
          templateId: template.id
        }
      }
    });

    console.log('\n✅ Successfully added Trade Compliance v3.0 template!');
    console.log(`   Template ID: ${template.id}`);
    console.log(`   Slug: ${template.slug}`);
    console.log(`   Sections: ${sections}`);
    console.log(`   Questions: ${questions}`);
    console.log(`   Estimated time: ${template.estimatedMinutes} minutes`);
    console.log('\n📊 The template is now available in your UI!\n');

  } catch (error) {
    console.error('❌ Error adding template:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Failed to add template:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
