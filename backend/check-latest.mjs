import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkLatest() {
  try {
    console.log('=== Latest Assessment Activity ===\n');

    const latestAssessment = await prisma.assessment.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        template: { select: { name: true } },
      }
    });

    if (latestAssessment) {
      console.log(`Latest Assessment: ${latestAssessment.id}`);
      console.log(`  Organization: ${latestAssessment.organization.name}`);
      console.log(`  Template: ${latestAssessment.template.name}`);
      console.log(`  Status: ${latestAssessment.status}`);
      console.log(`  Created: ${latestAssessment.createdAt.toISOString()}`);
      console.log(`  Updated: ${latestAssessment.updatedAt.toISOString()}`);
      console.log(`  Time since update: ${Math.round((Date.now() - latestAssessment.updatedAt.getTime()) / 1000)}s ago`);
    }

    // Check latest answers
    const latestAnswer = await prisma.answer.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        assessment: { select: { id: true } }
      }
    });

    console.log('\nLatest Answer:');
    if (latestAnswer) {
      console.log(`  Assessment: ${latestAnswer.assessment.id}`);
      console.log(`  Score: ${latestAnswer.score}/5`);
      console.log(`  Created: ${latestAnswer.createdAt.toISOString()}`);
      console.log(`  Time since: ${Math.round((Date.now() - latestAnswer.createdAt.getTime()) / 1000)}s ago`);
    } else {
      console.log('  No answers found');
    }

    // Check latest audit log
    const latestAudit = await prisma.auditLog.findFirst({
      where: {
        action: {
          in: ['ASSESSMENT_EXECUTED', 'ASSESSMENT_CREATED', 'ASSESSMENT_UPDATED']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\nLatest Audit Log:');
    if (latestAudit) {
      console.log(`  Action: ${latestAudit.action}`);
      console.log(`  Entity: ${latestAudit.entity} ${latestAudit.entityId}`);
      console.log(`  Created: ${latestAudit.createdAt.toISOString()}`);
      console.log(`  Time since: ${Math.round((Date.now() - latestAudit.createdAt.getTime()) / 1000)}s ago`);
    } else {
      console.log('  No audit logs found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatest();
