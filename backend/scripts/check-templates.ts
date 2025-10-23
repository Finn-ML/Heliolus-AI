import { PrismaClient } from '../src/generated/prisma/index.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Querying templates...\n');

    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        category: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${templates.length} templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ID: ${template.id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Slug: ${template.slug}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Active: ${template.isActive}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error querying templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
