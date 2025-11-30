import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

export default async function handler(req, res) {
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

    // Get user and verify admin role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "GET") {
      // Get all settings
      const settings = await prisma.setting.findMany({
        orderBy: { key: "asc" },
      });

      return res.status(200).json({ settings });
    } else if (req.method === "PUT") {
      // Update settings
      const { key, value } = req.body;

      if (!key) {
        return res.status(400).json({ error: "Setting key is required" });
      }

      // Validate value is valid JSON
      let jsonValue;
      try {
        jsonValue = typeof value === "string" ? JSON.parse(value) : value;
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON value" });
      }

      // Upsert setting
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      });

      return res.status(200).json({ setting });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in admin/settings:", error);
    return res.status(500).json({
      error: "Failed to process settings",
      message: error.message,
    });
  }
}

