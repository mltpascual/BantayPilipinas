// Design: "Ops Center" — PhiVolcs earthquake list + GDACS disaster alerts
// Theme-aware colors for light/dark mode

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { EarthquakeFeature, GDACSItem, fetchEarthquakes, fetchGDACS, formatMagnitude, timeAgo } from "@/lib/feeds";

export default function PhiVolcsPanel() {
  const [tab, setTab] = useState<"quakes" | "disasters">("quakes");
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [disasters, setDisasters] = useState<GDACSItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [eq, gd] = await Promise.allSettled([fetchEarthquakes(), fetchGDACS()]);
      if (eq.status === "fulfilled") setEarthquakes(eq.value);
      if (gd.status === "fulfilled") setDisasters(gd.value);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 300000);
    return () => clearInterval(interval);
  }, []);

  const eventIcons: Record<string, string> = {
    cyclone: "TC",
    earthquake: "EQ",
    flood: "FL",
    volcano: "VL",
    unknown: "--",
  };

  return (
    <PanelWrapper title="PhiVolcs / Disasters" icon="PV" status={loading ? "idle" : "active"}>
      <div className="flex flex-col h-full gap-1.5">
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setTab("quakes")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "quakes"
                ? "bg-[#CE1126] text-white shadow-[0_0_8px_#CE112640]"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Earthquakes ({earthquakes.length})
          </button>
          <button
            onClick={() => setTab("disasters")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "disasters"
                ? "bg-[#FF6B35] text-white shadow-[0_0_8px_#FF6B3540]"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            GDACS Alerts ({disasters.length})
          </button>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {tab === "quakes" ? (
            <div className="space-y-0.5">
              {loading && earthquakes.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs font-mono">
                  Loading USGS data...
                </div>
              ) : (
                earthquakes.slice(0, 15).map((eq) => {
                  const { color, label } = formatMagnitude(eq.properties.mag);
                  const time = new Date(eq.properties.time).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
                  return (
                    <a
                      key={eq.id}
                      href={eq.properties.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-1.5 rounded hover:bg-secondary transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                          style={{ background: `${color}20`, color, boxShadow: `0 0 6px ${color}30` }}
                        >
                          {eq.properties.mag.toFixed(1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {eq.properties.place}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-[8px] font-semibold px-1 py-0.5 rounded"
                              style={{ background: `${color}20`, color }}
                            >
                              {label}
                            </span>
                            <span className="text-[8px] font-mono text-muted-foreground">{time}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {loading && disasters.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs font-mono">
                  Loading GDACS data...
                </div>
              ) : disasters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-1">
                  <span className="text-xs font-mono font-bold text-[#22C55E]">CLEAR</span>
                  <div className="text-muted-foreground text-[10px] font-mono text-center">
                    No active GDACS alerts<br />for PH region
                  </div>
                </div>
              ) : (
                disasters.map((item, i) => (
                  <a
                    key={`gdacs-${i}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-1.5 rounded hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[8px] font-bold font-mono shrink-0 px-1 py-0.5 rounded bg-secondary text-muted-foreground">{eventIcons[item.eventType] || "--"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[8px] text-muted-foreground mt-0.5 font-mono">
                          {timeAgo(item.pubDate)}
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}
