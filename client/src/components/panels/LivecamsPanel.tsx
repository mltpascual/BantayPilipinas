// Design: "Ops Center Noir" — Live webcam grid from Philippine cities
// Small thumbnails with city labels, click to expand

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

const WEBCAMS = [
  { name: "Davao City", videoId: "DSRm7V_bsm8", location: "Agdao, Davao" },
  { name: "Manila Bay", videoId: "kpPFkxDjISg", location: "Manila Bay Sunset" },
  { name: "Boracay", videoId: "2FjcGJCiB_A", location: "Boracay Beach" },
  { name: "Tagaytay", videoId: "qSrOHSTGass", location: "Taal View" },
];

export default function LivecamsPanel() {
  const [selected, setSelected] = useState(0);

  return (
    <PanelWrapper title="Livecams" icon="📷" status="live">
      <div className="flex flex-col h-full gap-1.5">
        {/* Main view */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          <iframe
            key={WEBCAMS[selected].videoId}
            src={`https://www.youtube.com/embed/${WEBCAMS[selected].videoId}?autoplay=0&mute=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={WEBCAMS[selected].name}
          />
        </div>
        {/* Thumbnail strip */}
        <div className="flex gap-1 shrink-0 overflow-x-auto">
          {WEBCAMS.map((cam, i) => (
            <button
              key={cam.videoId}
              onClick={() => setSelected(i)}
              className={`shrink-0 rounded px-2 py-1 transition-all text-left ${
                i === selected
                  ? "bg-[oklch(0.22_0.03_260)] border border-[#0038A8] shadow-[0_0_8px_oklch(0.40_0.15_260_/_0.2)]"
                  : "bg-[oklch(0.15_0.02_260)] border border-transparent hover:border-[oklch(0.30_0.02_260)]"
              }`}
            >
              <div className="text-[10px] font-semibold text-[oklch(0.85_0.005_260)]">{cam.name}</div>
              <div className="text-[8px] text-[oklch(0.45_0.01_260)]">{cam.location}</div>
            </button>
          ))}
        </div>
      </div>
    </PanelWrapper>
  );
}
