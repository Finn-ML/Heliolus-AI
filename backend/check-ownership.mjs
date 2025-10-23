import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkOwnership() {
  try {
    const assessmentId = 'cmh3fju610001phrlckdz3aa2';

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true
          }
        },
        organizationId: true,
        organization: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    console.log('===== Assessment Ownership =====');
    console.log('Assessment ID:', assessment.id);
    console.log('Assessment userId:', assessment.userId);
    console.log('User email:', assessment.user?.email);
    console.log('\n===== Organization Ownership =====');
    console.log('Organization ID:', assessment.organizationId);
    console.log('Organization userId:', assessment.organization?.userId);
    console.log('Organization owner email:', assessment.organization?.user?.email);

    if (assessment.userId !== assessment.organization?.userId) {
      console.log('\n⚠️ WARNING: Assessment userId does not match organization userId!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwnership();
