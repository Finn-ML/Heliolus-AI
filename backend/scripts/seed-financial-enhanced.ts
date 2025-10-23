/**
 * Seed script to add the Enhanced Financial Crime Compliance Template v3.0
 * Run with: npx tsx scripts/seed-financial-enhanced.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { FINANCIAL_CRIME_ENHANCED_TEMPLATE, TemplateData, SectionData, QuestionData } from '../prisma/seed-templates-enhanced';

const prisma = new PrismaClient();

async function seedEnhancedFinancialTemplate(adminUserId: string) {
  console.log('🏦 Creating Enhanced Financial Crime Compliance Template v3.0...');

  const templateData = FINANCIAL_CRIME_ENHANCED_TEMPLATE;

  // Check if template already exists
  const existing = await prisma.template.findFirst({
    where: { slug: templateData.slug }
  });

  if (existing) {
    console.log(`⚠️  Template "${templateData.name}" already exists. Skipping.`);
    return existing;
  }

  // Create template with sections and questions
  const template = await prisma.template.create({
    data: {
      name: templateData.name,
      slug: templateData.slug,
      category: templateData.category,
      description: templateData.description,
      version: templateData.version,
      estimatedMinutes: templateData.estimatedMinutes,
      isActive: templateData.isActive,
      tags: templateData.tags,
      createdBy: adminUserId,
      sections: {
        create: templateData.sections.map((section: SectionData, sectionIndex: number) => ({
          title: section.title,
          description: section.description,
          weight: section.weight,
          regulatoryPriority: section.regulatoryPriority,
          order: section.order,
          isRequired: section.isRequired,
          questions: {
            create: section.questions.map((question: QuestionData, questionIndex: number) => ({
              text: question.question,
              type: question.type,
              weight: question.weight,
              isFoundational: question.isFoundational,
              order: question.order,
              required: question.isRequired,
              options: question.options || [],
              helpText: question.helpText,
              aiPromptHint: question.aiPromptHint,
              scoringRules: question.scoringRules,
              validation: question.validationRules,
              tags: question.tags
            }))
          }
        }))
      }
    },
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  // Calculate statistics
  const totalQuestions = template.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const foundationalQuestions = template.sections.reduce((sum, section) =>
    sum + section.questions.filter(q => q.isFoundational).length, 0);

  console.log(`✅ Created template: ${template.name} (${template.sections.length} sections)`);
  console.log(`📊 Statistics:`);
  console.log(`      - Total Questions: ${totalQuestions}`);
  console.log(`      - Foundational Questions: ${foundationalQuestions} (${Math.round(foundationalQuestions/totalQuestions*100)}%)`);
  console.log(`      - Estimated Time: ${template.estimatedMinutes} minutes`);

  return template;
}

async function main() {
  console.log('🌱 Starting Enhanced Financial Crime Template Seed...');

  try {
    // Find or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@heliolus.com',
          firstName: 'Admin',
          lastName: 'User',
          password: await import('bcryptjs').then(bcrypt => bcrypt.hash('Admin123!', 10)),
          role: 'ADMIN',
          emailVerified: true,
          status: 'ACTIVE'
        }
      });
    }

    await seedEnhancedFinancialTemplate(adminUser.id);

    console.log('✅ Enhanced Financial Crime Template seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
