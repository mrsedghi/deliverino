"use client";

import dynamic from "next/dynamic";
import "../lib/leafletFix";

const MapWithSearch = dynamic(() => import("@/components/map/MapWithSearch"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <MapWithSearch />
    </div>
  );
}
