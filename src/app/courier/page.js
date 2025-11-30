"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { initSocketClient, subscribeToCourier, disconnectSocket } from "@/lib/socket-client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";

function CourierPageContent() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [vehicleType, setVehicleType] = useState("MOTORCYCLE");
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [radius, setRadius] = useState(5);
  const [socketConnected, setSocketConnected] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = initSocketClient();

    socket.on("connect", () => {
      setSocketConnected(true);
      console.log("Socket.io connected");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      console.log("Socket.io disconnected");
    });

    socket.on("offer", (offerData) => {
      console.log("📨 Received offer:", offerData);
      setIncomingOffer(offerData);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({
            lat: 35.6892,
            lng: 51.3890,
          });
        }
      );
    } else {
      setLocation({
        lat: 35.6892,
        lng: 51.3890,
      });
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Toggle online/offline
  const handleToggleOnline = async () => {
    if (!token) {
      alert("Please login first. Token not found.");
      return;
    }

    if (!location.lat || !location.lng) {
      alert("Location not available. Please enable location sharing.");
      return;
    }

    if (!isOnline) {
      try {
        const response = await fetch("/api/courier/online", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lat: location.lat,
            lng: location.lng,
            vehicleType: vehicleType,
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        setIsOnline(true);
        
        if (data.courier?.id) {
          subscribeToCourier(data.courier.id);
        }
        
        loadNearbyOrders();
      } catch (error) {
        console.error("Error going online:", error);
        alert("Failed to go online. Please try again.");
      }
    } else {
      try {
        const response = await fetch("/api/courier/offline", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        setIsOnline(false);
        setNearbyOrders([]);
      } catch (error) {
        console.error("Error going offline:", error);
        alert("Failed to go offline. Please try again.");
      }
    }
  };

  // Load nearby orders
  const loadNearbyOrders = async () => {
    if (!token || !location.lat || !location.lng) return;

    setIsLoadingOrders(true);
    try {
      const response = await fetch(
        `/api/courier/nearby-orders?lat=${location.lat}&lng=${location.lng}&radius_km=${radius}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setNearbyOrders(data.orders || []);
    } catch (error) {
      console.error("Error loading nearby orders:", error);
      alert("Failed to load nearby orders. Please try again.");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle accept order
  const handleAcceptOrder = async (orderId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/courier/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      alert("Order accepted successfully!");
      setIncomingOffer(null);
      loadNearbyOrders();
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order. Please try again.");
    }
  };

  // Handle reject order
  const handleRejectOrder = async (orderId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/courier/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      setIncomingOffer(null);
      loadNearbyOrders();
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {user?.name || "Courier"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.phone}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Chip
              icon={<Icon icon={socketConnected ? "mdi:check-circle" : "mdi:close-circle"} />}
              label={socketConnected ? "Connected" : "Disconnected"}
              color={socketConnected ? "success" : "default"}
              variant="outlined"
            />
            <Button
              variant="outlined"
              onClick={() => router.push("/")}
              startIcon={<Icon icon="mdi:home" />}
            >
              Home
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={logout}
              startIcon={<Icon icon="mdi:logout" />}
            >
              Logout
            </Button>
          </Stack>
        </Box>

        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom color="text.primary">
          Courier Dashboard
        </Typography>

        {/* Status Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Status
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color={isOnline ? "success.main" : "text.disabled"}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Icon icon={isOnline ? "mdi:circle" : "mdi:circle-outline"} width={24} />
                    {isOnline ? "Online" : "Offline"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color={isOnline ? "error" : "success"}
                  size="large"
                  onClick={handleToggleOnline}
                  startIcon={<Icon icon={isOnline ? "mdi:power" : "mdi:power-on"} />}
                >
                  {isOnline ? "Go Offline" : "Go Online"}
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Location
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" color="text.primary">
                    {location.lat ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "Not set"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isOnline}>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      label="Vehicle Type"
                    >
                      <MenuItem value="WALKING">Walking</MenuItem>
                      <MenuItem value="SCOOTER">Scooter</MenuItem>
                      <MenuItem value="BICYCLE">Bicycle</MenuItem>
                      <MenuItem value="MOTORCYCLE">Motorcycle</MenuItem>
                      <MenuItem value="CAR">Car</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                label="Search Radius (km)"
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value) || 5)}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
              />

              <Button
                variant="outlined"
                fullWidth
                onClick={getCurrentLocation}
                startIcon={<Icon icon="mdi:crosshairs-gps" />}
              >
                Update Location
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Nearby Orders */}
        {isOnline && (
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  Nearby Orders
                </Typography>
                <Button
                  variant="outlined"
                  onClick={loadNearbyOrders}
                  disabled={isLoadingOrders}
                  startIcon={<Icon icon="mdi:refresh" />}
                >
                  {isLoadingOrders ? "Loading..." : "Refresh"}
                </Button>
              </Box>

              {isLoadingOrders ? (
                <Stack spacing={2}>
                  <Skeleton variant="rectangular" height={120} />
                  <Skeleton variant="rectangular" height={120} />
                  <Skeleton variant="rectangular" height={120} />
                </Stack>
              ) : nearbyOrders.length === 0 ? (
                <Alert severity="info" icon={<Icon icon="mdi:information" />}>
                  No nearby orders found
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {nearbyOrders.map((order) => (
                    <Card key={order.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                Order #{order.id.slice(0, 8)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Fare: ${order.fare?.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Distance: {order.distanceKm?.toFixed(2)} km
                              </Typography>
                            </Box>
                            <Chip label={order.status} size="small" color="primary" variant="outlined" />
                          </Box>
                          <Stack direction="row" spacing={2}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleAcceptOrder(order.id)}
                              startIcon={<Icon icon="mdi:check" />}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRejectOrder(order.id)}
                              startIcon={<Icon icon="mdi:close" />}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* Incoming Offer Modal */}
        {incomingOffer && (
          <Dialog
            open={!!incomingOffer}
            onClose={() => setIncomingOffer(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon icon="mdi:bell-ring" width={24} />
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  New Order Offer!
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace" color="text.primary">
                    {incomingOffer.orderId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Fare
                  </Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    ${incomingOffer.fare?.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Distance
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {incomingOffer.distance?.toFixed(2)} km
                  </Typography>
                </Box>
                {incomingOffer.expiresAt && (
                  <Alert severity="warning" icon={<Icon icon="mdi:clock-alert" />}>
                    Expires at: {new Date(incomingOffer.expiresAt).toLocaleTimeString()}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  handleRejectOrder(incomingOffer.orderId);
                  setIncomingOffer(null);
                }}
                color="error"
                startIcon={<Icon icon="mdi:close" />}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  handleAcceptOrder(incomingOffer.orderId);
                  setIncomingOffer(null);
                }}
                variant="contained"
                color="success"
                startIcon={<Icon icon="mdi:check" />}
              >
                Accept
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </Box>
  );
}

export default function CourierPage() {
  return (
    <ProtectedRoute requiredRole="COURIER" redirectTo="/courier/login">
      <CourierPageContent />
    </ProtectedRoute>
  );
}
