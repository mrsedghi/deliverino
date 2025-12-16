import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (req.method === 'GET') {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          phone: true,
          fullName: true,
          nationalCode: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Backward-compat: if nationalCode was previously stored in Setting, migrate it once.
      let migratedNationalCode = user.nationalCode;
      if (!migratedNationalCode) {
        const profileKey = `user_profile:${user.id}`;
        const profileSetting = await prisma.setting.findUnique({
          where: { key: profileKey },
          select: { value: true },
        });
        const legacyNational =
          profileSetting?.value &&
          typeof profileSetting.value === "object" &&
          typeof profileSetting.value.nationalCode === "string"
            ? profileSetting.value.nationalCode.trim()
            : "";

        if (legacyNational) {
          migratedNationalCode = legacyNational;
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { nationalCode: legacyNational },
            });
          } catch (e) {
            // ignore (e.g., unique constraint collision)
          }
        }
      }

      return res.status(200).json({
        user: {
          ...user,
          nationalCode: migratedNationalCode || null,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { fullName, nationalCode } = req.body || {};

      const cleanFullName = typeof fullName === 'string' ? fullName.trim() : '';
      const cleanNationalCode = typeof nationalCode === 'string' ? nationalCode.trim() : '';

      if (!cleanFullName) {
        return res.status(400).json({ error: 'Full name is required' });
      }
      if (!cleanNationalCode) {
        return res.status(400).json({ error: 'National code is required' });
      }
      if (!/^\d{8,20}$/.test(cleanNationalCode)) {
        return res.status(400).json({ error: 'National code must be digits (8-20 characters)' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: { fullName: cleanFullName, nationalCode: cleanNationalCode },
        select: {
          id: true,
          phone: true,
          fullName: true,
          nationalCode: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        user: {
          ...updatedUser,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

