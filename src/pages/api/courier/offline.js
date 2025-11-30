import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract and verify token
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Update courier to offline
    const courier = await prisma.courier.updateMany({
      where: { userId: decoded.userId },
      data: {
        active: false,
      },
    });

    if (courier.count === 0) {
      return res.status(404).json({ error: "Courier profile not found" });
    }

    return res.status(200).json({
      message: "Courier set to offline",
      active: false,
    });
  } catch (error) {
    console.error("Error in courier/offline:", error);
    return res.status(500).json({
      error: "Failed to set courier offline",
      message: error.message,
    });
  }
}

