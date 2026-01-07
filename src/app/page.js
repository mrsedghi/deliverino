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
  const {
    user,
    isAuthenticated,
    isLoading,
    isProfileComplete,
    logout,
    token,
    refreshUser,
  } = useAuth();
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
      setProfileError(
        "Please enter a valid full name and national code (8-20 digits)."
      );
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
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* User info card - Top right corner */}
      <Paper
        elevation={4}
        onClick={() => setProfileMenuOpen(true)}
        sx={{
          position: "absolute",
          top: { xs: 56, sm: 16 }, // Move down on mobile to avoid search bar
          right: { xs: 8, sm: 16 },
          zIndex: 3000,
          borderRadius: { xs: 2.5, sm: 2 },
          overflow: "hidden",
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(18,18,18,0.95)"
              : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          minWidth: { xs: 140, sm: 200 },
          maxWidth: { xs: 180, sm: 320 },
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          pointerEvents: "auto",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 1, sm: 1.5 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
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
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              display: { xs: "none", sm: "block" },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              noWrap
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
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
                transform: "scale(1.1)",
              },
              width: { xs: 28, sm: 36 },
              height: { xs: 28, sm: 36 },
              transition: "all 0.2s ease-in-out",
            }}
            title="Logout"
          >
            <Icon icon="mdi:logout" width={18} height={18} />
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
            maxHeight: isMobile ? "85vh" : "90vh",
            height: isMobile ? "85vh" : "auto",
            borderRadius: isMobile ? "24px 24px 0 0" : 2,
            m: isMobile ? 0 : 2,
            position: isMobile ? "fixed" : "relative",
            bottom: isMobile ? 0 : "auto",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(18,18,18,0.98)"
                : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(16px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1.25,
            pt: isMobile ? 1.5 : 2,
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(18,18,18,0.98)"
                : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(16px)",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ flex: 1, minWidth: 0 }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  fontWeight: 800,
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                }}
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: { xs: "0.9375rem", sm: "1rem" } }}
                >
                  {user?.fullName || "Profile"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.8125rem" } }}
                >
                  {user?.phone}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={() => setProfileMenuOpen(false)}
              title="Close"
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
              }}
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </IconButton>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mt: 1.5 }}
            variant={isMobile ? "fullWidth" : "standard"}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label="Orders"
              icon={<Icon icon="mdi:history" width={18} height={18} />}
              iconPosition="start"
              sx={{
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                minHeight: { xs: 48, sm: 48 },
              }}
            />
            <Tab
              label="Settings"
              icon={<Icon icon="mdi:cog" width={18} height={18} />}
              iconPosition="start"
              sx={{
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                minHeight: { xs: 48, sm: 48 },
              }}
            />
          </Tabs>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: 0,
            pt: 2,
            flex: 1,
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: { xs: 6, sm: 8 },
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
          }}
        >
          {/* Order History Tab */}
          {activeTab === 0 && (
            <Box
              sx={{
                pb: isMobile ? "calc(env(safe-area-inset-bottom) + 16px)" : 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                >
                  Your recent orders
                </Typography>
                <IconButton
                  size="small"
                  onClick={loadOrders}
                  disabled={isLoadingOrders}
                  title="Refresh"
                  sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                  }}
                >
                  <Icon
                    icon={
                      isLoadingOrders
                        ? "svg-spinners:3-dots-fade"
                        : "mdi:refresh"
                    }
                    width={20}
                    height={20}
                  />
                </IconButton>
              </Box>

              {ordersError && <Alert severity="error">{ordersError}</Alert>}

              {isLoadingOrders && (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      variant="outlined"
                      sx={{ bgcolor: "background.paper" }}
                    >
                      <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Skeleton variant="text" width={80} height={20} />
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{ borderRadius: 1 }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={60}
                              height={24}
                              sx={{ borderRadius: 1 }}
                            />
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Skeleton
                              variant="circular"
                              width={14}
                              height={14}
                            />
                            <Skeleton variant="text" width="60%" height={16} />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              {!isLoadingOrders && !ordersError && orders.length === 0 && (
                <Card
                  variant="outlined"
                  sx={{
                    mt: 1,
                    bgcolor: "background.paper",
                    borderColor: "divider",
                    "&:hover": {
                      boxShadow: 2,
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Stack
                      spacing={2}
                      alignItems="center"
                      sx={{ textAlign: "center", py: 1 }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          bgcolor: "action.hover",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          icon="mdi:package-variant"
                          width={32}
                          height={32}
                          style={{ opacity: 0.6 }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            fontSize: { xs: "1rem", sm: "1.125rem" },
                            mb: 0.5,
                          }}
                        >
                          No orders yet
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}
                        >
                          Create your first delivery by selecting origin and
                          destination on the map.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setProfileMenuOpen(false)}
                        startIcon={
                          <Icon icon="mdi:map-marker" width={20} height={20} />
                        }
                        sx={{
                          mt: 1,
                          py: { xs: 1.25, sm: 1 },
                          fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                          minHeight: { xs: 44, sm: 40 },
                        }}
                      >
                        Create order
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {!isLoadingOrders && !ordersError && orders.length > 0 && (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      variant="outlined"
                      sx={{
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        "&:hover": {
                          boxShadow: 4,
                          borderColor: "primary.main",
                          transform: "translateY(-2px)",
                        },
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                      }}
                      onClick={() => {
                        router.push(`/orders/${order.id}`);
                        setProfileMenuOpen(false);
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              sx={{ gap: 0.75, mb: 0.75 }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                noWrap
                                sx={{
                                  fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                                }}
                              >
                                #{order.id.slice(0, 8)}
                              </Typography>
                              <Chip
                                size="small"
                                label={statusLabel(order.status)}
                                color={getStatusColor(order.status)}
                                variant="outlined"
                                sx={{
                                  height: { xs: 24, sm: 22 },
                                  fontSize: { xs: "0.6875rem", sm: "0.625rem" },
                                  fontWeight: 600,
                                }}
                              />
                              {order.mode && (
                                <Chip
                                  size="small"
                                  label={order.mode}
                                  variant="outlined"
                                  sx={{
                                    height: { xs: 24, sm: 22 },
                                    fontSize: {
                                      xs: "0.6875rem",
                                      sm: "0.625rem",
                                    },
                                  }}
                                />
                              )}
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Icon
                                icon="mdi:clock-outline"
                                width={14}
                                height={14}
                                style={{ opacity: 0.6 }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                                }}
                              >
                                {formatDate(order.createdAt)}
                              </Typography>
                              {order.fare && (
                                <>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mx: 0.5 }}
                                  >
                                    •
                                  </Typography>
                                  <Icon
                                    icon="mdi:currency-usd"
                                    width={14}
                                    height={14}
                                    style={{ opacity: 0.6 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.primary"
                                    fontWeight={600}
                                    sx={{
                                      fontSize: {
                                        xs: "0.75rem",
                                        sm: "0.8125rem",
                                      },
                                    }}
                                  >
                                    ${order.fare.toFixed(2)}
                                  </Typography>
                                </>
                              )}
                            </Stack>
                          </Box>
                          <Icon
                            icon="mdi:chevron-right"
                            width={24}
                            height={24}
                            style={{ opacity: 0.5, flexShrink: 0 }}
                          />
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
            <Box
              sx={{
                pb: isMobile ? "calc(env(safe-area-inset-bottom) + 16px)" : 2,
              }}
            >
              <Stack spacing={2}>
                {profileError && (
                  <Alert
                    severity="error"
                    sx={{ fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}
                    onClose={() => setProfileError("")}
                  >
                    {profileError}
                  </Alert>
                )}
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
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={2}
                    >
                      <Icon
                        icon="mdi:account"
                        width={20}
                        height={20}
                        style={{ opacity: 0.7 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ fontSize: { xs: "0.9375rem", sm: "1rem" } }}
                      >
                        Account Information
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <TextField
                        label="Full name"
                        value={fullNameDraft}
                        onChange={(e) => setFullNameDraft(e.target.value)}
                        fullWidth
                        size={isMobile ? "medium" : "small"}
                        disabled={profileSaving}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <Icon
                              icon="mdi:account-outline"
                              width={20}
                              height={20}
                              style={{ marginRight: 8, opacity: 0.5 }}
                            />
                          ),
                        }}
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
                        size={isMobile ? "medium" : "small"}
                        disabled={profileSaving}
                        inputProps={{ inputMode: "numeric" }}
                        helperText="Digits only (8-20 characters)"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <Icon
                              icon="mdi:card-account-details-outline"
                              width={20}
                              height={20}
                              style={{ marginRight: 8, opacity: 0.5 }}
                            />
                          ),
                        }}
                      />
                      <TextField
                        label="Phone"
                        value={user?.phone || ""}
                        fullWidth
                        size={isMobile ? "medium" : "small"}
                        disabled
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <Icon
                              icon="mdi:phone-outline"
                              width={20}
                              height={20}
                              style={{ marginRight: 8, opacity: 0.5 }}
                            />
                          ),
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={!canSaveProfile || profileSaving}
                        startIcon={
                          profileSaving ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <Icon
                              icon="mdi:content-save"
                              width={20}
                              height={20}
                            />
                          )
                        }
                        sx={{
                          mt: 1,
                          py: { xs: 1.5, sm: 1.25 },
                          fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                          minHeight: { xs: 48, sm: 44 },
                          fontWeight: 600,
                        }}
                      >
                        {profileSaving ? "Saving..." : "Save changes"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

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
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={2}
                    >
                      <Icon
                        icon="mdi:shield-lock-outline"
                        width={20}
                        height={20}
                        style={{ opacity: 0.7 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ fontSize: { xs: "0.9375rem", sm: "1rem" } }}
                      >
                        Security
                      </Typography>
                    </Stack>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        <Icon icon="mdi:logout" width={20} height={20} />
                      }
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      fullWidth
                      sx={{
                        py: { xs: 1.25, sm: 1 },
                        fontSize: { xs: "0.9375rem", sm: "0.875rem" },
                        minHeight: { xs: 44, sm: 40 },
                        fontWeight: 600,
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
            px: { xs: 2, sm: 2.5 },
            pb: { xs: "calc(env(safe-area-inset-bottom) + 12px)", sm: 2 },
            pt: 1.5,
            position: "sticky",
            bottom: 0,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(18,18,18,0.98)"
                : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(16px)",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button
            onClick={() => setProfileMenuOpen(false)}
            variant="text"
            startIcon={<Icon icon="mdi:close" width={18} height={18} />}
            sx={{
              fontSize: { xs: "0.9375rem", sm: "0.875rem" },
              minHeight: { xs: 44, sm: 40 },
            }}
          >
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
        <Alert
          onClose={() => setProfileSavedOpen(false)}
          severity="success"
          variant="filled"
        >
          Profile updated
        </Alert>
      </Snackbar>

      {/* Map */}
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <MapWithSearch />
      </Box>
    </Box>
  );
}
