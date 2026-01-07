"use client";

import { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import FixedCenterPin from "./FixedCenterPin";

export default function MapWrapper({ center, setCenter, onMovingChange }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  // Ensure map is interactive
  useEffect(() => {
    if (!map) return;

    if (!map.dragging.enabled()) map.dragging.enable();
    if (!map.touchZoom.enabled()) map.touchZoom.enable();

    const container = map.getContainer();
    if (!container) return;

    container.style.cursor = "grab";
    const onDown = () => {
      container.style.cursor = "grabbing";
    };
    const onUp = () => {
      container.style.cursor = "grab";
    };
    container.addEventListener("mousedown", onDown);
    container.addEventListener("mouseup", onUp);

    return () => {
      container.removeEventListener("mousedown", onDown);
      container.removeEventListener("mouseup", onUp);
    };
  }, [map]);

  const handleCenterChange = useCallback(
    (newCenter) => {
      setCenter(newCenter);
    },
    [setCenter]
  );

  return (
    <FixedCenterPin
      onCenterChange={handleCenterChange}
      onMovingChange={onMovingChange}
    />
  );
}


