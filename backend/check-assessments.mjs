import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

const assessments = await prisma.assessment.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10,
  select: {
    id: true,
    status: true,
    riskScore: true,
    createdAt: true,
    completedAt: true,
    organization: {
      select: { name: true }
    }
  }
});

console.log('Recent Assessments:');
assessments.forEach((a, i) => {
  console.log(`${i+1}. ${a.id} - ${a.organization.name}`);
  console.log(`   Status: ${a.status}`);
  console.log(`   Score: ${a.riskScore || 'N/A'}`);
  console.log(`   Created: ${a.createdAt.toISOString()}`);
  console.log(`   Completed: ${a.completedAt?.toISOString() || 'N/A'}`);
});

await prisma.$disconnect();
