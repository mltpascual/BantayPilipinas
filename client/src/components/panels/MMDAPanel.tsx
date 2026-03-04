// Design: "Ops Center Noir" — MMDA Twitter embed + filtered news
// Yellow accent for traffic/MMDA content

import { useEffect, useRef, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchRSSFeed, timeAgo } from "@/lib/feeds";

export default function MMDAPanel() {
  const [tab, setTab] = useState<"twitter" | "news">("twitter");
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const twitterRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Load Twitter widget
  useEffect(() => {
    if (scriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
    scriptLoaded.current = true;

    script.onload = () => {
      if ((window as any).twttr?.widgets && twitterRef.current) {
        (window as any).twttr.widgets.load(twitterRef.current);
      }
    };
  }, []);

  // Re-render Twitter widget when switching to twitter tab
  useEffect(() => {
    if (tab === "twitter" && (window as any).twttr?.widgets && twitterRef.current) {
      setTimeout(() => {
        (window as any).twttr.widgets.load(twitterRef.current);
      }, 200);
    }
  }, [tab]);

  // Fetch MMDA-related news
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const feeds = await Promise.allSettled([
        fetchRSSFeed("https://data.gmanetwork.com/gno/rss/news/metro/feed.xml", "GMA Metro"),
        fetchRSSFeed("https://newsinfo.inquirer.net/category/latest-stories/feed", "Inquirer"),
      ]);
      const allItems: FeedItem[] = [];
      feeds.forEach((r) => {
        if (r.status === "fulfilled") allItems.push(...r.value);
      });
      const filtered = allItems.filter((item) => {
        const text = `${item.title} ${item.description}`.toLowerCase();
        return text.includes("mmda") || text.includes("edsa") || text.includes("traffic") || text.includes("metro manila") || text.includes("road") || text.includes("highway");
      });
      setNews(filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()));
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 180000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PanelWrapper title="MMDA" icon="🚦" status="active">
      <div className="flex flex-col h-full gap-1.5">
        {/* Tabs */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setTab("twitter")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "twitter"
                ? "bg-[#1DA1F2] text-white shadow-[0_0_8px_#1DA1F240]"
                : "bg-[oklch(0.18_0.02_260)] text-[oklch(0.55_0.01_260)] hover:text-[oklch(0.80_0.005_260)]"
            }`}
          >
            @MMDA Timeline
          </button>
          <button
            onClick={() => setTab("news")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "news"
                ? "bg-[#FCD116] text-[#080b14] shadow-[0_0_8px_#FCD11640]"
                : "bg-[oklch(0.18_0.02_260)] text-[oklch(0.55_0.01_260)] hover:text-[oklch(0.80_0.005_260)]"
            }`}
          >
            MMDA News ({news.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {tab === "twitter" ? (
            <div ref={twitterRef} className="h-full">
              <a
                className="twitter-timeline"
                data-theme="dark"
                data-chrome="noheader nofooter noborders transparent"
                data-height="100%"
                href="https://twitter.com/ABORABORAAA"
              >
                Loading MMDA tweets...
              </a>
            </div>
          ) : (
            <div className="space-y-0.5">
              {loading && news.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[oklch(0.50_0.01_260)] text-xs font-mono">
                  Loading MMDA news...
                </div>
              ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-1">
                  <span className="text-lg">🚗</span>
                  <div className="text-[oklch(0.40_0.01_260)] text-[10px] font-mono text-center">
                    No MMDA/traffic news found
                  </div>
                </div>
              ) : (
                news.map((item, i) => (
                  <a
                    key={`mmda-${i}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-1.5 rounded hover:bg-[oklch(0.18_0.02_260)] transition-colors group border-l-2 border-[#FCD116]"
                  >
                    <div className="text-[11px] font-medium text-[oklch(0.82_0.005_260)] leading-snug group-hover:text-white transition-colors line-clamp-2 ml-1.5">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-1.5">
                      <span className="text-[8px] font-mono text-[oklch(0.45_0.01_260)]">{item.source}</span>
                      <span className="text-[8px] font-mono text-[oklch(0.35_0.01_260)]">{timeAgo(item.pubDate)}</span>
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
