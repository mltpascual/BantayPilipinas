// Design: "Ops Center" — Volcano live streams from afarTV YouTube
// Order: Bulusan, Kanlaon, Mayon (Mayon is "Watch on YouTube" only — embed disabled by owner)
// Theme-aware colors for light/dark mode

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

interface VolcanoStream {
  name: string;
  videoId: string;
  location: string;
  alertLevel: number;
  embedDisabled?: boolean;
}

const STREAMS: VolcanoStream[] = [
  {
    name: "Bulusan",
    videoId: "sSavszvmqHY",
    location: "afarTV — Sorsogon, 4K Ultra HD",
    alertLevel: 1,
  },
  {
    name: "Kanlaon",
    videoId: "JVLVCSfQLYQ",
    location: "afarTV — Negros Occidental",
    alertLevel: 2,
  },
  {
    name: "Mayon",
    videoId: "UDAZWxehMAI",
    location: "afarTV — Legazpi, Albay, 4K Ultra HD",
    alertLevel: 3,
    embedDisabled: true,
  },
];

function getAlertColor(level: number): string {
  switch (level) {
    case 0: return "#22C55E";
    case 1: return "#FACC15";
    case 2: return "#F97316";
    case 3: return "#CE1126";
    case 4: return "#CE1126";
    case 5: return "#7F1D1D";
    default: return "#6B7280";
  }
}

export default function LivecamsPanel() {
  const [selected, setSelected] = useState(0);
  const stream = STREAMS[selected];

  return (
    <PanelWrapper title="Volcano Cams" icon="VCAM" status="live">
      <div className="flex flex-col h-full gap-1.5">
        {/* Volcano selector buttons with alert badges */}
        <div className="flex items-center gap-1 px-0.5">
          {STREAMS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSelected(i)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider py-1.5 rounded transition-all duration-200 ${
                i === selected
                  ? "bg-[#CE1126] text-white shadow-[0_0_8px_#CE112640]"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
              }`}
            >
              {s.name}
              <span
                className="text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none"
                style={{
                  backgroundColor: i === selected ? "rgba(255,255,255,0.25)" : getAlertColor(s.alertLevel) + "22",
                  color: i === selected ? "#fff" : getAlertColor(s.alertLevel),
                }}
              >
                L{s.alertLevel}
              </span>
            </button>
          ))}
        </div>

        {/* Video area — embed or "Watch on YouTube" fallback */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          {stream.embedDisabled ? (
            /* Mayon — embed disabled, show thumbnail + Watch on YouTube */
            <a
              href={`https://www.youtube.com/watch?v=${stream.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 group"
            >
              {/* YouTube thumbnail as background */}
              <img
                src={`https://img.youtube.com/vi/${stream.videoId}/maxresdefault.jpg`}
                alt={`${stream.name} Volcano`}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Play button */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#CE1126] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Text */}
              <div className="relative z-10 text-center">
                <div className="text-white text-xs font-bold">Watch on YouTube</div>
                <div className="text-white/60 text-[9px] font-mono mt-0.5">Embed disabled by video owner</div>
              </div>
            </a>
          ) : (
            /* Bulusan & Kanlaon — normal YouTube embed */
            <iframe
              key={stream.videoId}
              src={`https://www.youtube.com/embed/${stream.videoId}?autoplay=1&mute=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${stream.name} Volcano — Live Stream`}
            />
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-white">
                  {stream.name} Volcano
                </div>
                <div className="text-[9px] text-white/60 font-mono">{stream.location}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[7px] font-bold font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: getAlertColor(stream.alertLevel),
                    color: stream.alertLevel >= 3 ? "#fff" : "#000",
                  }}
                >
                  Alert Level {stream.alertLevel}
                </span>
                {stream.embedDisabled ? (
                  <div className="flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-[8px] font-bold font-mono text-white/80">YT</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CE1126] animate-pulse" />
                    <span className="text-[8px] font-bold font-mono text-white/80">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[8px] text-muted-foreground/60 font-mono shrink-0">
          Source: afarTV YouTube — 24/7 Live Streams | Alert levels: PHIVOLCS
        </div>
      </div>
    </PanelWrapper>
  );
}
