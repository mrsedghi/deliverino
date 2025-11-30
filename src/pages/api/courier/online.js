import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";

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

    const { lat, lng, vehicleType } = req.body;

    // Validate input
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    if (!vehicleType || !["WALKING", "SCOOTER", "BICYCLE", "MOTORCYCLE", "CAR"].includes(vehicleType)) {
      return res.status(400).json({ error: "Invalid vehicle type" });
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update or create courier profile
    const courier = await prisma.courier.upsert({
      where: { userId: decoded.userId },
      update: {
        active: true,
        locationLat: lat,
        locationLng: lng,
        vehicleType: vehicleType,
      },
      create: {
        userId: decoded.userId,
        active: true,
        locationLat: lat,
        locationLng: lng,
        vehicleType: vehicleType,
        rating: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      courier: {
        id: courier.id,
        active: courier.active,
        locationLat: courier.locationLat,
        locationLng: courier.locationLng,
        vehicleType: courier.vehicleType,
        rating: courier.rating,
      },
    });
  } catch (error) {
    console.error("Error in courier/online:", error);
    return res.status(500).json({
      error: "Failed to set courier online",
      message: error.message,
    });
  }
}

