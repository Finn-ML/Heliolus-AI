import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAssessmentData() {
  try {
    // Find John Doe
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'john', mode: 'insensitive' } },
          { firstName: { contains: 'john', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Get their assessments
    const assessments = await prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        riskScore: true,
        createdAt: true,
        completedAt: true,
        template: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            gaps: true,
            risks: true
          }
        }
      }
    });

    console.log('\n📊 Assessments:');
    for (const assessment of assessments) {
      console.log(`\n- ID: ${assessment.id}`);
      console.log(`  Template: ${assessment.template?.name || 'Unknown'}`);
      console.log(`  Status: ${assessment.status}`);
      console.log(`  Risk Score: ${assessment.riskScore ?? 'NULL'} ${assessment.riskScore !== null ? `(${(assessment.riskScore / 10).toFixed(1)}/10)` : ''}`);
      console.log(`  Gaps: ${assessment._count.gaps}`);
      console.log(`  Risks: ${assessment._count.risks}`);
      console.log(`  Created: ${assessment.createdAt.toISOString()}`);
      console.log(`  Completed: ${assessment.completedAt?.toISOString() || 'Not completed'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssessmentData();
