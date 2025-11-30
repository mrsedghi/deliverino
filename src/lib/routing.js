import haversineDistance from "haversine-distance";

// Default speeds for different vehicle types (km/h)
const DEFAULT_SPEEDS = {
  car: 45,
  motorcycle: 50,
  bicycle: 15,
  scooter: 20,
  walking: 5,
};

/**
 * Estimate route using OSRM or fallback to Haversine
 * @param {Object} origin - Origin coordinates { lat, lng }
 * @param {Object} dest - Destination coordinates { lat, lng }
 * @param {string} vehicleType - Vehicle type (default: 'car')
 * @returns {Promise<Object>} Route estimation result
 */
export async function estimateRoute(origin, dest, vehicleType = "car") {
  const osrmUrl = process.env.NEXT_PUBLIC_OSRM_BASE_URL;

  // Try OSRM first if URL is configured
  if (osrmUrl) {
    try {
      const result = await estimateWithOSRM(origin, dest, osrmUrl);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn("OSRM request failed, falling back to Haversine:", error.message);
    }
  }

  // Fallback to Haversine calculation
  return estimateWithHaversine(origin, dest, vehicleType);
}

/**
 * Estimate route using OSRM service
 * @param {Object} origin - Origin coordinates { lat, lng }
 * @param {Object} dest - Destination coordinates { lat, lng }
 * @param {string} osrmUrl - OSRM base URL
 * @returns {Promise<Object|null>} Route result or null if failed
 */
async function estimateWithOSRM(origin, dest, osrmUrl) {
  // OSRM expects coordinates in format: {lng},{lat};{lng},{lat}
  // Remove trailing slash from URL if present
  const baseUrl = osrmUrl.replace(/\/$/, "");
  const coordinates = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const url = `${baseUrl}/route/v1/driving/${coordinates}?overview=false&geometries=polyline`;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Deliverino App",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("OSRM returned no route");
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // Convert meters to km
    const durationMin = Math.round(route.duration / 60); // Convert seconds to minutes

    return {
      distance_km: parseFloat(distanceKm.toFixed(2)),
      duration_min: durationMin,
      polyline: route.geometry || null,
      steps: route.legs?.[0]?.steps || [],
      method: "osrm",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("OSRM request timeout");
    }
    throw error;
  }
}

/**
 * Estimate route using Haversine distance and default speed
 * @param {Object} origin - Origin coordinates { lat, lng }
 * @param {Object} dest - Destination coordinates { lat, lng }
 * @param {string} vehicleType - Vehicle type
 * @returns {Object} Route estimation result
 */
function estimateWithHaversine(origin, dest, vehicleType) {
  // Calculate Haversine distance in meters
  const distanceMeters = haversineDistance(origin, dest);
  const distanceKm = distanceMeters / 1000;

  // Get default speed for vehicle type
  const speedKmh = DEFAULT_SPEEDS[vehicleType] || DEFAULT_SPEEDS.car;

  // Calculate estimated duration
  // duration (hours) = distance (km) / speed (km/h)
  // duration (minutes) = (distance / speed) * 60
  const durationHours = distanceKm / speedKmh;
  const durationMin = Math.round(durationHours * 60);

  return {
    distance_km: parseFloat(distanceKm.toFixed(2)),
    duration_min: durationMin,
    polyline: null,
    steps: [],
    method: "haversine",
  };
}

