const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkOptimizationStatus() {
  try {
    console.log('=== AI Optimization Status Check ===\n');

    // Check configuration
    console.log('📋 Configuration:');
    console.log('  AI_ENABLE_PREPROCESSING:', process.env.AI_ENABLE_PREPROCESSING);
    console.log('  AI_MAX_CONCURRENT_CALLS:', process.env.AI_MAX_CONCURRENT_CALLS);
    console.log('  AI_TOP_K_DOCUMENTS:', process.env.AI_TOP_K_DOCUMENTS);
    console.log('  OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
    console.log('');

    // Check recent assessments
    console.log('📊 Recent Assessment Activity:\n');

    const recentAssessments = await prisma.assessment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        organization: {
          include: {
            documents: true
          }
        },
        answers: true
      }
    });

    if (recentAssessments.length === 0) {
      console.log('  ℹ️  No assessments found yet');
    } else {
      for (const assessment of recentAssessments) {
        console.log(`  Assessment ID: ${assessment.id.substring(0, 8)}...`);
        console.log(`    Status: ${assessment.status}`);
        console.log(`    Documents: ${assessment.organization?.documents?.length || 0}`);
        console.log(`    Answers: ${assessment.answers?.length || 0}`);
        console.log(`    Credits Used: ${assessment.creditsUsed || 0}`);
        console.log(`    Updated: ${assessment.updatedAt.toISOString()}`);

        // Calculate expected vs actual API calls
        const docCount = assessment.organization?.documents?.length || 0;
        const answerCount = assessment.answers?.length || 0;

        if (docCount > 0 && answerCount > 0) {
          const legacyApiCalls = docCount * answerCount;
          const optimizedApiCalls = docCount + answerCount;
          const reduction = Math.round(((legacyApiCalls - optimizedApiCalls) / legacyApiCalls) * 100);

          console.log(`    💡 Optimization Potential:`);
          console.log(`       Legacy: ${legacyApiCalls} API calls`);
          console.log(`       Optimized: ${optimizedApiCalls} API calls`);
          console.log(`       Savings: ${reduction}% reduction`);
        }
        console.log('');
      }
    }

    // Check documents uploaded
    const documentCount = await prisma.document.count();
    console.log(`📄 Total Documents in System: ${documentCount}`);

    const documentsWithContent = await prisma.document.count({
      where: {
        parsedContent: { not: null }
      }
    });
    console.log(`   Documents with parsed content: ${documentsWithContent}`);
    console.log('');

    // Summary
    console.log('✅ Summary:');
    if (process.env.AI_ENABLE_PREPROCESSING === 'true') {
      console.log('   Optimization is ENABLED and ready to use');
      console.log('   Next assessment execution will use the optimized flow');
    } else {
      console.log('   Optimization is DISABLED');
      console.log('   Set AI_ENABLE_PREPROCESSING=true to enable');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOptimizationStatus();
