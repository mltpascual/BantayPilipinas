// Design: "Ops Center" — Accident/incident feed
// Red-tinted items for severity, filtered from Metro Manila news
// Theme-aware colors, filters to today's news (Philippine time)

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchAccidentNews, timeAgo } from "@/lib/feeds";

function isTodayPH(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  const nowPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const itemPH = date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return nowPH === itemPH;
}

export default function AccidentsPanel() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAccidentNews();
      // Filter to today's incidents only (PH time)
      const todayItems = data.filter((item) => isTodayPH(item.pubDate));
      setItems(todayItems);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 180000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (title: string): { icon: string; color: string } => {
    const t = title.toLowerCase();
    if (t.includes("killed") || t.includes("died") || t.includes("dead") || t.includes("fatal"))
      return { icon: "FATAL", color: "#CE1126" };
    if (t.includes("crash") || t.includes("collision") || t.includes("fire") || t.includes("explosion"))
      return { icon: "FIRE", color: "#FF6B35" };
    if (t.includes("flood") || t.includes("storm") || t.includes("typhoon") || t.includes("landslide"))
      return { icon: "WX", color: "#0038A8" };
    if (t.includes("earthquake"))
      return { icon: "EQ", color: "#CE1126" };
    if (t.includes("traffic") || t.includes("mmda") || t.includes("road"))
      return { icon: "ROAD", color: "#FCD116" };
    return { icon: "ALERT", color: "#FF6B35" };
  };

  return (
    <PanelWrapper title="Accidents & Incidents" icon="INC" status={loading ? "idle" : items.length > 0 ? "live" : "active"}>
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-muted-foreground animate-pulse">SCANNING</div>
          <div className="text-muted-foreground text-xs font-mono">
            Scanning feeds...
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-[#22C55E]">CLEAR</div>
          <div className="text-muted-foreground text-xs font-mono text-center">
            No incidents detected today<br />
            <span className="text-[9px]">Monitoring GMA Metro & Inquirer</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-muted-foreground mb-1">
            {items.length} incident{items.length !== 1 ? "s" : ""} today
          </div>
          {items.map((item, i) => {
            const { icon, color } = getSeverityIcon(item.title);
            return (
              <a
                key={`acc-${i}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded hover:bg-secondary transition-colors group"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-[7px] font-bold font-mono shrink-0 mt-0.5 px-1 py-0.5 rounded" style={{ background: `${color}22`, color }}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {item.source}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/70">
                        {timeAgo(item.pubDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </PanelWrapper>
  );
}
