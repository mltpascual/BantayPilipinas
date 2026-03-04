// Design: "Ops Center Noir" — Dark CARTO map centered on Philippines
// Earthquake markers color-coded by magnitude (Red=major, Yellow=moderate, Blue=light)
// Typhoon tracker overlay with animated pulsing storm icons and wind radius circles
// Toggle controls for earthquake and typhoon layers

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  EarthquakeFeature,
  TyphoonData,
  fetchEarthquakes,
  fetchTyphoons,
  formatMagnitude,
  getTyphoonColor,
  getTyphoonCategory,
} from "@/lib/feeds";

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const earthquakeLayer = useRef<L.LayerGroup | null>(null);
  const typhoonLayer = useRef<L.LayerGroup | null>(null);
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [typhoons, setTyphoons] = useState<TyphoonData[]>([]);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showTyphoons, setShowTyphoons] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [12.8797, 121.774],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    earthquakeLayer.current = L.layerGroup().addTo(map);
    typhoonLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

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

  // Fetch data
  useEffect(() => {
    const loadEQ = async () => {
      const data = await fetchEarthquakes();
      setEarthquakes(data);
    };
    const loadTC = async () => {
      const data = await fetchTyphoons();
      setTyphoons(data);
    };
    loadEQ();
    loadTC();
    const eqInterval = setInterval(loadEQ, 300000);
    const tcInterval = setInterval(loadTC, 600000); // 10 min
    return () => {
      clearInterval(eqInterval);
      clearInterval(tcInterval);
    };
  }, []);

  // Update earthquake markers
  useEffect(() => {
    if (!earthquakeLayer.current) return;
    earthquakeLayer.current.clearLayers();
    if (!showEarthquakes) return;

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

      earthquakeLayer.current!.addLayer(marker);
    });
  }, [earthquakes, showEarthquakes]);

  // Update typhoon markers
  useEffect(() => {
    if (!typhoonLayer.current || !mapInstance.current) return;
    typhoonLayer.current.clearLayers();
    if (!showTyphoons) return;

    typhoons.forEach((tc) => {
      const color = getTyphoonColor(tc.alertLevel, tc.windSpeed);
      const cat = getTyphoonCategory(tc.windSpeed);

      // Outer pulsing wind radius circle
      const windRadiusKm = Math.max(100, tc.windSpeed * 1.5);
      const windCircle = L.circle([tc.lat, tc.lon], {
        radius: windRadiusKm * 1000,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.25,
        fillOpacity: 0.08,
        dashArray: "8 6",
        className: "typhoon-radius-pulse",
      });
      typhoonLayer.current!.addLayer(windCircle);

      // Inner storm eye circle
      const eyeCircle = L.circle([tc.lat, tc.lon], {
        radius: 30000,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.2,
        className: "typhoon-eye-pulse",
      });
      typhoonLayer.current!.addLayer(eyeCircle);

      // Custom typhoon icon using divIcon
      const typhoonIcon = L.divIcon({
        className: "typhoon-marker",
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div class="typhoon-spin" style="font-size:28px; filter: drop-shadow(0 0 8px ${color});">🌀</div>
            <div style="position:absolute; top:-16px; left:50%; transform:translateX(-50%); white-space:nowrap; background:${color}; color:#fff; font-size:9px; font-weight:700; padding:1px 5px; border-radius:3px; font-family:'JetBrains Mono',monospace; letter-spacing:0.03em;">
              ${tc.name}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([tc.lat, tc.lon], { icon: typhoonIcon });

      const windStr = tc.windSpeed.toFixed(0);
      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 220px; line-height: 1.5;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
            <span style="font-size:22px;">🌀</span>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: ${color};">${tc.name}</div>
              <div style="font-size:10px; color:#9CA3AF;">${cat}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:8px; margin-bottom:6px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#9CA3AF; font-size:10px;">Wind Speed</span>
              <span style="color:#fff; font-weight:600; font-family:'JetBrains Mono',monospace; font-size:12px;">${windStr} km/h</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#9CA3AF; font-size:10px;">Position</span>
              <span style="color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px;">${tc.lat.toFixed(1)}°, ${tc.lon.toFixed(1)}°</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#9CA3AF; font-size:10px;">Alert Level</span>
              <span style="background:${color}; color:white; padding:1px 6px; border-radius:3px; font-size:10px; font-weight:600;">${tc.alertLevel}</span>
            </div>
          </div>
          <div style="color:#9CA3AF; font-size:10px; margin-bottom:4px;">Affecting: ${tc.country || "Open ocean"}</div>
          <a href="${tc.link}" target="_blank" rel="noopener" style="display:block; color:#0038A8; font-size:10px; text-decoration:none;">View on GDACS →</a>
        </div>
      `);

      typhoonLayer.current!.addLayer(marker);

      // Draw bounding box if available
      if (tc.bbox) {
        const [lonMin, lonMax, latMin, latMax] = tc.bbox;
        const bounds: L.LatLngBoundsExpression = [
          [latMin, lonMin],
          [latMax, lonMax],
        ];
        const rect = L.rectangle(bounds, {
          color: color,
          weight: 1,
          opacity: 0.15,
          fillOpacity: 0.03,
          dashArray: "4 4",
        });
        typhoonLayer.current!.addLayer(rect);
      }
    });
  }, [typhoons, showTyphoons]);

  const toggleEarthquakes = useCallback(() => setShowEarthquakes((v) => !v), []);
  const toggleTyphoons = useCallback(() => setShowTyphoons((v) => !v), []);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />

      {/* Layer toggle controls */}
      <div className="absolute top-2 left-12 z-[1000] flex gap-1.5">
        <button
          onClick={toggleEarthquakes}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold tracking-wider transition-all border ${
            showEarthquakes
              ? "bg-[oklch(0.15_0.02_260_/_0.9)] border-[#FCD116] text-[#FCD116] shadow-[0_0_6px_oklch(0.85_0.17_85_/_0.2)]"
              : "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
          }`}
          title="Toggle earthquake markers"
        >
          <span className="text-[11px]">🔴</span> EQ
        </button>
        <button
          onClick={toggleTyphoons}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold tracking-wider transition-all border ${
            showTyphoons
              ? "bg-[oklch(0.15_0.02_260_/_0.9)] border-[#FF6B35] text-[#FF6B35] shadow-[0_0_6px_oklch(0.65_0.15_30_/_0.2)]"
              : "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
          }`}
          title="Toggle typhoon tracker"
        >
          <span className="text-[11px]">🌀</span> TC
        </button>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-2 text-[10px] font-mono border border-[oklch(0.25_0.02_260_/_0.5)]">
        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider">
          EARTHQUAKES
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] shadow-[0_0_4px_#CE1126]" />
          <span className="text-[oklch(0.70_0.005_260)]">M7+ Major</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_4px_#FF6B35]" />
          <span className="text-[oklch(0.70_0.005_260)]">M5-7 Strong</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116] shadow-[0_0_4px_#FCD116]" />
          <span className="text-[oklch(0.70_0.005_260)]">M4-5 Moderate</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0038A8] shadow-[0_0_4px_#0038A8]" />
          <span className="text-[oklch(0.70_0.005_260)]">M3-4 Light</span>
        </div>
        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
          TYPHOONS
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px]">🌀</span>
          <span className="text-[oklch(0.70_0.005_260)]">Active Storm</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-0.5 bg-[#CE1126] rounded" />
          <span className="text-[oklch(0.70_0.005_260)]">Red Alert</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-0.5 bg-[#FF6B35] rounded" />
          <span className="text-[oklch(0.70_0.005_260)]">Orange Alert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#FCD116] rounded" />
          <span className="text-[oklch(0.70_0.005_260)]">Green Alert</span>
        </div>
      </div>

      {/* Counts badge */}
      <div className="absolute top-2 right-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[oklch(0.65_0.01_260)] border border-[oklch(0.25_0.02_260_/_0.5)] flex flex-col gap-0.5">
        <div>
          <span className="text-[#FCD116] font-bold">{earthquakes.length}</span>{" "}
          quakes (30d)
        </div>
        {typhoons.length > 0 && (
          <div>
            <span className="text-[#FF6B35] font-bold">{typhoons.length}</span>{" "}
            active storm{typhoons.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
