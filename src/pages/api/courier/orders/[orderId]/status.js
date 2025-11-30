import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

// Socket.io helper
function getSocketIO() {
  return typeof global !== "undefined" && global.io ? global.io : null;
}

function emitToCustomer(customerId, event, data) {
  const io = getSocketIO();
  if (io) {
    io.to(`customer:${customerId}`).emit(event, data);
    console.log(`📤 Socket: Emitted ${event} to customer:${customerId}`);
  } else {
    console.warn("Socket.io not initialized, skipping real-time notification");
  }
}

// Valid status transitions
const STATUS_TRANSITIONS = {
  ACCEPTED: ["IN_PROGRESS"], // ENROUTE_TO_PICKUP
  IN_PROGRESS: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"], // ENROUTE_TO_DELIVERY
  IN_TRANSIT: ["DELIVERED"],
};

// Map frontend status names to database statuses
const STATUS_MAP = {
  ENROUTE_TO_PICKUP: "IN_PROGRESS",
  PICKED_UP: "PICKED_UP",
  ENROUTE_TO_DELIVERY: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
};

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

    const { orderId } = req.query;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Map frontend status to database status
    const dbStatus = STATUS_MAP[status] || status;

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
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify courier is assigned to this order
    if (order.courierId !== courier.id) {
      return res.status(403).json({ error: "You are not assigned to this order" });
    }

    // Validate status transition
    const currentStatus = order.status;
    const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(dbStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from ${currentStatus} to ${dbStatus}`,
        allowedTransitions: allowedNextStatuses || [],
      });
    }

    // Prepare update data
    const updateData = {
      status: dbStatus,
    };

    // If delivered, set deliveredAt timestamp (we'll add this field if needed)
    // For now, we'll use updatedAt which is automatically updated

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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

    // Emit real-time event to customer
    emitToCustomer(updatedOrder.customerId, "order:update", {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    });

    return res.status(200).json({
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        courierId: updatedOrder.courierId,
        fare: updatedOrder.fare,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in courier/orders/status:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(500).json({
      error: "Failed to update order status",
      message: error.message,
    });
  }
}

