"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { initSocketClient, subscribeToCustomer, disconnectSocket } from "@/lib/socket-client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  LinearProgress,
  Paper,
} from "@mui/material";
import { Icon } from "@iconify/react";

// Helper function to get status order for timeline
function getStatusOrder(status) {
  const order = {
    PENDING: 1,
    DISPATCHING: 2,
    ACCEPTED: 3,
    IN_PROGRESS: 4,
    PICKED_UP: 5,
    IN_TRANSIT: 6,
    DELIVERED: 7,
    CANCELLED: 0,
    ESCALATE: 0,
  };
  return order[status] || 0;
}

function OrderStatusPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const orderId = params.orderId;
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Status display configuration
  const statusConfig = {
    PENDING: { label: "Pending", color: "warning", icon: "mdi:clock-outline" },
    DISPATCHING: { label: "Finding Courier", color: "info", icon: "mdi:magnify" },
    ACCEPTED: { label: "Accepted by Courier", color: "success", icon: "mdi:check-circle" },
    IN_PROGRESS: { label: "En Route to Pickup", color: "info", icon: "mdi:car" },
    PICKED_UP: { label: "Picked Up", color: "secondary", icon: "mdi:package-variant" },
    IN_TRANSIT: { label: "En Route to Delivery", color: "info", icon: "mdi:truck-delivery" },
    DELIVERED: { label: "Delivered", color: "success", icon: "mdi:check-circle" },
    CANCELLED: { label: "Cancelled", color: "error", icon: "mdi:close-circle" },
    ESCALATE: { label: "Escalated", color: "warning", icon: "mdi:alert" },
  };

  // Load order status
  const loadOrderStatus = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/orders/${orderId}/status`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      setPaymentMethod(data.order.paymentMethod || "CASH");
    } catch (error) {
      console.error("Error loading order status:", error);
      alert("Failed to load order status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orderId) {
      loadOrderStatus();
    }
  }, [orderId]);

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

    socket.on("order:update", (updateData) => {
      console.log("📨 Received order update:", updateData);
      if (updateData.orderId === orderId) {
        setOrder((prev) => ({
          ...prev,
          status: updateData.status,
          updatedAt: updateData.updatedAt,
        }));
      }
    });

    socket.on("order:payment", (paymentUpdate) => {
      console.log("📨 Received payment update:", paymentUpdate);
      if (paymentUpdate.orderId === orderId) {
        setOrder((prev) => ({
          ...prev,
          paid: paymentUpdate.paid,
          paidAt: paymentUpdate.paidAt,
          paymentMethod: paymentUpdate.paymentMethod,
        }));
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [orderId]);

  // Subscribe to customer channel when order is loaded
  useEffect(() => {
    if (socketConnected && order?.customerId) {
      subscribeToCustomer(order.customerId);
    }
  }, [socketConnected, order?.customerId]);

  // Fallback polling (every 10 seconds) if socket not connected
  useEffect(() => {
    if (!orderId || order?.status === "DELIVERED" || order?.status === "CANCELLED") {
      return;
    }

    if (!socketConnected) {
      const interval = setInterval(() => {
        loadOrderStatus();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [orderId, order?.status, socketConnected]);

  // Handle payment completion
  const handleCompletePayment = async () => {
    if (!order) return;

    setIsProcessingPayment(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const requestBody = {
        paymentMethod: paymentMethod,
      };

      if (paymentMethod === "CARD") {
        requestBody.paymentData = paymentData;
      }

      const response = await fetch(`/api/orders/${orderId}/complete-payment`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API returned ${response.status}`);
      }

      const data = await response.json();

      setOrder((prev) => ({
        ...prev,
        paid: true,
        paidAt: data.order.paidAt,
        paymentMethod: data.order.paymentMethod,
      }));

      setShowPaymentForm(false);
      setPaymentData({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
      alert("Payment completed successfully!");
    } catch (error) {
      console.error("Error completing payment:", error);
      alert(error.message || "Failed to complete payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading order status...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Alert severity="error" icon={<Icon icon="mdi:alert-circle" />}>
          Order not found
        </Alert>
      </Box>
    );
  }

  const statusInfo = statusConfig[order.status] || {
    label: order.status,
    color: "default",
    icon: "mdi:file-document",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {user?.fullName || "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.phone}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.push("/")}
              startIcon={<Icon icon="mdi:home" />}
            >
              Home
            </Button>
            <Chip
              icon={<Icon icon={socketConnected ? "mdi:check-circle" : "mdi:close-circle"} />}
              label={socketConnected ? "Connected" : "Disconnected"}
              color={socketConnected ? "success" : "default"}
              variant="outlined"
            />
          </Stack>
        </Box>

        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom color="text.primary">
          Order Status
        </Typography>

        {/* Order Details Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Order ID
                </Typography>
                <Typography variant="h6" fontFamily="monospace" color="text.primary">
                  {order.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Current Status
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                  <Icon icon={statusInfo.icon} width={32} height={32} />
                  <Chip
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="large"
                    sx={{ fontSize: "1rem", fontWeight: "bold" }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Fare
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    ${order.fare?.toFixed(2) || "0.00"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Distance
                  </Typography>
                  <Typography variant="h6" color="text.primary">
                    {order.distanceKm?.toFixed(2) || "N/A"} km
                  </Typography>
                </Grid>
              </Grid>

              {/* Payment Status */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: order.paid ? "success.light" : "warning.light",
                  border: 2,
                  borderColor: order.paid ? "success.main" : "warning.main",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Payment Status
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={order.paid ? "success.dark" : "warning.dark"}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Icon icon={order.paid ? "mdi:check-circle" : "mdi:clock-outline"} />
                      {order.paid ? "Paid" : "Pending"} ({order.paymentMethod || "CASH"})
                    </Typography>
                    {order.paid && order.paidAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        Paid at {new Date(order.paidAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  {!order.paid && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setShowPaymentForm(true)}
                      startIcon={<Icon icon="mdi:credit-card" />}
                    >
                      Pay Now
                    </Button>
                  )}
                </Box>
              </Paper>

              {order.courier && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "info.light" }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Assigned Courier
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="text.primary">
                    {order.courier.user?.fullName || "Courier"} • {order.courier.vehicleType}
                  </Typography>
                </Paper>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Origin
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" color="text.primary">
                    {order.originLat.toFixed(6)}, {order.originLng.toFixed(6)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Destination
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" color="text.primary">
                    {order.destLat.toFixed(6)}, {order.destLng.toFixed(6)}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </Typography>
                {order.updatedAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last updated: {new Date(order.updatedAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
              Order Timeline
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {Object.entries(statusConfig).map(([status, config]) => {
                const isCompleted = getStatusOrder(order.status) >= getStatusOrder(status);
                return (
                  <Box
                    key={status}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      opacity: isCompleted ? 1 : 0.4,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isCompleted ? "success.main" : "action.disabledBackground",
                        color: isCompleted ? "success.contrastText" : "text.disabled",
                      }}
                    >
                      {isCompleted ? (
                        <Icon icon="mdi:check" width={24} height={24} />
                      ) : (
                        <Icon icon={config.icon} width={24} height={24} />
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      fontWeight={isCompleted ? "bold" : "normal"}
                      color="text.primary"
                    >
                      {config.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Chip
              icon={
                socketConnected ? (
                  <Icon icon="mdi:circle" width={12} style={{ animation: "pulse 2s infinite" }} />
                ) : (
                  <Icon icon="mdi:circle-outline" width={12} />
                )
              }
              label={socketConnected ? "Real-time updates enabled" : "Polling for updates every 10 seconds..."}
              color={socketConnected ? "success" : "default"}
              variant="outlined"
            />
          </Box>
        )}

        {/* Payment Form Dialog */}
        <Dialog
          open={showPaymentForm}
          onClose={() => {
            setShowPaymentForm(false);
            setPaymentData({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Complete Payment
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Amount
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ${order.fare?.toFixed(2) || "0.00"}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                  disabled={isProcessingPayment}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                </Select>
              </FormControl>

              {paymentMethod === "CARD" && (
                <Stack spacing={2}>
                  <TextField
                    label="Card Number"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, cardNumber: e.target.value.replace(/\s/g, "") })
                    }
                    inputProps={{ maxLength: 16 }}
                    disabled={isProcessingPayment}
                    fullWidth
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Expiry (MM/YY)"
                        placeholder="12/25"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                        inputProps={{ maxLength: 5 }}
                        disabled={isProcessingPayment}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="CVV"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, "") })
                        }
                        inputProps={{ maxLength: 4 }}
                        disabled={isProcessingPayment}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    label="Cardholder Name"
                    placeholder="John Doe"
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                    disabled={isProcessingPayment}
                    fullWidth
                  />
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowPaymentForm(false);
                setPaymentData({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
              }}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompletePayment}
              variant="contained"
              color="success"
              disabled={
                isProcessingPayment ||
                (paymentMethod === "CARD" &&
                  (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName))
              }
              startIcon={isProcessingPayment ? <CircularProgress size={20} /> : <Icon icon="mdi:check" />}
            >
              {isProcessingPayment ? "Processing..." : "Complete Payment"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default function OrderStatusPage() {
  return (
    <ProtectedRoute>
      <OrderStatusPageContent />
    </ProtectedRoute>
  );
}
