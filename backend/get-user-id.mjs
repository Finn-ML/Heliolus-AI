import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function getUserId() {
  try {
    // Get first user
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (user) {
      console.log('\n✅ Found user:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log('\n📋 Use this ID for testing:');
      console.log(`   ${user.id}\n`);
    } else {
      console.log('❌ No users found in database');
      console.log('\nCreate a user first by registering through the API:');
      console.log('POST /v1/auth/register');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getUserId();
