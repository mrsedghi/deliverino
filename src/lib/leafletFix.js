// Leaflet icon fix for Next.js SSR
// This function should only be called in client components via useEffect
let iconsFixed = false;

export function fixLeafletIcons() {
  if (typeof window === "undefined" || iconsFixed) return;
  
  iconsFixed = true;

  // Use dynamic import to avoid SSR issues
  import("leaflet").then((L) => {
    import("leaflet/dist/images/marker-icon-2x.png").then((markerIcon2x) => {
      import("leaflet/dist/images/marker-icon.png").then((markerIcon) => {
        import("leaflet/dist/images/marker-shadow.png").then((markerShadow) => {
          delete L.default.Icon.Default.prototype._getIconUrl;
          L.default.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIcon2x.default.src,
            iconUrl: markerIcon.default.src,
            shadowUrl: markerShadow.default.src,
          });
        });
      });
    });
  });
}

