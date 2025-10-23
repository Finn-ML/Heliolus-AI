/**
 * Standalone script to add Enhanced Financial Crime Compliance v3.0 template
 * WITHOUT deleting any existing data
 *
 * Usage: npx tsx prisma/seed-financial-enhanced-only.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { seedEnhancedTemplates } from './seed-templates-enhanced';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding Enhanced Financial Crime Compliance v3.0 template (preserving existing data)...\n');

  try {
    // Check if template already exists
    const existing = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' }
    });

    if (existing) {
      console.log('⚠️  Enhanced Financial Crime Compliance v3.0 template already exists!');
      console.log(`   Template ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Version: ${existing.version}`);
      console.log('\n✅ No changes needed - template already in database.\n');
      return;
    }

    // Seed the template
    console.log('📋 Creating Enhanced Financial Crime Compliance v3.0 template...');
    const template = await seedEnhancedTemplates();

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

    console.log('\n✅ Successfully added Enhanced Financial Crime Compliance v3.0 template!');
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
