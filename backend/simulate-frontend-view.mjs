import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function simulateFrontendView() {
  try {
    const user = await prisma.user.findFirst({
      include: { organization: true }
    });

    if (!user?.organization) {
      console.log('No user with organization found');
      return;
    }

    // This simulates what the route handler does
    const assessments = await prisma.assessment.findMany({
      where: {
        organizationId: user.organization.id
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
        gaps: {
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
            priority: true,
          }
        },
        risks: {
          select: {
            id: true,
            category: true,
            title: true,
            riskLevel: true,
          }
        },
        priorities: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100  // Same limit as frontend
    });

    // Map like the route handler does
    const mappedAssessments = assessments.map(assessment => ({
      id: assessment.id,
      organizationId: assessment.organizationId,
      templateId: assessment.templateId,
      status: assessment.status,
      responses: assessment.responses || {},
      riskScore: assessment.riskScore,
      creditsUsed: assessment.creditsUsed,
      completedAt: assessment.completedAt?.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      template: assessment.template ? {
        id: assessment.template.id,
        name: assessment.template.name,
        category: assessment.template.category,
      } : null,
      gaps: assessment.gaps || [],
      risks: assessment.risks || [],
      hasPriorities: !!assessment.priorities,
    }));

    // Filter like frontend does
    const filteredReports = mappedAssessments
      .filter(assessment =>
        assessment.status === 'COMPLETED' || assessment.status === 'IN_PROGRESS'
      )
      .slice(0, 5)  // Just show first 5
      .map(assessment => {
        const isCompleted = assessment.status === 'COMPLETED';
        const hasPriorities = assessment.hasPriorities === true;
        const gapCount = assessment.gaps?.length || 0;
        const riskCount = assessment.risks?.length || 0;

        // Determine status based on completion and priorities
        let status;
        if (assessment.status === 'IN_PROGRESS') {
          status = 'generating';
        } else if (isCompleted && hasPriorities) {
          status = 'completed';
        } else if (isCompleted && !hasPriorities) {
          status = 'complete-priorities';
        } else {
          status = 'generating';
        }

        return {
          id: assessment.id,
          title: assessment.template?.name || 'Assessment Report',
          status,
          realStatus: assessment.status,
          hasPriorities,
          gapCount,
          riskCount,
          riskScore: assessment.riskScore
        };
      });

    console.log('\n===== Frontend View Simulation =====');
    console.log('Total assessments returned:', mappedAssessments.length);
    console.log('\nFirst 5 Reports (as frontend would see them):');

    filteredReports.forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.title}`);
      console.log(`   ID: ${report.id}`);
      console.log(`   DB Status: ${report.realStatus}`);
      console.log(`   Has Priorities: ${report.hasPriorities}`);
      console.log(`   Frontend Status: ${report.status}`);
      console.log(`   Risk Score: ${report.riskScore} | Gaps: ${report.gapCount} | Risks: ${report.riskCount}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateFrontendView();