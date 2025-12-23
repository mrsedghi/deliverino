"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import { Icon as LeafletIcon } from "leaflet";
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
  useMediaQuery,
  useTheme,
  Divider,
  LinearProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

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
      <Icon icon="mdi:map-marker" width={34} height={44} color="#3B82F6" />
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

  const handleCenterChange = useCallback(
    (newCenter) => {
      setCenter(newCenter);
    },
    [setCenter]
  );

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
        alert(
          "Failed to get your location. Please enable location permissions."
        );
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
      sx={{
        // Keep it below the profile card (which is top-right on the page)
        marginTop: { xs: "132px", sm: "96px" },
        marginRight: { xs: "20px", sm: "20px" },
        zIndex: 1500,
      }}
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

// Origin and Destination Markers Component
function LocationMarkers({ origin, destination }) {
  // Create custom icons for origin and destination
  const originIcon = new LeafletIcon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="#10b981">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `),
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });

  const destinationIcon = new LeafletIcon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="#ef4444">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `),
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });

  return (
    <>
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <strong>Origin</strong>
          </Popup>
        </Marker>
      )}
      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
        >
          <Popup>
            <strong>Destination</strong>
          </Popup>
        </Marker>
      )}
    </>
  );
}

function MapContainerWrapper({
  center,
  setCenter,
  onLocationFound,
  origin,
  destination,
}) {
  return (
    <MapContainer
      center={center || [35.6892, 51.389]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapWrapper center={center} setCenter={setCenter} />
      <GPSLocationButton onLocationFound={onLocationFound} />
      <LocationMarkers origin={origin} destination={destination} />
    </MapContainer>
  );
}

// Main component
export default function MapWithSearch() {
  // Fix Leaflet icons on client side only (in useEffect to avoid SSR issues)
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const [mapCenter, setMapCenter] = useState([35.6892, 51.389]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [step, setStep] = useState("origin"); // "origin" | "destination" | "modes"
  const [availableModes, setAvailableModes] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [isLoadingModes, setIsLoadingModes] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [modesError, setModesError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Lightweight step status for responsive “mini stepper”
  const stepOrder = ["origin", "destination", "modes"];
  const currentStepIndex = stepOrder.indexOf(step);
  const progressValue =
    ((currentStepIndex >= 0 ? currentStepIndex + 1 : 0) / stepOrder.length) *
    100;

  const stepStatus = {
    origin: step === "origin" ? "active" : origin ? "done" : "pending",
    destination:
      step === "destination"
        ? "active"
        : destination
        ? "done"
        : origin
        ? "pending"
        : "pending",
    modes: step === "modes" ? "active" : selectedMode ? "done" : "pending",
  };

  const stepMeta = [
    {
      key: "origin",
      label: "Set Origin",
      caption: "Center map & confirm",
      icon: "mdi:map-marker",
    },
    {
      key: "destination",
      label: "Confirm Destination",
      caption: "Move map to drop-off",
      icon: "mdi:map-marker-check",
    },
    {
      key: "modes",
      label: "Select Mode",
      caption: "Pick delivery option",
      icon: "mdi:truck-delivery-outline",
    },
  ];

  // Search Nominatim
  const searchNominatim = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5`
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

  const loadAvailableModes = async (
    originParam = origin,
    destinationParam = destination
  ) => {
    if (!originParam || !destinationParam) return;

    setIsLoadingModes(true);
    setModesError(null);
    try {
      const response = await fetch("/api/orders/available-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: originParam, dest: destinationParam }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setAvailableModes(data);

      // Auto-select suggested mode if available
      if (data.suggestedMode) {
        const suggestedModeData = data.modes.find(
          (m) => m.mode === data.suggestedMode && m.enabled
        );
        if (suggestedModeData) {
          setSelectedMode(data.suggestedMode);
        }
      }
    } catch (error) {
      console.error("Error loading available modes:", error);
      setModesError(
        error?.message || "Failed to load delivery modes. Please try again."
      );
      alert("Failed to load delivery modes. Please try again.");
    } finally {
      setIsLoadingModes(false);
    }
  };

  // Handle setting location (confirm steps)
  const handleSetLocation = () => {
    if (step === "origin") {
      const nextOrigin = { lat: mapCenter[0], lng: mapCenter[1] };
      setOrigin(nextOrigin);
      setDestination(null);
      setAvailableModes(null);
      setSelectedMode(null);
      setCreatedOrder(null);
      setModesError(null);
      setStep("destination");
      return;
    }

    if (step === "destination") {
      const nextDestination = { lat: mapCenter[0], lng: mapCenter[1] };
      setDestination(nextDestination);
      setAvailableModes(null);
      setSelectedMode(null);
      setCreatedOrder(null);
      setModesError(null);
      setStep("modes");
      loadAvailableModes(origin, nextDestination);
      return;
    }
  };

  const handleChangeDestination = () => {
    setDestination(null);
    setAvailableModes(null);
    setSelectedMode(null);
    setCreatedOrder(null);
    setModesError(null);
    setStep("destination");
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!origin || !destination || !selectedMode) return;

    const selectedModeData = availableModes?.modes.find(
      (m) => m.mode === selectedMode
    );
    if (!selectedModeData || !selectedModeData.enabled) {
      alert("Please select a valid delivery mode.");
      return;
    }

    // Get auth token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!token) {
      alert("Please login first to create an order.");
      return;
    }

    setIsCreatingOrder(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          origin,
          dest: destination,
          mode: selectedMode,
          notes: null,
          weight: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      setCreatedOrder(data.order);

      // Redirect to order status page after showing success message
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = `/orders/${data.order.id}`;
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);
      alert(error.message || "Failed to create order. Please try again.");
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
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Search Bar */}
      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 16 },
          left: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 360 }, // Leave space for user card on larger screens
          maxWidth: { xs: "calc(100% - 16px)", sm: 500 },
          zIndex: 2000,
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(18,18,18,0.88)"
              : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          // Ensure it doesn't overlap with user card on mobile
          "@media (max-width: 600px)": {
            right: 8,
            maxWidth: "calc(100% - 16px)",
          },
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
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
                "&:hover": {
                  bgcolor: "background.paper",
                },
                "&.Mui-focused": {
                  bgcolor: "background.paper",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  style={{ marginRight: 8, color: "inherit", opacity: 0.7 }}
                />
              ),
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                mt: 0.5,
                maxHeight: 280,
                overflow: "auto",
                zIndex: 1001,
                bgcolor: "background.paper",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
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
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="text.primary"
                  >
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
          origin={origin}
          destination={destination}
          onLocationFound={(location) => {
            setMapCenter(location);
            if (step === "origin") {
              setOrigin({ lat: location[0], lng: location[1] });
              setDestination(null);
              setAvailableModes(null);
              setSelectedMode(null);
              setCreatedOrder(null);
              setStep("destination");
            } else if (step === "destination") {
              setDestination({ lat: location[0], lng: location[1] });
            } else {
              // step === "modes": do not overwrite confirmed destination
            }
          }}
        />
      </Box>

      {/* Control Panel */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          bottom: { xs: 0, sm: 16 },
          left: { xs: 0, sm: 16 },
          right: { xs: 0, sm: "auto" },
          width: { xs: "100%", sm: 420 },
          maxWidth: { xs: "100%", sm: 420 },
          zIndex: 1000,
          p: { xs: 1.5, sm: 2 },
          pt: { xs: 1, sm: 2 },
          pb: {
            xs: "calc(env(safe-area-inset-bottom) + 12px)",
            sm: 2,
          },
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(18,18,18,0.92)"
              : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderTopLeftRadius: { xs: 18, sm: 12 },
          borderTopRightRadius: { xs: 18, sm: 12 },
          borderBottomLeftRadius: { xs: 0, sm: 12 },
          borderBottomRightRadius: { xs: 0, sm: 12 },
          boxShadow: isMobile
            ? "0 -12px 28px rgba(0,0,0,0.22)"
            : "0 10px 28px rgba(0,0,0,0.18)",
          maxHeight: { xs: "56vh", sm: "auto" },
          overflow: "hidden", // prevent rounded-corner clipping while scrolling
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflow: { xs: "auto", sm: "visible" },
            pr: { xs: 0.5, sm: 0 }, // tiny padding so scrollbar (if any) doesn't overlap
          }}
        >
          {/* Sticky step section (prevents “cropped” feel on mobile scroll) */}
          <Box
            sx={{
              position: { xs: "sticky", sm: "static" },
              top: 0,
              zIndex: 2,
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(18,18,18,0.96)"
                  : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(12px)",
              pb: 1.25,
            }}
          >
            {/* Mobile sheet handle */}
            {isMobile && (
              <Box
                sx={{
                  width: 44,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: "divider",
                  mx: "auto",
                  mb: 0.75,
                }}
              />
            )}

            <Typography
              variant="subtitle2"
              fontWeight="medium"
              gutterBottom
              color="text.primary"
            >
              Step:{" "}
              {step === "origin"
                ? "Set Origin"
                : step === "destination"
                ? "Confirm Destination"
                : "Choose Delivery Mode"}
            </Typography>

            {/* Stepper with progress */}
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.75,
                  gap: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {currentStepIndex >= 0
                    ? `Step ${currentStepIndex + 1} of ${stepOrder.length}`
                    : `Step of ${stepOrder.length}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(progressValue)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                  },
                }}
              />
            </Box>

            {/* Redesigned horizontal stepper pills */}
            <Box
              sx={{
                display: "flex",
                flexWrap: { xs: "nowrap", md: "wrap" },
                overflowX: { xs: "auto", md: "visible" },
                overflowY: "hidden",
                columnGap: { xs: 1, md: 1.25 },
                rowGap: { xs: 0, md: 1.25 },
                mb: 1,
                pb: 0.5,
                pr: { xs: 0.5, md: 0 },
                scrollSnapType: { xs: "x mandatory", md: "none" },
                "&::-webkit-scrollbar": { height: { xs: 6, md: 0 } },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "text.disabled",
                  borderRadius: 999,
                },
                "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
              }}
            >
              {stepMeta.map((item, idx) => {
                const status = stepStatus[item.key];
                const isActive = status === "active";
                const isDone = status === "done";
                const baseBg =
                  status === "pending"
                    ? "background.paper"
                    : isActive
                    ? theme.palette.mode === "dark"
                      ? "rgba(59,130,246,0.14)"
                      : "rgba(59,130,246,0.12)"
                    : theme.palette.mode === "dark"
                    ? "rgba(34,197,94,0.16)"
                    : "rgba(34,197,94,0.12)";
                const borderColor = isActive
                  ? theme.palette.primary.main
                  : isDone
                  ? theme.palette.success.main
                  : "divider";
                const iconColor = isDone
                  ? theme.palette.success.main
                  : isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.disabled;
                const textColor = isActive
                  ? "text.primary"
                  : isDone
                  ? "text.primary"
                  : "text.secondary";

                return (
                  <Box
                    key={item.key}
                    sx={{
                      minWidth: { xs: 180, md: "48%" },
                      maxWidth: { md: "48%" },
                      flexShrink: 0,
                      px: 1.25,
                      py: 1,
                      borderRadius: 12,
                      border: "1px solid",
                      borderColor,
                      bgcolor: baseBg,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      scrollSnapAlign: { xs: "start", md: "none" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor:
                          isDone || isActive
                            ? "common.white"
                            : theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.04)",
                        border: "1px solid",
                        borderColor: iconColor,
                        display: "grid",
                        placeItems: "center",
                        color: iconColor,
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        icon={
                          isDone
                            ? "mdi:check"
                            : item.icon || "mdi:checkbox-blank-circle-outline"
                        }
                        width={18}
                        height={18}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isActive ? 700 : 600}
                        color={textColor}
                        noWrap
                      >
                        {idx + 1}. {item.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                        noWrap
                      >
                        {item.caption}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleSetLocation}
              disabled={step === "modes"}
              startIcon={
                <Icon
                  icon={
                    step === "origin"
                      ? "mdi:map-marker"
                      : step === "destination"
                      ? "mdi:map-marker-check"
                      : "mdi:check-circle"
                  }
                />
              }
              sx={{ py: 1.2 }}
            >
              {step === "origin"
                ? "Set Origin"
                : step === "destination"
                ? "Confirm Destination"
                : "Destination Confirmed"}
            </Button>

            {step === "modes" && (
              <Button
                sx={{ mt: 1 }}
                variant="outlined"
                fullWidth
                onClick={handleChangeDestination}
                startIcon={<Icon icon="mdi:pencil" />}
              >
                Change Destination
              </Button>
            )}

            <Divider sx={{ mt: 1.25 }} />
          </Box>

          <Stack spacing={2} sx={{ pt: 1.5 }}>
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
                        <Chip
                          size="small"
                          color="success"
                          variant="outlined"
                          label="Selected"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                    {destination && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Destination
                        </Typography>
                        <Chip
                          size="small"
                          color="error"
                          variant="outlined"
                          label="Selected"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                    {origin && destination && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Distance (Haversine)
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {(
                            haversineDistance(origin, destination) / 1000
                          ).toFixed(2)}{" "}
                          km
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

            {/* Step 3: mode selection states */}
            {!isLoadingModes && step === "modes" && (
              <>
                {modesError && (
                  <Card
                    variant="outlined"
                    sx={{ bgcolor: "error.light", color: "error.contrastText" }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Couldn’t load delivery modes
                        </Typography>
                        <Typography variant="body2">{modesError}</Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="inherit"
                          onClick={() =>
                            loadAvailableModes(origin, destination)
                          }
                          startIcon={<Icon icon="mdi:refresh" />}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Retry
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {!modesError && !availableModes && (
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Select a delivery mode
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tap below to load available options for your route.
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            loadAvailableModes(origin, destination)
                          }
                          startIcon={<Icon icon="mdi:truck-delivery" />}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Load Modes
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {!modesError && availableModes && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight="medium"
                      gutterBottom
                      color="text.primary"
                    >
                      Available Delivery Modes
                    </Typography>
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={12}
                        slidesPerView={1.2}
                        navigation
                        pagination={{ clickable: true }}
                        breakpoints={{
                          480: {
                            slidesPerView: 1.5,
                          },
                          640: {
                            slidesPerView: 2,
                          },
                          960: {
                            slidesPerView: 2.5,
                          },
                        }}
                        style={{
                          paddingBottom: "40px",
                          touchAction: "pan-y",
                        }}
                      >
                        {availableModes.modes.map((mode) => (
                          <SwiperSlide key={mode.mode}>
                            <ModeCard
                              mode={mode.mode}
                              fare={mode.fare}
                              estimatedDuration={mode.estimatedDuration}
                              enabled={mode.enabled}
                              reason={mode.reason}
                              isSelected={selectedMode === mode.mode}
                              isSuggested={
                                availableModes.suggestedMode === mode.mode
                              }
                              onClick={() =>
                                mode.enabled && setSelectedMode(mode.mode)
                              }
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </Box>
                  </Box>
                )}
              </>
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
                startIcon={
                  isCreatingOrder ? (
                    <Icon icon="svg-spinners:3-dots-fade" />
                  ) : (
                    <Icon icon="mdi:check-circle" />
                  )
                }
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
        </Box>
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
