// Design: "Ops Center Noir" — Main dashboard with draggable/resizable panels
// Header with PH branding, PHT clock, panel toggles
// react-grid-layout v2 API: gridConfig, dragConfig, resizeConfig
// Layout: Map dominant (3/4 upper-left), streams right, news/data below

import { useState, useEffect, useCallback, useRef } from "react";
import { GridLayout, verticalCompactor } from "react-grid-layout";

import MapPanel from "@/components/panels/MapPanel";
import NewsPanel from "@/components/panels/NewsPanel";
import LivestreamPanel from "@/components/panels/LivestreamPanel";
import LivecamsPanel from "@/components/panels/LivecamsPanel";
import AccidentsPanel from "@/components/panels/AccidentsPanel";
import MMDAPanel from "@/components/panels/MMDAPanel";
import PhiVolcsPanel from "@/components/panels/PhiVolcsPanel";
import WeatherPanel from "@/components/panels/WeatherPanel";
import WaterLevelPanel from "@/components/panels/WaterLevelPanel";

interface PanelConfig {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType;
  defaultLayout: { x: number; y: number; w: number; h: number; minW?: number; minH?: number };
}

// New Layout: 12 columns
// Upper area (y=0):
//   Map (9w, 12h) — dominant 3/4 of upper area
//   Right stack (3w): Livestream(3w,4h) + VolcanoCams(3w,4h) + Weather(3w,4h)
// Lower area (y=12):
//   News(3w,7h) | PhiVolcs(3w,7h) | Accidents(3w,7h) | MMDA(3w,7h)
// Extra row (y=19):
//   WaterLevel(4w,6h)
const PANELS: PanelConfig[] = [
  { id: "map", title: "Map", icon: "MAP", component: MapPanel, defaultLayout: { x: 0, y: 0, w: 9, h: 12, minW: 4, minH: 6 } },
  { id: "livestream", title: "Livestream", icon: "LIVE", component: LivestreamPanel, defaultLayout: { x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 } },
  { id: "livecams", title: "Volcano Cams", icon: "VCAM", component: LivecamsPanel, defaultLayout: { x: 9, y: 4, w: 3, h: 4, minW: 2, minH: 3 } },
  { id: "weather", title: "Weather", icon: "WX", component: WeatherPanel, defaultLayout: { x: 9, y: 8, w: 3, h: 4, minW: 2, minH: 3 } },
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
  const [time, setTime] = useState(new Date());
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(
    new Set(PANELS.map((p) => p.id))
  );
  const [layout, setLayout] = useState(getDefaultLayout());
  const [containerWidth, setContainerWidth] = useState(window.innerWidth - 16);
  const mainRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Track container width
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#080b14]">
      {/* Header */}
      <header className="shrink-0 h-11 flex items-center px-4 gap-4 border-b border-[oklch(0.20_0.02_260)] bg-[oklch(0.09_0.015_260)] relative z-50">
        <div className="flex items-center gap-4 w-full">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#0038A8] to-[#001d5a] flex items-center justify-center shadow-lg shadow-[#0038A8]/20">
              <span className="text-[10px] font-bold text-white">PH</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold tracking-wider text-white">MISSION CONTROL</span>
              <span className="text-[9px] text-[oklch(0.40_0.01_260)] font-mono">v1.0</span>
            </div>
          </div>

          <div className="w-px h-5 bg-[oklch(0.22_0.02_260)]" />

          {/* Clock */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-[#FCD116] tabular-nums">{phtTime}</span>
            <span className="text-[10px] font-mono text-[oklch(0.45_0.01_260)]">PHT</span>
            <span className="text-[10px] text-[oklch(0.38_0.01_260)]">{phtDate}</span>
          </div>

          <div className="flex-1" />

          {/* Panel toggles */}
          <div className="flex items-center gap-0.5">
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePanel(p.id)}
                className={`text-[7px] font-bold font-mono tracking-wider w-auto px-1.5 h-7 flex items-center justify-center rounded transition-all ${
                  visiblePanels.has(p.id)
                    ? "bg-[oklch(0.20_0.03_260)] text-[oklch(0.85_0.005_260)] shadow-inner"
                    : "bg-transparent text-[oklch(0.30_0.01_260)] hover:text-[oklch(0.55_0.01_260)]"
                }`}
                title={`Toggle ${p.title}`}
              >
                {p.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[oklch(0.22_0.02_260)]" />

          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] shadow-lg shadow-[#22C55E]/30 pulse-blue" />
            <span className="text-[9px] font-mono font-semibold text-[oklch(0.50_0.01_260)] tracking-wider">ONLINE</span>
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
// Layout v2 - Map dominant
