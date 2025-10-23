import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

const targetScore = parseInt(process.argv[2]) || 45;

const assessments = await prisma.assessment.findMany({
  where: {
    riskScore: {
      gte: targetScore - 2,
      lte: targetScore + 2
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: {
    id: true,
    riskScore: true,
    status: true,
    createdAt: true,
    organization: {
      select: { name: true }
    }
  }
});

console.log(`Assessments scoring around ${targetScore}:\n`);
assessments.forEach((a, i) => {
  console.log(`${i+1}. ${a.id}`);
  console.log(`   Organization: ${a.organization.name}`);
  console.log(`   Score: ${a.riskScore}/100`);
  console.log(`   Status: ${a.status}`);
  console.log(`   Created: ${a.createdAt.toISOString()}\n`);
});

if (assessments.length > 0) {
  console.log(`\nUse this ID for analysis: ${assessments[0].id}`);
}

await prisma.$disconnect();
