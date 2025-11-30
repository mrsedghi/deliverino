import { estimateRoute } from "@/lib/routing";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { origin, dest, vehicleType } = req.body;

    // Validate input
    if (!origin || typeof origin.lat !== "number" || typeof origin.lng !== "number") {
      return res.status(400).json({ error: "Invalid origin coordinates" });
    }

    if (!dest || typeof dest.lat !== "number" || typeof dest.lng !== "number") {
      return res.status(400).json({ error: "Invalid destination coordinates" });
    }

    // Estimate route
    const result = await estimateRoute(origin, dest, vehicleType || "car");

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in route estimate:", error);
    return res.status(500).json({ 
      error: "Failed to estimate route",
      message: error.message 
    });
  }
}

