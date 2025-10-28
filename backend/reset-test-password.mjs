import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'test-1761057880863-pxseqx@example.com';
  const newPassword = 'secure_dev_admin_2024';
  
  console.log('🔐 Resetting password for test user...\n');
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update the user
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Password reset successful!');
  console.log('   User ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   New Password: secure_dev_admin_2024');
  console.log('\n🎉 Test login button should now work!');
  
  await prisma.$disconnect();
}

resetPassword().catch(console.error);
