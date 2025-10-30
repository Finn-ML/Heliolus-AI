#!/usr/bin/env node

/**
 * Fix assessment status for assessments that have risk scores but are still IN_PROGRESS
 * These should be marked as COMPLETED
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAssessmentStatus() {
  console.log('=== Fixing Assessment Status ===\n');

  try {
    // Find all assessments that have risk scores but are not COMPLETED
    const assessmentsToFix = await prisma.assessment.findMany({
      where: {
        riskScore: { not: null },
        status: { not: 'COMPLETED' },
      },
      select: {
        id: true,
        status: true,
        riskScore: true,
        completedAt: true,
      },
    });

    console.log(`Found ${assessmentsToFix.length} assessments to fix:\n`);

    if (assessmentsToFix.length === 0) {
      console.log('✅ No assessments need fixing!');
      return;
    }

    // Show what will be updated
    for (const assessment of assessmentsToFix) {
      console.log(`Assessment ${assessment.id}:`);
      console.log(`  - Current status: ${assessment.status}`);
      console.log(`  - Risk score: ${assessment.riskScore}`);
      console.log(`  - Completed at: ${assessment.completedAt || 'NOT SET'}`);
      console.log('');
    }

    // Update all assessments
    const result = await prisma.assessment.updateMany({
      where: {
        riskScore: { not: null },
        status: { not: 'COMPLETED' },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result.count} assessments to COMPLETED status\n`);

    // Verify the updates
    const verifyAssessments = await prisma.assessment.findMany({
      where: {
        id: { in: assessmentsToFix.map(a => a.id) },
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
      },
    });

    console.log('Verification:');
    for (const assessment of verifyAssessments) {
      console.log(`✓ ${assessment.id}: ${assessment.status} (completed: ${assessment.completedAt?.toISOString()})`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAssessmentStatus();
