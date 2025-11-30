// Test database connection
require('dotenv/config');

// Check if Prisma Client is generated
try {
  const { PrismaClient } = require('@prisma/client');
  
  async function testConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
    
    if (!process.env.DATABASE_URL) {
      console.error('\n❌ DATABASE_URL is not set in your .env file!');
      console.error('Please create a .env file with:');
      console.error('DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"');
      process.exit(1);
      return;
    }
    
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Successfully connected to database!');
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Database connection failed:');
      console.error(error.message);
      
      console.error('\n⚠️  Please check:');
      console.error('1. Is PostgreSQL running?');
      console.error('2. Does the database exist? (Create it with: CREATE DATABASE deliverino;)');
      console.error('3. Are the credentials correct?');
      console.error('4. Is the host and port correct?');
      
      process.exit(1);
    }
  }
  
  testConnection();
} catch (error) {
  if (error.message.includes('Cannot find module') || error.message.includes('__internal')) {
    console.error('❌ Prisma Client has not been generated yet!');
    console.error('\nPlease run first:');
    console.error('  npx prisma generate');
    console.error('\nThen try the connection test again.');
    process.exit(1);
  } else {
    throw error;
  }
}

