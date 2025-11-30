"use client";

import dynamic from "next/dynamic";

const MapWithSearch = dynamic(() => import("@/components/map/MapWithSearch"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <MapWithSearch />
    </div>
  );
}
