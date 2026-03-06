// Design: "Ops Center" — Fixed dashboard layout optimized for 1920x1080
// Desktop: CSS Grid fixed layout, no drag/resize
// Mobile (<768px): stacked single-column scrollable layout

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

import MapPanel from "@/components/panels/MapPanel";
import LivestreamPanel from "@/components/panels/LivestreamPanel";
import LivecamsPanel from "@/components/panels/LivecamsPanel";
import PhiVolcsPanel from "@/components/panels/PhiVolcsPanel";
import WaterLevelPanel from "@/components/panels/WaterLevelPanel";
import WeatherAirQualityPanel from "@/components/panels/WeatherAirQualityPanel";
import PHNewsPanel from "@/components/panels/PHNewsPanel";
import PAGASABulletinBanner from "@/components/PAGASABulletinBanner";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === "dark";

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

      {/* Main Content */}
      {isMobile ? (
        <main role="main" aria-label="Dashboard panels" className="flex-1 overflow-auto p-2 space-y-2 pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="h-[55vh] overflow-hidden rounded-lg"><MapPanel /></div>
          <div className="h-[280px] overflow-hidden rounded-lg"><LivestreamPanel /></div>
          <div className="h-[280px] overflow-hidden rounded-lg"><LivecamsPanel /></div>
          <div className="h-[400px] overflow-hidden rounded-lg"><WeatherAirQualityPanel /></div>
          <div className="h-[300px] overflow-hidden rounded-lg"><PhiVolcsPanel /></div>
          <div className="h-[280px] overflow-hidden rounded-lg"><WaterLevelPanel /></div>
          <div className="h-[400px] overflow-hidden rounded-lg"><PHNewsPanel /></div>
          <div className="h-4" />
        </main>
      ) : (
        <main
          role="main"
          aria-label="Dashboard panels"
          className="flex-1 overflow-hidden p-1.5"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gridTemplateRows: "1fr 1fr 40% ",
            gap: "6px",
            height: "calc(100vh - 48px)",
          }}
        >
          {/* Row 1-2: Map (9 cols) + Livestream/VolcanoCams (3 cols) */}
          <div style={{ gridColumn: "1 / 10", gridRow: "1 / 3" }} className="overflow-hidden rounded-lg border border-border">
            <MapPanel />
          </div>
          <div style={{ gridColumn: "10 / 13", gridRow: "1 / 2" }} className="overflow-hidden rounded-lg border border-border">
            <LivestreamPanel />
          </div>
          <div style={{ gridColumn: "10 / 13", gridRow: "2 / 3" }} className="overflow-hidden rounded-lg border border-border">
            <LivecamsPanel />
          </div>

          {/* Row 3: PhiVolcs (3 cols) + Water Levels (3 cols) + Weather (3 cols) + PH News (3 cols) */}
          <div style={{ gridColumn: "1 / 4", gridRow: "3 / 4" }} className="overflow-hidden rounded-lg border border-border">
            <PhiVolcsPanel />
          </div>
          <div style={{ gridColumn: "4 / 7", gridRow: "3 / 4" }} className="overflow-hidden rounded-lg border border-border">
            <WaterLevelPanel />
          </div>
          <div style={{ gridColumn: "7 / 10", gridRow: "3 / 4" }} className="overflow-hidden rounded-lg border border-border">
            <WeatherAirQualityPanel />
          </div>
          <div style={{ gridColumn: "10 / 13", gridRow: "3 / 4" }} className="overflow-hidden rounded-lg border border-border">
            <PHNewsPanel />
          </div>
        </main>
      )}
    </div>
  );
}
