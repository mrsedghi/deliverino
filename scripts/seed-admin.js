/**
 * Seed script to create an admin user
 * 
 * Usage:
 * node scripts/seed-admin.js
 * 
 * Or with environment variables:
 * ADMIN_PHONE=+1234567890 ADMIN_NAME=Admin ADMIN_PASSWORD=admin123 node scripts/seed-admin.js
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    const adminPhone = process.env.ADMIN_PHONE || '+1234567890';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { phone: adminPhone },
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'ADMIN') {
        console.log('Admin user already exists:', adminPhone);
        console.log('To login, use this phone number and password:', adminPassword);
        return;
      } else {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            // Update password if provided
            ...(adminPassword && { password: hashedPassword }),
          },
        });
        console.log('Updated user to admin:', adminPhone);
        console.log('Password:', adminPassword);
        return;
      }
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Phone:', adminPhone);
    console.log('Password:', adminPassword);
    console.log('Role:', admin.role);
    console.log('');
    console.log('To login:');
    console.log('1. Use the login endpoint with phone:', adminPhone);
    console.log('2. Use password:', adminPassword);
    console.log('3. Access admin panel at: /admin');

    // Generate a test token (optional)
    if (process.env.JWT_SECRET) {
      const token = jwt.sign(
        { userId: admin.id, phone: admin.phone, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('');
      console.log('Test token (expires in 7 days):');
      console.log(token);
      console.log('');
      console.log('You can use this token in localStorage:');
      console.log(`localStorage.setItem('auth_token', '${token}')`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

