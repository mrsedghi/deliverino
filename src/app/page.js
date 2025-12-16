"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Button,
  TextField,
  Skeleton,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Slide,
  Snackbar,
} from "@mui/material";
import { Icon } from "@iconify/react";

const SlideUp = (props) => <Slide direction="up" {...props} />;

const MapWithSearch = dynamic(() => import("@/components/map/MapWithSearch"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Typography color="text.secondary">Loading map...</Typography>
    </Box>
  ),
});

export default function Home() {
  const { user, isAuthenticated, isLoading, isProfileComplete, logout, token, refreshUser } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSavedOpen, setProfileSavedOpen] = useState(false);
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [nationalCodeDraft, setNationalCodeDraft] = useState("");

  useEffect(() => {
    if (profileMenuOpen) {
      setFullNameDraft(user?.fullName || "");
      setNationalCodeDraft(user?.nationalCode || "");
      setProfileError("");
    }
  }, [profileMenuOpen, user?.fullName, user?.nationalCode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Enforce profile completion
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isProfileComplete) {
      router.push("/profile-completion");
    }
  }, [isLoading, isAuthenticated, isProfileComplete, router]);

  // Load orders when profile menu opens
  useEffect(() => {
    if (profileMenuOpen && activeTab === 0 && token) {
      loadOrders();
    }
  }, [profileMenuOpen, activeTab, token]);

  const loadOrders = async () => {
    if (!token) return;
    setIsLoadingOrders(true);
    setOrdersError("");
    try {
      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load orders");
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrdersError("Failed to load order history");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "default",
      ACCEPTED: "info",
      IN_PROGRESS: "primary",
      PICKED_UP: "warning",
      IN_TRANSIT: "warning",
      DELIVERED: "success",
      CANCELLED: "error",
      FAILED: "error",
      DISPATCHING: "info",
      ESCALATE: "error",
    };
    return colors[status] || "default";
  };

  const statusLabel = (status) => {
    const map = {
      PENDING: "Pending",
      DISPATCHING: "Dispatching",
      ACCEPTED: "Accepted",
      IN_PROGRESS: "To pickup",
      PICKED_UP: "Picked up",
      IN_TRANSIT: "In transit",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
      FAILED: "Failed",
      ESCALATE: "Escalate",
    };
    return map[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canSaveProfile = useMemo(() => {
    const n = (nationalCodeDraft || "").trim();
    const f = (fullNameDraft || "").trim();
    return f.length >= 2 && /^\d{8,20}$/.test(n);
  }, [fullNameDraft, nationalCodeDraft]);

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!canSaveProfile) {
      setProfileError("Please enter a valid full name and national code (8-20 digits).");
      return;
    }
    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullNameDraft,
          nationalCode: nationalCodeDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      await refreshUser();
      setProfileSavedOpen(true);
    } catch (e) {
      setProfileError(e.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!isProfileComplete) {
    return null; // Will redirect
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* User info card - Top right corner */}
      <Paper
        elevation={4}
        onClick={() => setProfileMenuOpen(true)}
        sx={{
          position: "absolute",
          top: { xs: 56, sm: 16 }, // Move down on mobile to avoid search bar
          right: { xs: 8, sm: 16 },
          zIndex: 3000,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          minWidth: { xs: 140, sm: 200 },
          maxWidth: { xs: 180, sm: 320 },
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <Box sx={{ p: { xs: 1, sm: 1.5 }, display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
          <Avatar 
            sx={{ 
              bgcolor: "primary.main", 
              width: { xs: 28, sm: 40 }, 
              height: { xs: 28, sm: 40 },
              fontSize: { xs: "0.75rem", sm: "1rem" },
              fontWeight: "bold",
            }}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0, display: { xs: "none", sm: "block" } }}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold"
              noWrap
              sx={{ lineHeight: 1.2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              {user?.fullName || "User"}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              noWrap
              sx={{ fontSize: "0.7rem", display: "block" }}
            >
              {user?.phone}
            </Typography>
          </Box>
          <IconButton
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            sx={{
              bgcolor: "error.main",
              color: "error.contrastText",
              "&:hover": {
                bgcolor: "error.dark",
              },
              width: { xs: 26, sm: 32 },
              height: { xs: 26, sm: 32 },
            }}
            title="Logout"
          >
            <Icon icon="mdi:logout" width={16} style={{ fontSize: { xs: "14px", sm: "18px" } }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Profile Menu Dialog */}
      <Dialog
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        fullScreen={isMobile}
        TransitionComponent={SlideUp}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: isMobile ? "100vh" : "90vh",
            borderRadius: isMobile ? "18px 18px 0 0" : 2,
            m: isMobile ? 0 : 2,
            position: isMobile ? "fixed" : "relative",
            bottom: isMobile ? 0 : "auto",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(18,18,18,0.95)"
                : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.25, pt: isMobile ? 1.25 : 2 }}>
          {isMobile && (
            <Box
              sx={{
                width: 44,
                height: 4,
                borderRadius: 999,
                bgcolor: "divider",
                mx: "auto",
                mb: 1,
              }}
            />
          )}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontWeight: 800 }}>
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={900} noWrap>
                  {user?.fullName || "Profile"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.phone}
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setProfileMenuOpen(false)} title="Close">
              <Icon icon="mdi:close" />
            </IconButton>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mt: 1.25 }}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Orders" icon={<Icon icon="mdi:history" />} iconPosition="start" />
            <Tab label="Settings" icon={<Icon icon="mdi:cog" />} iconPosition="start" />
          </Tabs>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 1.5, sm: 2 }, pb: 0 }}>

          {/* Order History Tab */}
          {activeTab === 0 && (
            <Box sx={{ pb: isMobile ? "calc(env(safe-area-inset-bottom) + 12px)" : 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Your recent orders
                </Typography>
                <IconButton size="small" onClick={loadOrders} disabled={isLoadingOrders} title="Refresh">
                  <Icon icon="mdi:refresh" />
                </IconButton>
              </Box>

              {ordersError && <Alert severity="error">{ordersError}</Alert>}

              {isLoadingOrders && (
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Card key={i} variant="outlined">
                      <CardContent>
                        <Stack spacing={1}>
                          <Skeleton variant="text" width="55%" />
                          <Skeleton variant="text" width="35%" />
                          <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              {!isLoadingOrders && !ordersError && orders.length === 0 && (
                <Card variant="outlined" sx={{ mt: 1 }}>
                  <CardContent>
                    <Stack spacing={1.25} alignItems="flex-start">
                      <Typography variant="subtitle1" fontWeight={800}>
                        No orders yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create your first delivery by selecting origin and destination on the map.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => setProfileMenuOpen(false)}
                        startIcon={<Icon icon="mdi:map-marker" />}
                      >
                        Create order
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {!isLoadingOrders && !ordersError && orders.length > 0 && (
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      variant="outlined"
                      sx={{
                        borderColor: "divider",
                        "&:hover": { boxShadow: 2, borderColor: "primary.main" },
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        router.push(`/orders/${order.id}`);
                        setProfileMenuOpen(false);
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2" fontWeight={900} noWrap>
                                #{order.id.slice(0, 8)}
                              </Typography>
                              <Chip
                                size="small"
                                label={statusLabel(order.status)}
                                color={getStatusColor(order.status)}
                                variant="outlined"
                              />
                              {order.mode && (
                                <Chip size="small" label={order.mode} variant="outlined" />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.25 }}>
                              {formatDate(order.createdAt)}
                              {order.fare ? ` • $${order.fare.toFixed(2)}` : ""}
                            </Typography>
                          </Box>
                          <Icon icon="mdi:chevron-right" />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 1 && (
            <Box sx={{ pb: isMobile ? "calc(env(safe-area-inset-bottom) + 12px)" : 2 }}>
              <Stack spacing={1.25}>
                {profileError && <Alert severity="error">{profileError}</Alert>}
                <Card variant="outlined">
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={900} gutterBottom>
                      Account
                    </Typography>
                    <Stack spacing={1.25}>
                      <TextField
                        label="Full name"
                        value={fullNameDraft}
                        onChange={(e) => setFullNameDraft(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={profileSaving}
                      />
                      <TextField
                        label="National code"
                        value={nationalCodeDraft}
                        onChange={(e) =>
                          setNationalCodeDraft(
                            e.target.value.replace(/\D/g, "").slice(0, 20)
                          )
                        }
                        fullWidth
                        size="small"
                        disabled={profileSaving}
                        inputProps={{ inputMode: "numeric" }}
                        helperText="Digits only (8-20)"
                      />
                      <TextField
                        label="Phone"
                        value={user?.phone || ""}
                        fullWidth
                        size="small"
                        disabled
                      />
                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={!canSaveProfile || profileSaving}
                        startIcon={
                          profileSaving ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <Icon icon="mdi:content-save" />
                          )
                        }
                      >
                        {profileSaving ? "Saving..." : "Save changes"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

                <Card variant="outlined">
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={900} gutterBottom>
                      Security
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Icon icon="mdi:logout" />}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 1.5, sm: 2 },
            pb: { xs: "calc(env(safe-area-inset-bottom) + 10px)", sm: 2 },
            pt: 1,
          }}
        >
          <Button onClick={() => setProfileMenuOpen(false)} variant="text" startIcon={<Icon icon="mdi:close" />}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={profileSavedOpen}
        autoHideDuration={2200}
        onClose={() => setProfileSavedOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setProfileSavedOpen(false)} severity="success" variant="filled">
          Profile updated
        </Alert>
      </Snackbar>

      {/* Map */}
      <Box sx={{ width: "100%", height: "100vh" }}>
        <MapWithSearch />
      </Box>
    </Box>
  );
}
