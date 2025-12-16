import { prisma } from "@/lib/prisma";
import haversineDistance from "haversine-distance";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lat, lng, radius_km } = req.query;

    // Validate input
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius_km || "5"); // Default 5km radius

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    if (isNaN(radiusNum) || radiusNum <= 0) {
      return res.status(400).json({ error: "Invalid radius" });
    }

    // Get all pending orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        originLat: true,
        originLng: true,
        destLat: true,
        destLng: true,
        distanceKm: true,
        durationMin: true,
        mode: true,
        fare: true,
        notes: true,
        weightKg: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Filter orders within radius using Haversine distance
    const nearbyOrders = pendingOrders
      .map((order) => {
        const distance = haversineDistance(
          { lat: latNum, lng: lngNum },
          { lat: order.originLat, lng: order.originLng }
        ) / 1000; // Convert to km

        return {
          ...order,
          distanceFromCourier: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((order) => order.distanceFromCourier <= radiusNum)
      .sort((a, b) => a.distanceFromCourier - b.distanceFromCourier); // Sort by distance

    return res.status(200).json({
      orders: nearbyOrders,
      count: nearbyOrders.length,
      radius_km: radiusNum,
    });
  } catch (error) {
    console.error("Error in courier/nearby-orders:", error);
    return res.status(500).json({
      error: "Failed to get nearby orders",
      message: error.message,
    });
  }
}

