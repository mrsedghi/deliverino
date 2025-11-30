import { generateOTPForPhone } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validate phone format (basic validation)
    // Allow phone numbers with or without +, and allow common formats
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        error: "Invalid phone number format. Please use international format (e.g., +1234567890)" 
      });
    }

    // Generate OTP
    const otpResult = generateOTPForPhone(cleanPhone);

    // In development, return the OTP code for testing
    const response = {
      message: otpResult.message,
      expiresAt: otpResult.expiresAt,
    };

    if (process.env.NODE_ENV === "development") {
      response.code = otpResult.code; // Only in development
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in send-otp:", error);
    return res.status(500).json({
      error: error.message || "Failed to send OTP",
    });
  }
}

