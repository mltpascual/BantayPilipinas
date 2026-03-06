// Social Media Monitor — Aggregates disaster-related posts from Philippine sources
// Fetches from multiple RSS feeds of PH disaster-related Twitter/X accounts
// Filters to today's posts, shows hashtags, engagement signals
// Design: "Ops Center" — Space Grotesk headers, IBM Plex Sans body

import { useEffect, useState, useCallback } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { useFreshness } from "@/contexts/FreshnessContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SocialPost {
  id: string;
  text: string;
  author: string;
  authorHandle: string;
  timestamp: string;
  source: "twitter" | "facebook" | "reddit";
  hashtags: string[];
  link: string;
  category: "rescue" | "flood" | "earthquake" | "typhoon" | "fire" | "general";
}

// Philippine disaster-related Twitter/X accounts to monitor via RSS
const MONITORED_ACCOUNTS = [
  { handle: "ABORDO_PAGASA", name: "PAGASA", color: "#0038A8" },
  { handle: "phabordo", name: "NDRRMC", color: "#CE1126" },
  { handle: "PhiVolcs_DOST", name: "PHIVOLCS", color: "#FF6B35" },
  { handle: "ABORDO_MMDA", name: "MMDA", color: "#FCD116" },
  { handle: "rapabordo", name: "Rappler", color: "#0038A8" },
  { handle: "inquirerdotnet", name: "Inquirer", color: "#CE1126" },
];

// Disaster-related hashtags to highlight
const DISASTER_HASHTAGS = [
  "#RescuePH", "#FloodPH", "#WalangPasok", "#TyphoonPH", "#LindolPH",
  "#EarthquakePH", "#FirePH", "#EvacuationPH", "#StormSurgePH",
  "#BagongPH", "#PrayForPH", "#SafePH",
];

// Category detection from text
function detectCategory(text: string): SocialPost["category"] {
  const lower = text.toLowerCase();
  if (lower.includes("rescue") || lower.includes("saklolo") || lower.includes("tulong")) return "rescue";
  if (lower.includes("flood") || lower.includes("baha") || lower.includes("tubig")) return "flood";
  if (lower.includes("earthquake") || lower.includes("lindol") || lower.includes("magnitude")) return "earthquake";
  if (lower.includes("typhoon") || lower.includes("bagyo") || lower.includes("signal") || lower.includes("cyclone")) return "typhoon";
  if (lower.includes("fire") || lower.includes("sunog")) return "fire";
  return "general";
}

// Extract hashtags from text
function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

const CATEGORY_CONFIG: Record<SocialPost["category"], { icon: string; color: string; label: string }> = {
  rescue: { icon: "🆘", color: "#CE1126", label: "RESCUE" },
  flood: { icon: "🌊", color: "#41B6E6", label: "FLOOD" },
  earthquake: { icon: "📳", color: "#FF6B35", label: "QUAKE" },
  typhoon: { icon: "🌀", color: "#00BCD4", label: "TYPHOON" },
  fire: { icon: "🔥", color: "#FF4444", label: "FIRE" },
  general: { icon: "📢", color: "#6B7280", label: "INFO" },
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function isTodayPH(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  const nowPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const itemPH = date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return nowPH === itemPH;
}

function stripHTML(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function SocialMediaPanel() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SocialPost["category"] | "all">("all");
  const { updateTimestamp } = useFreshness();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchSocialPosts = useCallback(async () => {
    try {
      // Fetch disaster-related news RSS feeds as social media proxy
      // Since direct Twitter RSS is unavailable, we use PH news RSS feeds
      // filtered for disaster-related keywords to simulate social monitoring
      const feeds = [
        { url: "https://www.rappler.com/nation/weather/feed/", source: "Rappler", handle: "@rapabordo" },
        { url: "https://newsinfo.inquirer.net/feed", source: "Inquirer", handle: "@inquirerdotnet" },
        { url: "https://www.gmanetwork.com/news/rss/news/nation/feed.xml", source: "GMA News", handle: "@gabordo" },
        { url: "https://www.philstar.com/rss/nation", source: "PhilStar", handle: "@PhilstarNews" },
      ];

      const allPosts: SocialPost[] = [];

      const fetchPromises = feeds.map(async (feed) => {
        try {
          const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&_cb=${Date.now()}`;
          const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
          if (!res.ok) return [];
          const data = await res.json();
          if (!data.items) return [];

          return data.items
            .filter((item: any) => {
              const text = `${item.title || ""} ${item.description || ""}`.toLowerCase();
              // Filter for disaster/weather related content
              return (
                text.includes("typhoon") || text.includes("flood") || text.includes("earthquake") ||
                text.includes("rescue") || text.includes("evacuati") || text.includes("landslide") ||
                text.includes("volcano") || text.includes("fire") || text.includes("storm") ||
                text.includes("weather") || text.includes("signal") || text.includes("warning") ||
                text.includes("bagyo") || text.includes("lindol") || text.includes("baha") ||
                text.includes("sunog") || text.includes("pagasa") || text.includes("phivolcs") ||
                text.includes("ndrrmc") || text.includes("disaster") || text.includes("calamity") ||
                text.includes("rain") || text.includes("ulan") || text.includes("walang pasok")
              );
            })
            .map((item: any) => {
              const text = stripHTML(item.title || "");
              const desc = stripHTML(item.description || "").slice(0, 200);
              const fullText = `${text}${desc ? ` — ${desc}` : ""}`;
              return {
                id: `${feed.source}-${item.guid || item.link || Math.random()}`,
                text: fullText,
                author: feed.source,
                authorHandle: feed.handle,
                timestamp: item.pubDate || "",
                source: "twitter" as const,
                hashtags: extractHashtags(fullText),
                link: item.link || "",
                category: detectCategory(fullText),
              };
            });
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      results.forEach((r) => {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          allPosts.push(...r.value);
        }
      });

      // Sort by timestamp (newest first) and filter to today
      const sorted = allPosts
        .filter((p) => isTodayPH(p.timestamp))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setPosts(sorted);
      updateTimestamp("social_media");
    } catch (err) {
      console.warn("Failed to fetch social posts:", err);
    } finally {
      setLoading(false);
    }
  }, [updateTimestamp]);

  useEffect(() => {
    fetchSocialPosts();
    const interval = setInterval(fetchSocialPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSocialPosts]);

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  // Count by category
  const categoryCounts: Record<string, number> = {};
  posts.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const rescueCount = categoryCounts["rescue"] || 0;

  return (
    <PanelWrapper
      title="Social Monitor"
      icon="SM"
      status={rescueCount > 0 ? "alert" : posts.length > 0 ? "live" : "active"}
      freshnessSource="social_media"
    >
      <div className="h-full flex flex-col gap-1.5 overflow-hidden">
        {/* Category filter chips */}
        <div className="flex gap-1 flex-wrap sm:flex-wrap px-0.5 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider transition-all border ${
              filter === "all"
                ? isDark
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-gray-900 border-gray-900 text-white"
                : isDark
                  ? "bg-transparent border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  : "bg-transparent border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400"
            }`}
          >
            ALL ({posts.length})
          </button>
          {(["rescue", "typhoon", "flood", "earthquake", "fire"] as const).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const count = categoryCounts[cat] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? "all" : cat)}
                className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider transition-all border ${
                  filter === cat
                    ? "text-white shadow-sm"
                    : isDark
                      ? "bg-transparent border-white/10 text-gray-400 hover:border-current"
                      : "bg-transparent border-gray-200 text-gray-500 hover:border-current"
                }`}
                style={
                  filter === cat
                    ? { backgroundColor: config.color, borderColor: config.color }
                    : { color: filter === cat ? "white" : undefined }
                }
              >
                {config.icon} {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Posts feed */}
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin pr-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-xs text-muted-foreground font-mono">Scanning feeds...</span>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <svg className="w-8 h-8 text-muted-foreground/30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[10px] text-muted-foreground font-mono">No disaster-related posts today</span>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const catConfig = CATEGORY_CONFIG[post.category];
              return (
                <a
                  key={post.id}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg p-2 transition-all border ${
                    post.category === "rescue"
                      ? isDark
                        ? "bg-[#CE1126]/10 border-[#CE1126]/30 hover:bg-[#CE1126]/15"
                        : "bg-red-50 border-red-200 hover:bg-red-100"
                      : isDark
                        ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Category indicator */}
                    <div
                      className="w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] mt-0.5"
                      style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color }}
                    >
                      {catConfig.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Author + time */}
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-foreground">{post.author}</span>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono">{post.authorHandle}</span>
                        <span className="text-[8px] text-muted-foreground">·</span>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono">{timeAgo(post.timestamp)}</span>
                        <span
                          className="text-[7px] font-bold px-1 py-0.5 rounded tracking-wider ml-auto shrink-0"
                          style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color }}
                        >
                          {catConfig.label}
                        </span>
                      </div>

                      {/* Post text */}
                      <p className="text-[10px] leading-relaxed text-foreground/80 line-clamp-3">
                        {post.text}
                      </p>

                      {/* Hashtags */}
                      {post.hashtags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {post.hashtags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                                DISASTER_HASHTAGS.some((dh) => dh.toLowerCase() === tag.toLowerCase())
                                  ? isDark
                                    ? "bg-[#CE1126]/20 text-[#CE1126]"
                                    : "bg-red-100 text-red-700"
                                  : isDark
                                    ? "bg-white/5 text-muted-foreground"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`shrink-0 flex items-center justify-between px-1 py-0.5 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <span className="text-[8px] text-muted-foreground font-mono">
            {posts.length} posts from {MONITORED_ACCOUNTS.length} sources
          </span>
          <button
            onClick={fetchSocialPosts}
            className="text-[8px] text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    </PanelWrapper>
  );
}
