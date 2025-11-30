"use client";

import { MapContainer, TileLayer } from "react-leaflet";

export default function MapCore() {
  return (
    <MapContainer
      center={[35.6892, 51.3890]}   // Tehran default
      zoom={13}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url={process.env.NEXT_PUBLIC_OSM_TILE_URL}
        attribution="&copy; OpenStreetMap contributors"
      />
    </MapContainer>
  );
}

