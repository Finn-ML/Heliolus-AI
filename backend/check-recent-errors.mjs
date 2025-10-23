import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkRecentErrors() {
  try {
    console.log('=== Recent Assessment Errors Check ===\n');

    // Check most recent assessments
    const recentAssessments = await prisma.assessment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        answers: {
          take: 5,
          orderBy: { updatedAt: 'desc' }
        },
        gaps: true,
        risks: true
      }
    });

    console.log(`📊 Found ${recentAssessments.length} recent assessments:\n`);

    for (const assessment of recentAssessments) {
      console.log(`Assessment: ${assessment.id.substring(0, 8)}...`);
      console.log(`  Organization: ${assessment.organization?.name || 'Unknown'}`);
      console.log(`  Status: ${assessment.status}`);
      console.log(`  Created: ${assessment.createdAt.toISOString()}`);
      console.log(`  Updated: ${assessment.updatedAt.toISOString()}`);
      console.log(`  Answers: ${assessment.answers?.length || 0}`);
      console.log(`  Gaps: ${assessment.gaps?.length || 0}`);
      console.log(`  Risks: ${assessment.risks?.length || 0}`);
      console.log(`  Risk Score: ${assessment.riskScore || 'Not calculated'}`);
      console.log(`  Credits Used: ${assessment.creditsUsed || 0}`);

      if (assessment.status === 'FAILED') {
        console.log(`  ❌ Status: FAILED`);
      } else if (assessment.status === 'IN_PROGRESS') {
        console.log(`  ⚠️  Status: IN_PROGRESS (may have stalled)`);
      } else if (assessment.status === 'COMPLETED') {
        console.log(`  ✅ Status: COMPLETED`);
      }

      // Check for aiAnalysis errors
      if (assessment.aiAnalysis) {
        const analysis = assessment.aiAnalysis;
        if (typeof analysis === 'object' && analysis.error) {
          console.log(`  🔴 AI Analysis Error: ${analysis.error}`);
          console.log(`     Message: ${analysis.message}`);
        }
      }

      console.log('');
    }

    // Check for any assessments updated in last 5 minutes with issues
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentlyUpdated = await prisma.assessment.findMany({
      where: {
        updatedAt: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (recentlyUpdated.length > 0) {
      console.log(`\n⏰ Assessments updated in last 5 minutes: ${recentlyUpdated.length}`);
      for (const a of recentlyUpdated) {
        console.log(`  - ${a.id.substring(0, 8)}... [${a.status}] at ${a.updatedAt.toISOString()}`);
      }
    }

    // Check audit log for recent errors
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['ASSESSMENT_EXECUTED', 'ASSESSMENT_COMPLETED']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    if (recentAuditLogs.length > 0) {
      console.log(`\n📝 Recent Audit Logs:`);
      for (const log of recentAuditLogs) {
        console.log(`  ${log.timestamp.toISOString()} - ${log.action}`);
        if (log.metadata) {
          const metadata = log.metadata;
          if (typeof metadata === 'object') {
            console.log(`    Details:`, JSON.stringify(metadata, null, 2));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking assessments:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentErrors();
