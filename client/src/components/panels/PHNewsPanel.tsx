// Design: "Ops Center" — Comprehensive PH News RSS aggregator
// 13 legitimate Philippine news outlets with category filters
// Theme-aware, shows today's news in Philippine Time

import { useEffect, useState, useMemo, useCallback } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchAllPHNews, PH_NEWS_SOURCES, PHNewsSource, timeAgo } from "@/lib/feeds";
import { useFreshness } from "@/contexts/FreshnessContext";
import { useTheme } from "@/contexts/ThemeContext";

type FilterMode = "all" | "major" | "business" | "regional";

const SOURCE_COLOR_MAP: Record<string, string> = {};
PH_NEWS_SOURCES.forEach((s) => {
  SOURCE_COLOR_MAP[s.shortName] = s.color;
});

function isTodayPH(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  const nowPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const itemPH = date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return nowPH === itemPH;
}

export default function PHNewsPanel() {
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const { updateTimestamp } = useFreshness();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAllPHNews();
        if (!mounted) return;
        setNews(data);
        updateTimestamp("ph-news");
      } catch {
        // feeds.ts handles errors internally
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 180_000); // refresh every 3 min
    return () => { mounted = false; clearInterval(interval); };
  }, [updateTimestamp]);

  // Filter news by category and source
  const filteredNews = useMemo(() => {
    let items = news.filter((item) => isTodayPH(item.pubDate));

    if (selectedSource) {
      items = items.filter((item) => item.source === selectedSource);
    } else if (filter !== "all") {
      const sourceNames = PH_NEWS_SOURCES
        .filter((s) => s.category === filter)
        .map((s) => s.shortName);
      items = items.filter((item) => sourceNames.includes(item.source));
    }

    return items;
  }, [news, filter, selectedSource]);

  // Count per source
  const sourceCounts = useMemo(() => {
    const todayNews = news.filter((item) => isTodayPH(item.pubDate));
    const counts: Record<string, number> = {};
    todayNews.forEach((item) => {
      counts[item.source] = (counts[item.source] || 0) + 1;
    });
    return counts;
  }, [news]);

  const totalToday = useMemo(() => {
    return news.filter((item) => isTodayPH(item.pubDate)).length;
  }, [news]);

  const handleFilterClick = useCallback((mode: FilterMode) => {
    setFilter(mode);
    setSelectedSource(null);
    setShowSourcePicker(false);
  }, []);

  const handleSourceClick = useCallback((shortName: string) => {
    setSelectedSource((prev) => (prev === shortName ? null : shortName));
    setShowSourcePicker(false);
  }, []);

  const filterBtn = (mode: FilterMode, label: string) => (
    <button
      onClick={() => handleFilterClick(mode)}
      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide transition-all whitespace-nowrap ${
        filter === mode && !selectedSource
          ? "bg-[#0038A8] text-white shadow-sm"
          : isDark
            ? "text-gray-400 hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  // Group sources by category for the picker
  const sourcesByCategory: Record<string, PHNewsSource[]> = {
    major: PH_NEWS_SOURCES.filter((s) => s.category === "major"),
    business: PH_NEWS_SOURCES.filter((s) => s.category === "business"),
    regional: PH_NEWS_SOURCES.filter((s) => s.category === "regional"),
  };

  return (
    <PanelWrapper title="PH News" icon="RSS" status={loading ? "idle" : "active"} freshnessSource="ph-news">
      {/* Filter bar */}
      <div className={`sticky top-0 z-10 px-2 py-1.5 border-b flex items-center gap-1 overflow-x-auto scrollbar-none ${isDark ? "bg-card/95 border-border" : "bg-white/95 border-gray-200"} backdrop-blur-sm`}>
        {filterBtn("all", `All (${totalToday})`)}
        {filterBtn("major", "National")}
        {filterBtn("business", "Business")}
        {filterBtn("regional", "Regional")}
        <div className="flex-1" />
        <button
          onClick={() => setShowSourcePicker(!showSourcePicker)}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
            selectedSource
              ? "bg-[#0038A8] text-white"
              : isDark
                ? "text-gray-400 hover:text-white hover:bg-white/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="Filter by source"
        >
          {selectedSource || "Source ▾"}
        </button>
      </div>

      {/* Source picker dropdown */}
      {showSourcePicker && (
        <div className={`px-2 py-2 border-b space-y-2 ${isDark ? "bg-[oklch(0.14_0.01_260)] border-border" : "bg-gray-50 border-gray-200"}`}>
          {Object.entries(sourcesByCategory).map(([cat, sources]) => (
            <div key={cat}>
              <div className={`text-[8px] font-bold tracking-widest uppercase mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {cat === "major" ? "National" : cat === "business" ? "Business" : "Regional"}
              </div>
              <div className="flex flex-wrap gap-1">
                {sources.map((src) => {
                  const count = sourceCounts[src.shortName] || 0;
                  const isActive = selectedSource === src.shortName;
                  return (
                    <button
                      key={src.id}
                      onClick={() => handleSourceClick(src.shortName)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                        isActive
                          ? "text-white shadow-sm"
                          : isDark
                            ? "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                            : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
                      }`}
                      style={isActive ? { backgroundColor: src.color } : undefined}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: src.color }}
                      />
                      {src.shortName}
                      {count > 0 && (
                        <span className={`text-[8px] ${isActive ? "text-white/80" : isDark ? "text-gray-500" : "text-gray-400"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedSource && (
            <button
              onClick={() => { setSelectedSource(null); setShowSourcePicker(false); }}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded ${isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            >
              ✕ Clear Filter
            </button>
          )}
        </div>
      )}

      {/* News list */}
      {loading && news.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-muted-foreground animate-pulse">LOADING</div>
          <div className="text-muted-foreground text-xs font-mono">
            Fetching from 13 outlets...
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="text-xs font-mono font-bold text-muted-foreground">NO NEWS</div>
          <div className="text-muted-foreground text-[10px] font-mono text-center px-4">
            {selectedSource
              ? `No news from ${selectedSource} today`
              : filter !== "all"
                ? `No ${filter} news today`
                : "No news items found for today (PHT)"}
          </div>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filteredNews.map((item, i) => {
            const srcColor = SOURCE_COLOR_MAP[item.source] || "#6B7280";
            return (
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
                    className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: `${srcColor}20`,
                      color: srcColor,
                    }}
                  >
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ backgroundColor: srcColor }}
                    />
                    {item.source}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {timeAgo(item.pubDate)}
                  </span>
                  {item.category && (
                    <span className={`text-[8px] px-1 py-0.5 rounded ${isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
                      {item.category}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </PanelWrapper>
  );
}
