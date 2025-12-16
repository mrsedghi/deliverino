import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract and verify token (optional for customer)
    const authHeader = req.headers.authorization;
    let customerId = null;

    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.userId) {
          customerId = decoded.userId;
        }
      }
    }

    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
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
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If authenticated, verify customer owns the order
    if (customerId && order.customerId !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error in orders/status:", error);
    return res.status(500).json({
      error: "Failed to get order status",
      message: error.message,
    });
  }
}

