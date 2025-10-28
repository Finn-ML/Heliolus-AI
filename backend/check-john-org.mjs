import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

try {
  // Find John Doe
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'john.doe', mode: 'insensitive' } },
        { email: { contains: 'johndoe', mode: 'insensitive' } },
        { firstName: 'John', lastName: 'Doe' }
      ]
    }
  });

  if (!user) {
    console.log('John Doe not found');
    process.exit(0);
  }

  console.log('=== John Doe ===');
  console.log('User ID:', user.id);
  console.log('Organization ID:', user.organizationId);

  // Check if he has an organization
  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    if (org) {
      console.log('\n=== Organization ===');
      console.log('ID:', org.id);
      console.log('Name:', org.name);
      console.log('Size:', org.size);
      console.log('Annual Revenue:', org.annualRevenue);
      console.log('Compliance Team Size:', org.complianceTeamSize);
      console.log('Country:', org.country);
      console.log('Industry:', org.industry);

      const missing = [];
      if (!org.size) missing.push('size');
      if (!org.annualRevenue) missing.push('annualRevenue');
      if (!org.complianceTeamSize) missing.push('complianceTeamSize');

      if (missing.length > 0) {
        console.log('\n✗ Organization is INCOMPLETE');
        console.log('Missing fields:', missing.join(', '));
      } else {
        console.log('\n✓ Organization is COMPLETE');
      }
    } else {
      console.log('\n✗ Organization not found');
    }
  } else {
    console.log('\n✗ User has no organization');
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
} finally {
  await prisma.$disconnect();
}
