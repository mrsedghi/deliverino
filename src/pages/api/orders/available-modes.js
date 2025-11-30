import { estimateRoute } from "@/lib/routing";
import { calcFare, getDefaultFareConfig } from "@/lib/fare";
import { prisma } from "@/lib/prisma";

// Default values (fallback if settings not in DB)
const DEFAULT_MODE_SPEEDS = {
  WALKING: 5,
  SCOOTER: 20,
  BICYCLE: 15,
  MOTORCYCLE: 50,
  CAR: 45,
};

const DEFAULT_MAX_DISTANCE_BY_MODE = {
  WALKING: 3,
  SCOOTER: 10,
  BICYCLE: 15,
  MOTORCYCLE: 50,
  CAR: 100,
};

const DEFAULT_MAX_DURATION_BY_MODE = {
  WALKING: 60,
  SCOOTER: 45,
  BICYCLE: 90,
  MOTORCYCLE: 120,
  CAR: 180,
};

// Get default settings (fallback)
function getDefaultSettings() {
  return {
    modeSpeeds: DEFAULT_MODE_SPEEDS,
    maxDistanceByMode: DEFAULT_MAX_DISTANCE_BY_MODE,
    maxDurationByMode: DEFAULT_MAX_DURATION_BY_MODE,
    minFareByMode: {},
    fareBase: 5,
    farePerKm: 1.5,
    farePerMinute: 0.1,
  };
}

// Load settings from database
async function loadSettings() {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.setting === 'undefined') {
      console.warn("Prisma client not initialized, using defaults");
      return getDefaultSettings();
    }

    // Note: In Prisma 7, connections are managed automatically
    // We don't need to explicitly call $connect() for queries

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "mode_speed_kmph",
            "max_distance_by_mode",
            "max_duration_by_mode",
            "min_fare_by_mode",
            "fare_base",
            "fare_per_km",
            "fare_per_minute",
          ],
        },
      },
    });

    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      modeSpeeds: settingsMap.mode_speed_kmph || DEFAULT_MODE_SPEEDS,
      maxDistanceByMode: settingsMap.max_distance_by_mode || DEFAULT_MAX_DISTANCE_BY_MODE,
      maxDurationByMode: settingsMap.max_duration_by_mode || DEFAULT_MAX_DURATION_BY_MODE,
      minFareByMode: settingsMap.min_fare_by_mode || {},
      fareBase: settingsMap.fare_base || 5,
      farePerKm: settingsMap.fare_per_km || 1.5,
      farePerMinute: settingsMap.fare_per_minute || 0.1,
    };
  } catch (error) {
    console.error("Error loading settings, using defaults:", error);
    return getDefaultSettings();
  }
}

// Mode order (priority)
const MODE_ORDER = ["WALKING", "SCOOTER", "BICYCLE", "MOTORCYCLE", "CAR"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { origin, dest } = req.body;

    // Validate input
    if (!origin || typeof origin.lat !== "number" || typeof origin.lng !== "number") {
      return res.status(400).json({ error: "Invalid origin coordinates" });
    }

    if (!dest || typeof dest.lat !== "number" || typeof dest.lng !== "number") {
      return res.status(400).json({ error: "Invalid destination coordinates" });
    }

    // Get route estimate
    const routeEstimate = await estimateRoute(origin, dest, "car");
    const { distance_km, duration_min } = routeEstimate;

    // Load settings from database (with fallback to defaults)
    let settings;
    try {
      settings = await loadSettings();
    } catch (error) {
      console.error("Failed to load settings, using defaults:", error);
      settings = getDefaultSettings();
    }

    // Build fare config from settings
    const fareConfig = {
      base: settings.fareBase,
      perKm: settings.farePerKm,
      perMinute: settings.farePerMinute,
    };

    // Process each mode
    const modes = MODE_ORDER.map((mode) => {
      const speedKmh = settings.modeSpeeds[mode] || DEFAULT_MODE_SPEEDS[mode];
      const maxDistance = settings.maxDistanceByMode[mode] || DEFAULT_MAX_DISTANCE_BY_MODE[mode];
      const maxDuration = settings.maxDurationByMode[mode] || DEFAULT_MAX_DURATION_BY_MODE[mode];
      const minFare = settings.minFareByMode[mode] || 0;

      // Calculate estimated duration for this mode
      const estimatedDuration = (distance_km / speedKmh) * 60; // minutes

      // Calculate fare using settings
      // Formula: base + (distance_km * per_km) + (duration_min * per_minute)
      const fare = Math.max(
        minFare,
        settings.fareBase + distance_km * settings.farePerKm + estimatedDuration * settings.farePerMinute
      );

      // Check if mode should be disabled
      let enabled = true;
      let reason = null;

      if (distance_km > maxDistance) {
        enabled = false;
        reason = `Distance exceeds maximum (${maxDistance} km)`;
      } else if (estimatedDuration > maxDuration) {
        enabled = false;
        reason = `Duration exceeds maximum (${maxDuration} min)`;
      } else if (fare < minFare) {
        enabled = false;
        reason = `Fare below minimum (${minFare})`;
      }

      return {
        mode,
        enabled,
        fare: enabled ? fare : null,
        estimatedDuration: Math.round(estimatedDuration),
        reason: enabled ? null : reason,
      };
    });

    // Find suggested mode (first enabled mode, or cheapest enabled mode)
    const enabledModes = modes.filter((m) => m.enabled);
    let suggestedMode = null;

    if (enabledModes.length > 0) {
      // Suggest the cheapest enabled mode
      suggestedMode = enabledModes.reduce((cheapest, current) => {
        if (!cheapest || current.fare < cheapest.fare) {
          return current;
        }
        return cheapest;
      }, null)?.mode;
    }

    return res.status(200).json({
      distance_km,
      duration_min,
      modes,
      suggestedMode,
    });
  } catch (error) {
    console.error("Error in available-modes:", error);
    return res.status(500).json({
      error: "Failed to get available modes",
      message: error.message,
    });
  }
}

