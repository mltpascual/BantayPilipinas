// Design: "Ops Center" — Main dashboard with draggable/resizable panels
// Desktop: react-grid-layout 12-col grid with drag/resize, bounded to viewport (no overflow)
// Mobile (<768px): Bottom tab navigation with 5 tabs — Home, Map, News, Video, Alerts

import { useState, useEffect, useCallback, useRef } from "react";
import { GridLayout, verticalCompactor } from "react-grid-layout";
import { useTheme } from "@/contexts/ThemeContext";

import MapPanel from "@/components/panels/MapPanel";
import LivestreamPanel from "@/components/panels/LivestreamPanel";
import LivecamsPanel from "@/components/panels/LivecamsPanel";
import PhiVolcsPanel from "@/components/panels/PhiVolcsPanel";
import WaterLevelPanel from "@/components/panels/WaterLevelPanel";
import WeatherAirQualityPanel from "@/components/panels/WeatherAirQualityPanel";
import PHNewsPanel from "@/components/panels/PHNewsPanel";
import PAGASABulletinBanner from "@/components/PAGASABulletinBanner";

interface PanelConfig {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType;
  defaultLayout: { x: number; y: number; w: number; h: number; minW?: number; minH?: number };
}

const PANELS: PanelConfig[] = [
  { id: "map", title: "Map", icon: "MAP", component: MapPanel, defaultLayout: { x: 0, y: 0, w: 7, h: 13, minW: 4, minH: 6 } },
  { id: "phivolcs", title: "PhiVolcs", icon: "PV", component: PhiVolcsPanel, defaultLayout: { x: 7, y: 0, w: 2, h: 13, minW: 2, minH: 4 } },
  { id: "livecams", title: "Volcano Cams", icon: "VCAM", component: LivecamsPanel, defaultLayout: { x: 9, y: 0, w: 3, h: 13, minW: 2, minH: 3 } },
  { id: "livestream", title: "Livestream", icon: "LIVE", component: LivestreamPanel, defaultLayout: { x: 9, y: 13, w: 3, h: 12, minW: 2, minH: 3 } },
  { id: "phnews", title: "PH News", icon: "RSS", component: PHNewsPanel, defaultLayout: { x: 0, y: 13, w: 3, h: 12, minW: 2, minH: 3 } },
  { id: "waterlevel", title: "Water Levels", icon: "WL", component: WaterLevelPanel, defaultLayout: { x: 3, y: 13, w: 3, h: 12, minW: 2, minH: 3 } },
  { id: "weather", title: "Weather & AQ", icon: "WX", component: WeatherAirQualityPanel, defaultLayout: { x: 6, y: 13, w: 3, h: 12, minW: 2, minH: 3 } },
];

// Nav bar height constant — used for both the bar itself and content padding
const MOBILE_NAV_HEIGHT = 64;

// Mobile tab definitions
type MobileTab = "home" | "map" | "news" | "video" | "alerts";

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const MOBILE_TABS: TabConfig[] = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
        ) : (
          <>
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </>
        )}
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        ) : (
          <>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </>
        )}
      </svg>
    ),
  },
  {
    id: "news",
    label: "News",
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm1 4h14v2H5V6zm0 4h9v2H5v-2zm0 4h14v2H5v-2z" />
        ) : (
          <>
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <line x1="5" y1="7" x2="19" y2="7" />
            <line x1="5" y1="11" x2="14" y2="11" />
            <line x1="5" y1="15" x2="19" y2="15" />
          </>
        )}
      </svg>
    ),
  },
  {
    id: "video",
    label: "Video",
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v5l4-3v12l-4-3v5a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
        ) : (
          <>
            <rect x="2" y="4" width="16" height="16" rx="2" />
            <path d="M22 7l-4 3 4 3V7z" />
          </>
        )}
      </svg>
    ),
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
        ) : (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
      </svg>
    ),
  },
];

function getDefaultLayout() {
  return PANELS.map((p) => ({
    i: p.id,
    ...p.defaultLayout,
    resizeHandles: ["se" as const, "sw" as const, "ne" as const, "nw" as const],
  }));
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// Calculate maxRows based on available height so panels can't go past the viewport
function useMaxRows(headerHeight: number, rowHeight: number, margin: number) {
  const [maxRows, setMaxRows] = useState(19);
  useEffect(() => {
    const calc = () => {
      const availableHeight = window.innerHeight - headerHeight - 12; // 12px for padding
      const rows = Math.floor((availableHeight + margin) / (rowHeight + margin));
      setMaxRows(rows);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [headerHeight, rowHeight, margin]);
  return maxRows;
}

// Mobile tab content — each tab is always mounted, visibility toggled via CSS display
// This prevents panels from remounting/re-fetching when switching tabs
function MobileTabContent({ activeTab }: { activeTab: MobileTab }) {
  return (
    <>
      {/* Home tab — all panels stacked */}
      <div
        className="flex-1 overflow-auto p-2 space-y-2 flex flex-col"
        style={{ display: activeTab === "home" ? "flex" : "none" }}
      >
        <div className="h-[55vh] overflow-hidden rounded-lg shrink-0"><MapPanel /></div>
        <div className="h-[300px] overflow-hidden rounded-lg shrink-0"><PhiVolcsPanel /></div>
        <div className="h-[280px] overflow-hidden rounded-lg shrink-0"><LivestreamPanel /></div>
        <div className="h-[280px] overflow-hidden rounded-lg shrink-0"><LivecamsPanel /></div>
        <div className="h-[280px] overflow-hidden rounded-lg shrink-0"><WaterLevelPanel /></div>
        <div className="h-[400px] overflow-hidden rounded-lg shrink-0"><WeatherAirQualityPanel /></div>
        <div className="h-[400px] overflow-hidden rounded-lg shrink-0"><PHNewsPanel /></div>
        <div className="h-4 shrink-0" />
      </div>

      {/* Map tab — full screen */}
      <div
        className="flex-1 overflow-hidden"
        style={{ display: activeTab === "map" ? "flex" : "none" }}
      >
        <MapPanel />
      </div>

      {/* News tab — full screen */}
      <div
        className="flex-1 overflow-hidden"
        style={{ display: activeTab === "news" ? "flex" : "none" }}
      >
        <PHNewsPanel />
      </div>

      {/* Video tab — livestream + volcano cams */}
      <div
        className="flex-1 overflow-auto p-2 space-y-2 flex flex-col"
        style={{ display: activeTab === "video" ? "flex" : "none" }}
      >
        <div className="h-[50vh] overflow-hidden rounded-lg shrink-0"><LivestreamPanel /></div>
        <div className="h-[50vh] overflow-hidden rounded-lg shrink-0"><LivecamsPanel /></div>
        <div className="h-4 shrink-0" />
      </div>

      {/* Alerts tab — phivolcs + water levels + weather */}
      <div
        className="flex-1 overflow-auto p-2 space-y-2 flex flex-col"
        style={{ display: activeTab === "alerts" ? "flex" : "none" }}
      >
        <div className="h-[400px] overflow-hidden rounded-lg shrink-0"><PhiVolcsPanel /></div>
        <div className="h-[300px] overflow-hidden rounded-lg shrink-0"><WaterLevelPanel /></div>
        <div className="h-[400px] overflow-hidden rounded-lg shrink-0"><WeatherAirQualityPanel /></div>
        <div className="h-4 shrink-0" />
      </div>
    </>
  );
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [visiblePanels] = useState<Set<string>>(
    new Set(PANELS.map((p) => p.id))
  );
  const [layout, setLayout] = useState(getDefaultLayout());
  const [containerWidth, setContainerWidth] = useState(window.innerWidth - 16);
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const maxRows = useMaxRows(48, 42, 6); // header ~48px, rowHeight 42, margin 6
  const [activeTab, setActiveTab] = useState<MobileTab>("home");

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

  const onLayoutChange = useCallback((newLayout: any) => {
    setLayout((prev: any) => {
      const map = new Map(newLayout.map((l: any) => [l.i, l]));
      return prev.map((item: any) => map.get(item.i) || item);
    });
  }, []);

  // Download current layout as JSON
  const handleDownloadLayout = useCallback(() => {
    const exportData = layout.map((l: any) => ({
      id: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layout-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [layout]);

  // Import layout from JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportLayout = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          const newLayout = imported.map((item: any) => ({
            i: item.id || item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            resizeHandles: ["se" as const, "sw" as const, "ne" as const, "nw" as const],
          }));
          setLayout(newLayout);
        }
      } catch {
        alert("Invalid layout file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Reset to default layout
  const handleResetLayout = useCallback(() => {
    setLayout(getDefaultLayout());
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
        role="banner"
        aria-label="Dashboard header"
        className="shrink-0 flex items-center px-3 md:px-4 gap-2 md:gap-4 border-b border-border relative z-50 bg-card min-h-[44px] md:h-12"
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div className="flex items-center gap-2 md:gap-4 w-full flex-wrap md:flex-nowrap py-1 md:py-0">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gradient-to-br from-[#0038A8] to-[#001d5a] flex items-center justify-center shadow-lg shadow-[#0038A8]/20 shrink-0">
              <span className="text-[10px] md:text-[11px] font-bold text-white tracking-wide">PH</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] md:text-[13px] font-bold tracking-wider text-foreground">
                <span className="hidden sm:inline">MISSION CONTROL</span>
                <span className="sm:hidden">MC</span>
              </span>
              <span className="text-[8px] md:text-[9px] font-mono text-muted-foreground hidden sm:inline">v1.0</span>
            </div>
          </div>

          <div className="w-px h-5 md:h-6 bg-border hidden sm:block" />

          {/* Clock */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className={`text-xs md:text-sm font-mono font-bold tabular-nums ${isDark ? "text-ph-yellow" : "text-[#B8860B]"}`}>{phtTime}</span>
            <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground">PHT</span>
            <span className="text-[9px] md:text-[10px] text-muted-foreground hidden sm:inline">{phtDate}</span>
          </div>

          <div className="flex-1" />

          {/* Layout controls — desktop only */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadLayout}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Download Layout"
                aria-label="Download current layout as JSON"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button
                onClick={handleImportLayout}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Import Layout"
                aria-label="Import layout from JSON file"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
              <button
                onClick={handleResetLayout}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Reset to Default Layout"
                aria-label="Reset panels to default layout"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Theme toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                isDark
                  ? "text-muted-foreground hover:text-ph-yellow hover:bg-secondary"
                  : "text-muted-foreground hover:text-[#B8860B] hover:bg-secondary"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg className="w-4 h-4 md:w-[18px] md:h-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg className="w-4 h-4 md:w-[18px] md:h-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          <div className="w-px h-5 md:h-6 bg-border" />

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] shadow-lg shadow-[#22C55E]/30 pulse-blue" />
            <span className="text-[9px] md:text-[10px] font-mono font-semibold tracking-wider text-muted-foreground">ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Content — Desktop: Bounded Grid Layout, Mobile: Tab-based views */}
      {isMobile ? (
        <>
          {/* Mobile tab content area */}
          <main
            ref={mainRef}
            role="main"
            aria-label="Dashboard panels"
            className="flex-1 flex flex-col overflow-hidden"
            style={{ paddingBottom: `${MOBILE_NAV_HEIGHT}px` }}
          >
            <MobileTabContent activeTab={activeTab} />
          </main>

          {/* Mobile bottom navigation bar */}
          <nav
            role="navigation"
            aria-label="Mobile navigation"
            className="fixed bottom-0 left-0 right-0 z-[9999] mobile-bottom-nav"
            style={{
              height: `${MOBILE_NAV_HEIGHT}px`,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Frosted glass background */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            />
            {/* Background fill */}
            <div
              className={`absolute inset-0 ${
                isDark
                  ? "bg-[oklch(0.12_0.015_260_/_0.85)]"
                  : "bg-[oklch(0.995_0.002_80_/_0.88)]"
              }`}
            />
            {/* Top border */}
            <div
              className={`absolute top-0 left-0 right-0 h-px ${
                isDark ? "bg-[oklch(0.30_0.02_260_/_0.5)]" : "bg-[oklch(0.88_0.008_80_/_0.7)]"
              }`}
            />

            {/* Tab buttons */}
            <div className={`relative flex items-center justify-around px-2`} style={{ height: `${MOBILE_NAV_HEIGHT}px` }}>
              {MOBILE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors duration-200 ${
                      isActive
                        ? "text-[#DC2626]"
                        : isDark
                        ? "text-[oklch(0.55_0.01_260)]"
                        : "text-[oklch(0.50_0.015_260)]"
                    }`}
                    aria-label={tab.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="relative">
                      {tab.icon(isActive)}
                    </div>
                    <span
                      className={`text-[10px] leading-tight font-display ${
                        isActive ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      ) : (
        <main ref={mainRef} role="main" aria-label="Dashboard panels" className="flex-1 overflow-hidden p-1.5">
          <GridLayout
            className="layout"
            layout={filteredLayout as any}
            width={containerWidth}
            gridConfig={{
              cols: 12,
              rowHeight: 42,
              margin: [6, 6] as [number, number],
              containerPadding: [0, 0] as [number, number],
              maxRows: maxRows,
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
            autoSize={false}
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
      )}
    </div>
  );
}
