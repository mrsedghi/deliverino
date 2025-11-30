"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { fixLeafletIcons } from "../../lib/leafletFix";

const LeafletMap = dynamic(() => import("./MapCore"), {
  ssr: false,
});

export default function MapView() {
  // Fix Leaflet icons on client side only
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  return (
    <div className="w-full h-[100vh]">
      <LeafletMap />
    </div>
  );
}

const LeafletMap = dynamic(() => import("./MapCore"), {
  ssr: false,
});

export default function MapView() {
  return (
    <div className="w-full h-[100vh]">
      <LeafletMap />
    </div>
  );
}

