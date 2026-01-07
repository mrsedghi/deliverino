"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { useMap, useMapEvents } from "react-leaflet";

export default function FixedCenterPin({ onCenterChange, onMovingChange }) {
  const map = useMap();
  const [currentCenter, setCurrentCenter] = useState(() => {
    const center = map.getCenter();
    return [center.lat, center.lng];
  });

  useMapEvents({
    // Click anywhere to move the map center under the pin
    click: (e) => {
      map.panTo(e.latlng, { animate: true, duration: 0.25 });
    },
    // Track movement so we can block "Confirm" while inertia/animation is still running
    movestart: () => {
      onMovingChange?.(true);
    },
    // Use moveend so the stored center matches what the user actually confirms
    moveend: () => {
      const center = map.getCenter();
      const newCenter = [center.lat, center.lng];
      setCurrentCenter(newCenter);
      onCenterChange?.(newCenter);
      onMovingChange?.(false);
    },
  });

  return (
    <>
      {/* Center dot: exact selection point */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: "common.white",
          border: "2px solid #3B82F6",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          zIndex: 999,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          transformOrigin: "50% 100%", // pin tip stays anchored while animating
          zIndex: 1000,
          pointerEvents: "none",
          filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
          animation: "pulse 2s ease-in-out infinite",
          "@keyframes pulse": {
            "0%, 100%": {
              transform: "translate(-50%, -100%) scale(1)",
            },
            "50%": {
              transform: "translate(-50%, -100%) scale(1.04)",
            },
          },
        }}
        aria-hidden="true"
      >
        {/* Custom SVG pin for better tip alignment */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="48"
          viewBox="0 0 18 24"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))" }}
        >
          <path
            d="M18 8.4c0 4.2-5.2 12-9 12S0 12.6 0 8.4C0 3.8 3.8 0 9 0s9 3.8 9 8.4Z"
            fill="#3B82F6"
            transform="translate(0 24) scale(1,-1)"
          />
          <path
            d="M12 8.4c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3Z"
            fill="#ffffff"
          />
        </svg>
      </Box>
    </>
  );
}


