// Design: "Ops Center" — Volcano live streams from afarTV YouTube
// Buttons: Mayon, Bulusan, Kanlaon with PHIVOLCS alert level badges
// Theme-aware colors for light/dark mode

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

interface VolcanoStream {
  name: string;
  videoId: string;
  location: string;
  alertLevel: number;
}

const STREAMS: VolcanoStream[] = [
  {
    name: "Mayon",
    videoId: "UDAZWxehMAI",
    location: "afarTV — Legazpi, Albay, 4K Ultra HD",
    alertLevel: 3,
  },
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
];

function getAlertColor(level: number): string {
  switch (level) {
    case 0: return "#22C55E"; // green — no alert
    case 1: return "#FACC15"; // yellow — low-level unrest
    case 2: return "#F97316"; // orange — moderate unrest
    case 3: return "#CE1126"; // red — high unrest / magmatic
    case 4: return "#CE1126"; // red — hazardous eruption imminent
    case 5: return "#7F1D1D"; // dark red — hazardous eruption ongoing
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
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CE1126] animate-pulse" />
                  <span className="text-[8px] font-bold font-mono text-white/80">LIVE</span>
                </div>
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
