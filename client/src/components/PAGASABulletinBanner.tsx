// PAGASA Tropical Cyclone Bulletin Banner
// Fetches cyclone.dat from PAGASA pubfiles for active tropical cyclone data
// Shows a scrolling banner when there's an active TC, or severe weather advisory
// Also shows alerts for M5+ earthquakes and critical water levels

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface TCData {
  name: string;
  internationalName: string;
  category: string;
  lat: number;
  lon: number;
  maxWinds: number;
  movement: string;
  timestamp: string;
}

interface AlertItem {
  type: "typhoon" | "earthquake" | "water" | "advisory";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
}

const PAGASA_CYCLONE_URL = "https://pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat";
const USGS_EQ_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&minlatitude=4&maxlatitude=22&minlongitude=115&maxlongitude=130&limit=5&orderby=time";
const PAGASA_WATER_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent("http://121.58.193.173:8080/water/main_list.do");

function parseCycloneData(text: string): TCData | null {
  try {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return null;
    
    // cyclone.dat format varies, try to extract key info
    // Typical format: name, position, winds, movement info
    const firstLine = lines[0].trim();
    if (firstLine.toLowerCase().includes("no tropical cyclone") || 
        firstLine.toLowerCase().includes("none") ||
        lines.length < 3) {
      return null;
    }
    
    // Try to parse structured data
    // Format can be: TYPHOON_NAME | LAT | LON | WINDS | CATEGORY | etc.
    const data = lines.join(" ");
    
    // Extract name (usually first significant word/phrase)
    const nameMatch = data.match(/(?:typhoon|tropical storm|tropical depression|super typhoon|severe tropical storm)\s+"?([A-Z][A-Za-z]+)"?/i) 
      || data.match(/"([A-Z][A-Za-z]+)"/);
    
    const name = nameMatch ? nameMatch[1] : lines[0].trim().split(/\s+/)[0];
    
    return {
      name: name,
      internationalName: "",
      category: "Tropical Cyclone",
      lat: 0,
      lon: 0,
      maxWinds: 0,
      movement: "",
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export default function PAGASABulletinBanner() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      const newAlerts: AlertItem[] = [];

      // 1. Check PAGASA cyclone data
      try {
        const res = await fetch(
          "https://api.allorigins.win/raw?url=" + encodeURIComponent(PAGASA_CYCLONE_URL),
          { signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const text = await res.text();
          const tc = parseCycloneData(text);
          if (tc) {
            newAlerts.push({
              type: "typhoon",
              severity: "critical",
              message: `PAGASA TROPICAL CYCLONE ADVISORY: ${tc.category.toUpperCase()} "${tc.name}" is active in the Philippine Area of Responsibility`,
              timestamp: tc.timestamp,
            });
          }
        }
      } catch { /* ignore */ }

      // 2. Check for M5+ earthquakes near Philippines
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

      // 3. Check critical water levels
      try {
        const res = await fetch(PAGASA_WATER_URL, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
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
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Rotate alerts
  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  if (!isVisible || alerts.length === 0) return null;

  const current = alerts[currentIndex];
  
  const severityColors = {
    critical: {
      dark: "bg-[oklch(0.25_0.12_25)] border-[oklch(0.45_0.18_25)] text-[oklch(0.90_0.05_25)]",
      light: "bg-[oklch(0.95_0.05_25)] border-[oklch(0.70_0.15_25)] text-[oklch(0.35_0.12_25)]",
      icon: isDark ? "text-[oklch(0.70_0.20_25)]" : "text-[oklch(0.50_0.18_25)]",
      dot: "bg-[oklch(0.60_0.22_25)]",
    },
    warning: {
      dark: "bg-[oklch(0.25_0.10_85)] border-[oklch(0.50_0.15_85)] text-[oklch(0.90_0.05_85)]",
      light: "bg-[oklch(0.95_0.05_85)] border-[oklch(0.75_0.12_85)] text-[oklch(0.35_0.10_85)]",
      icon: isDark ? "text-[oklch(0.75_0.17_85)]" : "text-[oklch(0.55_0.15_85)]",
      dot: "bg-[oklch(0.70_0.17_85)]",
    },
    info: {
      dark: "bg-[oklch(0.18_0.05_260)] border-[oklch(0.35_0.10_260)] text-[oklch(0.85_0.02_260)]",
      light: "bg-[oklch(0.95_0.02_260)] border-[oklch(0.80_0.05_260)] text-[oklch(0.30_0.05_260)]",
      icon: isDark ? "text-[oklch(0.60_0.15_260)]" : "text-[oklch(0.45_0.12_260)]",
      dot: "bg-[oklch(0.55_0.15_260)]",
    },
  };

  const colors = severityColors[current.severity];
  const colorClass = isDark ? colors.dark : colors.light;

  const typeIcons: Record<string, React.ReactNode> = {
    typhoon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" />
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
        <path d="M12 2c3 4 4 8 0 10s-3 6 0 10" />
      </svg>
    ),
    earthquake: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2l3-9 4 18 4-18 3 9h4" />
      </svg>
    ),
    water: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    advisory: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };

  return (
    <div className={`shrink-0 border-b px-3 py-1.5 flex items-center gap-3 transition-colors ${colorClass}`}>
      {/* Severity dot */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
        <span className={colors.icon}>{typeIcons[current.type] || typeIcons.advisory}</span>
      </div>

      {/* Alert message */}
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        <p className="text-[11px] font-mono font-semibold tracking-wide whitespace-nowrap animate-[scroll_20s_linear_infinite]">
          {current.message}
        </p>
      </div>

      {/* Alert count badge */}
      {alerts.length > 1 && (
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
          isDark ? "bg-[oklch(0.20_0.02_260)] text-[oklch(0.70_0.01_260)]" : "bg-[oklch(0.90_0.01_260)] text-[oklch(0.40_0.015_260)]"
        }`}>
          {currentIndex + 1}/{alerts.length}
        </span>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => setIsVisible(false)}
        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
          isDark ? "hover:bg-[oklch(0.25_0.02_260)] text-[oklch(0.55_0.01_260)]" : "hover:bg-[oklch(0.88_0.01_260)] text-[oklch(0.50_0.015_260)]"
        }`}
        title="Dismiss alerts"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
