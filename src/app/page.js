"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Box, Avatar, Typography, Button, AppBar, Toolbar, Stack } from "@mui/material";
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
      {/* Header with user info and logout */}
      <AppBar
        position="absolute"
        sx={{
          top: 16,
          left: 16,
          right: 16,
          width: "auto",
          maxWidth: 400,
          borderRadius: 2,
          zIndex: 3000,
        }}
      >
        <Toolbar>
          <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.name || "User"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.phone}
            </Typography>
          </Box>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={logout}
            startIcon={<Icon icon="mdi:logout" />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Map */}
      <Box sx={{ width: "100%", height: "100vh" }}>
        <MapWithSearch />
      </Box>
    </Box>
  );
}
