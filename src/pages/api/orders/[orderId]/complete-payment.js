import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";
import { processCardPayment, validatePaymentData } from "@/lib/payment";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract and verify token (optional - can be called by customer or admin)
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
    const { paymentMethod, paymentData } = req.body;

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
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify customer owns the order (if authenticated)
    if (customerId && order.customerId !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if already paid
    if (order.paid) {
      return res.status(400).json({
        error: "Order is already paid",
        paidAt: order.paidAt,
      });
    }

    // Validate payment method
    const method = paymentMethod || order.paymentMethod || "CASH";
    if (!["CASH", "CARD"].includes(method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    let paymentResult = null;

    // Process payment based on method
    if (method === "CARD") {
      // Validate payment data for card payments
      if (!paymentData) {
        return res.status(400).json({
          error: "Payment data is required for card payments",
        });
      }

      const validation = validatePaymentData(paymentData);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid payment data",
          details: validation.errors,
        });
      }

      // Process card payment
      try {
        paymentResult = await processCardPayment({
          ...paymentData,
          amount: order.fare || 0,
          currency: "USD", // TODO: Make configurable
        });

        if (!paymentResult.success) {
          return res.status(402).json({
            error: "Payment failed",
            details: paymentResult.message || "Payment could not be processed",
          });
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        return res.status(500).json({
          error: "Payment processing failed",
          message: error.message,
        });
      }
    } else {
      // CASH payment - no processing needed, just mark as paid
      paymentResult = {
        success: true,
        transactionId: `cash_${Date.now()}`,
        amount: order.fare || 0,
        currency: "USD",
        status: "completed",
        message: "Cash payment recorded",
      };
    }

    // Update order with payment information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paid: true,
        paidAt: new Date(),
        paymentMethod: method,
        // Store transaction ID in notes if needed
        notes: order.notes
          ? `${order.notes} | Payment: ${paymentResult.transactionId}`
          : `Payment: ${paymentResult.transactionId}`,
      },
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
          },
        },
      },
    });

    // Emit real-time event to customer (if socket.io is available)
    try {
      const { emitToCustomer } = await import("@/pages/api/socket");
      emitToCustomer(order.customerId, "order:payment", {
        orderId: updatedOrder.id,
        paid: true,
        paidAt: updatedOrder.paidAt,
        paymentMethod: updatedOrder.paymentMethod,
      });
    } catch (error) {
      // Socket.io not available, continue without real-time update
      console.log("Socket.io not available for payment notification");
    }

    return res.status(200).json({
      success: true,
      order: {
        id: updatedOrder.id,
        paid: updatedOrder.paid,
        paidAt: updatedOrder.paidAt,
        paymentMethod: updatedOrder.paymentMethod,
        fare: updatedOrder.fare,
      },
      payment: {
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        status: paymentResult.status,
      },
    });
  } catch (error) {
    console.error("Error in orders/complete-payment:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(500).json({
      error: "Failed to complete payment",
      message: error.message,
    });
  }
}

