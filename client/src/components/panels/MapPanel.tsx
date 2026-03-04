// Design: "Ops Center Noir" — Mapbox GL JS map with NOAH hazard layers
// Flood (100yr), Landslide (LH1/LH2), Storm Surge (SSA4) from UPRI-NOAH tilesets
// Earthquake markers from USGS, Typhoon tracker from GDACS, Water level stations from PAGASA
// Toggle controls for each layer type

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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

// NOAH public token from their live production site (noah.up.edu.ph)
mapboxgl.accessToken =
  "pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZTZyMGdjYzAybGMzbmwxMHA4MnE0enMifQ.tuOhBGsN-M7JCPaUqZ0Hng";

// NOAH hazard tileset configuration
const NOAH_TILESETS = {
  flood: {
    url: "mapbox://upri-noah.ph_fh_100yr_tls",
    sourceLayers: Array.from({ length: 18 }, (_, i) =>
      `PH${String(i + 1).padStart(2, "0")}0000000_FH_100yr`
    ),
    variable: "Var",
    colors: { 1: "#F2C94C", 2: "#F2994A", 3: "#EB5757" },
  },
  landslide: {
    url: "mapbox://upri-noah.ph_lh_lh1_tls",
    sourceLayers: Array.from({ length: 18 }, (_, i) =>
      `PH${String(i + 1).padStart(2, "0")}0000000_LH_lh1`
    ),
    variable: "LH",
    colors: { 1: "#F2C94C", 2: "#F2994A", 3: "#EB5757" },
  },
  stormSurge: {
    url: "mapbox://upri-noah.ph_ssh_ssa4_tls",
    sourceLayers: [
      ...Array.from({ length: 14 }, (_, i) =>
        `PH${String(i + 1).padStart(2, "0")}0000000_SSH_ssa4`
      ),
      "PH150000000_SSH_ssa4",
      "PH160000000_SSH_ssa4",
      "PH170000000_SSH_ssa4",
      "PH180000000_SSH_ssa4",
    ],
    variable: "HAZ",
    colors: { 1: "#F2C94C", 2: "#F2994A", 3: "#EB5757" },
  },
};

// Critical facilities GeoJSON from NOAH S3
const CRITICAL_FACILITIES = {
  hospitals: "https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/hospitals.geojson",
  schools: "https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/schools.geojson",
};

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);

  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [typhoons, setTyphoons] = useState<TyphoonData[]>([]);
  const [waterLevels, setWaterLevels] = useState<WaterLevelStation[]>([]);

  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showTyphoons, setShowTyphoons] = useState(true);
  const [showWaterLevels, setShowWaterLevels] = useState(true);
  const [showFlood, setShowFlood] = useState(false);
  const [showLandslide, setShowLandslide] = useState(false);
  const [showStormSurge, setShowStormSurge] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showSchools, setShowSchools] = useState(false);
  const [hazardLayersAvailable, setHazardLayersAvailable] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Mapbox GL map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11", // Mapbox dark style — clean mission control aesthetic
      center: [121.774, 12.8797],
      zoom: 5.5,
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      // Try to add NOAH hazard tilesets (may fail if tilesets are restricted)
      try {
        map.addSource("noah-flood", { type: "vector", url: NOAH_TILESETS.flood.url });
        NOAH_TILESETS.flood.sourceLayers.forEach((layerName) => {
          map.addLayer({
            id: `flood-${layerName}`, type: "fill", source: "noah-flood",
            "source-layer": layerName,
            paint: { "fill-color": ["interpolate", ["linear"], ["get", "Var"], 1, "#F2C94C", 2, "#F2994A", 3, "#EB5757"], "fill-opacity": 0.65 },
            layout: { visibility: "none" },
          });
        });

        map.addSource("noah-landslide", { type: "vector", url: NOAH_TILESETS.landslide.url });
        NOAH_TILESETS.landslide.sourceLayers.forEach((layerName) => {
          map.addLayer({
            id: `landslide-${layerName}`, type: "fill", source: "noah-landslide",
            "source-layer": layerName,
            paint: { "fill-color": ["interpolate", ["linear"], ["get", "LH"], 1, "#F2C94C", 2, "#F2994A", 3, "#EB5757"], "fill-opacity": 0.65 },
            layout: { visibility: "none" },
          });
        });

        map.addSource("noah-storm-surge", { type: "vector", url: NOAH_TILESETS.stormSurge.url });
        NOAH_TILESETS.stormSurge.sourceLayers.forEach((layerName) => {
          map.addLayer({
            id: `surge-${layerName}`, type: "fill", source: "noah-storm-surge",
            "source-layer": layerName,
            paint: { "fill-color": ["interpolate", ["linear"], ["get", "HAZ"], 1, "#F2C94C", 2, "#F2994A", 3, "#EB5757"], "fill-opacity": 0.65 },
            layout: { visibility: "none" },
          });
        });
      } catch (err) {
        console.warn("NOAH hazard tilesets not available (restricted access)", err);
        setHazardLayersAvailable(false);
      }

      // Listen for tileset errors and gracefully disable
      map.on("error", (e) => {
        const msg = e.error?.message || "";
        if (msg.includes("403") || msg.includes("Forbidden")) {
          setHazardLayersAvailable(false);
        }
      });

      // Add earthquake GeoJSON source (empty initially)
      map.addSource("earthquakes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "earthquake-circles",
        type: "circle",
        source: "earthquakes",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2, 3,
            4, 6,
            5, 10,
            6, 15,
            7, 22,
            8, 30,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            3, "#0038A8",
            4, "#FCD116",
            5, "#FF6B35",
            7, "#CE1126",
          ],
          "circle-opacity": 0.7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            3, "#0038A8",
            4, "#FCD116",
            5, "#FF6B35",
            7, "#CE1126",
          ],
          "circle-stroke-opacity": 0.9,
        },
      });

      // Earthquake click popup
      map.on("click", "earthquake-circles", (e) => {
        if (!e.features || e.features.length === 0) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = f.properties!;
        const mag = props.mag;
        const { color, label } = formatMagnitude(mag);
        const time = new Date(props.time).toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
        });

        new mapboxgl.Popup({ className: "noah-popup", maxWidth: "280px" })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.4;color:#e5e7eb;">
              <div style="font-weight:700;font-size:15px;color:${color};margin-bottom:4px;">M${Number(mag).toFixed(1)} Earthquake</div>
              <div style="margin-bottom:2px;">${props.place}</div>
              <div style="color:#9CA3AF;font-size:11px;font-family:'JetBrains Mono',monospace;">${time} PHT</div>
              <div style="margin-top:8px;display:flex;gap:4px;">
                <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;">${label}</span>
                ${props.tsunami ? '<span style="background:#CE1126;color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;">TSUNAMI</span>' : ""}
              </div>
              <a href="${props.url}" target="_blank" rel="noopener" style="display:block;margin-top:8px;color:#0038A8;font-size:10px;">View on USGS →</a>
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
    });

    mapInstance.current = map;

    const observer = new ResizeObserver(() => {
      map.resize();
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
    const loadWL = async () => {
      const data = await fetchWaterLevels();
      setWaterLevels(data);
    };
    loadEQ();
    loadTC();
    loadWL();
    const eqInterval = setInterval(loadEQ, 300000);
    const tcInterval = setInterval(loadTC, 600000);
    const wlInterval = setInterval(loadWL, 120000);
    return () => {
      clearInterval(eqInterval);
      clearInterval(tcInterval);
      clearInterval(wlInterval);
    };
  }, []);

  // Update earthquake source data
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;
    const source = map.getSource("earthquakes") as mapboxgl.GeoJSONSource;
    if (!source) return;

    if (showEarthquakes && earthquakes.length > 0) {
      source.setData({
        type: "FeatureCollection",
        features: earthquakes.map((eq) => ({
          type: "Feature" as const,
          geometry: eq.geometry,
          properties: eq.properties,
        })),
      });
      map.setLayoutProperty("earthquake-circles", "visibility", "visible");
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
      if (map.getLayer("earthquake-circles")) {
        map.setLayoutProperty("earthquake-circles", "visibility", "none");
      }
    }
  }, [earthquakes, showEarthquakes, mapReady]);

  // Update typhoon markers (using Mapbox markers since they need custom HTML)
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing typhoon markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showTyphoons) return;

    typhoons.forEach((tc) => {
      const color = getTyphoonColor(tc.alertLevel, tc.windSpeed);
      const cat = getTyphoonCategory(tc.windSpeed);

      // Typhoon marker element
      const el = document.createElement("div");
      el.className = "typhoon-map-marker";
      el.innerHTML = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div class="typhoon-spin" style="font-size:32px;filter:drop-shadow(0 0 10px ${color});">🌀</div>
          <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);white-space:nowrap;background:${color};color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;font-family:'JetBrains Mono',monospace;letter-spacing:0.03em;">
            ${tc.name}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        className: "noah-popup",
        maxWidth: "280px",
        offset: 25,
      }).setHTML(`
        <div style="font-family:'Inter',sans-serif;font-size:12px;line-height:1.5;color:#e5e7eb;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:22px;">🌀</span>
            <div>
              <div style="font-weight:700;font-size:15px;color:${color};">${tc.name}</div>
              <div style="font-size:10px;color:#9CA3AF;">${cat}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:6px;padding:8px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Wind Speed</span>
              <span style="font-weight:600;font-family:'JetBrains Mono',monospace;font-size:12px;">${tc.windSpeed.toFixed(0)} km/h</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#9CA3AF;font-size:10px;">Position</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:11px;">${tc.lat.toFixed(1)}°, ${tc.lon.toFixed(1)}°</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#9CA3AF;font-size:10px;">Alert Level</span>
              <span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;">${tc.alertLevel}</span>
            </div>
          </div>
          <a href="${tc.link}" target="_blank" rel="noopener" style="display:block;color:#0038A8;font-size:10px;">View on GDACS →</a>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tc.lon, tc.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [typhoons, showTyphoons, mapReady]);

  // Update water level markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing water level popups/markers
    popupsRef.current.forEach((p) => p.remove());
    popupsRef.current = [];

    // Remove existing WL markers by class
    document.querySelectorAll(".wl-map-marker").forEach((el) => el.remove());

    if (!showWaterLevels) return;

    waterLevels.forEach((station) => {
      if (!station.lat || !station.lon) return;
      const color = getWaterLevelColor(station.status);
      const statusLabel = station.status.toUpperCase();

      const el = document.createElement("div");
      el.className = "wl-map-marker";
      el.style.cssText = `width:22px;height:22px;border-radius:4px;background:${color};border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}66;cursor:pointer;font-size:11px;`;
      el.textContent = "🌊";

      let thresholdHTML = "";
      if (station.alertWL || station.alarmWL || station.criticalWL) {
        thresholdHTML = `<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;margin-top:6px;">
          <div style="color:#9CA3AF;font-size:9px;font-weight:600;margin-bottom:3px;">THRESHOLDS</div>`;
        if (station.alertWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#FCD116;font-size:10px;">Alert</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.alertWL}m</span></div>`;
        if (station.alarmWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#FF6B35;font-size:10px;">Alarm</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.alarmWL}m</span></div>`;
        if (station.criticalWL) thresholdHTML += `<div style="display:flex;justify-content:space-between;"><span style="color:#CE1126;font-size:10px;">Critical</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;">${station.criticalWL}m</span></div>`;
        thresholdHTML += `</div>`;
      }

      const popup = new mapboxgl.Popup({
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

      new mapboxgl.Marker({ element: el })
        .setLngLat([station.lon, station.lat])
        .setPopup(popup)
        .addTo(map);
    });
  }, [waterLevels, showWaterLevels, mapReady]);

  // Toggle NOAH hazard layers visibility
  const toggleHazardLayers = useCallback(
    (prefix: string, sourceLayers: string[], visible: boolean) => {
      if (!mapInstance.current) return;
      const map = mapInstance.current;
      sourceLayers.forEach((layerName) => {
        const layerId = `${prefix}-${layerName}`;
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            visible ? "visible" : "none"
          );
        }
      });
    },
    []
  );

  useEffect(() => {
    if (!mapReady) return;
    toggleHazardLayers("flood", NOAH_TILESETS.flood.sourceLayers, showFlood);
  }, [showFlood, mapReady, toggleHazardLayers]);

  useEffect(() => {
    if (!mapReady) return;
    toggleHazardLayers("landslide", NOAH_TILESETS.landslide.sourceLayers, showLandslide);
  }, [showLandslide, mapReady, toggleHazardLayers]);

  useEffect(() => {
    if (!mapReady) return;
    toggleHazardLayers("surge", NOAH_TILESETS.stormSurge.sourceLayers, showStormSurge);
  }, [showStormSurge, mapReady, toggleHazardLayers]);

  const toggleEarthquakes = useCallback(() => setShowEarthquakes((v) => !v), []);
  const toggleTyphoons = useCallback(() => setShowTyphoons((v) => !v), []);
  const toggleWaterLevels = useCallback(() => setShowWaterLevels((v) => !v), []);
  const toggleFlood = useCallback(() => setShowFlood((v) => !v), []);
  const toggleLandslide = useCallback(() => setShowLandslide((v) => !v), []);
  const toggleStormSurge = useCallback(() => setShowStormSurge((v) => !v), []);
  const toggleHospitals = useCallback(() => setShowHospitals((v) => !v), []);
  const toggleSchools = useCallback(() => setShowSchools((v) => !v), []);

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
          new mapboxgl.Popup({ className: "noah-popup", maxWidth: "220px" })
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
        map.on("mouseenter", "hospitals-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "hospitals-layer", () => {
          map.getCanvas().style.cursor = "";
        });
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
          new mapboxgl.Popup({ className: "noah-popup", maxWidth: "220px" })
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
        map.on("mouseenter", "schools-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "schools-layer", () => {
          map.getCanvas().style.cursor = "";
        });
      } else {
        map.setLayoutProperty("schools-layer", "visibility", "visible");
      }
    } else {
      if (map.getLayer("schools-layer")) {
        map.setLayoutProperty("schools-layer", "visibility", "none");
      }
    }
  }, [showSchools, mapReady]);

  const btnClass = (active: boolean, activeColor: string) =>
    `flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold tracking-wider transition-all border ${
      active
        ? `bg-[oklch(0.15_0.02_260_/_0.9)] border-[${activeColor}] text-[${activeColor}] shadow-[0_0_6px_${activeColor}44]`
        : "bg-[oklch(0.12_0.015_260_/_0.9)] border-[oklch(0.25_0.02_260)] text-[oklch(0.45_0.01_260)]"
    }`;

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />

      {/* Layer toggle controls — Row 1: Data layers */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1.5">
        <div className="flex gap-1">
          <button
            onClick={toggleEarthquakes}
            className={btnClass(showEarthquakes, "#FCD116")}
            style={showEarthquakes ? { borderColor: "#FCD116", color: "#FCD116" } : {}}
            title="Toggle earthquake markers"
          >
            <span className="text-[11px]">🔴</span> EQ
          </button>
          <button
            onClick={toggleTyphoons}
            className={btnClass(showTyphoons, "#FF6B35")}
            style={showTyphoons ? { borderColor: "#FF6B35", color: "#FF6B35" } : {}}
            title="Toggle typhoon tracker"
          >
            <span className="text-[11px]">🌀</span> TC
          </button>
          <button
            onClick={toggleWaterLevels}
            className={btnClass(showWaterLevels, "#0038A8")}
            style={showWaterLevels ? { borderColor: "#0038A8", color: "#0038A8" } : {}}
            title="Toggle water level stations"
          >
            <span className="text-[11px]">🌊</span> WL
          </button>
        </div>

        {/* Row 2: NOAH hazard layers (hidden if tilesets unavailable) */}
        {hazardLayersAvailable && (
          <div className="flex gap-1">
            <button
              onClick={toggleFlood}
              className={btnClass(showFlood, "#EB5757")}
              style={showFlood ? { borderColor: "#EB5757", color: "#EB5757" } : {}}
              title="Toggle NOAH Flood Hazard (100yr)"
            >
              <span className="text-[11px]">💧</span> FLOOD
            </button>
            <button
              onClick={toggleLandslide}
              className={btnClass(showLandslide, "#F2994A")}
              style={showLandslide ? { borderColor: "#F2994A", color: "#F2994A" } : {}}
              title="Toggle NOAH Landslide Hazard"
            >
              <span className="text-[11px]">⛰️</span> SLIDE
            </button>
            <button
              onClick={toggleStormSurge}
              className={btnClass(showStormSurge, "#00D4FF")}
              style={showStormSurge ? { borderColor: "#00D4FF", color: "#00D4FF" } : {}}
              title="Toggle NOAH Storm Surge (SSA4)"
            >
              <span className="text-[11px]">🌊</span> SURGE
            </button>
          </div>
        )}

        {/* Row 3: Facilities */}
        <div className="flex gap-1">
          <button
            onClick={toggleHospitals}
            className={btnClass(showHospitals, "#00D4FF")}
            style={showHospitals ? { borderColor: "#00D4FF", color: "#00D4FF" } : {}}
            title="Toggle NOAH Hospitals"
          >
            <span className="text-[11px]">🏥</span> HOSP
          </button>
          <button
            onClick={toggleSchools}
            className={btnClass(showSchools, "#FCD116")}
            style={showSchools ? { borderColor: "#FCD116", color: "#FCD116" } : {}}
            title="Toggle NOAH Schools"
          >
            <span className="text-[11px]">🏫</span> SCHOOL
          </button>
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[oklch(0.10_0.015_260_/_0.92)] backdrop-blur-md rounded-lg px-2.5 py-2 text-[10px] font-mono border border-[oklch(0.25_0.02_260_/_0.5)] max-h-[280px] overflow-y-auto">
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

        {hazardLayersAvailable && (
          <>
            <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
              NOAH HAZARDS
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded bg-[#EB5757]" />
              <span className="text-[oklch(0.70_0.005_260)]">High Risk</span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded bg-[#F2994A]" />
              <span className="text-[oklch(0.70_0.005_260)]">Medium Risk</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#F2C94C]" />
              <span className="text-[oklch(0.70_0.005_260)]">Low Risk</span>
            </div>
          </>
        )}

        <div className="text-[oklch(0.55_0.01_260)] mb-1 font-semibold text-[9px] tracking-wider border-t border-[oklch(0.25_0.02_260_/_0.5)] pt-1.5">
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
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded bg-[#0038A8]" />
          <span className="text-[oklch(0.70_0.005_260)]">Normal</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FCD116]" />
          <span className="text-[oklch(0.70_0.005_260)]">Alert</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FF6B35]" />
          <span className="text-[oklch(0.70_0.005_260)]">Alarm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#CE1126]" />
          <span className="text-[oklch(0.70_0.005_260)]">Critical</span>
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
        {waterLevels.length > 0 && (
          <div>
            <span className="text-[#0038A8] font-bold">
              {waterLevels.length}
            </span>{" "}
            water stations
          </div>
        )}
        {showFlood && (
          <div className="text-[#EB5757]">
            <span className="font-bold">FLOOD</span> hazard ON
          </div>
        )}
        {showLandslide && (
          <div className="text-[#F2994A]">
            <span className="font-bold">SLIDE</span> hazard ON
          </div>
        )}
        {showStormSurge && (
          <div className="text-[#00D4FF]">
            <span className="font-bold">SURGE</span> hazard ON
          </div>
        )}
      </div>

      {/* NOAH attribution */}
      <div className="absolute bottom-2 right-2 z-[1000] text-[8px] text-[oklch(0.45_0.01_260)] font-mono">
        Hazard data: UPRI-NOAH / DOST
      </div>
    </div>
  );
}
