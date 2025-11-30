import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
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

    // Get user and verify admin role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get statistics
    const [ordersCount, activeCouriersCount, revenueData] = await Promise.all([
      // Total orders count
      prisma.order.count(),

      // Active couriers count
      prisma.courier.count({
        where: { active: true },
      }),

      // Revenue (sum of fares where paid = true)
      prisma.order.aggregate({
        where: { paid: true },
        _sum: {
          fare: true,
        },
      }),
    ]);

    const revenue = revenueData._sum.fare || 0;

    return res.status(200).json({
      stats: {
        ordersCount,
        activeCouriersCount,
        revenue: revenue.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error in admin/stats:", error);
    return res.status(500).json({
      error: "Failed to fetch statistics",
      message: error.message,
    });
  }
}

