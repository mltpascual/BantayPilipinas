// MapPanel — Philippines Mission Control
// Features: Water levels (SVG icons), NOAH Hazard overlays (Flood, Landslide, Storm Surge),
// Volcano Hazard Zones, Hospitals, Schools, Evacuation Centers, Satellite toggle,
// Location search, Full-screen mode, Alert banner

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  WaterLevelStation,
  fetchWaterLevels,
  getWaterLevelColor,
  GDACSItem,
  fetchGDACS,
} from "@/lib/feeds";
import { isDataFresh } from "@/lib/fetchUtils";
import { searchProvinces, type Province } from "@/lib/provinces";
import { useTheme } from "@/contexts/ThemeContext";

// Basemap styles
const MAP_STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const MAP_STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const ESRI_SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

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

// Evacuation Centers GeoJSON (6,424 centers from OpenStreetMap)
const EVACUATION_CENTERS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663343684150/bv7KxrQPggRZjkjamxW5FG/evacuation_centers_ph_a8c5b5f2.geojson";

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

// HTML escape utility to prevent XSS from external API data
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Alert types for the banner
interface AlertItem {
  id: string;
  type: "waterlevel";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: Date;
}

export default function MapPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const gdacsMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [waterLevels, setWaterLevels] = useState<WaterLevelStation[]>([]);
  const [showWaterLevels, setShowWaterLevels] = useState(true);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showSchools, setShowSchools] = useState(false);
  const [showFlood, setShowFlood] = useState(false);
  const [showLandslide, setShowLandslide] = useState(false);
  const [showStormSurge, setShowStormSurge] = useState(false);
  const [showVolcano, setShowVolcano] = useState(false);
  const [showEvacCenters, setShowEvacCenters] = useState(false);
  const [showGDACS, setShowGDACS] = useState(true);
  const [gdacsAlerts, setGdacsAlerts] = useState<GDACSItem[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [hazardLoading, setHazardLoading] = useState<Record<string, boolean>>({});

  // Full-screen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Alert banner
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertDismissed, setAlertDismissed] = useState<Set<string>>(new Set());

  // Location search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Province[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Satellite toggle
  const [isSatellite, setIsSatellite] = useState(false);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
      center: [121.774, 12.8797],
      zoom: 5.5,
      maxBounds: [[110, 2], [135, 22]],
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
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

  // Generate alerts from water level data
  useEffect(() => {
    const newAlerts: AlertItem[] = [];
    waterLevels.forEach((st) => {
      if (st.status === "critical" || st.status === "alarm") {
        newAlerts.push({
          id: `wl-${st.name}`,
          type: "waterlevel",
          severity: st.status === "critical" ? "critical" : "warning",
          message: `${escapeHtml(st.name)} — ${st.status.toUpperCase()} (${escapeHtml(String(st.currentWL))}m)`,
          timestamp: new Date(),
        });
      }
    });
    setAlerts(newAlerts);
  }, [waterLevels]);

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

  // Render water level markers with SVG water drop icons
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing water level markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showWaterLevels) return;

    waterLevels.forEach((st) => {
      if (!st.lat || !st.lon) return;
      const color = getWaterLevelColor(st.status);
      const status = st.status === "critical" ? "CRITICAL" :
                     st.status === "alarm" ? "ALARM" :
                     st.status === "alert" ? "ALERT" : "Normal";

      // SVG water drop icon marker
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="position:relative;width:28px;height:34px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C14 0 0 14 0 22C0 28.627 6.268 34 14 34C21.732 34 28 28.627 28 22C28 14 14 0 14 0Z" fill="${color}"/>
          <path d="M14 2C14 2 2 14.5 2 22C2 27.523 7.373 32 14 32C20.627 32 26 27.523 26 22C26 14.5 14 2 14 2Z" fill="${color}" opacity="0.9"/>
          <path d="M10 20C10 20 8 16 14 10C14 10 12 18 10 20Z" fill="white" opacity="0.3"/>
          <text x="14" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="800" fill="white">${st.status === "critical" ? "!" : st.status === "alarm" ? "!" : "~"}</text>
        </svg>
      </div>`;

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([st.lon, st.lat])
        .setPopup(
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "260px" }).setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${color};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${escapeHtml(st.name)}</div>
                  <div style="font-size:10px;color:#6B7280;">PAGASA FFWS</div>
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#6B7280;">Level</span>
                  <span style="font-weight:700;font-family:'JetBrains Mono',monospace;">${escapeHtml(String(st.currentWL || "N/A"))} m</span>
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

      markersRef.current.push(marker);
    });
  }, [waterLevels, showWaterLevels, mapReady]);

  // Fetch GDACS alerts
  useEffect(() => {
    let mounted = true;
    const loadGDACS = async () => {
      try {
        const data = await fetchGDACS();
        if (!mounted) return;
        // Filter to only recent alerts (within ~23 hours)
        const recent = data.filter(d => isDataFresh(d.pubDate, 23));
        setGdacsAlerts(recent);
      } catch (err) {
        console.warn("Failed to fetch GDACS:", err);
      }
    };
    loadGDACS();
    const interval = setInterval(loadGDACS, 10 * 60 * 1000); // refresh every 10 min
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Render GDACS alert markers on the map
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing GDACS markers
    gdacsMarkersRef.current.forEach(m => m.remove());
    gdacsMarkersRef.current = [];

    if (!showGDACS) return;

    gdacsAlerts.forEach((alert) => {
      if (alert.lat === null || alert.lon === null) return;

      // Color by severity
      const severityColor = alert.severity === "high" ? "#CE1126"
        : alert.severity === "medium" ? "#FF6B35"
        : "#22C55E";

      // Icon by event type
      const eventIcons: Record<string, string> = {
        earthquake: '<path d="M2 12l2-2 3 3 4-6 3 4 4-3 4 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        cyclone: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="white" stroke-width="1.5" fill="none"/><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="white" stroke-width="1.5" fill="none"/>',
        flood: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="white" stroke-width="2" fill="none"/>',
        volcano: '<path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        drought: '<circle cx="12" cy="12" r="5" stroke="white" stroke-width="2" fill="none"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="white" stroke-width="2" stroke-linecap="round"/>',
        wildfire: '<path d="M12 12c0-3 2-5 2-8-3 2-6 5.5-6 8a4 4 0 0 0 8 0c0-1-.5-2-1.5-3-.5 1.5-1.5 3-2.5 3z" stroke="white" stroke-width="1.5" fill="rgba(255,255,255,0.3)"/>',
      };
      const iconSvg = eventIcons[alert.eventType] || eventIcons.earthquake;

      // Severity label
      const severityLabel = alert.severity === "high" ? "RED"
        : alert.severity === "medium" ? "ORANGE"
        : "GREEN";

      // Event type label
      const typeLabel = alert.eventType.charAt(0).toUpperCase() + alert.eventType.slice(1);

      // Time ago
      const pubTime = new Date(alert.pubDate);
      const hoursAgo = Math.round((Date.now() - pubTime.getTime()) / (1000 * 60 * 60));
      const timeLabel = hoursAgo < 1 ? "< 1h ago" : `${hoursAgo}h ago`;

      // Create pulsing marker element
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="position:relative;width:32px;height:32px;">
        <div style="position:absolute;inset:-4px;border-radius:50%;background:${severityColor};opacity:0.25;animation:gdacsPulse 2s ease-in-out infinite;"></div>
        <div style="width:32px;height:32px;border-radius:50%;background:${severityColor};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${iconSvg}</svg>
        </div>
      </div>`;

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([alert.lon, alert.lat])
        .setPopup(
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "300px" }).setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#1f2937;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${severityColor};width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${iconSvg}</svg>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHtml(typeLabel)}</div>
                  <div style="font-size:10px;color:#6B7280;">${escapeHtml(alert.country || "Global")} &middot; ${timeLabel}</div>
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px;margin-bottom:6px;">
                <div style="font-size:11px;font-weight:600;margin-bottom:4px;line-height:1.3;">${escapeHtml(alert.title)}</div>
                <div style="font-size:10px;color:#6B7280;line-height:1.3;">${escapeHtml(alert.description.slice(0, 200))}</div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="background:${severityColor};color:white;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;">${severityLabel} ALERT</span>
                ${alert.link ? `<a href="${escapeHtml(alert.link)}" target="_blank" rel="noopener noreferrer" style="font-size:10px;color:#0038A8;text-decoration:underline;font-weight:600;">View on GDACS &rarr;</a>` : ""}
              </div>
              <div style="font-size:9px;color:#6B7280;margin-top:4px;">Source: GDACS (Global Disaster Alert &amp; Coordination System)</div>
            </div>
          `)
        )
        .addTo(map);

      gdacsMarkersRef.current.push(marker);
    });
  }, [gdacsAlerts, showGDACS, mapReady]);

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
      });

      map.addLayer({
        id: outlineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": ["match", ["get", propKey], 1, outlines[1], 2, outlines[2], 3, outlines[3], outlines[1]],
          "line-width": 0.5,
          "line-opacity": 0.6,
        },
      });

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

        map.addLayer({ id: "volcano-edz-fill", type: "fill", source: "volcano-zones", filter: ["==", ["get", "zone"], "EDZ"], paint: { "fill-color": "rgba(255, 140, 0, 0.25)", "fill-opacity": 0.7 } });
        map.addLayer({ id: "volcano-pdz-fill", type: "fill", source: "volcano-zones", filter: ["==", ["get", "zone"], "PDZ"], paint: { "fill-color": "rgba(206, 17, 38, 0.35)", "fill-opacity": 0.7 } });
        map.addLayer({ id: "volcano-edz-outline", type: "line", source: "volcano-zones", filter: ["==", ["get", "zone"], "EDZ"], paint: { "line-color": "rgba(255, 140, 0, 0.7)", "line-width": 1.5, "line-dasharray": [4, 2] } });
        map.addLayer({ id: "volcano-pdz-outline", type: "line", source: "volcano-zones", filter: ["==", ["get", "zone"], "PDZ"], paint: { "line-color": "rgba(206, 17, 38, 0.8)", "line-width": 2 } });
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

  // Toggle evacuation centers layer
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showEvacCenters) {
      if (!map.getSource("evac-centers")) {
        setHazardLoading(prev => ({ ...prev, evac: true }));
        map.addSource("evac-centers", { type: "geojson", data: EVACUATION_CENTERS });
        map.addLayer({
          id: "evac-centers-layer",
          type: "circle",
          source: "evac-centers",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 4, 15, 8],
            "circle-color": "#4CAF50",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.8,
          },
        });
        map.on("click", "evac-centers-layer", (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const name = f.properties?.name || "Evacuation Center";
          const amenity = f.properties?.amenity || "shelter";
          const capacity = f.properties?.capacity || "N/A";
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "240px" })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:'Inter',sans-serif;font-size:12px;color:#1f2937;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <div style="background:#4CAF50;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:13px;">${name}</div>
                    <div style="font-size:10px;color:#6B7280;text-transform:capitalize;">${amenity}</div>
                  </div>
                </div>
                ${capacity !== "N/A" ? `<div style="font-size:10px;color:#6B7280;">Capacity: ${capacity}</div>` : ""}
                <div style="font-size:9px;color:#6B7280;margin-top:2px;">Source: OpenStreetMap / DSWD</div>
              </div>
            `)
            .addTo(map);
        });
        map.on("mouseenter", "evac-centers-layer", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "evac-centers-layer", () => { map.getCanvas().style.cursor = ""; });
        setHazardLoading(prev => ({ ...prev, evac: false }));
      } else {
        map.setLayoutProperty("evac-centers-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("evac-centers-layer")) map.setLayoutProperty("evac-centers-layer", "visibility", "none");
    }
  }, [showEvacCenters, mapReady]);

  // Theme-aware map style switching
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    // Save current view state
    const center = map.getCenter();
    const zoom = map.getZoom();

    // Switch base style based on theme
    const targetStyle = isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
    map.setStyle(targetStyle);

    map.once("style.load", () => {
      // Restore view
      map.setCenter(center);
      map.setZoom(zoom);

      // Re-add satellite layer if it was active
      if (isSatellite) {
        map.addSource("satellite-tiles", {
          type: "raster",
          tiles: [ESRI_SATELLITE_TILES],
          tileSize: 256,
          attribution: "ESRI World Imagery",
        });
        const firstLayerId = map.getStyle().layers?.[0]?.id;
        map.addLayer({
          id: "satellite-layer",
          type: "raster",
          source: "satellite-tiles",
          paint: { "raster-opacity": 1 },
        }, firstLayerId);
      }
    });
  }, [isDark, mapReady]);

  // Satellite basemap toggle
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    if (isSatellite) {
      if (!map.getSource("satellite-tiles")) {
        map.addSource("satellite-tiles", {
          type: "raster",
          tiles: [ESRI_SATELLITE_TILES],
          tileSize: 256,
          attribution: "ESRI World Imagery",
        });
      }
      if (!map.getLayer("satellite-layer")) {
        const firstLayerId = map.getStyle().layers?.[0]?.id;
        map.addLayer({
          id: "satellite-layer",
          type: "raster",
          source: "satellite-tiles",
          paint: { "raster-opacity": 1 },
        }, firstLayerId);
      } else {
        map.setLayoutProperty("satellite-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("satellite-layer")) {
        map.setLayoutProperty("satellite-layer", "visibility", "none");
      }
    }
  }, [isSatellite, mapReady]);

  // Location search handler
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

  const toggleWaterLevels = useCallback(() => setShowWaterLevels((v) => !v), []);
  const toggleHospitals = useCallback(() => setShowHospitals((v) => !v), []);
  const toggleSchools = useCallback(() => setShowSchools((v) => !v), []);
  const toggleFlood = useCallback(() => setShowFlood((v) => !v), []);
  const toggleLandslide = useCallback(() => setShowLandslide((v) => !v), []);
  const toggleStormSurge = useCallback(() => setShowStormSurge((v) => !v), []);
  const toggleVolcano = useCallback(() => setShowVolcano((v) => !v), []);
  const toggleEvacCenters = useCallback(() => setShowEvacCenters((v) => !v), []);
  const toggleGDACS = useCallback(() => setShowGDACS((v) => !v), []);

  const btnClass = (active: boolean) =>
    `flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-semibold tracking-wider transition-all border ${
      active
        ? isDark
          ? "bg-[oklch(0.18_0.02_260_/_0.95)] border-current shadow-sm"
          : "bg-white/95 border-current shadow-sm"
        : isDark
          ? "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
          : "bg-white/80 border-gray-300 text-gray-500"
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
              <svg className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider bg-white/20 uppercase">WL</span>
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

      {/* Satellite toggle button */}
      <button
        onClick={() => setIsSatellite(v => !v)}
        className={`absolute top-2 right-12 z-[1001] w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md shadow-lg border transition-colors ${
          isSatellite ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700" : isDark ? "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] hover:bg-[oklch(0.18_0.02_260)]" : "bg-white/90 border-gray-200 hover:bg-white"
        }`}
        title={isSatellite ? "Switch to Map view" : "Switch to Satellite view"}
      >
        <svg className={`w-4 h-4 ${isSatellite ? "text-white" : isDark ? "text-gray-400" : "text-gray-700"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
      </button>

      {/* Fullscreen toggle button */}
      <button
        onClick={() => setIsFullscreen(v => !v)}
        className={`absolute top-2 right-2 z-[1001] w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md shadow-lg border transition-colors ${isDark ? 'bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] hover:bg-[oklch(0.18_0.02_260)]' : 'bg-white/90 border-gray-200 hover:bg-white'}`}
        title={isFullscreen ? "Exit fullscreen (ESC)" : "Fullscreen map"}
      >
        {isFullscreen ? (
          <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
        ) : (
          <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        )}
      </button>

      {/* Location Search Bar */}
      <div className={`absolute ${displayAlerts.length > 0 ? "top-10" : "top-2"} left-1/2 -translate-x-1/2 z-[1001] transition-all w-[calc(100%-5rem)] sm:w-auto`}>
        <div className="relative">
          <div className={`flex items-center backdrop-blur-md rounded-lg shadow-lg border transition-all ${showSearch ? "w-full sm:w-72" : "w-full sm:w-44"} ${isDark ? 'bg-[oklch(0.12_0.015_260_/_0.95)] border-[oklch(0.25_0.02_260)]' : 'bg-white/95 border-gray-200'}`}>
            <svg className={`w-4 h-4 ml-3 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              className={`w-full px-2 py-2 text-xs bg-transparent outline-none ${isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="mr-2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>

          {showSearch && searchResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1 backdrop-blur-md rounded-lg shadow-lg border overflow-hidden max-h-64 overflow-y-auto ${isDark ? 'bg-[oklch(0.12_0.015_260_/_0.95)] border-[oklch(0.25_0.02_260)]' : 'bg-white/95 border-gray-200'}`}>
              {searchResults.map((p) => (
                <button key={`${p.name}-${p.region}`} onMouseDown={(e) => e.preventDefault()} onClick={() => flyToProvince(p)} className={`w-full px-3 py-2 text-left transition-colors last:border-0 ${isDark ? 'hover:bg-white/10 border-b border-white/5' : 'hover:bg-blue-50 border-b border-gray-100'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.name}</span>
                    {p.type && p.type !== "province" && (
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                        p.type === "city" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {p.type === "city" ? "CITY" : "MUNI"}
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.region}</div>
                </button>
              ))}
              <div className={`px-3 py-1.5 text-[9px] ${isDark ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-gray-50'}`}>Selecting a location auto-enables hazard layers</div>
            </div>
          )}
        </div>
      </div>

      {/* Layer toggle controls */}
      <div className={`absolute ${displayAlerts.length > 0 ? "top-20" : "top-12"} left-1 sm:left-2 z-[1000] flex flex-col gap-1 sm:gap-1.5 transition-all`}>
        {/* Row 1: GDACS + Water Levels + NOAH Hazard overlays */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={toggleGDACS} className={btnClass(showGDACS)} style={showGDACS ? { color: "#FF4444", borderColor: "#FF4444" } : {}} title="Toggle GDACS Disaster Alerts (last 23h)">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> GDACS{gdacsAlerts.length > 0 ? ` (${gdacsAlerts.length})` : ""}
          </button>
          <button onClick={toggleWaterLevels} className={btnClass(showWaterLevels)} style={showWaterLevels ? { color: "#0038A8", borderColor: "#0038A8" } : {}} title="Toggle water level stations">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> WL
          </button>
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

        {/* Row 2: Volcano + Facilities */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={toggleVolcano} className={btnClass(showVolcano)} style={showVolcano ? { color: "#CE1126", borderColor: "#CE1126" } : {}} title="Toggle Volcano Hazard Zones (PHIVOLCS)">
            {hazardLoading.volcano ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            )} Volcano
          </button>
          <button onClick={toggleHospitals} className={btnClass(showHospitals)} style={showHospitals ? { color: "#00D4FF", borderColor: "#00D4FF" } : {}} title="Toggle NOAH Hospitals">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v5"/><path d="M10 11h4"/><rect x="4" y="6" width="16" height="16" rx="2"/></svg> Hosp
          </button>
          <button onClick={toggleSchools} className={btnClass(showSchools)} style={showSchools ? { color: "#FCD116", borderColor: "#FCD116" } : {}} title="Toggle NOAH Schools">
            <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> School
          </button>
          <button onClick={toggleEvacCenters} className={btnClass(showEvacCenters)} style={showEvacCenters ? { color: "#4CAF50", borderColor: "#4CAF50" } : {}} title="Toggle Evacuation Centers">
            {hazardLoading.evac ? (
              <svg className="w-3 h-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            )} Evac
          </button>
        </div>
      </div>

      {/* Legend overlay */}
      <div className={`absolute bottom-2 left-2 z-[1000] backdrop-blur-md rounded-lg px-2 sm:px-2.5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-mono max-h-[40vh] sm:max-h-[60vh] overflow-y-auto max-w-[45vw] sm:max-w-none border ${isDark ? 'bg-[oklch(0.10_0.015_260_/_0.92)] border-[oklch(0.25_0.02_260_/_0.5)]' : 'bg-white/92 border-gray-200/60'}`}>
        {/* GDACS Alerts Legend */}
        {showGDACS && gdacsAlerts.length > 0 && (
          <>
            <div className={`mb-1 font-semibold text-[9px] tracking-wider ${isDark ? 'text-[oklch(0.55_0.01_260)]' : 'text-gray-500'}`}>GDACS ALERTS</div>
            {[
              { color: "#CE1126", label: "Red (High)" },
              { color: "#FF6B35", label: "Orange (Medium)" },
              { color: "#22C55E", label: "Green (Low)" },
            ].map((item) => (
              <div key={`gdacs-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ background: item.color }} />
                <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>{item.label}</span>
              </div>
            ))}
            <div className={`text-[8px] mb-1 ${isDark ? 'text-[oklch(0.50_0.01_260)]' : 'text-gray-400'}`}>Last 23h only</div>
          </>
        )}

        {/* NOAH Hazards Legend */}
        {(showFlood || showLandslide || showStormSurge) && (
          <>
            <div className={`mb-1 font-semibold text-[9px] tracking-wider ${isDark ? 'text-[oklch(0.55_0.01_260)]' : 'text-gray-500'}`}>NOAH HAZARDS</div>
            {showFlood && (
              <div className="mb-1">
                <div className="text-[8px] text-[#41B6E6] font-semibold mb-0.5">Flood</div>
                {[{ color: "rgba(65, 182, 230, 0.6)", label: "Low" }, { color: "rgba(30, 120, 220, 0.7)", label: "Medium" }, { color: "rgba(10, 50, 168, 0.8)", label: "High" }].map((item) => (
                  <div key={`flood-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
                    <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>{item.label}</span>
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
                    <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>{item.label}</span>
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
                    <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Volcano Legend */}
        {showVolcano && (
          <>
            <div className={`mb-1 mt-1.5 font-semibold text-[9px] tracking-wider pt-1.5 border-t ${isDark ? 'text-[oklch(0.55_0.01_260)] border-[oklch(0.25_0.02_260_/_0.5)]' : 'text-gray-500 border-gray-200'}`}>VOLCANO ZONES</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: "rgba(206, 17, 38, 0.5)" }} />
              <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>PDZ (Permanent)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-2 rounded-sm border border-dashed border-orange-400" style={{ background: "rgba(255, 140, 0, 0.3)" }} />
              <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>EDZ (Extended)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] border border-white" />
              <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>Summit</span>
            </div>
          </>
        )}

        <div className={`mb-1 font-semibold text-[9px] tracking-wider pt-1.5 border-t ${isDark ? 'text-[oklch(0.55_0.01_260)] border-[oklch(0.25_0.02_260_/_0.5)]' : 'text-gray-500 border-gray-200'}`}>FACILITIES</div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" />
          <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>Hospitals</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
          <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>Schools</span>
        </div>

        {/* Evacuation Centers Legend */}
        {showEvacCenters && (
          <>
            <div className={`mb-1 mt-1.5 font-semibold text-[9px] tracking-wider pt-1.5 border-t ${isDark ? 'text-[oklch(0.55_0.01_260)] border-[oklch(0.25_0.02_260_/_0.5)]' : 'text-gray-500 border-gray-200'}`}>EVACUATION CENTERS</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
              <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>Shelter / Evac Center</span>
            </div>
            <div className={`text-[8px] ${isDark ? 'text-[oklch(0.50_0.01_260)]' : 'text-gray-400'}`}>Source: OSM / DSWD (6,424)</div>
          </>
        )}

        <div className={`mb-1 font-semibold text-[9px] tracking-wider pt-1.5 border-t ${isDark ? 'text-[oklch(0.55_0.01_260)] border-[oklch(0.25_0.02_260_/_0.5)]' : 'text-gray-500 border-gray-200'}`}>WATER LEVELS</div>
        {[
          { color: "#0038A8", label: "Normal" },
          { color: "#FCD116", label: "Alert" },
          { color: "#FF6B35", label: "Alarm" },
          { color: "#CE1126", label: "Critical" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 mb-0.5">
            <svg className="w-3 h-3.5 shrink-0" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C14 0 0 14 0 22C0 28.627 6.268 34 14 34C21.732 34 28 28.627 28 22C28 14 14 0 14 0Z" fill={item.color}/>
            </svg>
            <span className={isDark ? 'text-[oklch(0.70_0.005_260)]' : 'text-gray-600'}>{item.label}</span>
          </div>
        ))}
      </div>



      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[1000] flex flex-col items-end gap-0.5">
        <div className={`text-[7px] font-mono ${isDark ? 'text-[oklch(0.45_0.01_260)]' : 'text-gray-400'}`}>{isSatellite ? "ESRI Satellite" : "CARTO / OpenStreetMap"}</div>
        <div className={`text-[7px] font-mono ${isDark ? 'text-[oklch(0.45_0.01_260)]' : 'text-gray-400'}`}>Data: PAGASA / UPRI-NOAH / PHIVOLCS / GDACS</div>
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
