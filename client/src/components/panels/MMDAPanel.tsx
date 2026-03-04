// Design: "Ops Center" — MMDA Facebook embed + filtered news
// Yellow accent for traffic/MMDA content
// Theme-aware colors for light/dark mode
// Note about Facebook embed availability

import { useEffect, useRef, useState, useCallback } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { FeedItem, fetchRSSFeed, timeAgo } from "@/lib/feeds";

export default function MMDAPanel() {
  const [tab, setTab] = useState<"facebook" | "news">("facebook");
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fbContainerRef = useRef<HTMLDivElement>(null);
  const fbLoaded = useRef(false);
  const [fbDimensions, setFbDimensions] = useState({ width: 340, height: 400 });

  const loadFacebookSDK = useCallback(() => {
    if (fbLoaded.current) return;
    fbLoaded.current = true;

    if (!document.getElementById("fb-root")) {
      const fbRoot = document.createElement("div");
      fbRoot.id = "fb-root";
      document.body.appendChild(fbRoot);
    }

    if (!(window as any).FB) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);

      script.onload = () => {
        setTimeout(() => {
          if ((window as any).FB?.XFBML) {
            (window as any).FB.XFBML.parse(fbContainerRef.current);
          }
        }, 500);
      };
    } else {
      setTimeout(() => {
        (window as any).FB?.XFBML?.parse(fbContainerRef.current);
      }, 200);
    }
  }, []);

  useEffect(() => {
    if (!fbContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0) {
          setFbDimensions({ width: Math.min(w, 500), height: Math.max(h, 300) });
        }
      }
    });
    observer.observe(fbContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (tab === "facebook") {
      loadFacebookSDK();
      setTimeout(() => {
        if ((window as any).FB?.XFBML && fbContainerRef.current) {
          (window as any).FB.XFBML.parse(fbContainerRef.current);
        }
      }, 300);
    }
  }, [tab, loadFacebookSDK]);

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
    <PanelWrapper title="MMDA" icon="MMDA" status="active">
      <div className="flex flex-col h-full gap-1.5">
        {/* Tabs */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setTab("facebook")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "facebook"
                ? "bg-[#1877F2] text-white shadow-[0_0_8px_#1877F240]"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            MMDA Facebook
          </button>
          <button
            onClick={() => setTab("news")}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
              tab === "news"
                ? "bg-[#FCD116] text-[#080b14] shadow-[0_0_8px_#FCD11640]"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Traffic News ({news.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {tab === "facebook" ? (
            <div className="flex flex-col h-full">
              <div ref={fbContainerRef} className="flex-1 w-full overflow-hidden">
                <div
                  className="fb-page"
                  data-href="https://www.facebook.com/MMDAPH"
                  data-tabs="timeline"
                  data-width={fbDimensions.width}
                  data-height={fbDimensions.height}
                  data-small-header="true"
                  data-adapt-container-width="true"
                  data-hide-cover="false"
                  data-show-facepile="false"
                >
                  <blockquote
                    cite="https://www.facebook.com/MMDAPH"
                    className="fb-xfbml-parse-ignore"
                  >
                    <a href="https://www.facebook.com/MMDAPH" target="_blank" rel="noopener noreferrer">
                      <div className="flex flex-col items-center justify-center h-32 gap-2">
                        <svg className="w-8 h-8 text-[#1877F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="text-[11px] font-semibold text-muted-foreground">Loading MMDA Facebook...</span>
                        <span className="text-[9px] text-muted-foreground/70">facebook.com/MMDAPH</span>
                      </div>
                    </a>
                  </blockquote>
                </div>
              </div>
              {/* Note about FB embed availability */}
              <div className="text-[8px] text-muted-foreground/60 font-mono mt-1 leading-relaxed shrink-0">
                Note: Facebook embed may not load in some regions due to IP restrictions. Other viewers should see it normally. Try the Traffic News tab for an alternative.
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {loading && news.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs font-mono">
                  Loading traffic news...
                </div>
              ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-1">
                  <span className="text-xs font-mono font-bold text-[#FCD116]">CLEAR</span>
                  <div className="text-muted-foreground text-[10px] font-mono text-center">
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
                    className="block p-1.5 rounded hover:bg-secondary transition-colors group border-l-2 border-[#FCD116]"
                  >
                    <div className="text-[11px] font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 ml-1.5">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-1.5">
                      <span className="text-[8px] font-mono text-muted-foreground">{item.source}</span>
                      <span className="text-[8px] font-mono text-muted-foreground/70">{timeAgo(item.pubDate)}</span>
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
