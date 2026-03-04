// PH Mission Control — Map Panel (MapLibre GL JS)
// Uses free CARTO dark basemap tiles — no API token required
// Earthquake markers from USGS, Typhoon tracker from GDACS, Water level stations from PAGASA
// NOAH critical facilities (Hospitals, Schools) from S3 GeoJSON
// NOAH Hazard overlays: Flood, Landslide, Storm Surge (Nationwide 81 provinces) from simplified GeoJSON
// Toggle controls for each layer type

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
  formatMagnitude,
  getTyphoonColor,
  getTyphoonCategory,
  getWaterLevelColor,
} from "@/lib/feeds";

// Free dark basemap style (CARTO Dark Matter — no token needed)
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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

// Hazard color schemes matching NOAH Studio
// Flood: Var property (1=Low, 2=Medium, 3=High)
// Landslide: LH property (1=Low, 2=Medium, 3=High)
// Storm Surge: HAZ property (1=Low, 2=Medium, 3=High)
const HAZARD_COLORS = {
  flood: {
    1: "rgba(65, 182, 230, 0.45)",   // Low - light blue
    2: "rgba(30, 120, 220, 0.55)",    // Medium - blue
    3: "rgba(10, 50, 168, 0.65)",     // High - dark blue
  },
  landslide: {
    1: "rgba(252, 209, 22, 0.45)",    // Low - yellow
    2: "rgba(242, 153, 74, 0.55)",    // Medium - orange
    3: "rgba(206, 17, 38, 0.65)",     // High - red
  },
  stormsurge: {
    1: "rgba(180, 130, 255, 0.40)",   // Low - light purple
    2: "rgba(220, 80, 180, 0.50)",    // Medium - magenta
    3: "rgba(206, 17, 38, 0.60)",     // High - red
  },
};

const HAZARD_OUTLINES = {
  flood: {
    1: "rgba(65, 182, 230, 0.7)",
    2: "rgba(30, 120, 220, 0.7)",
    3: "rgba(10, 50, 168, 0.8)",
  },
  landslide: {
    1: "rgba(252, 209, 22, 0.6)",
    2: "rgba(242, 153, 74, 0.7)",
    3: "rgba(206, 17, 38, 0.8)",
  },
  stormsurge: {
    1: "rgba(180, 130, 255, 0.5)",
    2: "rgba(220, 80, 180, 0.6)",
    3: "rgba(206, 17, 38, 0.7)",
  },
};

function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return "#CE1126";
  if (mag >= 5) return "#FF6B35";
  if (mag >= 4) return "#FCD116";
  return "#0038A8";
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
  const [mapReady, setMapReady] = useState(false);
  const [hazardLoading, setHazardLoading] = useState<Record<string, boolean>>({});

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: DARK_STYLE,
      center: [121.774, 12.8797],
      zoom: 5.5,
      maxBounds: [[110, 2], [135, 22]],
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

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
          "circle-radius": [
            "interpolate", ["linear"], ["get", "mag"],
            3, 12, 4, 16, 5, 22, 6, 30, 7, 40,
          ],
          "circle-color": [
            "interpolate", ["linear"], ["get", "mag"],
            3, "#0038A8", 4, "#FCD116", 5, "#FF6B35", 7, "#CE1126",
          ],
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "earthquake-circles",
        type: "circle",
        source: "earthquakes",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "mag"],
            3, 4, 4, 6, 5, 9, 6, 13, 7, 18,
          ],
          "circle-color": [
            "interpolate", ["linear"], ["get", "mag"],
            3, "#0038A8", 4, "#FCD116", 5, "#FF6B35", 7, "#CE1126",
          ],
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
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#e5e7eb;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${color};color:white;font-weight:800;font-size:18px;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;">${mag.toFixed(1)}</div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${place}</div>
                  <div style="font-size:10px;color:#9CA3AF;">${time}</div>
                </div>
              </div>
              <div style="font-size:10px;color:#9CA3AF;">
                Depth: ${f.properties?.depth || "N/A"} km • ${formatMagnitude(mag)}
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "earthquake-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "earthquake-circles", () => {
        map.getCanvas().style.cursor = "";
      });

      setMapReady(true);
      mapInstance.current = map;
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

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
        geometry: {
          type: "Point" as const,
          coordinates: eq.geometry.coordinates,
        },
        properties: {
          mag: eq.properties.mag,
          place: eq.properties.place,
          time: eq.properties.time,
          depth: eq.geometry.coordinates[2],
        },
      })),
    });

    const vis = showEarthquakes ? "visible" : "none";
    if (map.getLayer("earthquake-circles")) map.setLayoutProperty("earthquake-circles", "visibility", vis);
    if (map.getLayer("earthquake-glow")) map.setLayoutProperty("earthquake-glow", "visibility", vis);
  }, [earthquakes, showEarthquakes, mapReady]);

  // Render typhoon markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Remove old typhoon markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showTyphoons) return;

    typhoons.forEach((tc) => {
      const color = getTyphoonColor(tc.alertLevel, tc.windSpeed);
      const category = getTyphoonCategory(tc.windSpeed);

      // Animated typhoon marker
      const el = document.createElement("div");
      el.style.cssText = `
        width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
        font-size: 24px; cursor: pointer; animation: typhoon-spin 3s linear infinite;
        filter: drop-shadow(0 0 8px ${color});
      `;
      el.textContent = "🌀";

      // Pulsing ring
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: absolute; width: 50px; height: 50px; border-radius: 50%;
        border: 2px solid ${color}; opacity: 0.5; animation: typhoon-pulse 2s ease-out infinite;
        pointer-events: none;
      `;
      el.appendChild(ring);

      const popup = new maplibregl.Popup({
        className: "noah-popup",
        maxWidth: "280px",
        offset: 20,
      }).setHTML(`
        <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#e5e7eb;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:28px;filter:drop-shadow(0 0 6px ${color});">🌀</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:${color};">${tc.name}</div>
              <div style="font-size:10px;color:#9CA3AF;">${category}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Wind Speed</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${color};">${tc.windSpeed} km/h</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Alert Level</span>
              <span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;">${tc.alertLevel}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#9CA3AF;font-size:10px;">Source</span>
              <span style="font-size:10px;">GDACS</span>
            </div>
          </div>
          <a href="${tc.link}" target="_blank" rel="noopener" style="display:block;text-align:center;margin-top:6px;color:#0038A8;font-size:10px;text-decoration:underline;">View on GDACS →</a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([tc.lon, tc.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [typhoons, showTyphoons, mapReady]);

  // Render water level station markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Remove old WL markers
    document.querySelectorAll(".wl-marker").forEach((el) => el.remove());

    if (!showWaterLevels || waterLevels.length === 0) return;

    waterLevels.forEach((station) => {
      const color = getWaterLevelColor(station.status);
      const wl = parseFloat(station.currentWL);
      const statusLabel =
        (station.criticalWL !== null && wl >= station.criticalWL)
          ? "CRITICAL"
          : (station.alarmWL !== null && wl >= station.alarmWL)
          ? "ALARM"
          : (station.alertWL !== null && wl >= station.alertWL)
          ? "ALERT"
          : "NORMAL";

      const el = document.createElement("div");
      el.className = "wl-marker";
      el.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        background: ${color}; border: 2px solid rgba(255,255,255,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; cursor: pointer;
        box-shadow: 0 0 8px ${color}88;
      `;
      el.textContent = "🌊";

      let thresholdHTML = "";
      if (station.alertWL || station.alarmWL || station.criticalWL) {
        thresholdHTML = `<div style="margin-top:4px;background:rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;">`;
        thresholdHTML += `<div style="font-size:9px;color:#9CA3AF;margin-bottom:2px;">Thresholds</div>`;
        if (station.alertWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#FCD116;font-size:10px;">Alert</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.alertWL}m</span></div>`;
        if (station.alarmWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#FF6B35;font-size:10px;">Alarm</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.alarmWL}m</span></div>`;
        if (station.criticalWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#CE1126;font-size:10px;">Critical</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.criticalWL}m</span></div>`;
        thresholdHTML += `</div>`;
      }

      const popup = new maplibregl.Popup({
        className: "noah-popup",
        maxWidth: "260px",
        offset: 15,
      }).setHTML(`
        <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#e5e7eb;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">🌊</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:${color};">${station.name}</div>
              <div style="font-size:10px;color:#9CA3AF;">PAGASA FFWS Station</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Water Level</span>
              <span style="color:${color};font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px;">${station.currentWL}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Status</span>
              <span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;">${statusLabel}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#9CA3AF;font-size:10px;">Updated</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.timestamp}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;font-size:9px;color:#9CA3AF;font-family:'JetBrains Mono',monospace;margin-top:4px;">
            <span>-10m: ${station.wl10m}</span>
            <span>-30m: ${station.wl30m}</span>
            <span>-1h: ${station.wl1h}</span>
          </div>
          ${thresholdHTML}
        </div>
      `);

      new maplibregl.Marker({ element: el })
        .setLngLat([station.lon, station.lat])
        .setPopup(popup)
        .addTo(map);
    });
  }, [waterLevels, showWaterLevels, mapReady]);

  // ===== NOAH HAZARD LAYERS =====
  
  // Helper to add a hazard layer
  const addHazardLayer = useCallback(async (
    hazardType: "flood" | "landslide" | "stormsurge",
    propKey: string,
    url: string
  ) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const sourceId = `noah-${hazardType}`;
    const fillId = `noah-${hazardType}-fill`;
    const outlineId = `noah-${hazardType}-outline`;

    if (map.getSource(sourceId)) {
      // Already loaded, just show
      if (map.getLayer(fillId)) map.setLayoutProperty(fillId, "visibility", "visible");
      if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, "visibility", "visible");
      return;
    }

    // Show loading state
    setHazardLoading(prev => ({ ...prev, [hazardType]: true }));

    try {
      const response = await fetch(url);
      const geojson = await response.json();

      if (!mapInstance.current) return;

      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      const colors = HAZARD_COLORS[hazardType];
      const outlines = HAZARD_OUTLINES[hazardType];

      // Fill layer with data-driven color based on hazard level
      map.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": [
            "match",
            ["get", propKey],
            1, colors[1],
            2, colors[2],
            3, colors[3],
            colors[1],
          ],
          "fill-opacity": 1,
        },
      }, "earthquake-glow"); // Insert below earthquake layers

      // Outline layer
      map.addLayer({
        id: outlineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": [
            "match",
            ["get", propKey],
            1, outlines[1],
            2, outlines[2],
            3, outlines[3],
            outlines[1],
          ],
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
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#e5e7eb;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="background:${levelColor};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:16px;">${hazardType === "flood" ? "🌊" : hazardType === "landslide" ? "⛰️" : "🌊"}</span>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;">${typeLabel} Hazard</div>
                  <div style="font-size:10px;color:#9CA3AF;">NOAH Philippines</div>
                </div>
              </div>
              <div style="background:rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#9CA3AF;font-size:10px;">Risk Level</span>
                  <span style="background:${levelColor};color:white;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;">${levelLabel}</span>
                </div>
              </div>
              <div style="font-size:9px;color:#9CA3AF;margin-top:4px;">
                Source: UPRI Project NOAH • 100-year return period
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", fillId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", fillId, () => {
        map.getCanvas().style.cursor = "";
      });

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
    if (showFlood) {
      addHazardLayer("flood", "Var", NOAH_HAZARDS.flood);
    } else {
      hideHazardLayer("flood");
    }
  }, [showFlood, mapReady, addHazardLayer, hideHazardLayer]);

  // Toggle landslide hazard
  useEffect(() => {
    if (!mapReady) return;
    if (showLandslide) {
      addHazardLayer("landslide", "LH", NOAH_HAZARDS.landslide);
    } else {
      hideHazardLayer("landslide");
    }
  }, [showLandslide, mapReady, addHazardLayer, hideHazardLayer]);

  // Toggle storm surge hazard
  useEffect(() => {
    if (!mapReady) return;
    if (showStormSurge) {
      addHazardLayer("stormsurge", "HAZ", NOAH_HAZARDS.stormsurge);
    } else {
      hideHazardLayer("stormsurge");
    }
  }, [showStormSurge, mapReady, addHazardLayer, hideHazardLayer]);

  const toggleEarthquakes = useCallback(() => setShowEarthquakes((v) => !v), []);
  const toggleTyphoons = useCallback(() => setShowTyphoons((v) => !v), []);
  const toggleWaterLevels = useCallback(() => setShowWaterLevels((v) => !v), []);
  const toggleHospitals = useCallback(() => setShowHospitals((v) => !v), []);
  const toggleSchools = useCallback(() => setShowSchools((v) => !v), []);
  const toggleFlood = useCallback(() => setShowFlood((v) => !v), []);
  const toggleLandslide = useCallback(() => setShowLandslide((v) => !v), []);
  const toggleStormSurge = useCallback(() => setShowStormSurge((v) => !v), []);

  // Load hospitals GeoJSON when toggled
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showHospitals) {
      if (!map.getSource("hospitals")) {
        map.addSource("hospitals", {
          type: "geojson",
          data: CRITICAL_FACILITIES.hospitals,
        });
        map.addLayer({
          id: "hospitals-layer",
          type: "circle",
          source: "hospitals",
          paint: {
            "circle-radius": 4,
            "circle-color": "#00D4FF",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.8,
          },
        });
        map.on("click", "hospitals-layer", (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const name = f.properties?.name || f.properties?.NAME || "Hospital";
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "220px" })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:'Inter',sans-serif;font-size:12px;color:#e5e7eb;">
                <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                  <span>🏥</span>
                  <span style="font-weight:700;font-size:13px;color:#00D4FF;">${name}</span>
                </div>
                <div style="color:#9CA3AF;font-size:10px;">Critical Facility — Hospital</div>
              </div>
            `)
            .addTo(map);
        });
        map.on("mouseenter", "hospitals-layer", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "hospitals-layer", () => { map.getCanvas().style.cursor = ""; });
      } else {
        map.setLayoutProperty("hospitals-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("hospitals-layer")) {
        map.setLayoutProperty("hospitals-layer", "visibility", "none");
      }
    }
  }, [showHospitals, mapReady]);

  // Load schools GeoJSON when toggled
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (showSchools) {
      if (!map.getSource("schools")) {
        map.addSource("schools", {
          type: "geojson",
          data: CRITICAL_FACILITIES.schools,
        });
        map.addLayer({
          id: "schools-layer",
          type: "circle",
          source: "schools",
          paint: {
            "circle-radius": 3,
            "circle-color": "#FCD116",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.7,
          },
        });
        map.on("click", "schools-layer", (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const name = f.properties?.name || f.properties?.NAME || "School";
          new maplibregl.Popup({ className: "noah-popup", maxWidth: "220px" })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:'Inter',sans-serif;font-size:12px;color:#e5e7eb;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span>🏫</span>
                  <span style="font-weight:700;font-size:13px;color:#FCD116;">${name}</span>
                </div>
                <div style="color:#9CA3AF;font-size:10px;">Critical Facility — School</div>
              </div>
            `)
            .addTo(map);
        });
        map.on("mouseenter", "schools-layer", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "schools-layer", () => { map.getCanvas().style.cursor = ""; });
      } else {
        map.setLayoutProperty("schools-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("schools-layer")) {
        map.setLayoutProperty("schools-layer", "visibility", "none");
      }
    }
  }, [showSchools, mapReady]);

  // Fly to Metro Manila when any hazard layer is first enabled
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    if (showFlood || showLandslide || showStormSurge) {
      const map = mapInstance.current;
      const zoom = map.getZoom();
      // Only fly if zoomed out (viewing whole Philippines)
      if (zoom < 9) {
        map.flyTo({
          center: [121.0, 14.55],
          zoom: 10.5,
          duration: 2000,
          essential: true,
        });
      }
    }
  }, [showFlood, showLandslide, showStormSurge, mapReady]);

  const btnClass = (active: boolean) =>
    `flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold tracking-wider transition-all border ${
      active
        ? "bg-[oklch(0.18_0.02_260_/_0.95)] border-current shadow-sm"
        : "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
    }`;

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />

      {/* Layer toggle controls */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1.5">
        {/* Row 1: Data layers */}
        <div className="flex gap-1">
          <button
            onClick={toggleEarthquakes}
            className={btnClass(showEarthquakes)}
            style={showEarthquakes ? { color: "#FCD116", borderColor: "#FCD116" } : {}}
            title="Toggle earthquake markers"
          >
            <span className="text-[11px]">🔴</span> EQ
          </button>
          <button
            onClick={toggleTyphoons}
            className={btnClass(showTyphoons)}
            style={showTyphoons ? { color: "#FF6B35", borderColor: "#FF6B35" } : {}}
            title="Toggle typhoon tracker"
          >
            <span className="text-[11px]">🌀</span> TC
          </button>
          <button
            onClick={toggleWaterLevels}
            className={btnClass(showWaterLevels)}
            style={showWaterLevels ? { color: "#0038A8", borderColor: "#0038A8" } : {}}
            title="Toggle water level stations"
          >
            <span className="text-[11px]">🌊</span> WL
          </button>
        </div>

        {/* Row 2: NOAH Hazard overlays */}
        <div className="flex gap-1">
          <button
            onClick={toggleFlood}
            className={btnClass(showFlood)}
            style={showFlood ? { color: "#41B6E6", borderColor: "#41B6E6" } : {}}
            title="Toggle NOAH Flood Hazard (Metro Manila)"
          >
            {hazardLoading.flood ? (
              <span className="text-[11px] animate-spin">⏳</span>
            ) : (
              <span className="text-[11px]">💧</span>
            )}
            FLOOD
          </button>
          <button
            onClick={toggleLandslide}
            className={btnClass(showLandslide)}
            style={showLandslide ? { color: "#F2994A", borderColor: "#F2994A" } : {}}
            title="Toggle NOAH Landslide Hazard (Metro Manila)"
          >
            {hazardLoading.landslide ? (
              <span className="text-[11px] animate-spin">⏳</span>
            ) : (
              <span className="text-[11px]">⛰️</span>
            )}
            SLIDE
          </button>
          <button
            onClick={toggleStormSurge}
            className={btnClass(showStormSurge)}
            style={showStormSurge ? { color: "#B482FF", borderColor: "#B482FF" } : {}}
            title="Toggle NOAH Storm Surge Hazard (Metro Manila)"
          >
            {hazardLoading.stormsurge ? (
              <span className="text-[11px] animate-spin">⏳</span>
            ) : (
              <span className="text-[11px]">🌊</span>
            )}
            SURGE
          </button>
        </div>

        {/* Row 3: Facilities */}
        <div className="flex gap-1">
          <button
            onClick={toggleHospitals}
            className={btnClass(showHospitals)}
            style={showHospitals ? { color: "#00D4FF", borderColor: "#00D4FF" } : {}}
            title="Toggle NOAH Hospitals"
          >
            <span className="text-[11px]">🏥</span> HOSP
          </button>
          <button
            onClick={toggleSchools}
            className={btnClass(showSchools)}
            style={showSchools ? { color: "#FCD116", borderColor: "#FCD116" } : {}}
            title="Toggle NOAH Schools"
          >
            <span className="text-[11px]">🏫</span> SCHOOL
          </button>
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-2 text-[10px] font-mono border border-[oklch(0.25_0.02_260_/_0.5)] max-h-[320px] overflow-y-auto">
        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider">
          EARTHQUAKES
        </div>
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

        {/* NOAH Hazards Legend */}
        {(showFlood || showLandslide || showStormSurge) && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
              NOAH HAZARDS
            </div>
            {showFlood && (
              <div className="mb-1">
                <div className="text-[8px] text-[#41B6E6] font-semibold mb-0.5">Flood</div>
                {[
                  { color: "rgba(65, 182, 230, 0.6)", label: "Low" },
                  { color: "rgba(30, 120, 220, 0.7)", label: "Medium" },
                  { color: "rgba(10, 50, 168, 0.8)", label: "High" },
                ].map((item) => (
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
                {[
                  { color: "rgba(252, 209, 22, 0.6)", label: "Low" },
                  { color: "rgba(242, 153, 74, 0.7)", label: "Medium" },
                  { color: "rgba(206, 17, 38, 0.8)", label: "High" },
                ].map((item) => (
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
                {[
                  { color: "rgba(180, 130, 255, 0.5)", label: "Low" },
                  { color: "rgba(220, 80, 180, 0.6)", label: "Medium" },
                  { color: "rgba(206, 17, 38, 0.7)", label: "High" },
                ].map((item) => (
                  <div key={`surge-${item.label}`} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
                    <span className="text-[oklch(0.70_0.005_260)]">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-[oklch(0.55_0.01_260)] mb-1 mt-1.5 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
          FACILITIES
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" />
          <span className="text-[oklch(0.70_0.005_260)]">Hospitals</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
          <span className="text-[oklch(0.70_0.005_260)]">Schools</span>
        </div>

        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
          WATER LEVELS
        </div>
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
        {waterLevels.length > 0 && (
          <div>
            <span className="text-[#0038A8] font-bold">{waterLevels.length}</span>{" "}
            water stations
          </div>
        )}
        {(showFlood || showLandslide || showStormSurge) && (
          <div className="border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-0.5 mt-0.5">
            <span className="text-[#41B6E6] font-bold">NOAH</span>{" "}
            <span className="text-[8px]">Metro Manila</span>
          </div>
        )}
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[1000] text-[8px] text-[oklch(0.45_0.01_260)] font-mono">
        Data: USGS / GDACS / PAGASA / UPRI-NOAH
      </div>
    </div>
  );
}
