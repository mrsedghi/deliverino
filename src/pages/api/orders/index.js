import { prisma } from "@/lib/prisma";
import { dispatchOrder } from "@/lib/dispatch";
import { authenticateRequest } from "@/lib/auth-middleware";
import "@/lib/dispatch-job"; // Start background job

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user and get customerId from token
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(authError.status).json({ error: authError.message });
    }

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only CUSTOMER role can create orders
    if (user.role !== "CUSTOMER") {
      return res.status(403).json({ 
        error: "Only customers can create orders" 
      });
    }

    const { origin, dest, mode, notes, weight } = req.body;
    const customerId = user.id; // Get from authenticated user

    // Validate required fields
    if (!origin || typeof origin.lat !== "number" || typeof origin.lng !== "number") {
      return res.status(400).json({ error: "Invalid origin coordinates" });
    }

    if (!dest || typeof dest.lat !== "number" || typeof dest.lng !== "number") {
      return res.status(400).json({ error: "Invalid destination coordinates" });
    }

    // Validate mode - using vehicle types as mode for now
    // Note: Schema has DeliveryMode enum (STANDARD, EXPRESS, SCHEDULED) but we're using vehicle types
    // This should be updated in schema to match, or we map vehicle types to delivery modes
    const validModes = ["WALKING", "SCOOTER", "BICYCLE", "MOTORCYCLE", "CAR"];
    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({ error: "Invalid delivery mode" });
    }
    
    // Map vehicle type to delivery mode (using STANDARD as default for now)
    // TODO: Update schema to support vehicle types directly or add vehicleType field
    const deliveryMode = "STANDARD";

    // Get route estimate for distance and duration
    const { estimateRoute } = await import("@/lib/routing");
    const routeEstimate = await estimateRoute(origin, dest, "car");
    const { distance_km, duration_min } = routeEstimate;

    // Calculate fare
    const { calcFare, getDefaultFareConfig } = await import("@/lib/fare");
    const fareConfig = getDefaultFareConfig();
    
    // Get mode speed for duration calculation
    const MODE_SPEEDS = {
      WALKING: 5,
      SCOOTER: 20,
      BICYCLE: 15,
      MOTORCYCLE: 50,
      CAR: 45,
    };
    const speedKmh = MODE_SPEEDS[mode] || 45;
    const estimatedDuration = (distance_km / speedKmh) * 60;
    const fare = calcFare(distance_km, estimatedDuration, mode, fareConfig);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        customerId: customerId, // From authenticated user
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
        distanceKm: distance_km,
        durationMin: Math.round(estimatedDuration),
        mode: deliveryMode, // Using STANDARD for now, vehicle type stored in notes
        fare: fare,
        status: "PENDING",
        notes: notes ? `${notes} | Vehicle: ${mode}` : `Vehicle: ${mode}`, // Store vehicle type in notes
        weightKg: weight || null,
      },
      select: {
        id: true,
        status: true,
        fare: true,
        mode: true,
        createdAt: true,
      },
    });

    // Dispatch order to nearby couriers (async, don't wait)
    dispatchOrder(order.id).catch((error) => {
      console.error("Error dispatching order:", error);
    });

    return res.status(201).json({
      order: {
        id: order.id,
        status: order.status,
        fare: order.fare,
        mode: order.mode,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      error: "Failed to create order",
      message: error.message,
    });
  }
}

