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

    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get courier
    const courier = await prisma.courier.findUnique({
      where: { userId: decoded.userId },
    });

    if (!courier) {
      return res.status(404).json({ error: "Courier not found" });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        courier: {
          select: {
            id: true,
            vehicleType: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify courier is assigned to this order (or has an offer)
    const hasOffer = await prisma.orderOffer.findFirst({
      where: {
        orderId: orderId,
        courierId: courier.id,
        status: { in: ["OFFERED", "ACCEPTED"] },
      },
    });

    if (order.courierId !== courier.id && !hasOffer) {
      return res.status(403).json({ error: "You are not assigned to this order" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error in courier/orders/get:", error);
    return res.status(500).json({
      error: "Failed to get order",
      message: error.message,
    });
  }
}

