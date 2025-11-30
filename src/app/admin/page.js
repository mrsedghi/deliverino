"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  Skeleton,
  Snackbar,
} from "@mui/material";
import { Icon } from "@iconify/react";

function AdminPageContent() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Check authorization and load data
  useEffect(() => {
    if (!token) return;

    const checkAuthAndLoad = async () => {
      try {
        const statsResponse = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.status === 403 || statsResponse.status === 401) {
          setIsAuthorized(false);
          setIsLoading(false);
          setSnackbarMessage("Access denied. Admin privileges required.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          router.push("/");
          return;
        }

        if (!statsResponse.ok) {
          throw new Error("Failed to verify authorization");
        }

        const statsData = await statsResponse.json();
        setStats(statsData);
        setIsAuthorized(true);
        setIsLoadingStats(false);

        const settingsResponse = await fetch("/api/admin/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSettings(settingsData.settings || []);
        }
        setIsLoadingSettings(false);
      } catch (error) {
        console.error("Error loading admin data:", error);
        setIsAuthorized(false);
        setIsLoading(false);
        setSnackbarMessage(`Error loading admin data: ${error.message}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [token, router]);

  // Refresh stats
  const refreshStats = async () => {
    if (!token) return;

    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
      setSnackbarMessage("Statistics refreshed successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error refreshing stats:", error);
      setSnackbarMessage(`Failed to refresh statistics: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Save setting
  const saveSetting = async (key, value) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }
      setSnackbarMessage(`Setting "${key}" saved successfully!`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      const settingsResponse = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.settings || []);
      }
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      setSnackbarMessage(`Failed to save setting "${key}": ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettingValue = (key, newValue) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
    );
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
            Loading...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  // Default settings structure
  const defaultSettings = [
    {
      key: "max_distance_by_mode",
      label: "Max Distance by Mode (km)",
      description: "Maximum distance allowed for each delivery mode",
      defaultValue: {
        WALKING: 2,
        SCOOTER: 5,
        BICYCLE: 10,
        MOTORCYCLE: 50,
        CAR: 100,
      },
    },
    {
      key: "max_duration_by_mode",
      label: "Max Duration by Mode (minutes)",
      description: "Maximum duration allowed for each delivery mode",
      defaultValue: {
        WALKING: 30,
        SCOOTER: 20,
        BICYCLE: 45,
        MOTORCYCLE: 60,
        CAR: 90,
      },
    },
    {
      key: "mode_speed_kmph",
      label: "Mode Speed (km/h)",
      description: "Average speed for each delivery mode",
      defaultValue: {
        WALKING: 5,
        SCOOTER: 15,
        BICYCLE: 20,
        MOTORCYCLE: 40,
        CAR: 50,
      },
    },
    {
      key: "min_fare_by_mode",
      label: "Min Fare by Mode ($)",
      description: "Minimum fare for each delivery mode",
      defaultValue: {
        WALKING: 5,
        SCOOTER: 8,
        BICYCLE: 10,
        MOTORCYCLE: 15,
        CAR: 20,
      },
    },
    {
      key: "fare_base",
      label: "Base Fare ($)",
      description: "Base fare amount",
      defaultValue: 5,
    },
    {
      key: "fare_per_km",
      label: "Fare per Kilometer ($)",
      description: "Additional fare per kilometer",
      defaultValue: 1.5,
    },
    {
      key: "fare_per_minute",
      label: "Fare per Minute ($)",
      description: "Additional fare per minute",
      defaultValue: 0.1,
    },
  ];

  // Merge default settings with loaded settings
  const allSettings = defaultSettings.map((defaultSetting) => {
    const loaded = settings.find((s) => s.key === defaultSetting.key);
    return {
      ...defaultSetting,
      value: loaded?.value || defaultSetting.defaultValue,
      id: loaded?.id,
    };
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
                Admin Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.name || "Admin"} • {user?.phone}
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

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Total Orders
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width={100} height={48} />
                ) : (
                  <Typography variant="h4" component="div" color="primary.main" fontWeight="bold">
                    {stats?.totalOrders || 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Active Couriers
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width={100} height={48} />
                ) : (
                  <Typography variant="h4" component="div" color="success.main" fontWeight="bold">
                    {stats?.activeCouriers || 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Total Revenue
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width={100} height={48} />
                ) : (
                  <Typography variant="h4" component="div" color="secondary.main" fontWeight="bold">
                    ${stats?.totalRevenue?.toFixed(2) || "0.00"}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Settings Management */}
        <Paper elevation={2} sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
              App Settings
            </Typography>
            <Button
              variant="contained"
              onClick={refreshStats}
              disabled={isLoadingSettings}
              startIcon={<Icon icon="mdi:refresh" />}
            >
              {isLoadingSettings ? "Loading..." : "Refresh Settings"}
            </Button>
          </Box>

          {isLoadingSettings ? (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {allSettings.map((setting) => (
                <Box
                  key={setting.key}
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    pb: 3,
                    "&:last-child": { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Typography variant="h6" gutterBottom color="text.primary">
                    {setting.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {setting.description}
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
                    <TextField
                      fullWidth
                      multiline
                      rows={
                        typeof setting.value === "object"
                          ? Math.min(10, JSON.stringify(setting.value, null, 2).split("\n").length)
                          : 1
                      }
                      value={
                        typeof setting.value === "object"
                          ? JSON.stringify(setting.value, null, 2)
                          : setting.value
                      }
                      onChange={(e) => {
                        try {
                          const parsed = typeof setting.value === "object" ? JSON.parse(e.target.value) : parseFloat(e.target.value) || 0;
                          updateSettingValue(setting.key, parsed);
                        } catch {
                          updateSettingValue(setting.key, e.target.value);
                        }
                      }}
                      variant="outlined"
                      sx={{ flexGrow: 1, fontFamily: "monospace" }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => saveSetting(setting.key, setting.value)}
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={20} /> : <Icon icon="mdi:content-save" />}
                      sx={{ minWidth: 100 }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminPageContent />
    </ProtectedRoute>
  );
}
