import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";
import { cancelOtherOffers } from "@/lib/dispatch";

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

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get courier
    const courier = await prisma.courier.findUnique({
      where: { userId: decoded.userId },
    });

    if (!courier || !courier.active) {
      return res.status(403).json({ error: "Courier must be online to accept orders" });
    }

    // Check if there's a valid offer for this courier
    const now = new Date();
    const offer = await prisma.orderOffer.findFirst({
      where: {
        orderId: orderId,
        courierId: courier.id,
        status: "OFFERED",
        expiresAt: { gt: now },
      },
    });

    if (!offer) {
      return res.status(400).json({
        error: "No valid offer found. Offer may have expired or been cancelled.",
      });
    }

    // Update offer status
    await prisma.orderOffer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED" },
    });

    // Cancel other offers
    await cancelOtherOffers(orderId, offer.id);

    // Update order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierId: courier.id,
        status: "ACCEPTED",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return res.status(200).json({
      order: {
        id: order.id,
        status: order.status,
        courierId: order.courierId,
        fare: order.fare,
      },
    });
  } catch (error) {
    console.error("Error in courier/accept-order:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(500).json({
      error: "Failed to accept order",
      message: error.message,
    });
  }
}

