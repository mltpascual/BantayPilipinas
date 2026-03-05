// Design: "Ops Center" — Live news streams with tab switching
// Uses YouTube channel live embed URLs for PH news networks
// Theme-aware colors for light/dark mode

import { useState, useEffect, useCallback } from "react";
import PanelWrapper from "@/components/PanelWrapper";

interface Channel {
  name: string;
  channelId: string;
  label: string;
  color: string;
}

const CHANNELS: Channel[] = [
  {
    name: "CNN PH",
    channelId: "UCwMDXamqIbGCPPGmk7bMiQg",
    label: "CNN Philippines",
    color: "#CC0000",
  },
  {
    name: "ANC",
    channelId: "UCmN1TnSbMQTTDrjIG0FQKOQ",
    label: "ANC 24/7",
    color: "#1DA1F2",
  },
  {
    name: "GMA",
    channelId: "UCqYw-CTd1dU2yGI71sEyqNw",
    label: "GMA Integrated News",
    color: "#FF6B35",
  },
  {
    name: "ABS-CBN",
    channelId: "UCstEtN0pgOmCf02EdXsGFhQ",
    label: "ABS-CBN News",
    color: "#CE1126",
  },
  {
    name: "PTV",
    channelId: "UCm1wMSBO9P1L7TiJnBnTxUg",
    label: "PTV Philippines",
    color: "#0038A8",
  },
  {
    name: "ONE News",
    channelId: "UCzEAC4xGrhpShopTYgBhGJA",
    label: "One News PH (Cignal)",
    color: "#E8B500",
  },
  {
    name: "Net25",
    channelId: "UC5IF8NlxMW1GkEUUqWJJBIw",
    label: "Net25 Philippines",
    color: "#00A651",
  },
];

export default function LivestreamPanel() {
  const [active, setActive] = useState(0);
  const [embedKey, setEmbedKey] = useState(0);

  // Force refresh embed when switching channels
  const handleSwitch = useCallback((index: number) => {
    setActive(index);
    setEmbedKey((k) => k + 1);
  }, []);

  // Auto-refresh every 5 minutes to catch new live streams
  useEffect(() => {
    const interval = setInterval(() => {
      setEmbedKey((k) => k + 1);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const ch = CHANNELS[active];
  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${ch.channelId}&autoplay=1&mute=1`;

  return (
    <PanelWrapper title="Livestream" icon="LIVE" status="live">
      <div className="flex flex-col h-full gap-2">
        {/* Channel tabs */}
        <div className="flex gap-1 shrink-0 flex-wrap">
          {CHANNELS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => handleSwitch(i)}
              className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
                i === active
                  ? "text-white shadow-lg"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              style={i === active ? { backgroundColor: c.color } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Video embed */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          <iframe
            key={`${active}-${embedKey}`}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={ch.label}
          />
          {/* Channel label overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: ch.color }}
              />
              <span className="text-[10px] text-white/70 font-mono">
                {ch.label}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-muted-foreground/60 font-mono shrink-0">
          YouTube Live — streams auto-detect. Channel may be offline between broadcasts.
        </div>
      </div>
    </PanelWrapper>
  );
}
