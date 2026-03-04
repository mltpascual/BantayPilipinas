// Design: "Ops Center Noir" — Live webcam grid from Philippine cities
// Expanded to cover more cities: Davao, Manila, Boracay, Tagaytay, Cebu, Baguio, Makati, Palawan
// Thumbnail strip with city labels, click to switch feed

import { useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";

const WEBCAMS = [
  // JazBaz Philippines — 24/7 Davao street cams
  { name: "Davao City", videoId: "DSRm7V_bsm8", location: "Agdao, Soliman St." },
  { name: "Davao Cam 2", videoId: "wvaB1q5blpk", location: "Cynthia Store, Agdao" },
  // Manila Bay sunset cam
  { name: "Manila Bay", videoId: "kpPFkxDjISg", location: "Manila Bay Sunset" },
  // Boracay beach
  { name: "Boracay", videoId: "2FjcGJCiB_A", location: "White Beach" },
  // Tagaytay / Taal view
  { name: "Tagaytay", videoId: "qSrOHSTGass", location: "Taal Volcano View" },
  // Edge Babor — Davao barbershop cam (popular 24/7)
  { name: "Davao Barber", videoId: "vesU40BscXc", location: "Van Storage, Agdao" },
  // Maria Deseo — Agdao public market
  { name: "Davao Market", videoId: "lJjBH4kqOYs", location: "Agdao Public Market" },
  // Cebu — earthTV or community cams
  { name: "Cebu City", videoId: "zseoUD3oF9U", location: "Cebu Livestream" },
  // Baguio Channel
  { name: "Baguio", videoId: "Bib4bFna1LQ", location: "Baguio City" },
  // Makati walking tour / BGC
  { name: "Makati", videoId: "C8F8G9AJzVc", location: "Rockwell, Makati" },
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
            src={`https://www.youtube.com/embed/${WEBCAMS[selected].videoId}?autoplay=1&mute=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={WEBCAMS[selected].name}
          />
        </div>
        {/* Thumbnail strip — scrollable */}
        <div className="flex gap-1 shrink-0 overflow-x-auto pb-0.5">
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
              <div className="text-[10px] font-semibold text-[oklch(0.85_0.005_260)] whitespace-nowrap">{cam.name}</div>
              <div className="text-[8px] text-[oklch(0.45_0.01_260)] whitespace-nowrap">{cam.location}</div>
            </button>
          ))}
        </div>
      </div>
    </PanelWrapper>
  );
}
