/**
 * Check if Prisma Client is properly generated
 */

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client is available');
  
  // Try to instantiate (without connecting)
  const prisma = new PrismaClient();
  console.log('✅ Prisma Client can be instantiated');
  
  // Check if it has the expected methods
  if (typeof prisma.user !== 'undefined') {
    console.log('✅ Prisma Client has user model');
  }
  
  console.log('\n✅ Prisma Client is properly generated and ready to use!');
  process.exit(0);
} catch (error) {
  console.error('❌ Prisma Client error:', error.message);
  console.error('\nPlease run: npx prisma generate');
  process.exit(1);
}

