import { prisma } from "@/lib/prisma";
import haversineDistance from "haversine-distance";
import { sendToCourier } from "./notifications";

// Socket.io helpers (will be initialized by API route)
function getSocketIO() {
  return typeof global !== "undefined" && global.io ? global.io : null;
}

function emitToCourier(courierId, event, data) {
  const io = getSocketIO();
  if (io) {
    io.to(`courier:${courierId}`).emit(event, data);
    console.log(`📤 Socket: Emitted ${event} to courier:${courierId}`);
  } else {
    console.warn("Socket.io not initialized, skipping real-time notification");
  }
}

// Dispatch configuration
const DISPATCH_CONFIG = {
  dispatch_radius: 10, // km - initial search radius
  max_offers_per_dispatch: 3, // N - number of couriers to offer to
  offer_timeout_seconds: 45, // seconds - offer expiration time
  max_retry_radius: 50, // km - maximum search radius
  radius_expansion: 5, // km - how much to expand radius on retry
};

/**
 * Dispatch an order to nearby couriers
 * @param {string} orderId - Order ID
 * @param {Object} options - Dispatch options
 * @param {number} options.radius - Search radius in km (default: dispatch_radius)
 * @returns {Promise<Object>} Dispatch result
 */
export async function dispatchOrder(orderId, options = {}) {
  const radius = options.radius || DISPATCH_CONFIG.dispatch_radius;

  try {
    // Get order details
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
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== "PENDING" && order.status !== "DISPATCHING") {
      throw new Error(`Order ${orderId} is not in dispatchable state`);
    }

    // Update order status to DISPATCHING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DISPATCHING" },
    });

    // Find active couriers within radius
    const activeCouriers = await prisma.courier.findMany({
      where: {
        active: true,
        locationLat: { not: null },
        locationLng: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Calculate distance and ETA for each courier
    const couriersWithDistance = activeCouriers
      .map((courier) => {
        const distance = haversineDistance(
          { lat: order.originLat, lng: order.originLng },
          { lat: courier.locationLat, lng: courier.locationLng }
        ) / 1000; // Convert to km

        // Approximate ETA based on vehicle speed
        const vehicleSpeeds = {
          WALKING: 5,
          SCOOTER: 20,
          BICYCLE: 15,
          MOTORCYCLE: 50,
          CAR: 45,
        };
        const speed = vehicleSpeeds[courier.vehicleType] || 30;
        const etaMinutes = (distance / speed) * 60;

        return {
          courier,
          distance,
          etaMinutes,
        };
      })
      .filter((c) => c.distance <= radius) // Filter by radius
      .sort((a, b) => a.etaMinutes - b.etaMinutes); // Sort by ETA

    // Select top N couriers
    const topCouriers = couriersWithDistance.slice(0, DISPATCH_CONFIG.max_offers_per_dispatch);

    if (topCouriers.length === 0) {
      // No couriers found - escalate
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "ESCALATE" },
      });
      return {
        success: false,
        message: "No couriers available within radius",
        offersCreated: 0,
        escalated: true,
      };
    }

    // Create offers for each courier
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + DISPATCH_CONFIG.offer_timeout_seconds);

    const offers = [];
    for (const { courier } of topCouriers) {
      try {
        const offer = await prisma.orderOffer.create({
          data: {
            orderId: orderId,
            courierId: courier.id,
            status: "OFFERED",
            expiresAt: expiresAt,
          },
        });

        offers.push(offer);

        // Send notification to courier (stub)
        await sendToCourier(courier.id, {
          type: "order_offer",
          data: {
            orderId: order.id,
            offerId: offer.id,
            fare: order.fare,
            distance: order.distanceKm,
            origin: {
              lat: order.originLat,
              lng: order.originLng,
            },
            destination: {
              lat: order.destLat,
              lng: order.destLng,
            },
            expiresAt: expiresAt.toISOString(),
            customer: order.customer,
          },
        });

        // Emit real-time event via Socket.io
        emitToCourier(courier.id, "offer", {
          orderId: order.id,
          offerId: offer.id,
          fare: order.fare,
          distance: order.distanceKm,
          origin: {
            lat: order.originLat,
            lng: order.originLng,
          },
          destination: {
            lat: order.destLat,
            lng: order.destLng,
          },
          expiresAt: expiresAt.toISOString(),
          customer: order.customer,
        });
      } catch (error) {
        console.error(`Error creating offer for courier ${courier.id}:`, error);
      }
    }

    return {
      success: true,
      offersCreated: offers.length,
      offers: offers.map((o) => o.id),
      escalated: false,
    };
  } catch (error) {
    console.error("Error in dispatchOrder:", error);
    throw error;
  }
}

/**
 * Handle expired offers and retry dispatch if needed
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Result
 */
export async function handleExpiredOffers(orderId) {
  const now = new Date();

  // Get all expired offers for this order
  const expiredOffers = await prisma.orderOffer.findMany({
    where: {
      orderId: orderId,
      status: "OFFERED",
      expiresAt: { lt: now },
    },
  });

  if (expiredOffers.length === 0) {
    return { expiredCount: 0, retried: false };
  }

  // Mark offers as expired
  await prisma.orderOffer.updateMany({
    where: {
      orderId: orderId,
      status: "OFFERED",
      expiresAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  // Check if order still needs dispatch
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      offers: true,
    },
  });

  if (!order || order.status !== "DISPATCHING") {
    return { expiredCount: expiredOffers.length, retried: false };
  }

  // Check if all offers are expired/rejected
  const activeOffers = order.offers.filter(
    (o) => o.status === "OFFERED" || o.status === "ACCEPTED"
  );

  if (activeOffers.length === 0) {
    // All offers expired - retry with expanded radius
    const currentRadius = DISPATCH_CONFIG.dispatch_radius;
    const newRadius = currentRadius + DISPATCH_CONFIG.radius_expansion;

    if (newRadius <= DISPATCH_CONFIG.max_retry_radius) {
      // Retry dispatch with expanded radius
      return await dispatchOrder(orderId, { radius: newRadius });
    } else {
      // Max radius reached - escalate
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "ESCALATE" },
      });
      return {
        expiredCount: expiredOffers.length,
        retried: false,
        escalated: true,
      };
    }
  }

  return { expiredCount: expiredOffers.length, retried: false };
}

/**
 * Cancel all offers for an order (when one is accepted)
 * @param {string} orderId - Order ID
 * @param {string} acceptedOfferId - ID of the accepted offer
 */
export async function cancelOtherOffers(orderId, acceptedOfferId) {
  await prisma.orderOffer.updateMany({
    where: {
      orderId: orderId,
      id: { not: acceptedOfferId },
      status: "OFFERED",
    },
    data: {
      status: "CANCELLED",
    },
  });
}

