import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkGaps() {
  try {
    const assessment = await prisma.assessment.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        gaps: {
          take: 5
        }
      }
    });

    if (!assessment) {
      console.log('No assessment found');
      return;
    }

    console.log('\n=== GAP DETAILS (First 5) ===');
    console.log(`Assessment ID: ${assessment.id}\n`);

    assessment.gaps.forEach((gap, idx) => {
      console.log(`[${idx + 1}] Gap ID: ${gap.id}`);
      console.log(`    Title: ${gap.title.substring(0, 80)}...`);
      console.log(`    Severity: ${gap.severity}`);
      console.log(`    Priority: ${gap.priority}`);
      console.log(`    Category: ${gap.category}`);

      // Check all fields that might be missing
      console.log(`    Fields Check:`);
      console.log(`      - gapSize: ${gap.gapSize ?? 'NOT SET'}`);
      console.log(`      - currentState: ${gap.currentState ?? 'NOT SET'}`);
      console.log(`      - requiredState: ${gap.requiredState ?? 'NOT SET'}`);
      console.log(`      - estimatedCost: ${gap.estimatedCost ?? 'NOT SET'}`);
      console.log(`      - estimatedEffort: ${gap.estimatedEffort ?? 'NOT SET'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGaps();
