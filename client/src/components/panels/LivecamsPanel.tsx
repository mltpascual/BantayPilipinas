// Design: "Ops Center" — Volcano live streams from afarTV YouTube
// Simple 3-button selector: Mayon, Kanlaon, Bulusan
// Theme-aware colors for light/dark mode

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

interface VolcanoStream {
  name: string;
  videoId: string;
  location: string;
}

const STREAMS: VolcanoStream[] = [
  {
    name: "Mayon",
    videoId: "UDAZWxehMAI",
    location: "afarTV — Legazpi, Albay, 4K Ultra HD",
  },
  {
    name: "Kanlaon",
    videoId: "JVLVCSfQLYQ",
    location: "afarTV — Negros Occidental",
  },
  {
    name: "Bulusan",
    videoId: "sSavszvmqHY",
    location: "afarTV — Sorsogon, 4K Ultra HD",
  },
];

export default function LivecamsPanel() {
  const [selected, setSelected] = useState(0);
  const stream = STREAMS[selected];

  return (
    <PanelWrapper title="Volcano Cams" icon="VCAM" status="live">
      <div className="flex flex-col h-full gap-1.5">
        {/* Volcano selector buttons */}
        <div className="flex items-center gap-1 px-0.5">
          {STREAMS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSelected(i)}
              className={`flex-1 text-[10px] font-bold font-mono tracking-wider py-1.5 rounded transition-all duration-200 ${
                i === selected
                  ? "bg-[#CE1126] text-white shadow-[0_0_8px_#CE112640]"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* YouTube embed */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          <iframe
            key={stream.videoId}
            src={`https://www.youtube.com/embed/${stream.videoId}?autoplay=1&mute=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${stream.name} Volcano — Live Stream`}
          />

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-white">
                  {stream.name} Volcano
                </div>
                <div className="text-[9px] text-white/60 font-mono">{stream.location}</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#CE1126] animate-pulse" />
                <span className="text-[8px] font-bold font-mono text-white/80">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[8px] text-muted-foreground/60 font-mono shrink-0">
          Source: afarTV YouTube — 24/7 Live Streams
        </div>
      </div>
    </PanelWrapper>
  );
}
