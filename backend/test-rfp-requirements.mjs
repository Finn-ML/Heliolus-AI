import { PrismaClient } from './src/generated/prisma/index.js';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function testRFPRequirements() {
  try {
    // For testing, we'll use the assessment ID directly
    const assessmentId = 'cmhanasgy00c3qmmuwf8shscq';

    console.log('Testing RFP Requirements endpoint...\n');
    console.log(`Assessment ID: ${assessmentId}\n`);

    // Note: In production, this would require a proper JWT token
    // For testing, we'll call the service directly
    const { aiAnalysisService } = await import('./src/services/ai-analysis.service.js');

    const gaps = await prisma.gap.findMany({
      where: { assessmentId },
      take: 5,
    });

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { template: true }
    });

    console.log(`Found ${gaps.length} gaps\n`);
    console.log('Sample gap titles:');
    gaps.slice(0, 3).forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.title}`);
    });

    console.log('\n=== CALLING AI FORMATTING SERVICE ===\n');

    const formattedRequirements = await aiAnalysisService.formatGapsForRFP(
      gaps,
      assessment.template.name
    );

    console.log('=== FORMATTED REQUIREMENTS ===\n');
    console.log(formattedRequirements);
    console.log('\n=== END ===\n');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRFPRequirements();
