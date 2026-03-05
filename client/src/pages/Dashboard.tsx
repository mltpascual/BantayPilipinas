// Design: "Ops Center" — Main dashboard with draggable/resizable panels
// Space Grotesk headers, IBM Plex Sans body
// Improved toggle readability, smooth theme transitions

import { useState, useEffect, useCallback, useRef } from "react";
import { GridLayout, verticalCompactor } from "react-grid-layout";
import { useTheme } from "@/contexts/ThemeContext";

import MapPanel from "@/components/panels/MapPanel";
import NewsPanel from "@/components/panels/NewsPanel";
import LivestreamPanel from "@/components/panels/LivestreamPanel";
import LivecamsPanel from "@/components/panels/LivecamsPanel";
import AccidentsPanel from "@/components/panels/AccidentsPanel";
import MMDAPanel from "@/components/panels/MMDAPanel";
import PhiVolcsPanel from "@/components/panels/PhiVolcsPanel";
import WaterLevelPanel from "@/components/panels/WaterLevelPanel";
import WeatherAirQualityPanel from "@/components/panels/WeatherAirQualityPanel";
import PAGASABulletinBanner from "@/components/PAGASABulletinBanner";

interface PanelConfig {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType;
  defaultLayout: { x: number; y: number; w: number; h: number; minW?: number; minH?: number };
}

const PANELS: PanelConfig[] = [
  { id: "map", title: "Map", icon: "MAP", component: MapPanel, defaultLayout: { x: 0, y: 0, w: 9, h: 12, minW: 4, minH: 6 } },
  { id: "livestream", title: "Livestream", icon: "LIVE", component: LivestreamPanel, defaultLayout: { x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 } },
  { id: "livecams", title: "Volcano Cams", icon: "VCAM", component: LivecamsPanel, defaultLayout: { x: 9, y: 4, w: 3, h: 4, minW: 2, minH: 3 } },
  { id: "weather", title: "Weather & AQ", icon: "WX", component: WeatherAirQualityPanel, defaultLayout: { x: 9, y: 8, w: 3, h: 5, minW: 2, minH: 4 } },
  { id: "news", title: "News", icon: "NEWS", component: NewsPanel, defaultLayout: { x: 0, y: 12, w: 3, h: 7, minW: 2, minH: 3 } },
  { id: "phivolcs", title: "PhiVolcs", icon: "PV", component: PhiVolcsPanel, defaultLayout: { x: 3, y: 12, w: 3, h: 7, minW: 2, minH: 3 } },
  { id: "accidents", title: "Accidents", icon: "INC", component: AccidentsPanel, defaultLayout: { x: 6, y: 12, w: 3, h: 7, minW: 2, minH: 3 } },
  { id: "mmda", title: "MMDA", icon: "MMDA", component: MMDAPanel, defaultLayout: { x: 9, y: 12, w: 3, h: 7, minW: 2, minH: 3 } },
  { id: "waterlevel", title: "Water Levels", icon: "WL", component: WaterLevelPanel, defaultLayout: { x: 0, y: 19, w: 4, h: 6, minW: 2, minH: 3 } },
];

function getDefaultLayout() {
  return PANELS.map((p) => ({
    i: p.id,
    ...p.defaultLayout,
    resizeHandles: ["se" as const, "sw" as const, "ne" as const, "nw" as const],
  }));
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(
    new Set(PANELS.map((p) => p.id))
  );
  const [layout, setLayout] = useState(getDefaultLayout());
  const [containerWidth, setContainerWidth] = useState(window.innerWidth - 16);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (mainRef.current) {
        setContainerWidth(mainRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(handleResize);
    if (mainRef.current) observer.observe(mainRef.current);
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  const togglePanel = useCallback((id: string) => {
    setVisiblePanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onLayoutChange = useCallback((newLayout: any) => {
    setLayout((prev: any) => {
      const map = new Map(newLayout.map((l: any) => [l.i, l]));
      return prev.map((item: any) => map.get(item.i) || item);
    });
  }, []);

  const phtTime = time.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const phtDate = time.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const filteredLayout = layout.filter((l: any) => visiblePanels.has(l.i));
  const isDark = theme === "dark";

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-background"
      style={{ transition: "background-color 0.3s ease" }}
    >
      {/* PAGASA Tropical Cyclone Bulletin Banner */}
      <PAGASABulletinBanner />

      {/* Header */}
      <header
        className="shrink-0 h-12 flex items-center px-4 gap-4 border-b border-border relative z-50 bg-card"
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div className="flex items-center gap-4 w-full">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#0038A8] to-[#001d5a] flex items-center justify-center shadow-lg shadow-[#0038A8]/20">
              <span className="text-[11px] font-bold text-white tracking-wide">PH</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-bold tracking-wider text-foreground">MISSION CONTROL</span>
              <span className="text-[9px] font-mono text-muted-foreground">v1.0</span>
            </div>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Clock */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? "text-ph-yellow" : "text-[#B8860B]"}`}>{phtTime}</span>
            <span className="text-[10px] font-mono text-muted-foreground">PHT</span>
            <span className="text-[10px] text-muted-foreground">{phtDate}</span>
          </div>

          <div className="flex-1" />

          {/* Theme toggle — more prominent */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                isDark
                  ? "text-muted-foreground hover:text-ph-yellow hover:bg-secondary"
                  : "text-muted-foreground hover:text-[#B8860B] hover:bg-secondary"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          <div className="w-px h-6 bg-border" />

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] shadow-lg shadow-[#22C55E]/30 pulse-blue" />
            <span className="text-[10px] font-mono font-semibold tracking-wider text-muted-foreground">ONLINE</span>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <main ref={mainRef} className="flex-1 overflow-auto p-1.5">
        <GridLayout
          className="layout"
          layout={filteredLayout as any}
          width={containerWidth}
          gridConfig={{
            cols: 12,
            rowHeight: 42,
            margin: [6, 6] as [number, number],
            containerPadding: [0, 0] as [number, number],
            maxRows: Infinity,
          }}
          dragConfig={{
            enabled: true,
            handle: ".drag-handle",
          }}
          resizeConfig={{
            enabled: true,
            handles: ["se", "sw", "ne", "nw"],
          }}
          compactor={verticalCompactor}
          onLayoutChange={onLayoutChange as any}
          autoSize={true}
        >
          {PANELS.filter((p) => visiblePanels.has(p.id)).map((panel) => {
            const Component = panel.component;
            return (
              <div key={panel.id} className="overflow-hidden">
                <Component />
              </div>
            );
          })}
        </GridLayout>
      </main>
    </div>
  );
}
