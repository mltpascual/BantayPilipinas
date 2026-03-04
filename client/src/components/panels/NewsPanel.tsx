// Design: "Ops Center Noir" — News feed with source badges
// Items slide in, source color-coded by outlet
// Scrollable list with hover effects

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchAllNews, timeAgo } from "@/lib/feeds";

const SOURCE_COLORS: Record<string, string> = {
  Rappler: "#0038A8",
  Inquirer: "#CE1126",
  "GMA News": "#FCD116",
  PhilStar: "#22C55E",
};

export default function NewsPanel() {
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAllNews();
      setNews(data);
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
          <div className="text-xs font-mono font-bold text-[oklch(0.50_0.01_260)] animate-pulse">LOADING</div>
          <div className="text-[oklch(0.50_0.01_260)] text-xs font-mono">
            Loading feeds...
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
              className="block px-2 py-1.5 rounded hover:bg-[oklch(0.18_0.02_260)] transition-colors group"
            >
              <div className="text-[11px] font-medium text-[oklch(0.85_0.005_260)] leading-snug group-hover:text-white transition-colors line-clamp-2">
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
                <span className="text-[9px] text-[oklch(0.40_0.01_260)] font-mono">
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
