// Design: "Ops Center" — News feed with source badges
// Theme-aware colors for light/dark mode
// Filters to show only today's news (Philippine time)

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchAllNews, timeAgo } from "@/lib/feeds";

const SOURCE_COLORS: Record<string, string> = {
  Rappler: "#0038A8",
  Inquirer: "#CE1126",
  "GMA News": "#FCD116",
  PhilStar: "#22C55E",
};

function isTodayPH(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true; // include items with no valid date
  // Get current date in PH timezone
  const nowPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const itemPH = date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return nowPH === itemPH;
}

export default function NewsPanel() {
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAllNews();
      // Filter to only today's news in Philippine time
      const todayNews = data.filter((item) => isTodayPH(item.pubDate));
      setNews(todayNews);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 180000); // 3 min
    return () => clearInterval(interval);
  }, []);

  return (
    <PanelWrapper title="News" icon="NEWS" status={loading ? "idle" : "active"}>
      {loading && news.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-muted-foreground animate-pulse">LOADING</div>
          <div className="text-muted-foreground text-xs font-mono">
            Loading feeds...
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-muted-foreground">NO NEWS TODAY</div>
          <div className="text-muted-foreground text-[10px] font-mono text-center">
            No news items found for today (PHT)
          </div>
        </div>
      ) : (
        <div className="space-y-0.5">
          {news.map((item, i) => (
            <a
              key={`${item.source}-${i}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1.5 rounded hover:bg-secondary transition-colors group"
            >
              <div className="text-[11px] font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: `${SOURCE_COLORS[item.source] || "#6B7280"}20`,
                    color: SOURCE_COLORS[item.source] || "#6B7280",
                  }}
                >
                  {item.source}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  {timeAgo(item.pubDate)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </PanelWrapper>
  );
}
