/**
 * Fare calculation for delivery orders
 * Formula: base_fare + (distance_km * distance_rate) + (duration_min * duration_rate)
 */

// Default fare configuration (can be overridden by settings)
const DEFAULT_FARE_CONFIG = {
  WALKING: {
    base: 5,
    distanceRate: 2, // per km
    durationRate: 0.1, // per minute
    minFare: 5,
  },
  SCOOTER: {
    base: 8,
    distanceRate: 1.5,
    durationRate: 0.15,
    minFare: 8,
  },
  BICYCLE: {
    base: 6,
    distanceRate: 1.2,
    durationRate: 0.12,
    minFare: 6,
  },
  MOTORCYCLE: {
    base: 10,
    distanceRate: 1.0,
    durationRate: 0.2,
    minFare: 10,
  },
  CAR: {
    base: 15,
    distanceRate: 0.8,
    durationRate: 0.25,
    minFare: 15,
  },
};

/**
 * Calculate fare for a delivery order
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} durationMin - Estimated duration in minutes
 * @param {string} mode - Delivery mode (WALKING, SCOOTER, BICYCLE, MOTORCYCLE, CAR)
 * @param {Object} config - Optional fare configuration (defaults to DEFAULT_FARE_CONFIG)
 * @returns {number} Calculated fare
 */
export function calcFare(distanceKm, durationMin, mode, config = DEFAULT_FARE_CONFIG) {
  const modeConfig = config[mode] || config.CAR;

  if (!modeConfig) {
    throw new Error(`Invalid delivery mode: ${mode}`);
  }

  const { base, distanceRate, durationRate } = modeConfig;

  // Formula: base_fare + (distance_km * distance_rate) + (duration_min * duration_rate)
  const fare = base + distanceKm * distanceRate + durationMin * durationRate;

  // Round to 2 decimal places
  return Math.round(fare * 100) / 100;
}

/**
 * Get fare configuration for a mode
 * @param {string} mode - Delivery mode
 * @param {Object} config - Optional fare configuration
 * @returns {Object} Fare configuration for the mode
 */
export function getFareConfig(mode, config = DEFAULT_FARE_CONFIG) {
  return config[mode] || config.CAR;
}

/**
 * Get default fare configuration
 * @returns {Object} Default fare configuration
 */
export function getDefaultFareConfig() {
  return DEFAULT_FARE_CONFIG;
}

