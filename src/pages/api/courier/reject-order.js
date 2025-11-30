import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";
import { handleExpiredOffers } from "@/lib/dispatch";

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

    if (!courier) {
      return res.status(404).json({ error: "Courier not found" });
    }

    // Mark offer as rejected
    await prisma.orderOffer.updateMany({
      where: {
        orderId: orderId,
        courierId: courier.id,
        status: "OFFERED",
      },
      data: {
        status: "REJECTED",
      },
    });

    // Check if we need to retry dispatch
    await handleExpiredOffers(orderId);

    return res.status(200).json({
      message: "Order rejected",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error in courier/reject-order:", error);
    return res.status(500).json({
      error: "Failed to reject order",
      message: error.message,
    });
  }
}
