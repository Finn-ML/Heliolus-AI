import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
      take: 10
    });

    console.log('=== Users ===\n');

    for (const user of users) {
      // Get organizations owned by this user
      const orgs = await prisma.organization.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      });

      console.log(`Email: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Organizations: ${orgs.map(o => `${o.name} (${o.id})`).join(', ') || 'None'}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
