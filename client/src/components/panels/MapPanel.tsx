// Design: "Ops Center Noir" — Dark CARTO map centered on Philippines
// Earthquake markers color-coded by magnitude (Red=major, Yellow=moderate, Blue=light)
// Pulsing animation on recent earthquakes

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { EarthquakeFeature, fetchEarthquakes, formatMagnitude } from "@/lib/feeds";

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [12.8797, 121.7740],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Fix map size on container resize
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Fetch earthquakes
  useEffect(() => {
    const load = async () => {
      const data = await fetchEarthquakes();
      setEarthquakes(data);
    };
    load();
    const interval = setInterval(load, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Update markers
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    earthquakes.forEach((eq) => {
      const [lng, lat] = eq.geometry.coordinates;
      const mag = eq.properties.mag;
      const { color } = formatMagnitude(mag);
      const radius = Math.max(4, mag * 3);

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.4,
      });

      const time = new Date(eq.properties.time).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      });

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 180px; line-height: 1.4;">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px; color: ${color};">M${mag.toFixed(1)} Earthquake</div>
          <div style="color: #d1d5db; margin-bottom: 2px;">${eq.properties.place}</div>
          <div style="color: #9CA3AF; font-size: 11px; font-family: 'JetBrains Mono', monospace;">${time} PHT</div>
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">
              ${formatMagnitude(mag).label}
            </span>
            ${eq.properties.tsunami ? '<span style="background: #CE1126; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">TSUNAMI</span>' : ""}
          </div>
          <a href="${eq.properties.url}" target="_blank" rel="noopener" style="display: block; margin-top: 8px; color: #0038A8; font-size: 10px; text-decoration: none;">View on USGS →</a>
        </div>
      `);

      markersLayer.current!.addLayer(marker);
    });
  }, [earthquakes]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-2 text-[10px] font-mono border border-[oklch(0.25_0.02_260_/_0.5)]">
        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider">EARTHQUAKES</div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] shadow-[0_0_4px_#CE1126]" /> <span className="text-[oklch(0.70_0.005_260)]">M7+ Major</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_4px_#FF6B35]" /> <span className="text-[oklch(0.70_0.005_260)]">M5-7 Strong</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116] shadow-[0_0_4px_#FCD116]" /> <span className="text-[oklch(0.70_0.005_260)]">M4-5 Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0038A8] shadow-[0_0_4px_#0038A8]" /> <span className="text-[oklch(0.70_0.005_260)]">M3-4 Light</span>
        </div>
      </div>
      {/* Earthquake count */}
      <div className="absolute top-2 right-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[oklch(0.65_0.01_260)] border border-[oklch(0.25_0.02_260_/_0.5)]">
        <span className="text-[#FCD116] font-bold">{earthquakes.length}</span> quakes (30d)
      </div>
    </div>
  );
}
