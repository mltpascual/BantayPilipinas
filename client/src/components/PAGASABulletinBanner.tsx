// PAGASA Tropical Cyclone Bulletin Banner
// Fetches cyclone.dat from PAGASA pubfiles for active tropical cyclone data
// Shows a continuously looping marquee banner
// Also shows alerts for M5+ earthquakes and critical water levels
// DATE VALIDATION: Only shows typhoon alerts if the latest data point is within 48 hours

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchViaProxy, fetchFresh } from "@/lib/fetchUtils";
import { fetchAirQuality, getAqiCategory } from "@/lib/feeds";

interface AlertItem {
  type: "typhoon" | "earthquake" | "water" | "advisory";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
}

const PAGASA_CYCLONE_URL = "https://pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat";
const USGS_EQ_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&minlatitude=4&maxlatitude=22&minlongitude=115&maxlongitude=130&limit=5&orderby=time";
// Water level URL — uses fetchViaProxy for cache-busting
const PAGASA_WATER_BASE = "http://121.58.193.173:8080/water/main_list.do";

/**
 * Parse cyclone.dat and validate that the data is current (within 48 hours).
 * The file format is:
 *   Line 1: STORMNAME{INTLNAME}
 *   Lines 2+: TYPE,YYYY-MM-DD,HH:MM,lat,lon,extra
 * 
 * If the file is empty, has no lines, or the latest date is older than 48 hours,
 * returns null (no active storm).
 */
function parseCycloneData(text: string): { name: string; category: string } | null {
  try {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 10) return null;

    const lines = trimmed.split("\n").filter(l => l.trim());
    if (lines.length < 2) return null;

    const firstLine = lines[0].trim();
    if (firstLine.toLowerCase().includes("no tropical cyclone") || 
        firstLine.toLowerCase().includes("none")) {
      return null;
    }

    // Extract dates from data lines to check freshness
    // Format: TYPE,YYYY-MM-DD,HH:MM,...
    const now = Date.now();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours in ms
    let latestDate = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 3) {
        const dateStr = parts[1]?.trim();
        const timeStr = parts[2]?.trim();
        if (dateStr && timeStr) {
          const dt = new Date(`${dateStr}T${timeStr}:00+08:00`); // PHT = UTC+8
          if (!isNaN(dt.getTime()) && dt.getTime() > latestDate) {
            latestDate = dt.getTime();
          }
        }
      }
    }

    // If no valid dates found, or latest data is older than 48 hours, ignore
    if (latestDate === 0 || (now - latestDate) > maxAge) {
      return null;
    }

    // Extract storm name from first line
    // Format: BASYANG{PENHA} or just a name
    const nameMatch = firstLine.match(/^([A-Z]+)\{([A-Z]+)\}/i);
    if (nameMatch) {
      return { name: `${nameMatch[1]} (${nameMatch[2]})`, category: "Tropical Cyclone" };
    }

    // Fallback: try other patterns
    const data = lines.join(" ");
    const tcMatch = data.match(/(?:typhoon|tropical storm|tropical depression|super typhoon|severe tropical storm)\s+"?([A-Z][A-Za-z]+)"?/i) 
      || data.match(/"([A-Z][A-Za-z]+)"/);
    const name = tcMatch ? tcMatch[1] : firstLine.split(/\s+/)[0];
    return { name, category: "Tropical Cyclone" };
  } catch {
    return null;
  }
}

/**
 * Fetch cyclone.dat using multiple proxy strategies with cache-busting.
 * Tries direct fetch first, then allorigins with cache-bust parameter.
 */
async function fetchCycloneData(): Promise<string> {
  // Strategy 1: allorigins proxy with cache-busting (via shared util)
  try {
    const res = await fetchViaProxy(PAGASA_CYCLONE_URL, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return await res.text();
  } catch { /* try next */ }

  // Strategy 2: direct fetch with cache-busting (future CORS support)
  try {
    const res = await fetchFresh(PAGASA_CYCLONE_URL, { signal: AbortSignal.timeout(5000), mode: "cors" });
    if (res.ok) return await res.text();
  } catch { /* ignore */ }

  return "";
}

export default function PAGASABulletinBanner() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const newAlerts: AlertItem[] = [];

      // 1. Check PAGASA cyclone data with date validation
      try {
        const text = await fetchCycloneData();
        const tc = parseCycloneData(text);
        if (tc) {
          newAlerts.push({
            type: "typhoon",
            severity: "critical",
            message: `PAGASA TROPICAL CYCLONE ADVISORY: ${tc.category.toUpperCase()} "${tc.name}" is active in the Philippine Area of Responsibility`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch { /* ignore */ }

      // 2. Check for M5+ earthquakes near Philippines (last 24 hours only)
      try {
        const res = await fetch(USGS_EQ_URL, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const now = Date.now();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          
          for (const feature of (data.features || []).slice(0, 3)) {
            const props = feature.properties;
            const eqTime = props.time;
            if (eqTime > oneDayAgo) {
              const mag = props.mag;
              const place = props.place || "Unknown location";
              const severity = mag >= 6.5 ? "critical" : mag >= 5.5 ? "warning" : "info";
              newAlerts.push({
                type: "earthquake",
                severity,
                message: `EARTHQUAKE M${mag.toFixed(1)}: ${place} — ${new Date(eqTime).toLocaleString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: true, month: "short", day: "numeric" })} PHT`,
                timestamp: new Date(eqTime).toISOString(),
              });
            }
          }
        }
      } catch { /* ignore */ }

      // 3. Check air quality — alert if any city AQI > 150 (Unhealthy)
      try {
        const aqData = await fetchAirQuality();
        for (const city of aqData) {
          if (city.usAqi > 150) {
            const { label } = getAqiCategory(city.usAqi);
            newAlerts.push({
              type: "advisory",
              severity: city.usAqi > 200 ? "critical" : "warning",
              message: `AIR QUALITY ALERT: ${city.city} AQI ${city.usAqi} (${label}) — PM2.5: ${city.pm25.toFixed(1)} µg/m³`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch { /* ignore */ }

      // 4. Check critical water levels
      try {
        const res = await fetchViaProxy(PAGASA_WATER_BASE, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          const stations = data?.stationlist || [];
          for (const station of stations) {
            const current = parseFloat(station.waterlevel);
            const critical = parseFloat(station.critical);
            const alarm = parseFloat(station.alarm);
            const name = station.obsnme || station.obscode || "Unknown";
            if (!isNaN(current) && !isNaN(critical) && current >= critical) {
              newAlerts.push({
                type: "water",
                severity: "critical",
                message: `CRITICAL WATER LEVEL: ${name} at ${current.toFixed(2)}m (Critical: ${critical.toFixed(2)}m)`,
                timestamp: new Date().toISOString(),
              });
            } else if (!isNaN(current) && !isNaN(alarm) && current >= alarm) {
              newAlerts.push({
                type: "water",
                severity: "warning",
                message: `ALARM WATER LEVEL: ${name} at ${current.toFixed(2)}m (Alarm: ${alarm.toFixed(2)}m)`,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      } catch { /* ignore */ }

      setAlerts(newAlerts);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Show "No active alerts" status when no alerts are found
  if (!isVisible) return null;
  
  if (alerts.length === 0) {
    return (
      <div className={`shrink-0 border-b px-2 sm:px-3 py-1 flex items-center gap-1.5 sm:gap-2.5 transition-colors ${
        isDark 
          ? "bg-[oklch(0.14_0.01_160)] border-[oklch(0.22_0.03_160)] text-[oklch(0.55_0.04_160)]" 
          : "bg-[oklch(0.97_0.005_160)] border-[oklch(0.90_0.02_160)] text-[oklch(0.50_0.04_160)]"
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${
            isDark ? "bg-[oklch(0.55_0.15_160)]" : "bg-[oklch(0.60_0.15_160)]"
          }`} />
          <span className="text-[9px] font-mono font-medium tracking-wider">STATUS</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono tracking-wide">
          <span className="hidden sm:inline">No active alerts — System monitoring PAGASA, USGS, FFWS</span>
          <span className="sm:hidden">No active alerts</span>
        </span>
        <span className={`ml-auto text-[8px] font-mono ${
          isDark ? "text-[oklch(0.40_0.02_160)]" : "text-[oklch(0.65_0.02_160)]"
        }`}>
          {new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: false })} PHT
        </span>
      </div>
    );
  }

  // Determine highest severity for banner color
  const highestSeverity = alerts.some(a => a.severity === "critical") ? "critical"
    : alerts.some(a => a.severity === "warning") ? "warning" : "info";

  const severityColors = {
    critical: {
      dark: "bg-[oklch(0.25_0.12_25)] border-[oklch(0.45_0.18_25)] text-[oklch(0.90_0.05_25)]",
      light: "bg-[oklch(0.95_0.05_25)] border-[oklch(0.70_0.15_25)] text-[oklch(0.35_0.12_25)]",
      dot: "bg-[oklch(0.60_0.22_25)]",
    },
    warning: {
      dark: "bg-[oklch(0.25_0.10_85)] border-[oklch(0.50_0.15_85)] text-[oklch(0.90_0.05_85)]",
      light: "bg-[oklch(0.95_0.05_85)] border-[oklch(0.75_0.12_85)] text-[oklch(0.35_0.10_85)]",
      dot: "bg-[oklch(0.70_0.17_85)]",
    },
    info: {
      dark: "bg-[oklch(0.18_0.05_260)] border-[oklch(0.35_0.10_260)] text-[oklch(0.85_0.02_260)]",
      light: "bg-[oklch(0.95_0.02_260)] border-[oklch(0.80_0.05_260)] text-[oklch(0.30_0.05_260)]",
      dot: "bg-[oklch(0.55_0.15_260)]",
    },
  };

  const colors = severityColors[highestSeverity];
  const colorClass = isDark ? colors.dark : colors.light;

  // Build the full marquee text — all alerts concatenated with separators
  const marqueeText = alerts.map(a => {
    const typeLabel = a.type === "typhoon" ? "🌀 TYPHOON" : a.type === "earthquake" ? "⚠ EARTHQUAKE" : a.type === "water" ? "🌊 WATER LEVEL" : "💨 AIR QUALITY";
    return `[${typeLabel}] ${a.message}`;
  }).join("     ///     ");

  return (
    <div className={`shrink-0 border-b px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-3 transition-colors ${colorClass}`}>
      {/* Severity dot */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
        <span className="text-[9px] font-mono font-bold tracking-wider shrink-0">ALERT</span>
      </div>

      {/* Continuous looping marquee */}
      <div className="flex-1 overflow-hidden relative">
        <div className="marquee-loop whitespace-nowrap">
          <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wide inline-block">
            {marqueeText}
            <span className="inline-block w-[100vw]" />
            {marqueeText}
          </span>
        </div>
      </div>

      {/* Alert count */}
      {alerts.length > 1 && (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 bg-secondary text-muted-foreground">
          {alerts.length} alerts
        </span>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => setIsVisible(false)}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-secondary text-muted-foreground"
        title="Dismiss alerts"
        aria-label="Dismiss alerts"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
