import { verifyOtp } from '@/lib/otp-store';
import { generateToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, code } = req.body;

    // Validate input
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    const normalizedPhone = phone.trim();
    const normalizedCode = code.trim();

    // Verify OTP
    const isValid = await verifyOtp(normalizedPhone, normalizedCode);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Upsert user (create if doesn't exist, update if exists)
    const user = await prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: {
        // Update last login time (updatedAt is auto-updated)
      },
      create: {
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`, // Default name
        role: 'CUSTOMER', // Default role
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

