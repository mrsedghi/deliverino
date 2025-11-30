"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import haversineDistance from "haversine-distance";
import "../../lib/leafletFix";

// Fixed center pin component
function FixedCenterPin({ onCenterChange }) {
  const map = useMap();
  const [currentCenter, setCurrentCenter] = useState(() => {
    const center = map.getCenter();
    return [center.lat, center.lng];
  });

  useMapEvents({
    move: () => {
      const center = map.getCenter();
      const newCenter = [center.lat, center.lng];
      setCurrentCenter(newCenter);
      onCenterChange(newCenter);
    },
  });

  return (
    <div
      className="fixed-center-pin"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -100%)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z"
          fill="#3B82F6"
        />
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
      <div
        className="bg-white px-3 py-1 rounded shadow-lg text-xs font-mono whitespace-nowrap mt-1"
        style={{
          transform: "translateX(-50%)",
          marginLeft: "50%",
        }}
      >
        {currentCenter[0].toFixed(6)}, {currentCenter[1].toFixed(6)}
      </div>
    </div>
  );
}

// Map wrapper component with center update
function MapWrapper({ center, setCenter }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  const handleCenterChange = useCallback((newCenter) => {
    setCenter(newCenter);
  }, [setCenter]);

  return <FixedCenterPin onCenterChange={handleCenterChange} />;
}

// Map container wrapper
function MapContainerWrapper({ center, setCenter }) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        attribution="&copy; OpenStreetMap contributors"
      />
      <MapWrapper center={center} setCenter={setCenter} />
    </MapContainer>
  );
}

// Main component
export default function MapWithSearch() {
  const [mapCenter, setMapCenter] = useState([35.6892, 51.3890]); // Tehran default
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [step, setStep] = useState("origin"); // "origin" or "destination"
  const [routeEstimate, setRouteEstimate] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Search Nominatim
  const searchNominatim = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            "User-Agent": "Deliverino App",
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error searching Nominatim:", error);
      setSuggestions([]);
    }
  }, []);

  // Handle search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchNominatim(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchNominatim]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setMapCenter([lat, lng]);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  // Handle set origin/destination
  const handleSetLocation = () => {
    if (step === "origin") {
      setOrigin({ lat: mapCenter[0], lng: mapCenter[1] });
      setStep("destination");
      setSearchQuery("");
      setShowSuggestions(false);
    } else {
      setDestination({ lat: mapCenter[0], lng: mapCenter[1] });
    }
  };

  // Calculate distance (Haversine fallback for display)
  const calculateDistance = () => {
    if (!origin || !destination) return null;
    return haversineDistance(origin, destination) / 1000; // Convert to km
  };

  const distance = calculateDistance();

  // Handle route estimation
  const handleEstimate = async () => {
    if (!origin || !destination) return;

    setIsEstimating(true);
    setRouteEstimate(null);

    try {
      const response = await fetch("/api/route/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          dest: destination,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setRouteEstimate(data);
    } catch (error) {
      console.error("Error estimating route:", error);
      // Show error to user (you can add a toast/alert here)
      alert("Failed to estimate route. Please try again.");
    } finally {
      setIsEstimating(false);
    }
  };

  // Reset workflow
  const handleReset = () => {
    setOrigin(null);
    setDestination(null);
    setStep("origin");
    setSearchQuery("");
    setRouteEstimate(null);
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for an address..."
            className="w-full px-4 py-3 rounded-lg shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-[1001]">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm">{suggestion.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainerWrapper center={mapCenter} setCenter={setMapCenter} />
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Step: {step === "origin" ? "Set Origin" : "Set Destination"}
            </div>
            <button
              onClick={handleSetLocation}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {step === "origin" ? "Set Origin" : "Set Destination"}
            </button>
          </div>

          {/* Summary Card */}
          {(origin || destination) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">Summary</div>
              {origin && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Origin:</span> {origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}
                </div>
              )}
              {destination && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Destination:</span> {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                </div>
              )}
              {/* Show Haversine distance if no route estimate yet */}
              {!routeEstimate && distance !== null && (
                <div className="text-sm font-medium text-blue-600">
                  Distance (straight line): {distance.toFixed(2)} km
                </div>
              )}

              {/* Show route estimate results */}
              {routeEstimate && (
                <div className="space-y-1 pt-2 border-t border-gray-200">
                  <div className="text-sm font-medium text-green-600">
                    Route Distance: {routeEstimate.distance_km.toFixed(2)} km
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Estimated Duration: {routeEstimate.duration_min} minutes
                  </div>
                  <div className="text-xs text-gray-500">
                    Method: {routeEstimate.method === "osrm" ? "OSRM" : "Haversine (fallback)"}
                  </div>
                </div>
              )}

              {origin && destination && (
                <button
                  onClick={handleEstimate}
                  disabled={isEstimating}
                  className={`w-full mt-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                    isEstimating
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {isEstimating ? "Estimating..." : "Estimate"}
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

