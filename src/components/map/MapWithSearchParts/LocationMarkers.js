"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon as LeafletIcon } from "leaflet";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

export default function LocationMarkers({ origin, destination }) {
  // Create enhanced custom icons for origin and destination with shadows
  const originIcon = new LeafletIcon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="12" fill="#10b981" filter="url(#shadow)"/>
        <circle cx="20" cy="20" r="8" fill="#ffffff"/>
        <path d="M20 2C13.37 2 8 7.37 8 14c0 7 12 22 12 22s12-15 12-22c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#10b981" opacity="0.9"/>
      </svg>
    `),
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
    className: "custom-marker-origin",
  });

  const destinationIcon = new LeafletIcon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
        <defs>
          <filter id="shadow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="12" fill="#ef4444" filter="url(#shadow-red)"/>
        <circle cx="20" cy="20" r="8" fill="#ffffff"/>
        <path d="M20 2C13.37 2 8 7.37 8 14c0 7 12 22 12 22s12-15 12-22c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#ef4444" opacity="0.9"/>
      </svg>
    `),
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
    className: "custom-marker-destination",
  });

  return (
    <>
      {origin && (
        <Marker
          position={[origin.lat, origin.lng]}
          icon={originIcon}
          zIndexOffset={1000}
        >
          <Popup closeButton={true} autoPan={true} className="custom-popup">
            <Box sx={{ p: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon
                  icon="mdi:map-marker"
                  width={20}
                  height={20}
                  style={{ color: "#10b981" }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  Origin Point
                </Typography>
              </Box>
            </Box>
          </Popup>
        </Marker>
      )}
      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
          zIndexOffset={1001}
        >
          <Popup closeButton={true} autoPan={true} className="custom-popup">
            <Box sx={{ p: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon
                  icon="mdi:map-marker-check"
                  width={20}
                  height={20}
                  style={{ color: "#ef4444" }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  Destination Point
                </Typography>
              </Box>
            </Box>
          </Popup>
        </Marker>
      )}
    </>
  );
}


