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

    // Get user orders
    const orders = await prisma.order.findMany({
      where: {
        customerId: decoded.userId,
      },
      include: {
        courier: {
          select: {
            id: true,
            vehicleType: true,
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 orders
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error in /api/orders/my-orders:", error);
    return res.status(500).json({
      error: "Failed to get orders",
      message: error.message,
    });
  }
}

