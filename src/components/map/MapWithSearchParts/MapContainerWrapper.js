"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import { useTheme } from "@mui/material";
import MapWrapper from "./MapWrapper";
import GPSLocationButton from "./GPSLocationButton";
import LocationMarkers from "./LocationMarkers";

export default function MapContainerWrapper({
  center,
  setCenter,
  onLocationFound,
  origin,
  destination,
  mapStyle,
  onNotify,
  onMapCreated,
  onMovingChange,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <MapContainer
      center={center || [35.6892, 51.389]}
      zoom={13}
      style={{
        height: "100%",
        width: "100%",
        cursor: "grab",
        zIndex: 0,
      }}
      whenCreated={(map) => onMapCreated?.(map)}
      zoomControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      dragging={true}
      inertia={true}
      inertiaDeceleration={3000}
      inertiaMaxSpeed={1500}
      easeLinearity={0.25}
      worldCopyJump={false}
      preferCanvas={false}
      className="map-container-interactive"
    >
      <TileLayer
        url={mapStyle.url}
        attribution={mapStyle.attribution}
        maxZoom={19}
        minZoom={2}
        tileSize={256}
        zoomOffset={0}
      />

      <MapWrapper center={center} setCenter={setCenter} onMovingChange={onMovingChange} />
      <GPSLocationButton onLocationFound={onLocationFound} onNotify={onNotify} />
      <LocationMarkers origin={origin} destination={destination} />
    </MapContainer>
  );
}


