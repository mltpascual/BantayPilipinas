// Design: "Ops Center Noir" — Live news streams with tab switching
// Red LIVE badge pulses, tabs for different channels
// Uses YouTube channel embed URLs that auto-detect live streams

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

const CHANNELS = [
  {
    name: "ABS-CBN",
    // ABS-CBN News YouTube channel
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCstEtN0pgOmCf02EdXsGFhQ",
    fallbackUrl: "https://www.youtube.com/embed?listType=user_uploads&list=ABSCBNNews",
    label: "ABS-CBN News",
  },
  {
    name: "GMA",
    // GMA Integrated News
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCqYw-CTd1dU2yGI71sEyqNw",
    fallbackUrl: "https://www.youtube.com/embed?listType=user_uploads&list=gaboradorable",
    label: "GMA Integrated News",
  },
  {
    name: "PTV",
    // PTV Philippines
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCm1wMSBO9P1L7TiJnBnTxUg",
    fallbackUrl: "https://www.youtube.com/embed?listType=user_uploads&list=PTVPhilippines",
    label: "PTV Philippines",
  },
  {
    name: "CNN PH",
    // CNN Philippines
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCwMDXamqIbGCPPGmk7bMiQg",
    fallbackUrl: "https://www.youtube.com/embed?listType=user_uploads&list=CNNPhilippines",
    label: "CNN Philippines",
  },
];

export default function LivestreamPanel() {
  const [active, setActive] = useState(0);
  const [useFallback, setUseFallback] = useState<Record<number, boolean>>({});

  const currentUrl = useFallback[active]
    ? CHANNELS[active].fallbackUrl
    : CHANNELS[active].embedUrl;

  return (
    <PanelWrapper title="Livestream" icon="📺" status="live">
      <div className="flex flex-col h-full gap-2">
        {/* Channel tabs */}
        <div className="flex gap-1 shrink-0 flex-wrap">
          {CHANNELS.map((ch, i) => (
            <button
              key={ch.name}
              onClick={() => setActive(i)}
              className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
                i === active
                  ? "bg-[#CE1126] text-white"
                  : "bg-[oklch(0.18_0.02_260)] text-[oklch(0.60_0.01_260)] hover:text-[oklch(0.80_0.005_260)] hover:bg-[oklch(0.22_0.02_260)]"
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
        {/* Video embed */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          <iframe
            key={`${active}-${useFallback[active] ? "fb" : "main"}`}
            src={`${currentUrl}&autoplay=1&mute=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={CHANNELS[active].label}
            onError={() => {
              if (!useFallback[active]) {
                setUseFallback((prev) => ({ ...prev, [active]: true }));
              }
            }}
          />
          {/* Channel label overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
            <div className="text-[10px] text-white/60 font-mono">
              {CHANNELS[active].label} — YouTube Live
            </div>
          </div>
        </div>
        <div className="text-[9px] text-[oklch(0.35_0.01_260)] font-mono shrink-0">
          Streams auto-detect live broadcasts. If unavailable, channel may be offline.
        </div>
      </div>
    </PanelWrapper>
  );
}
