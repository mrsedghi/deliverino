import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, code, name, role } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone number and OTP code are required" });
    }

    // Clean phone number
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    // Verify OTP
    const verification = verifyOTP(cleanPhone, code);

    if (!verification.valid) {
      return res.status(400).json({
        error: verification.error,
        remainingAttempts: verification.remainingAttempts,
      });
    }

    // Check if Prisma Client is initialized
    if (!prisma) {
      console.error("Prisma Client not initialized. This usually means:");
      console.error("1. Prisma Client wasn't generated during build");
      console.error("2. DATABASE_URL environment variable is missing");
      console.error("3. Build process didn't run 'prisma generate'");
      return res.status(500).json({
        error: "Database connection error. Please contact support.",
        message: "Prisma Client not initialized. Check build logs and ensure DATABASE_URL is set.",
      });
    }

    // OTP verified, now handle user creation/login
    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      // Create new user
      // For new users, use provided name or generate a default from phone
      const userName = name?.trim() || `User ${cleanPhone.slice(-4)}`; // Use last 4 digits
      const defaultRole = role || "CUSTOMER";
      
      if (!["CUSTOMER", "COURIER", "ADMIN"].includes(defaultRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: userName,
          role: defaultRole,
          // No password needed for OTP auth
        },
      });
    }

    // Generate JWT token using centralized function
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return res.status(500).json({
      error: "Failed to verify OTP",
      message: error.message,
    });
  }
}
