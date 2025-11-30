"use client";
import dynamic from "next/dynamic";
import "../../lib/leafletFix";

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

