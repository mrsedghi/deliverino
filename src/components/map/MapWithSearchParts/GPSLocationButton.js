"use client";

import { useState } from "react";
import { Box, Paper, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { useMap } from "react-leaflet";

export default function GPSLocationButton({ onLocationFound, onNotify }) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      onNotify?.("Geolocation is not supported by your browser.", "warning");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
        onLocationFound?.([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        onNotify?.(
          "Failed to get your location. Please enable location permissions.",
          "error"
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
        marginTop: { xs: "132px", sm: "96px" },
        marginRight: { xs: "12px", sm: "20px" },
        zIndex: 1500,
      }}
    >
      <Tooltip title="Use my current location" arrow placement="left">
        <Paper
          elevation={4}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            "&:hover": {
              boxShadow: 6,
              transform: "scale(1.05)",
              transition: "all 0.2s ease-in-out",
            },
          }}
        >
          <IconButton
            onClick={handleGetLocation}
            disabled={isLocating}
            size={isMobile ? "medium" : "small"}
            sx={{
              bgcolor: "background.paper",
              width: { xs: 44, sm: 40 },
              height: { xs: 44, sm: 40 },
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            aria-label="Get current location"
          >
            {isLocating ? (
              <Icon
                icon="svg-spinners:3-dots-fade"
                width={isMobile ? 28 : 24}
                height={isMobile ? 28 : 24}
              />
            ) : (
              <Icon
                icon="mdi:crosshairs-gps"
                width={isMobile ? 28 : 24}
                height={isMobile ? 28 : 24}
              />
            )}
          </IconButton>
        </Paper>
      </Tooltip>
    </Box>
  );
}


