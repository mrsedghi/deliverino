"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  useMediaQuery,
  useTheme,
  Divider,
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import MapContainerWrapper from "./MapWithSearchParts/MapContainerWrapper";
import MapStyleSelector from "./MapWithSearchParts/MapStyleSelector";

// Main component
export default function MapWithSearch() {
  // Fix Leaflet icons on client side only (in useEffect to avoid SSR issues)
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const mapRef = useRef(null);

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
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("onboarding_completed");
    }
    return true;
  });
  const [mapStyle, setMapStyle] = useState(() => {
    // Initialize with theme-appropriate style
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mapStyle");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Fallback to default
        }
      }
    }
    // Default based on theme or use Carto Light
    return {
      id: "carto-light",
      name: "Light",
      icon: "mdi:map-outline",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      userSet: false,
    };
  });
  const searchTimeoutRef = useRef(null);
  const [isMapMoving, setIsMapMoving] = useState(false); // track drag or pan inertia

  // Save map style to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && mapStyle) {
      localStorage.setItem("mapStyle", JSON.stringify(mapStyle));
    }
  }, [mapStyle]);

  // Keep default map style aligned with system theme until user explicitly chooses a style
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapStyle?.userSet) return;

    const next =
      theme.palette.mode === "dark"
        ? {
            id: "carto-dark",
            name: "Dark",
            icon: "mdi:map-marker",
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            userSet: false,
          }
        : {
            id: "carto-light",
            name: "Light",
            icon: "mdi:map-outline",
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            userSet: false,
          };

    if (mapStyle?.id !== next.id) {
      setMapStyle(next);
    }
  }, [theme.palette.mode, mapStyle?.id, mapStyle?.userSet]);

  // Handle map style change
  const handleMapStyleChange = useCallback((newStyle) => {
    setMapStyle({ ...newStyle, userSet: true });
    setSnackbar({
      open: true,
      message: `Map style changed to ${newStyle.name}`,
      severity: "success",
    });
  }, []);

  // Handle onboarding completion
  const handleCompleteOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_completed", "true");
    }
    setShowOnboarding(false);
  }, []);

  const notify = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Lightweight step status for responsive “mini stepper”
  const stepOrder = useMemo(() => ["origin", "destination", "modes"], []);
  const currentStepIndex = useMemo(
    () => stepOrder.indexOf(step),
    [stepOrder, step]
  );
  const progressValue = useMemo(
    () =>
      ((currentStepIndex >= 0 ? currentStepIndex + 1 : 0) / stepOrder.length) *
      100,
    [currentStepIndex, stepOrder.length]
  );

  const stepStatus = useMemo(
    () => ({
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
    }),
    [step, origin, destination, selectedMode]
  );

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

  // Search Nominatim with improved error handling
  const searchNominatim = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            "User-Agent": "Deliverino/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data);
      if (data.length === 0) {
        setSearchError("No locations found. Try a different search term.");
      }
    } catch (error) {
      console.error("Error searching Nominatim:", error);
      setSuggestions([]);
      setSearchError("Search temporarily unavailable. Please try again.");
    } finally {
      setIsSearching(false);
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
        setSearchError(null);
        setIsSearching(false);
      }
    }, 400); // Slightly longer debounce for better performance

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
      const errorMessage =
        error?.message || "Failed to load delivery modes. Please try again.";
      setModesError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsLoadingModes(false);
    }
  };

  // Handle setting location (confirm steps)
  const handleSetLocation = () => {
    if (isMapMoving) {
      notify("Please wait for the map to stop moving, then confirm.", "info");
      return;
    }

    const leafletCenter = mapRef.current?.getCenter?.();
    const confirmedCenter = leafletCenter
      ? { lat: leafletCenter.lat, lng: leafletCenter.lng }
      : { lat: mapCenter[0], lng: mapCenter[1] };

    if (step === "origin") {
      const nextOrigin = confirmedCenter;
      setOrigin(nextOrigin);
      setDestination(null);
      setAvailableModes(null);
      setSelectedMode(null);
      setCreatedOrder(null);
      setModesError(null);
      setStep("destination");
      setSnackbar({
        open: true,
        message: "Origin set! Now select your destination.",
        severity: "success",
      });
      return;
    }

    if (step === "destination") {
      const nextDestination = confirmedCenter;

      // Validate distance
      if (origin) {
        const distance = haversineDistance(origin, nextDestination) / 1000;
        if (distance < 0.1) {
          setSnackbar({
            open: true,
            message:
              "Destination is too close to origin. Please select a different location.",
            severity: "warning",
          });
          return;
        }
        if (distance > 100) {
          setSnackbar({
            open: true,
            message:
              "Distance is too far (max 100km). Please select a closer location.",
            severity: "warning",
          });
          return;
        }
      }

      setDestination(nextDestination);
      setAvailableModes(null);
      setSelectedMode(null);
      setCreatedOrder(null);
      setModesError(null);
      setStep("modes");
      setSnackbar({
        open: true,
        message: "Destination confirmed! Loading delivery modes...",
        severity: "success",
      });
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
    setSnackbar({
      open: true,
      message: "Destination cleared. Please select a new destination.",
      severity: "info",
    });
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!origin || !destination || !selectedMode) return;

    const selectedModeData = availableModes?.modes.find(
      (m) => m.mode === selectedMode
    );
    if (!selectedModeData || !selectedModeData.enabled) {
      notify("Please select a valid delivery mode.", "warning");
      return;
    }

    // Get auth token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!token) {
      setSnackbar({
        open: true,
        message: "Please login first to create an order.",
        severity: "warning",
      });
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

      setSnackbar({
        open: true,
        message: "Order created successfully! Redirecting...",
        severity: "success",
      });

      // Redirect to order status page after showing success message
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = `/orders/${data.order.id}`;
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to create order. Please try again.",
        severity: "error",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Reset workflow with confirmation
  const handleReset = () => {
    setConfirmResetOpen(true);
  };

  const confirmReset = () => {
    setConfirmResetOpen(false);
    setOrigin(null);
    setDestination(null);
    setStep("origin");
    setAvailableModes(null);
    setSelectedMode(null);
    setCreatedOrder(null);
    notify("Order reset. Start fresh!", "info");
  };

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setSearchQuery(suggestion.display_name);
      setShowSuggestions(false);
      setSearchError(null);
    }
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
        touchAction: "none", // Prevent default touch behaviors that interfere with map
        "& > *": {
          touchAction: "auto", // Re-enable for interactive elements
        },
      }}
    >
      {/* Search Bar */}
      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 16 },
          left: { xs: 12, sm: 16 },
          right: { xs: 12, md: 360 }, // Leave space for user card on larger screens
          maxWidth: { xs: "calc(100% - 24px)", sm: 500, md: 600 },
          zIndex: 2000,
          pointerEvents: "auto",
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(18,18,18,0.95)"
              : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: { xs: 3, sm: 2 },
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
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
            onBlur={() => {
              // Delay hiding suggestions to allow click
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: { xs: 3, sm: 2 },
                bgcolor: "background.paper",
                fontSize: { xs: "1rem", sm: "0.875rem" },
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
                <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                  {isSearching ? (
                    <Icon
                      icon="svg-spinners:3-dots-fade"
                      width={isMobile ? 24 : 20}
                      height={isMobile ? 24 : 20}
                      style={{ color: "inherit", opacity: 0.7 }}
                    />
                  ) : (
                    <Icon
                      icon="mdi:magnify"
                      width={isMobile ? 24 : 20}
                      height={isMobile ? 24 : 20}
                      style={{ color: "inherit", opacity: 0.7 }}
                    />
                  )}
                </Box>
              ),
            }}
            aria-label="Search for address"
          />
          <Collapse
            in={showSuggestions && (suggestions.length > 0 || searchError)}
          >
            <Paper
              elevation={6}
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                mt: 0.5,
                maxHeight: { xs: 300, sm: 320 },
                overflow: "auto",
                zIndex: 1001,
                bgcolor: "background.paper",
                borderRadius: { xs: 3, sm: 2 },
                border: 1,
                borderColor: "divider",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              }}
            >
              {searchError && (
                <Box sx={{ p: 2 }}>
                  <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                    {searchError}
                  </Alert>
                </Box>
              )}
              {suggestions.map((suggestion, index) => (
                <Box
                  key={`${suggestion.place_id || index}-${suggestion.lat}-${
                    suggestion.lon
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                  sx={{
                    p: { xs: 2, sm: 1.75 },
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                      transition: "background-color 0.15s ease",
                    },
                    "&:active": {
                      bgcolor: "action.selected",
                    },
                    borderBottom: index < suggestions.length - 1 ? 1 : 0,
                    borderColor: "divider",
                    transition: "background-color 0.15s ease",
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSuggestionClick(suggestion);
                    }
                  }}
                  aria-label={`Select ${suggestion.display_name}`}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="text.primary"
                    sx={{
                      fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                      lineHeight: 1.5,
                    }}
                  >
                    {suggestion.display_name}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Collapse>
        </Box>
      </Paper>

      {/* Map */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          zIndex: 0,
          overflow: "hidden",
          "& .leaflet-container": {
            filter:
              mapStyle.id === "carto-dark"
                ? "brightness(0.95) contrast(1.05)"
                : mapStyle.id === "stamen-toner"
                ? "contrast(1.1) saturate(0.9)"
                : "brightness(1.02) contrast(1.02) saturate(1.05)",
            transition: "filter 0.3s ease-in-out",
            cursor: "grab",
            "&.leaflet-dragging": {
              cursor: "grabbing",
            },
            "& .leaflet-tile-container": {
              pointerEvents: "auto",
            },
            "& .leaflet-tile": {
              pointerEvents: "auto",
            },
          },
          "& .map-container-interactive": {
            pointerEvents: "auto",
          },
        }}
      >
        <MapContainerWrapper
          center={mapCenter}
          setCenter={setMapCenter}
          origin={origin}
          destination={destination}
          mapStyle={mapStyle}
          onNotify={notify}
          onMovingChange={setIsMapMoving}
          onMapCreated={(map) => {
            mapRef.current = map;
          }}
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
        <MapStyleSelector
          currentStyle={mapStyle.id}
          onStyleChange={handleMapStyleChange}
        />
      </Box>

      {/* Control Panel - Responsive Layout */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          // Mobile: bottom sheet
          ...(isMobile && {
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            maxWidth: "100%",
          }),
          // Tablet: bottom left
          ...(isTablet && {
            bottom: 16,
            left: 16,
            right: "auto",
            width: 420,
            maxWidth: 420,
          }),
          // Desktop: side panel
          ...(isDesktop && {
            top: 16,
            right: 16,
            bottom: 16,
            left: "auto",
            width: 400,
            maxWidth: 400,
          }),
          zIndex: 1000,
          pointerEvents: "auto",
          p: { xs: 2, sm: 2.5 },
          pt: { xs: 1.5, sm: 2.5 },
          pb: {
            xs: "calc(env(safe-area-inset-bottom) + 16px)",
            sm: 2.5,
          },
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(18,18,18,0.96)"
              : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(16px)",
          borderTopLeftRadius: { xs: 24, sm: 16 },
          borderTopRightRadius: { xs: 24, sm: 16 },
          borderBottomLeftRadius: { xs: 0, sm: 16 },
          borderBottomRightRadius: { xs: 0, sm: 16 },
          boxShadow: isMobile
            ? "0 -16px 40px rgba(0,0,0,0.25)"
            : "0 12px 32px rgba(0,0,0,0.2)",
          maxHeight: {
            xs: "65vh",
            sm: "75vh",
            md: "calc(100vh - 32px)",
          },
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflow: "auto",
            pr: { xs: 0.5, sm: 0 }, // tiny padding so scrollbar (if any) doesn't overlap
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
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
                  width: 48,
                  height: 5,
                  borderRadius: 999,
                  bgcolor: "divider",
                  mx: "auto",
                  mb: 1.5,
                  cursor: "grab",
                  "&:active": {
                    cursor: "grabbing",
                  },
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
            <Fade in timeout={600}>
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
                    <Fade in timeout={400 + idx * 200} key={item.key}>
                      <Box
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
                          transition: "all 0.3s ease-in-out",
                          "&:hover": {
                            transform:
                              isActive || isDone ? "translateY(-2px)" : "none",
                            boxShadow: isActive || isDone ? 2 : 0,
                          },
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
                                : item.icon ||
                                  "mdi:checkbox-blank-circle-outline"
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
                    </Fade>
                  );
                })}
              </Box>
            </Fade>

            <Button
              variant="contained"
              fullWidth
              onClick={handleSetLocation}
              disabled={step === "modes" || isMapMoving}
              startIcon={
                <Icon
                  icon={
                    step === "origin"
                      ? "mdi:map-marker"
                      : step === "destination"
                      ? "mdi:map-marker-check"
                      : "mdi:check-circle"
                  }
                  width={isMobile ? 24 : 20}
                  height={isMobile ? 24 : 20}
                />
              }
              sx={{
                py: { xs: 1.5, sm: 1.2 },
                fontSize: { xs: "1rem", sm: "0.875rem" },
                fontWeight: 600,
                minHeight: { xs: 48, sm: 44 },
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: 4,
                  "&::after": {
                    transform: "translateX(100%)",
                  },
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  transition: "transform 0.6s ease",
                },
                transition: "all 0.2s ease-in-out",
              }}
              aria-label={
                step === "origin"
                  ? "Set origin location"
                  : step === "destination"
                  ? "Confirm destination location"
                  : "Destination confirmed"
              }
            >
              {isMapMoving
                ? "Map moving..."
                : step === "origin"
                ? "Set Origin"
                : step === "destination"
                ? "Confirm Destination"
                : "Destination Confirmed"}
            </Button>

            {step === "modes" && (
              <Button
                sx={{
                  mt: 1,
                  py: { xs: 1.25, sm: 1 },
                  fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                  minHeight: { xs: 44, sm: 40 },
                }}
                variant="outlined"
                fullWidth
                onClick={handleChangeDestination}
                startIcon={
                  <Icon
                    icon="mdi:pencil"
                    width={isMobile ? 20 : 18}
                    height={isMobile ? 20 : 18}
                  />
                }
                aria-label="Change destination"
              >
                Change Destination
              </Button>
            )}

            <Divider sx={{ mt: 1.25 }} />
          </Box>

          <Stack spacing={2} sx={{ pt: 1.5 }}>
            {/* Summary Card */}
            {(origin || destination) && (
              <Fade in={!!(origin || destination)}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: "background.paper",
                    borderColor: "divider",
                    "&:hover": {
                      boxShadow: 2,
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 1.75 } }}>
                    <Stack spacing={1.5}>
                      {origin && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Icon
                              icon="mdi:map-marker"
                              width={18}
                              height={18}
                              style={{ color: "#10b981" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{
                                textTransform: "uppercase",
                                fontSize: "0.6875rem",
                                letterSpacing: 0.5,
                              }}
                            >
                              Origin
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label="Selected"
                            sx={{
                              mt: 0.25,
                              height: { xs: 26, sm: 24 },
                              fontSize: { xs: "0.75rem", sm: "0.6875rem" },
                            }}
                          />
                        </Box>
                      )}
                      {destination && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Icon
                              icon="mdi:map-marker-check"
                              width={18}
                              height={18}
                              style={{ color: "#ef4444" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{
                                textTransform: "uppercase",
                                fontSize: "0.6875rem",
                                letterSpacing: 0.5,
                              }}
                            >
                              Destination
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color="error"
                            variant="outlined"
                            label="Selected"
                            sx={{
                              mt: 0.25,
                              height: { xs: 26, sm: 24 },
                              fontSize: { xs: "0.75rem", sm: "0.6875rem" },
                            }}
                          />
                        </Box>
                      )}
                      {origin && destination && (
                        <Box
                          sx={{ pt: 0.5, borderTop: 1, borderColor: "divider" }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Icon
                              icon="mdi:map-marker-distance"
                              width={18}
                              height={18}
                              style={{
                                color: theme.palette.text.secondary,
                                opacity: 0.7,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{
                                textTransform: "uppercase",
                                fontSize: "0.6875rem",
                                letterSpacing: 0.5,
                              }}
                            >
                              Distance
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            fontWeight={600}
                            sx={{ fontSize: { xs: "1rem", sm: "0.9375rem" } }}
                          >
                            {(
                              haversineDistance(origin, destination) / 1000
                            ).toFixed(2)}{" "}
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: "0.875rem", sm: "0.8125rem" },
                              }}
                            >
                              km
                            </Typography>
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Available Modes Loading */}
            {isLoadingModes && (
              <Fade in timeout={300}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Icon
                      icon="svg-spinners:3-dots-fade"
                      width={24}
                      height={24}
                      style={{ color: theme.palette.primary.main }}
                    />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Loading delivery modes...
                    </Typography>
                  </Box>
                  {[0, 1, 2].map((i) => (
                    <Card
                      key={i}
                      variant="outlined"
                      sx={{ bgcolor: "background.paper" }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 1.75 } }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="flex-start"
                        >
                          <Skeleton
                            variant="rectangular"
                            width={56}
                            height={56}
                            sx={{ borderRadius: 2.5 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack spacing={1}>
                              <Skeleton
                                variant="text"
                                width="60%"
                                height={24}
                              />
                              <Skeleton
                                variant="text"
                                width="40%"
                                height={20}
                              />
                              <Skeleton
                                variant="text"
                                width="50%"
                                height={20}
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Fade>
            )}

            {/* Step 3: mode selection states */}
            {!isLoadingModes && step === "modes" && (
              <>
                {modesError && (
                  <Fade in timeout={400}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(239, 68, 68, 0.05)",
                        borderColor: "error.main",
                        borderWidth: 1.5,
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                bgcolor: "error.main",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Icon
                                icon="mdi:alert-circle"
                                width={24}
                                height={24}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="error.main"
                                sx={{
                                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                                }}
                              >
                                Couldn't Load Delivery Modes
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                                }}
                              >
                                {modesError}
                              </Typography>
                            </Box>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size={isMobile ? "medium" : "small"}
                              variant="contained"
                              color="error"
                              onClick={() =>
                                loadAvailableModes(origin, destination)
                              }
                              startIcon={
                                <Icon
                                  icon="mdi:refresh"
                                  width={18}
                                  height={18}
                                />
                              }
                              sx={{
                                flex: 1,
                                py: { xs: 1.25, sm: 1 },
                                fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                              }}
                            >
                              Retry
                            </Button>
                            <Button
                              size={isMobile ? "medium" : "small"}
                              variant="outlined"
                              color="error"
                              onClick={handleChangeDestination}
                              startIcon={
                                <Icon
                                  icon="mdi:map-marker"
                                  width={18}
                                  height={18}
                                />
                              }
                              sx={{
                                flex: 1,
                                py: { xs: 1.25, sm: 1 },
                                fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                              }}
                            >
                              Change Location
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
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
                  <Fade in timeout={600}>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Icon
                          icon="mdi:truck-delivery"
                          width={20}
                          height={20}
                          style={{ opacity: 0.7 }}
                        />
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          color="text.primary"
                          sx={{ fontSize: { xs: "0.9375rem", sm: "0.875rem" } }}
                        >
                          Available Delivery Modes
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Swiper
                          modules={[Navigation, Pagination]}
                          spaceBetween={isMobile ? 16 : 12}
                          slidesPerView={isMobile ? 1.15 : isTablet ? 1.5 : 2}
                          navigation={!isMobile}
                          autoHeight={true}
                          pagination={{
                            clickable: true,
                            dynamicBullets: true,
                            bulletClass: "swiper-pagination-bullet",
                          }}
                          breakpoints={{
                            480: {
                              slidesPerView: 1.4,
                              spaceBetween: 14,
                            },
                            640: {
                              slidesPerView: 1.8,
                              spaceBetween: 12,
                            },
                            960: {
                              slidesPerView: 2.2,
                              spaceBetween: 12,
                            },
                            1280: {
                              slidesPerView: 2.5,
                              spaceBetween: 12,
                            },
                          }}
                          style={{
                            paddingBottom: isMobile ? "48px" : "40px",
                            touchAction: "pan-y",
                          }}
                          grabCursor={true}
                          resistance={true}
                          resistanceRatio={0.85}
                        >
                          {availableModes.modes.map((mode) => (
                            <SwiperSlide
                              key={mode.mode}
                              style={{ height: "auto" }}
                            >
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
                  </Fade>
                )}
              </>
            )}

            {/* Create Order Button */}
            {selectedMode && availableModes && (
              <Fade in={!!selectedMode}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size={isMobile ? "large" : "medium"}
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  startIcon={
                    isCreatingOrder ? (
                      <Icon
                        icon="svg-spinners:3-dots-fade"
                        width={isMobile ? 24 : 20}
                        height={isMobile ? 24 : 20}
                      />
                    ) : (
                      <Icon
                        icon="mdi:check-circle"
                        width={isMobile ? 24 : 20}
                        height={isMobile ? 24 : 20}
                      />
                    )
                  }
                  sx={{
                    py: { xs: 1.75, sm: 1.5 },
                    fontSize: { xs: "1.0625rem", sm: "0.9375rem" },
                    fontWeight: 700,
                    minHeight: { xs: 52, sm: 48 },
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 6,
                    },
                    "&:disabled": {
                      opacity: 0.7,
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                  aria-label={
                    isCreatingOrder ? "Creating order" : "Create order"
                  }
                >
                  {isCreatingOrder ? "Creating Order..." : "Create Order"}
                </Button>
              </Fade>
            )}

            {/* Reset Button */}
            {(origin || destination) && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleReset}
                startIcon={
                  <Icon
                    icon="mdi:refresh"
                    width={isMobile ? 20 : 18}
                    height={isMobile ? 20 : 18}
                  />
                }
                sx={{
                  py: { xs: 1.25, sm: 1 },
                  fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                  minHeight: { xs: 44, sm: 40 },
                }}
                aria-label="Reset order"
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          bottom: { xs: "calc(65vh + 16px)", sm: 24 },
          zIndex: 3000,
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          icon={
            <Icon
              icon={
                snackbar.severity === "success"
                  ? "mdi:check-circle"
                  : snackbar.severity === "error"
                  ? "mdi:alert-circle"
                  : snackbar.severity === "warning"
                  ? "mdi:alert"
                  : "mdi:information"
              }
              width={22}
              height={22}
            />
          }
          sx={{
            width: "100%",
            fontSize: { xs: "0.9375rem", sm: "0.875rem" },
            alignItems: "center",
            "& .MuiAlert-icon": {
              fontSize: { xs: "1.5rem", sm: "1.375rem" },
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm reset dialog */}
      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reset order?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will clear your origin, destination, and selected mode.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmResetOpen(false)} variant="text">
            Cancel
          </Button>
          <Button onClick={confirmReset} color="error" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5000,
            width: { xs: "90%", sm: 400 },
            maxWidth: 500,
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(18,18,18,0.98)"
                : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(16px)",
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4)",
              }}
            >
              <Icon
                icon="mdi:map-marker-path"
                width={44}
                height={44}
                style={{ color: "#fff" }}
              />
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              Welcome to Deliverino!
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, fontSize: { xs: "0.9375rem", sm: "1rem" } }}
            >
              Create your delivery in 3 easy steps:
            </Typography>
            <Stack spacing={2} sx={{ textAlign: "left", mb: 4 }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  1
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Set Your Origin
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Move the map to your pickup location and confirm
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  2
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Choose Destination
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select where you want your delivery to go
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "warning.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  3
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Select Delivery Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pick the best option for your delivery needs
                  </Typography>
                </Box>
              </Box>
            </Stack>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCompleteOnboarding}
              startIcon={
                <Icon icon="mdi:rocket-launch" width={20} height={20} />
              }
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Get Started
            </Button>
          </Box>
        </Paper>
      )}

      {/* Backdrop for onboarding */}
      {showOnboarding && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 4999,
          }}
          onClick={handleCompleteOnboarding}
        />
      )}
    </Box>
  );
}
