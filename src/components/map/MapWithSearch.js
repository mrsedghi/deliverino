"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import haversineDistance from "haversine-distance";
import { fixLeafletIcons } from "../../lib/leafletFix";
import ModeCard from "../ModeCard";
import WaitingScreen from "../WaitingScreen";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Card,
  CardContent,
  Skeleton,
  Chip,
  IconButton,
} from "@mui/material";
import { Icon } from "@iconify/react";

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
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -100%)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <Icon icon="mdi:map-marker" width={32} height={40} color="#3B82F6" />
      <Paper
        elevation={3}
        sx={{
          px: 1.5,
          py: 0.5,
          mt: 0.5,
          transform: "translateX(-50%)",
          marginLeft: "50%",
          display: "inline-block",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" fontFamily="monospace" color="text.primary">
          {currentCenter[0].toFixed(6)}, {currentCenter[1].toFixed(6)}
        </Typography>
      </Paper>
    </Box>
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

// GPS Location Button Component (must be inside MapContainer)
function GPSLocationButton({ onLocationFound }) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
        if (onLocationFound) {
          onLocationFound([latitude, longitude]);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Failed to get your location. Please enable location permissions.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Box
      className="leaflet-top leaflet-right"
      sx={{ marginTop: "60px", marginRight: "10px", zIndex: 1000 }}
    >
      <Paper elevation={3} sx={{ p: 0.5 }}>
        <IconButton
          onClick={handleGetLocation}
          disabled={isLocating}
          size="small"
          sx={{ bgcolor: "background.paper" }}
          title="Go to my location"
        >
          {isLocating ? (
            <Icon icon="svg-spinners:3-dots-fade" width={24} height={24} />
          ) : (
            <Icon icon="mdi:crosshairs-gps" width={24} height={24} />
          )}
        </IconButton>
      </Paper>
    </Box>
  );
}

function MapContainerWrapper({ center, setCenter, onLocationFound }) {
  return (
    <MapContainer
      center={center || [35.6892, 51.3890]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapWrapper center={center} setCenter={setCenter} />
      <GPSLocationButton onLocationFound={onLocationFound} />
    </MapContainer>
  );
}

// Main component
export default function MapWithSearch() {
  // Fix Leaflet icons on client side only (in useEffect to avoid SSR issues)
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const [mapCenter, setMapCenter] = useState([35.6892, 51.3890]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [step, setStep] = useState("origin"); // "origin" or "destination"
  const [availableModes, setAvailableModes] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [isLoadingModes, setIsLoadingModes] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Search Nominatim
  const searchNominatim = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error searching Nominatim:", error);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery) {
        searchNominatim(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchNominatim]);

  // Handle setting location
  const handleSetLocation = () => {
    if (step === "origin") {
      setOrigin({ lat: mapCenter[0], lng: mapCenter[1] });
      setStep("destination");
    } else {
      setDestination({ lat: mapCenter[0], lng: mapCenter[1] });
      loadAvailableModes();
    }
  };

  // Load available modes
  const loadAvailableModes = async () => {
    if (!origin || !destination) return;

    setIsLoadingModes(true);
    try {
      const response = await fetch("/api/orders/available-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, dest: destination }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setAvailableModes(data);

      // Auto-select suggested mode if available
      if (data.suggestedMode) {
        const suggestedModeData = data.modes.find((m) => m.mode === data.suggestedMode && m.enabled);
        if (suggestedModeData) {
          setSelectedMode(data.suggestedMode);
        }
      }
    } catch (error) {
      console.error("Error loading available modes:", error);
      alert("Failed to load delivery modes. Please try again.");
    } finally {
      setIsLoadingModes(false);
    }
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!origin || !destination || !selectedMode) return;

    const selectedModeData = availableModes?.modes.find((m) => m.mode === selectedMode);
    if (!selectedModeData || !selectedModeData.enabled) {
      alert("Please select a valid delivery mode.");
      return;
    }

    setIsCreatingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          dest: destination,
          mode: selectedMode,
          notes: null,
          weight: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setCreatedOrder(data.order);
      
      // Redirect to order status page after showing success message
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = `/orders/${data.order.id}`;
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Reset workflow
  const handleReset = () => {
    setOrigin(null);
    setDestination(null);
    setStep("origin");
    setAvailableModes(null);
    setSelectedMode(null);
    setCreatedOrder(null);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setMapCenter([lat, lng]);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Search Bar */}
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          maxWidth: 500,
          zIndex: 2000,
          mr: "70px",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <TextField
            fullWidth
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            InputProps={{
              startAdornment: <Icon icon="mdi:magnify" width={20} style={{ marginRight: 8 }} />,
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                mt: 1,
                maxHeight: 240,
                overflow: "auto",
                zIndex: 1001,
                bgcolor: "background.paper",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom: index < suggestions.length - 1 ? 1 : 0,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" fontWeight="medium" color="text.primary">
                    {suggestion.display_name}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Map */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <MapContainerWrapper 
          center={mapCenter} 
          setCenter={setMapCenter}
          onLocationFound={(location) => {
            setMapCenter(location);
            if (step === "origin") {
              setOrigin({ lat: location[0], lng: location[1] });
            } else if (step === "destination") {
              setDestination({ lat: location[0], lng: location[1] });
            }
          }}
        />
      </Box>

      {/* Control Panel */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 500,
          zIndex: 1000,
          p: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium" gutterBottom color="text.primary">
              Step: {step === "origin" ? "Set Origin" : "Set Destination"}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSetLocation}
              startIcon={<Icon icon={step === "origin" ? "mdi:map-marker" : "mdi:map-marker-check"} />}
            >
              {step === "origin" ? "Set Origin" : "Set Destination"}
            </Button>
          </Box>

          {/* Summary Card */}
          {(origin || destination) && (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  {origin && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Origin
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" color="text.primary">
                        {origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}
                      </Typography>
                    </Box>
                  )}
                  {destination && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" color="text.primary">
                        {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                      </Typography>
                    </Box>
                  )}
                  {origin && destination && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Distance (Haversine)
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {(haversineDistance(origin, destination) / 1000).toFixed(2)} km
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Available Modes */}
          {isLoadingModes && (
            <Stack spacing={1}>
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="rectangular" height={100} />
            </Stack>
          )}

          {!isLoadingModes && availableModes && (
            <Box>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom color="text.primary">
                Available Delivery Modes
              </Typography>
              <Stack spacing={1}>
                {availableModes.modes.map((mode) => (
                  <ModeCard
                    key={mode.mode}
                    mode={mode.mode}
                    fare={mode.fare}
                    estimatedDuration={mode.estimatedDuration}
                    enabled={mode.enabled}
                    reason={mode.reason}
                    isSelected={selectedMode === mode.mode}
                    isSuggested={availableModes.suggestedMode === mode.mode}
                    onClick={() => mode.enabled && setSelectedMode(mode.mode)}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Create Order Button */}
          {selectedMode && availableModes && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
              startIcon={isCreatingOrder ? <Icon icon="svg-spinners:3-dots-fade" /> : <Icon icon="mdi:check-circle" />}
            >
              {isCreatingOrder ? "Creating Order..." : "Create Order"}
            </Button>
          )}

          {/* Reset Button */}
          {(origin || destination) && (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleReset}
              startIcon={<Icon icon="mdi:refresh" />}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Waiting Screen */}
      {createdOrder && (
        <WaitingScreen
          orderId={createdOrder.id}
          onClose={() => setCreatedOrder(null)}
        />
      )}
    </Box>
  );
}
