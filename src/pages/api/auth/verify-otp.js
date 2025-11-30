import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
      console.error("Prisma Client not initialized. Please run: npx prisma generate");
      return res.status(500).json({
        error: "Database connection error. Please contact support.",
        message: "Prisma Client not initialized",
      });
    }

    // Check if Prisma Client is initialized
    if (!prisma) {
      console.error("Prisma Client not initialized. Please run: npx prisma generate");
      return res.status(500).json({
        error: "Database connection error. Please contact support.",
        message: "Prisma Client not initialized. Run: npx prisma generate",
      });
    }

    // OTP verified, now handle user creation/login
    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      // Create new user
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name is required for new users" });
      }

      const defaultRole = role || "CUSTOMER";
      if (!["CUSTOMER", "COURIER", "ADMIN"].includes(defaultRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: name.trim(),
          role: defaultRole,
          // No password needed for OTP auth
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30d" }
    );

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
