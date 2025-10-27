import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test-1761057880863-pxseqx@example.com' }
  });

  if (user) {
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.lastName);
    
    // Test password
    const testPassword = 'secure_dev_admin_2024';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('   Password: ✅ MATCHES "secure_dev_admin_2024"');
    } else {
      console.log('   Password: ❌ DOES NOT MATCH "secure_dev_admin_2024"');
      console.log('\n   Need to reset password? (y/n)');
    }
  } else {
    console.log('❌ User not found!');
  }
  
  await prisma.$disconnect();
}

checkUser();
