"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Box, Avatar, Typography, IconButton, Paper } from "@mui/material";
import { Icon } from "@iconify/react";

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

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

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* User info card - Top right corner */}
      <Paper
        elevation={4}
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
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0, display: { xs: "none", sm: "block" } }}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold"
              noWrap
              sx={{ lineHeight: 1.2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              {user?.name || "User"}
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
            onClick={logout}
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

      {/* Map */}
      <Box sx={{ width: "100%", height: "100vh" }}>
        <MapWithSearch />
      </Box>
    </Box>
  );
}
