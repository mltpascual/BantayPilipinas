// PH Mission Control — Map Panel (MapLibre GL JS)
// Features: Earthquake markers, Typhoon tracker with forecast tracks, Water levels,
// NOAH Hazard overlays (Flood, Landslide, Storm Surge), Volcano Hazard Zones,
// RainViewer Weather Radar, Province search/zoom, Full-screen mode, Alert banner

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  EarthquakeFeature,
  TyphoonData,
  WaterLevelStation,
  fetchEarthquakes,
  fetchTyphoons,
  fetchWaterLevels,
  fetchTyphoonTrack,
  formatMagnitude,
  getTyphoonColor,
  getTyphoonCategory,
  getWaterLevelColor,
} from "@/lib/feeds";
import { searchProvinces, type Province } from "@/lib/provinces";

// Light basemap style (CARTO Voyager — clean white map like UP Project NOAH)
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Critical facilities GeoJSON from NOAH S3
const CRITICAL_FACILITIES = {
  hospitals: "https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/hospitals.geojson",
  schools: "https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/schools.geojson",
};

// NOAH Hazard GeoJSON files (Nationwide, 81 provinces simplified)
const NOAH_HAZARDS = {
  flood: "https://d2xsxph8kpxj0f.cloudfront.net/310519663343684150/bv7KxrQPggRZjkjamxW5FG/flood_nationwide_8c683cdc.geojson",
  landslide: "https://d2xsxph8kpxj0f.cloudfront.net/310519663343684150/bv7KxrQPggRZjkjamxW5FG/landslide_nationwide_766a44fa.geojson",
  stormsurge: "https://d2xsxph8kpxj0f.cloudfront.net/310519663343684150/bv7KxrQPggRZjkjamxW5FG/stormsurge_nationwide_3a31e988.geojson",
};

// Volcano Hazard Zones GeoJSON (12 major volcanoes with PDZ/EDZ)
const VOLCANO_HAZARDS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663343684150/bv7KxrQPggRZjkjamxW5FG/volcano_hazard_zones_28e9197a.geojson";

// RainViewer API endpoint for radar timestamps
const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";

// Hazard color schemes matching NOAH Studio
const HAZARD_COLORS = {
  flood: { 1: "rgba(65, 182, 230, 0.45)", 2: "rgba(30, 120, 220, 0.55)", 3: "rgba(10, 50, 168, 0.65)" },
  landslide: { 1: "rgba(252, 209, 22, 0.45)", 2: "rgba(242, 153, 74, 0.55)", 3: "rgba(206, 17, 38, 0.65)" },
  stormsurge: { 1: "rgba(180, 130, 255, 0.40)", 2: "rgba(220, 80, 180, 0.50)", 3: "rgba(206, 17, 38, 0.60)" },
};

const HAZARD_OUTLINES = {
  flood: { 1: "rgba(65, 182, 230, 0.7)", 2: "rgba(30, 120, 220, 0.7)", 3: "rgba(10, 50, 168, 0.8)" },
  landslide: { 1: "rgba(252, 209, 22, 0.6)", 2: "rgba(242, 153, 74, 0.7)", 3: "rgba(206, 17, 38, 0.8)" },
  stormsurge: { 1: "rgba(180, 130, 255, 0.5)", 2: "rgba(220, 80, 180, 0.6)", 3: "rgba(206, 17, 38, 0.7)" },
};

// Typhoon track color by category label
function getTrackSegmentColor(label: string): string {
  if (label.includes("Cat 5") || label.includes("STY")) return "#CE1126";
  if (label.includes("Cat 4") || label.includes("TY")) return "#FF3D00";
  if (label.includes("Cat 3")) return "#FF6B35";
  if (label.includes("Cat 2")) return "#FF9800";
  if (label.includes("Cat 1")) return "#FFC107";
  if (label.includes("TS") || label.includes("STS")) return "#FCD116";
  return "#0038A8"; // TD
}

function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return "#CE1126";
  if (mag >= 5) return "#FF6B35";
  if (mag >= 4) return "#FCD116";
  return "#0038A8";
}

// Alert types for the banner
interface AlertItem {
  id: string;
  type: "earthquake" | "typhoon" | "waterlevel";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: Date;
}

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [typhoons, setTyphoons] = useState<TyphoonData[]>([]);
  const [waterLevels, setWaterLevels] = useState<WaterLevelStation[]>([]);

  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showTyphoons, setShowTyphoons] = useState(true);
  const [showWaterLevels, setShowWaterLevels] = useState(true);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showSchools, setShowSchools] = useState(false);
  const [showFlood, setShowFlood] = useState(false);
  const [showLandslide, setShowLandslide] = useState(false);
  const [showStormSurge, setShowStormSurge] = useState(false);
  const [showVolcano, setShowVolcano] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [hazardLoading, setHazardLoading] = useState<Record<string, boolean>>({});

  // Full-screen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Alert banner
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertDismissed, setAlertDismissed] = useState<Set<string>>(new Set());

  // Province search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Province[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Radar state
  const radarTimestampRef = useRef<string>("");

  // Track loaded typhoon tracks
  const loadedTracksRef = useRef<Set<string>>(new Set());

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: [121.774, 12.8797],
      zoom: 5.5,
      maxBounds: [[110, 2], [135, 22]],
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Add earthquake GeoJSON source (empty initially)
      map.addSource("earthquakes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "earthquake-glow",
        type: "circle",
        source: "earthquakes",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 3, 12, 4, 16, 5, 22, 6, 30, 7, 40],
          "circle-color": ["interpolate", ["linear"], ["get", "mag"], 3, "#0038A8", 4, "#FCD116", 5, "#FF6B35", 7, "#CE1126"],
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "earthquake-circles",
        type: "circle",
        source: "earthquakes",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 3, 4, 4, 6, 5, 9, 6, 13, 7, 18],
          "circle-color": ["interpolate", ["linear"], ["get", "mag"], 3, "#0038A8", 4, "#FCD116", 5, "#FF6B35", 7, "#CE1126"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.3)",
        },
      });

      // Click handler for earthquakes
      map.on("click", "earthquake-circles", (e) => {
        if (!e.features || e.features.length === 0) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const mag = f.properties?.mag || 0;
        const place = f.properties?.place || "Unknown";
        const time = f.properties?.time ? new Date(f.properties.time).toLocaleString() : "";
        const color = getMagnitudeColor(mag);

        new maplibregl.Popup({ className: "noah-popup", maxWidth: "280px" })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${color};color:white;font-weight:800;font-size:18px;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;">${mag.toFixed(1)}</div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${place}</div>
                  <div style="font-size:10px;color:#6B7280;">${time}</div>
                </div>
              </div>
              <div style="font-size:10px;color:#6B7280;">
                Depth: ${f.properties?.depth || "N/A"} km | ${formatMagnitude(mag)}
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "earthquake-circles", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "earthquake-circles", () => { map.getCanvas().style.cursor = ""; });

      setMapReady(true);
      mapInstance.current = map;
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Fullscreen toggle with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Resize map when fullscreen changes
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.resize(), 100);
    }
  }, [isFullscreen]);

  // Generate alerts from data
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    // M5+ earthquakes in last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    earthquakes.forEach((eq) => {
      if (eq.properties.mag >= 5 && eq.properties.time > oneDayAgo) {
        newAlerts.push({
          id: `eq-${eq.id}`,
          type: "earthquake",
          severity: eq.properties.mag >= 7 ? "critical" : "warning",
          message: `M${eq.properties.mag.toFixed(1)} earthquake — ${eq.properties.place}`,
          timestamp: new Date(eq.properties.time),
        });
      }
    });

    // Active typhoons
    typhoons.forEach((t) => {
      newAlerts.push({
        id: `tc-${t.id}`,
        type: "typhoon",
        severity: t.alertLevel === "Red" ? "critical" : t.alertLevel === "Orange" ? "warning" : "info",
        message: `${t.name} — ${getTyphoonCategory(t.windSpeed)} (${t.windSpeed} km/h)`,
        timestamp: new Date(t.pubDate),
      });
    });

    // Critical water levels
    waterLevels.forEach((st) => {
      if (st.status === "critical" || st.status === "alarm") {
        newAlerts.push({
          id: `wl-${st.name}`,
          type: "waterlevel",
          severity: st.status === "critical" ? "critical" : "warning",
          message: `${st.name} — ${st.status.toUpperCase()} (${st.currentWL}m)`,
          timestamp: new Date(),
        });
      }
    });

    setAlerts(newAlerts);
  }, [earthquakes, typhoons, waterLevels]);

  // Fetch earthquake data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEarthquakes();
        setEarthquakes(data);
      } catch (err) {
        console.warn("Failed to fetch earthquakes:", err);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch typhoon data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTyphoons();
        setTyphoons(data);
      } catch (err) {
        console.warn("Failed to fetch typhoons:", err);
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch water level data
  useEffect(() => {
    const loadWL = async () => {
      try {
        const data = await fetchWaterLevels();
        setWaterLevels(data);
      } catch (err) {
        console.warn("Failed to fetch water levels:", err);
      }
    };
    loadWL();
    const interval = setInterval(loadWL, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update earthquake layer data + visibility
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;
    const src = map.getSource("earthquakes") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    src.setData({
      type: "FeatureCollection",
      features: earthquakes.map((eq) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: eq.geometry.coordinates },
        properties: {
          mag: eq.properties.mag,
          place: eq.properties.place,
          time: eq.properties.time,
          depth: eq.geometry.coordinates[2],
          url: eq.properties.url,
        },
      })),
    });

    const vis = showEarthquakes ? "visible" : "none";
    if (map.getLayer("earthquake-circles")) map.setLayoutProperty("earthquake-circles", "visibility", vis);
    if (map.getLayer("earthquake-glow")) map.setLayoutProperty("earthquake-glow", "visibility", vis);
  }, [earthquakes, showEarthquakes, mapReady]);

  // Render typhoon markers + fetch tracks
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing typhoon markers (not water level ones)
    const typhoonMarkers = markersRef.current.filter(m => !(m as any)._isWaterLevel);
    typhoonMarkers.forEach((m) => m.remove());
    markersRef.current = markersRef.current.filter(m => (m as any)._isWaterLevel);

    if (!showTyphoons) {
      // Hide track layers
      const style = map.getStyle();
      if (style?.layers) {
        style.layers.forEach((l) => {
          if (l.id.startsWith("tc-track-") || l.id.startsWith("tc-cone-") || l.id.startsWith("tc-wind-") || l.id.startsWith("tc-points-")) {
            map.setLayoutProperty(l.id, "visibility", "none");
          }
        });
      }
      return;
    }

    // Show existing track layers
    const style = map.getStyle();
    if (style?.layers) {
      style.layers.forEach((l) => {
        if (l.id.startsWith("tc-track-") || l.id.startsWith("tc-cone-") || l.id.startsWith("tc-wind-") || l.id.startsWith("tc-points-")) {
          map.setLayoutProperty(l.id, "visibility", "visible");
        }
      });
    }

    typhoons.forEach((t) => {
      const color = getTyphoonColor(t.alertLevel, t.windSpeed);
      const cat = getTyphoonCategory(t.windSpeed);

      const el = document.createElement("div");
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ${color};">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 4H3M18 8H6M19 12H9M16 16H5M21 20H3"/></svg>
      </div>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([t.lon, t.lat])
        .setPopup(
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "280px" }).setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${color};width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 4H3M18 8H6M19 12H9M16 16H5M21 20H3"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${t.title}</div>
                  <div style="font-size:10px;color:#6B7280;">${cat}</div>
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;font-size:11px;">
                <div>Category: <strong>${t.category}</strong></div>
                <div>Wind: ${t.windSpeed} km/h</div>
                <div style="font-size:10px;color:#6B7280;margin-top:4px;">Alert: ${t.alertLevel}</div>
              </div>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);

      // Fetch and render typhoon track if not already loaded
      const trackKey = `${t.eventId}-${t.episodeId}`;
      if (!loadedTracksRef.current.has(trackKey) && t.eventId) {
        loadedTracksRef.current.add(trackKey);

        fetchTyphoonTrack(t.eventId, t.episodeId).then((track) => {
          if (!track || !mapInstance.current) return;
          const m = mapInstance.current;

          // Cone of uncertainty
          if (track.cone) {
            const coneSourceId = `tc-cone-src-${t.eventId}`;
            const coneLayerId = `tc-cone-${t.eventId}`;
            if (!m.getSource(coneSourceId)) {
              m.addSource(coneSourceId, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [track.cone] },
              });
              m.addLayer({
                id: `${coneLayerId}-fill`,
                type: "fill",
                source: coneSourceId,
                paint: {
                  "fill-color": color,
                  "fill-opacity": 0.08,
                },
              }, "earthquake-glow");
              m.addLayer({
                id: `${coneLayerId}-outline`,
                type: "line",
                source: coneSourceId,
                paint: {
                  "line-color": color,
                  "line-width": 1.5,
                  "line-dasharray": [6, 3],
                  "line-opacity": 0.5,
                },
              }, "earthquake-glow");
            }
          }

          // Track line segments
          if (track.trackLine.length > 0) {
            const trackSourceId = `tc-track-src-${t.eventId}`;
            const trackLayerId = `tc-track-${t.eventId}`;
            if (!m.getSource(trackSourceId)) {
              // Build a single LineString from all segments
              const allCoords: [number, number][] = [];
              track.trackLine.forEach((seg) => {
                const coords = seg.geometry.coordinates;
                coords.forEach((c) => {
                  if (allCoords.length === 0 || allCoords[allCoords.length - 1][0] !== c[0] || allCoords[allCoords.length - 1][1] !== c[1]) {
                    allCoords.push(c as [number, number]);
                  }
                });
              });

              m.addSource(trackSourceId, {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: allCoords },
                  properties: {},
                },
              });
              m.addLayer({
                id: trackLayerId,
                type: "line",
                source: trackSourceId,
                paint: {
                  "line-color": color,
                  "line-width": 3,
                  "line-opacity": 0.9,
                },
              });
              // Dashed outline for track
              m.addLayer({
                id: `${trackLayerId}-outline`,
                type: "line",
                source: trackSourceId,
                paint: {
                  "line-color": "#ffffff",
                  "line-width": 5,
                  "line-opacity": 0.2,
                },
              }, trackLayerId);
            }
          }

          // Track points (forecast positions)
          if (track.trackPoints.length > 0) {
            const pointsSourceId = `tc-points-src-${t.eventId}`;
            const pointsLayerId = `tc-points-${t.eventId}`;
            if (!m.getSource(pointsSourceId)) {
              m.addSource(pointsSourceId, {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: track.trackPoints.map((pt) => ({
                    type: "Feature" as const,
                    geometry: { type: "Point" as const, coordinates: pt.coords },
                    properties: { label: pt.label, category: pt.category },
                  })),
                },
              });
              m.addLayer({
                id: pointsLayerId,
                type: "circle",
                source: pointsSourceId,
                paint: {
                  "circle-radius": 5,
                  "circle-color": color,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.9,
                },
              });
              m.addLayer({
                id: `${pointsLayerId}-labels`,
                type: "symbol",
                source: pointsSourceId,
                layout: {
                  "text-field": ["get", "label"],
                  "text-size": 9,
                  "text-offset": [0, 1.8],
                  "text-anchor": "top",
                  "text-font": ["Open Sans Regular"],
                },
                paint: {
                  "text-color": "#374151",
                  "text-halo-color": "#ffffff",
                  "text-halo-width": 1.5,
                },
              });

              // Click handler for track points
              m.on("click", pointsLayerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                const f = e.features[0];
                const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
                new maplibregl.Popup({ className: "noah-popup", maxWidth: "200px" })
                  .setLngLat(coords)
                  .setHTML(`
                    <div style="font-family:'Inter',sans-serif;font-size:12px;color:#1f2937;">
                      <div style="font-weight:700;">${t.name}</div>
                      <div style="color:#6B7280;font-size:10px;">Forecast: ${f.properties?.label || ""}</div>
                    </div>
                  `)
                  .addTo(m);
              });
              m.on("mouseenter", pointsLayerId, () => { m.getCanvas().style.cursor = "pointer"; });
              m.on("mouseleave", pointsLayerId, () => { m.getCanvas().style.cursor = ""; });
            }
          }
        });
      }
    });
  }, [typhoons, showTyphoons, mapReady]);

  // Render water level markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    const existingWL = markersRef.current.filter(m => (m as any)._isWaterLevel);
    existingWL.forEach(m => m.remove());
    markersRef.current = markersRef.current.filter(m => !(m as any)._isWaterLevel);

    if (!showWaterLevels) return;

    waterLevels.forEach((st) => {
      if (!st.lat || !st.lon) return;
      const color = getWaterLevelColor(st.status);
      const wl = parseFloat(st.currentWL) || 0;
      const status = st.status === "critical" ? "CRITICAL" :
                     st.status === "alarm" ? "ALARM" :
                     st.status === "alert" ? "ALERT" : "Normal";

      const el = document.createElement("div");
      el.innerHTML = `<div style="width:12px;height:12px;border-radius:3px;background:${color};border:1.5px solid rgba(255,255,255,0.5);box-shadow:0 0 6px ${color};"></div>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([st.lon, st.lat])
        .setPopup(
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "260px" }).setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${color};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${st.name}</div>
                  <div style="font-size:10px;color:#6B7280;">PAGASA FFWS</div>
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#6B7280;">Level</span>
                  <span style="font-weight:700;font-family:'JetBrains Mono',monospace;">${st.currentWL || "N/A"} m</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#6B7280;">Status</span>
                  <span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;">${status}</span>
                </div>
              </div>
            </div>
          `)
        )
        .addTo(map);

      (marker as any)._isWaterLevel = true;
      markersRef.current.push(marker);
    });
  }, [waterLevels, showWaterLevels, mapReady]);

  // Add NOAH hazard layer
  const addHazardLayer = useCallback(async (hazardType: string, propKey: string, url: string) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const sourceId = `noah-${hazardType}`;
    const fillId = `noah-${hazardType}-fill`;
    const outlineId = `noah-${hazardType}-outline`;

    if (map.getSource(sourceId)) {
      if (map.getLayer(fillId)) map.setLayoutProperty(fillId, "visibility", "visible");
      if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, "visibility", "visible");
      return;
    }

    setHazardLoading(prev => ({ ...prev, [hazardType]: true }));

    try {
      const colors = HAZARD_COLORS[hazardType as keyof typeof HAZARD_COLORS];
      const outlines = HAZARD_OUTLINES[hazardType as keyof typeof HAZARD_OUTLINES];

      map.addSource(sourceId, { type: "geojson", data: url });

      map.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": ["match", ["get", propKey], 1, colors[1], 2, colors[2], 3, colors[3], colors[1]],
          "fill-opacity": 0.7,
        },
      }, "earthquake-glow");

      map.addLayer({
        id: outlineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": ["match", ["get", propKey], 1, outlines[1], 2, outlines[2], 3, outlines[3], outlines[1]],
          "line-width": 0.5,
          "line-opacity": 0.6,
        },
      }, "earthquake-glow");

      // Click handler for hazard zones
      map.on("click", fillId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const f = e.features[0];
        const level = f.properties?.[propKey] || 1;
        const levelLabel = level === 3 ? "High" : level === 2 ? "Medium" : "Low";
        const typeLabel = hazardType === "stormsurge" ? "Storm Surge" : hazardType.charAt(0).toUpperCase() + hazardType.slice(1);
        const levelColor = level === 3 ? "#CE1126" : level === 2 ? "#F2994A" : "#F2C94C";

        new maplibregl.Popup({ className: "noah-popup", maxWidth: "240px" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${levelColor};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${hazardType === "flood" ? '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' : hazardType === "landslide" ? '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>' : '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>'}</svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${typeLabel} Hazard</div>
                  <div style="font-size:10px;color:#6B7280;">NOAH Philippines</div>
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#6B7280;font-size:10px;">Risk Level</span>
                  <span style="background:${levelColor};color:white;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;">${levelLabel}</span>
                </div>
              </div>
              <div style="font-size:9px;color:#6B7280;margin-top:4px;">Source: UPRI Project NOAH | 100-year return period</div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", fillId, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", fillId, () => { map.getCanvas().style.cursor = ""; });
    } catch (err) {
      console.warn(`Failed to load ${hazardType} hazard data:`, err);
    } finally {
      setHazardLoading(prev => ({ ...prev, [hazardType]: false }));
    }
  }, []);

  const hideHazardLayer = useCallback((hazardType: string) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const fillId = `noah-${hazardType}-fill`;
    const outlineId = `noah-${hazardType}-outline`;
    if (map.getLayer(fillId)) map.setLayoutProperty(fillId, "visibility", "none");
    if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, "visibility", "none");
  }, []);

  // Toggle flood hazard
  useEffect(() => {
    if (!mapReady) return;
    if (showFlood) addHazardLayer("flood", "Var", NOAH_HAZARDS.flood);
    else hideHazardLayer("flood");
  }, [showFlood, mapReady, addHazardLayer, hideHazardLayer]);

  // Toggle landslide hazard
  useEffect(() => {
    if (!mapReady) return;
    if (showLandslide) addHazardLayer("landslide", "LH", NOAH_HAZARDS.landslide);
    else hideHazardLayer("landslide");
  }, [showLandslide, mapReady, addHazardLayer, hideHazardLayer]);

  // Toggle storm surge hazard
  useEffect(() => {
    if (!mapReady) return;
    if (showStormSurge) addHazardLayer("stormsurge", "HAZ", NOAH_HAZARDS.stormsurge);
    else hideHazardLayer("stormsurge");
  }, [showStormSurge, mapReady, addHazardLayer, hideHazardLayer]);

  // Toggle volcano hazard zones
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showVolcano) {
      if (!map.getSource("volcano-zones")) {
        setHazardLoading(prev => ({ ...prev, volcano: true }));
        map.addSource("volcano-zones", { type: "geojson", data: VOLCANO_HAZARDS });

        map.addLayer({ id: "volcano-edz-fill", type: "fill", source: "volcano-zones", filter: ["==", ["get", "zone"], "EDZ"], paint: { "fill-color": "rgba(255, 140, 0, 0.25)", "fill-opacity": 0.7 } }, "earthquake-glow");
        map.addLayer({ id: "volcano-pdz-fill", type: "fill", source: "volcano-zones", filter: ["==", ["get", "zone"], "PDZ"], paint: { "fill-color": "rgba(206, 17, 38, 0.35)", "fill-opacity": 0.7 } }, "earthquake-glow");
        map.addLayer({ id: "volcano-edz-outline", type: "line", source: "volcano-zones", filter: ["==", ["get", "zone"], "EDZ"], paint: { "line-color": "rgba(255, 140, 0, 0.7)", "line-width": 1.5, "line-dasharray": [4, 2] } }, "earthquake-glow");
        map.addLayer({ id: "volcano-pdz-outline", type: "line", source: "volcano-zones", filter: ["==", ["get", "zone"], "PDZ"], paint: { "line-color": "rgba(206, 17, 38, 0.8)", "line-width": 2 } }, "earthquake-glow");
        map.addLayer({ id: "volcano-summit", type: "circle", source: "volcano-zones", filter: ["==", ["get", "zone"], "SUMMIT"], paint: { "circle-radius": 6, "circle-color": "#CE1126", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
        map.addLayer({ id: "volcano-labels", type: "symbol", source: "volcano-zones", filter: ["==", ["get", "zone"], "SUMMIT"], layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.5], "text-anchor": "top", "text-font": ["Open Sans Bold"] }, paint: { "text-color": "#CE1126", "text-halo-color": "#ffffff", "text-halo-width": 1.5 } });

        const volcanoClickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const name = f.properties?.name || "Unknown";
          const zone = f.properties?.zone || "";
          const zoneLabel = f.properties?.zone_label || zone;
          const radius = f.properties?.radius_km || "";
          const alertLevel = f.properties?.alert_level || 0;
          const province = f.properties?.province || "";
          const vType = f.properties?.type || "";
          const elevation = f.properties?.elevation_m || "";
          const lastEruption = f.properties?.last_eruption || "";
          const hazards = f.properties?.hazards || "";
          const zoneColor = zone === "PDZ" ? "#CE1126" : "#FF8C00";

          new maplibregl.Popup({ className: "noah-popup", maxWidth: "280px" })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <div style="background:${zoneColor};width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:14px;">${name} Volcano</div>
                    <div style="font-size:10px;color:#6B7280;">${province} | ${vType}</div>
                  </div>
                </div>
                <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;margin-bottom:4px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="color:#6B7280;font-size:10px;">Zone</span>
                    <span style="background:${zoneColor};color:white;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;">${zoneLabel}${radius ? ` (${radius} km)` : ""}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="color:#6B7280;font-size:10px;">Alert Level</span>
                    <span style="font-weight:700;">${alertLevel}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="color:#6B7280;font-size:10px;">Elevation</span>
                    <span style="font-weight:600;">${elevation} m</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#6B7280;font-size:10px;">Last Eruption</span>
                    <span style="font-weight:600;">${lastEruption}</span>
                  </div>
                </div>
                ${hazards ? `<div style="font-size:9px;color:#6B7280;">Hazards: ${hazards}</div>` : ""}
                <div style="font-size:9px;color:#6B7280;margin-top:2px;">Source: PHIVOLCS</div>
              </div>
            `)
            .addTo(map);
        };

        map.on("click", "volcano-pdz-fill", volcanoClickHandler);
        map.on("click", "volcano-edz-fill", volcanoClickHandler);
        map.on("click", "volcano-summit", volcanoClickHandler);
        ["volcano-pdz-fill", "volcano-edz-fill", "volcano-summit"].forEach(id => {
          map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
        });

        setHazardLoading(prev => ({ ...prev, volcano: false }));
      } else {
        ["volcano-edz-fill", "volcano-pdz-fill", "volcano-edz-outline", "volcano-pdz-outline", "volcano-summit", "volcano-labels"].forEach(id => {
          if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
        });
      }
    } else {
      ["volcano-edz-fill", "volcano-pdz-fill", "volcano-edz-outline", "volcano-pdz-outline", "volcano-summit", "volcano-labels"].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      });
    }
  }, [showVolcano, mapReady]);

  // Toggle RainViewer radar overlay
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showRadar) {
      const loadRadar = async () => {
        try {
          const resp = await fetch(RAINVIEWER_API);
          const data = await resp.json();
          const radarFrames = data?.radar?.past || [];
          if (radarFrames.length === 0) return;

          const latestFrame = radarFrames[radarFrames.length - 1];
          const ts = latestFrame.path;
          radarTimestampRef.current = ts;
          const tileUrl = `https://tilecache.rainviewer.com${ts}/256/{z}/{x}/{y}/2/1_1.png`;

          if (!map.getSource("rainviewer-radar")) {
            map.addSource("rainviewer-radar", { type: "raster", tiles: [tileUrl], tileSize: 256 });
            map.addLayer({ id: "rainviewer-radar-layer", type: "raster", source: "rainviewer-radar", paint: { "raster-opacity": 0.6 } }, "earthquake-glow");
          } else {
            map.removeLayer("rainviewer-radar-layer");
            map.removeSource("rainviewer-radar");
            map.addSource("rainviewer-radar", { type: "raster", tiles: [tileUrl], tileSize: 256 });
            map.addLayer({ id: "rainviewer-radar-layer", type: "raster", source: "rainviewer-radar", paint: { "raster-opacity": 0.6 } }, "earthquake-glow");
          }
        } catch (err) {
          console.warn("Failed to load RainViewer radar:", err);
        }
      };

      loadRadar();
      const interval = setInterval(loadRadar, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      if (map.getLayer("rainviewer-radar-layer")) map.removeLayer("rainviewer-radar-layer");
      if (map.getSource("rainviewer-radar")) map.removeSource("rainviewer-radar");
    }
  }, [showRadar, mapReady]);

  // Load hospitals GeoJSON when toggled
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showHospitals) {
      if (!map.getSource("hospitals")) {
        map.addSource("hospitals", { type: "geojson", data: CRITICAL_FACILITIES.hospitals });
        map.addLayer({ id: "hospitals-layer", type: "circle", source: "hospitals", paint: { "circle-radius": 4, "circle-color": "#00D4FF", "circle-stroke-width": 1, "circle-stroke-color": "#ffffff", "circle-opacity": 0.8 } });
        map.on("click", "hospitals-layer", (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const name = f.properties?.name || f.properties?.NAME || "Hospital";
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "220px" })
            .setLngLat(coords)
            .setHTML(`<div style="font-family:'Inter',sans-serif;font-size:12px;color:#1f2937;"><div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v5"/><path d="M10 11h4"/><rect x="4" y="6" width="16" height="16" rx="2"/></svg><span style="font-weight:700;font-size:13px;color:#00D4FF;">${name}</span></div><div style="color:#6B7280;font-size:10px;">Critical Facility — Hospital</div></div>`)
            .addTo(map);
        });
        map.on("mouseenter", "hospitals-layer", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "hospitals-layer", () => { map.getCanvas().style.cursor = ""; });
      } else {
        map.setLayoutProperty("hospitals-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("hospitals-layer")) map.setLayoutProperty("hospitals-layer", "visibility", "none");
    }
  }, [showHospitals, mapReady]);

  // Load schools GeoJSON when toggled
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showSchools) {
      if (!map.getSource("schools")) {
        map.addSource("schools", { type: "geojson", data: CRITICAL_FACILITIES.schools });
        map.addLayer({ id: "schools-layer", type: "circle", source: "schools", paint: { "circle-radius": 3, "circle-color": "#FCD116", "circle-stroke-width": 1, "circle-stroke-color": "#ffffff", "circle-opacity": 0.7 } });
        map.on("click", "schools-layer", (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const name = f.properties?.name || f.properties?.NAME || "School";
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "220px" })
            .setLngLat(coords)
            .setHTML(`<div style="font-family:'Inter',sans-serif;font-size:12px;color:#1f2937;"><div style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCD116" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg><span style="font-weight:700;font-size:13px;color:#FCD116;">${name}</span></div><div style="color:#6B7280;font-size:10px;">Critical Facility — School</div></div>`)
            .addTo(map);
        });
        map.on("mouseenter", "schools-layer", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "schools-layer", () => { map.getCanvas().style.cursor = ""; });
      } else {
        map.setLayoutProperty("schools-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("schools-layer")) map.setLayoutProperty("schools-layer", "visibility", "none");
    }
  }, [showSchools, mapReady]);

  // Province search handler
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) {
      setSearchResults(searchProvinces(value));
    } else {
      setSearchResults([]);
    }
  }, []);

  const flyToProvince = useCallback((province: Province) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({
      center: [province.lon, province.lat],
      zoom: province.zoom,
      duration: 2000,
      essential: true,
    });
    setShowFlood(true);
    setShowLandslide(true);
    setShowStormSurge(true);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  }, []);

  const toggleEarthquakes = useCallback(() => setShowEarthquakes((v) => !v), []);
  const toggleTyphoons = useCallback(() => setShowTyphoons((v) => !v), []);
  const toggleWaterLevels = useCallback(() => setShowWaterLevels((v) => !v), []);
  const toggleHospitals = useCallback(() => setShowHospitals((v) => !v), []);
  const toggleSchools = useCallback(() => setShowSchools((v) => !v), []);
  const toggleFlood = useCallback(() => setShowFlood((v) => !v), []);
  const toggleLandslide = useCallback(() => setShowLandslide((v) => !v), []);
  const toggleStormSurge = useCallback(() => setShowStormSurge((v) => !v), []);
  const toggleVolcano = useCallback(() => setShowVolcano((v) => !v), []);
  const toggleRadar = useCallback(() => setShowRadar((v) => !v), []);

  const btnClass = (active: boolean) =>
    `flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold tracking-wider transition-all border ${
      active
        ? "bg-[oklch(0.18_0.02_260_/_0.95)] border-current shadow-sm"
        : "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
    }`;

  // Filter active alerts (not dismissed)
  const activeAlerts = alerts.filter(a => !alertDismissed.has(a.id));
  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical");
  const warningAlerts = activeAlerts.filter(a => a.severity === "warning");
  const displayAlerts = [...criticalAlerts, ...warningAlerts].slice(0, 3);

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-[9999] bg-black" : "h-full w-full"}`}>
      {/* Alert Banner */}
      {displayAlerts.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-[1002] flex flex-col">
          {displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold ${
                alert.severity === "critical"
                  ? "bg-[#CE1126]/95 text-white"
                  : "bg-[#FF6B35]/90 text-white"
              }`}
            >
              {/* Alert icon */}
              <svg className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              {/* Type badge */}
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider bg-white/20 uppercase">
                {alert.type === "earthquake" ? "EQ" : alert.type === "typhoon" ? "TC" : "WL"}
              </span>
              <span className="flex-1 truncate">{alert.message}</span>
              <button
                onClick={() => setAlertDismissed(prev => new Set([...Array.from(prev), alert.id]))}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" />

      {/* Fullscreen toggle button */}
      <button
        onClick={() => setIsFullscreen(v => !v)}
        className="absolute top-2 right-2 z-[1001] w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 hover:bg-white transition-colors"
        title={isFullscreen ? "Exit fullscreen (ESC)" : "Fullscreen map"}
      >
        {isFullscreen ? (
          <svg className="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
        ) : (
          <svg className="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        )}
      </button>

      {/* Province Search Bar */}
      <div className={`absolute ${displayAlerts.length > 0 ? "top-10" : "top-2"} left-1/2 -translate-x-1/2 z-[1001] transition-all`}>
        <div className="relative">
          <div className={`flex items-center bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 transition-all ${showSearch ? "w-72" : "w-44"}`}>
            <svg className="w-4 h-4 ml-3 text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search province..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              className="w-full px-2 py-2 text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="mr-2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>

          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button key={p.name} onMouseDown={(e) => e.preventDefault()} onClick={() => flyToProvince(p)} className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0">
                  <div className="text-xs font-semibold text-gray-800">{p.name}</div>
                  <div className="text-[10px] text-gray-500">{p.region}</div>
                </button>
              ))}
              <div className="px-3 py-1.5 text-[9px] text-gray-400 bg-gray-50">Selecting a province auto-enables all hazard layers</div>
            </div>
          )}
        </div>
      </div>

      {/* Layer toggle controls */}
      <div className={`absolute ${displayAlerts.length > 0 ? "top-20" : "top-12"} left-2 z-[1000] flex flex-col gap-1.5 transition-all`}>
        {/* Row 1: Data layers */}
        <div className="flex gap-1">
          <button onClick={toggleEarthquakes} className={btnClass(showEarthquakes)} style={showEarthquakes ? { color: "#FCD116", borderColor: "#FCD116" } : {}} title="Toggle earthquake markers">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m2 12 4-4 3 6 4-8 3 6 4-4"/></svg> EQ
          </button>
          <button onClick={toggleTyphoons} className={btnClass(showTyphoons)} style={showTyphoons ? { color: "#FF6B35", borderColor: "#FF6B35" } : {}} title="Toggle typhoon tracker + forecast tracks">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16H5"/><path d="M21 20H3"/></svg> TC
          </button>
          <button onClick={toggleWaterLevels} className={btnClass(showWaterLevels)} style={showWaterLevels ? { color: "#0038A8", borderColor: "#0038A8" } : {}} title="Toggle water level stations">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg> WL
          </button>
        </div>

        {/* Row 2: NOAH Hazard overlays */}
        <div className="flex gap-1">
          <button onClick={toggleFlood} className={btnClass(showFlood)} style={showFlood ? { color: "#41B6E6", borderColor: "#41B6E6" } : {}} title="Toggle NOAH Flood Hazard">
            {hazardLoading.flood ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            )} Flood
          </button>
          <button onClick={toggleLandslide} className={btnClass(showLandslide)} style={showLandslide ? { color: "#F2994A", borderColor: "#F2994A" } : {}} title="Toggle NOAH Landslide Hazard">
            {hazardLoading.landslide ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            )} Slide
          </button>
          <button onClick={toggleStormSurge} className={btnClass(showStormSurge)} style={showStormSurge ? { color: "#B482FF", borderColor: "#B482FF" } : {}} title="Toggle NOAH Storm Surge Hazard">
            {hazardLoading.stormsurge ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
            )} Surge
          </button>
        </div>

        {/* Row 3: Volcano + Radar */}
        <div className="flex gap-1">
          <button onClick={toggleVolcano} className={btnClass(showVolcano)} style={showVolcano ? { color: "#CE1126", borderColor: "#CE1126" } : {}} title="Toggle Volcano Hazard Zones (PHIVOLCS)">
            {hazardLoading.volcano ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            )} Volcano
          </button>
          <button onClick={toggleRadar} className={btnClass(showRadar)} style={showRadar ? { color: "#00E676", borderColor: "#00E676" } : {}} title="Toggle Weather Radar (RainViewer)">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><circle cx="12" cy="12" r="2"/></svg> Radar
          </button>
        </div>

        {/* Row 4: Facilities */}
        <div className="flex gap-1">
          <button onClick={toggleHospitals} className={btnClass(showHospitals)} style={showHospitals ? { color: "#00D4FF", borderColor: "#00D4FF" } : {}} title="Toggle NOAH Hospitals">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v5"/><path d="M10 11h4"/><rect x="4" y="6" width="16" height="16" rx="2"/></svg> Hosp
          </button>
          <button onClick={toggleSchools} className={btnClass(showSchools)} style={showSchools ? { color: "#FCD116", borderColor: "#FCD116" } : {}} title="Toggle NOAH Schools">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> School
          </button>
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-2 text-[10px] font-mono border border-[oklch(0.25_0.02_260_/_0.5)] max-h-[60vh] overflow-y-auto">
        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider">EARTHQUAKES</div>
        {[
          { color: "#CE1126", label: "M7+ Major" },
          { color: "#FF6B35", label: "M5-7 Strong" },
          { color: "#FCD116", label: "M4-5 Moderate" },
          { color: "#0038A8", label: "M3-4 Light" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
            <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
          </div>
        ))}

        {/* Typhoon Track Legend */}
        {showTyphoons && typhoons.length > 0 && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">TYPHOON TRACK</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-0.5 rounded" style={{ background: "#FF6B35" }} />
              <span className="text-[oklch(0.70_0.005_260)]">Track line</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-2 rounded-sm border border-dashed" style={{ borderColor: "#FF6B35", background: "rgba(255,107,53,0.1)" }} />
              <span className="text-[oklch(0.70_0.005_260)]">Cone of uncertainty</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full border-2 border-white" style={{ background: "#FF6B35" }} />
              <span className="text-[oklch(0.70_0.005_260)]">Forecast position</span>
            </div>
          </>
        )}

        {/* NOAH Hazards Legend */}
        {(showFlood || showLandslide || showStormSurge) && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">NOAH HAZARDS</div>
            {showFlood && (
              <div className="mb-1">
                <div className="text-[8px] text-[#41B6E6] font-semibold mb-0.5">Flood</div>
                {[{ color: "rgba(65, 182, 230, 0.6)", label: "Low" }, { color: "rgba(30, 120, 220, 0.7)", label: "Medium" }, { color: "rgba(10, 50, 168, 0.8)", label: "High" }].map((item) => (
                  <div key={`flood-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
                    <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
            {showLandslide && (
              <div className="mb-1">
                <div className="text-[8px] text-[#F2994A] font-semibold mb-0.5">Landslide</div>
                {[{ color: "rgba(252, 209, 22, 0.6)", label: "Low" }, { color: "rgba(242, 153, 74, 0.7)", label: "Medium" }, { color: "rgba(206, 17, 38, 0.8)", label: "High" }].map((item) => (
                  <div key={`slide-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
                    <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
            {showStormSurge && (
              <div className="mb-1">
                <div className="text-[8px] text-[#B482FF] font-semibold mb-0.5">Storm Surge</div>
                {[{ color: "rgba(180, 130, 255, 0.5)", label: "Low" }, { color: "rgba(220, 80, 180, 0.6)", label: "Medium" }, { color: "rgba(206, 17, 38, 0.7)", label: "High" }].map((item) => (
                  <div key={`surge-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
                    <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Volcano Legend */}
        {showVolcano && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">VOLCANO ZONES</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: "rgba(206, 17, 38, 0.5)" }} />
              <span className="text-[oklch(0.70_0.005_260)]">PDZ (Permanent)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-2 rounded-sm border border-dashed border-orange-400" style={{ background: "rgba(255, 140, 0, 0.3)" }} />
              <span className="text-[oklch(0.70_0.005_260)]">EDZ (Extended)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] border border-white" />
              <span className="text-[oklch(0.70_0.005_260)]">Summit</span>
            </div>
          </>
        )}

        {/* Radar Legend */}
        {showRadar && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">WEATHER RADAR</div>
            <div className="flex items-center gap-0.5 mb-0.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: "#00E676" }} />
              <span className="w-2 h-2 rounded-sm" style={{ background: "#FFEB3B" }} />
              <span className="w-2 h-2 rounded-sm" style={{ background: "#FF9800" }} />
              <span className="w-2 h-2 rounded-sm" style={{ background: "#F44336" }} />
              <span className="w-2 h-2 rounded-sm" style={{ background: "#9C27B0" }} />
              <span className="text-[oklch(0.70_0.005_260)] ml-1">Light to Heavy</span>
            </div>
            <div className="text-[8px] text-[oklch(0.50_0.01_260)]">Source: RainViewer</div>
          </>
        )}

        <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">FACILITIES</div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" />
          <span className="text-[oklch(0.70_0.005_260)]">Hospitals</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
          <span className="text-[oklch(0.70_0.005_260)]">Schools</span>
        </div>

        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">WATER LEVELS</div>
        {[
          { color: "#0038A8", label: "Normal" },
          { color: "#FCD116", label: "Alert" },
          { color: "#FF6B35", label: "Alarm" },
          { color: "#CE1126", label: "Critical" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded" style={{ background: item.color }} />
            <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Counts badge */}
      <div className={`absolute ${displayAlerts.length > 0 ? "top-20" : "top-12"} right-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[oklch(0.65_0.01_260)] border border-[oklch(0.25_0.02_260_/_0.5)] flex flex-col gap-0.5 transition-all`}>
        <div><span className="text-[#FCD116] font-bold">{earthquakes.length}</span> quakes (30d)</div>
        {typhoons.length > 0 && (
          <div><span className="text-[#FF6B35] font-bold">{typhoons.length}</span> active storm{typhoons.length !== 1 ? "s" : ""}</div>
        )}
        {waterLevels.length > 0 && (
          <div><span className="text-[#0038A8] font-bold">{waterLevels.length}</span> water stations</div>
        )}
        {(showFlood || showLandslide || showStormSurge) && (
          <div className="border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-0.5 mt-0.5">
            <span className="text-[#41B6E6] font-bold">NOAH</span> <span className="text-[8px]">Nationwide</span>
          </div>
        )}
        {showVolcano && (
          <div><span className="text-[#CE1126] font-bold">12</span> volcanoes</div>
        )}
        {showRadar && (
          <div><span className="text-[#00E676] font-bold">RADAR</span> <span className="text-[8px]">Live</span></div>
        )}
      </div>

      {/* Attribution — positioned below the MapLibre zoom +/- controls */}
      <div className="absolute bottom-2 right-2 z-[1000] flex flex-col items-end gap-0.5">
        <div className="text-[7px] text-[oklch(0.45_0.01_260)] font-mono">CARTO / OpenStreetMap</div>
        <div className="text-[7px] text-[oklch(0.45_0.01_260)] font-mono">Data: USGS / GDACS / PAGASA / UPRI-NOAH / PHIVOLCS / RainViewer</div>
      </div>

      {/* Fullscreen ESC hint */}
      {isFullscreen && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1001] bg-black/60 text-white/80 text-[10px] font-mono px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
          Press ESC to exit fullscreen
        </div>
      )}
    </div>
  );
}
