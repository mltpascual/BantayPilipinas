// Design: "Ops Center" — NOAH Hazards panel
// Theme-aware colors for light/dark mode

import { useState } from "react";
import PanelWrapper from "../PanelWrapper";

const HAZARD_TYPES = [
  {
    id: "flood",
    icon: "FLOOD",
    label: "Flood",
    color: "#3B82F6",
    desc: "100-year rain return period flood inundation maps",
    levels: [
      { label: "Low", depth: "0–0.5m", color: "#93C5FD" },
      { label: "Medium", depth: "0.5–1.5m", color: "#3B82F6" },
      { label: "High", depth: ">1.5m", color: "#1E3A8A" },
    ],
  },
  {
    id: "landslide",
    icon: "SLIDE",
    label: "Landslide",
    color: "#F59E0B",
    desc: "Shallow & structurally-controlled landslide susceptibility",
    levels: [
      { label: "Low", depth: "Monitor", color: "#FCD34D" },
      { label: "Medium", depth: "Slope protection", color: "#F59E0B" },
      { label: "High", depth: "No dwelling zone", color: "#B45309" },
    ],
  },
  {
    id: "stormsurge",
    icon: "SURGE",
    label: "Storm Surge",
    color: "#EF4444",
    desc: "Storm surge advisory maps based on 721 historical cyclones",
    levels: [
      { label: "SSA 1", depth: "2–3m", color: "#FCA5A5" },
      { label: "SSA 2", depth: "3–4m", color: "#EF4444" },
      { label: "SSA 3", depth: "4–5m", color: "#B91C1C" },
      { label: "SSA 4", depth: ">5m", color: "#7F1D1D" },
    ],
  },
];

const QUICK_LINKS = [
  {
    icon: "MAP",
    label: "NOAH Studio",
    desc: "Full hazard map viewer",
    url: "https://noah.up.edu.ph/noah-studio",
    primary: true,
  },
  {
    icon: "SEARCH",
    label: "Know Your Hazards",
    desc: "Search your area's risk",
    url: "https://noah.up.edu.ph/know-your-hazards",
    primary: false,
  },
  {
    icon: "TARGET",
    label: "HazardHunter",
    desc: "DOST-PHIVOLCS risk tool",
    url: "https://hazardhunter.georisk.gov.ph/",
    primary: false,
  },
  {
    icon: "DATA",
    label: "GeoAnalytics",
    desc: "Risk analysis & visualization",
    url: "https://geoanalytics.georisk.gov.ph/",
    primary: false,
  },
];

export default function NOAHPanel() {
  const [activeHazard, setActiveHazard] = useState<string>("flood");
  const [tab, setTab] = useState<"hazards" | "links">("hazards");

  const selectedHazard = HAZARD_TYPES.find((h) => h.id === activeHazard)!;

  return (
    <PanelWrapper title="NOAH Hazards" icon="NOAH" status="live" badge="UP NOAH">
      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setTab("hazards")}
          className={`flex-1 text-[10px] font-semibold py-1 rounded transition-all ${
            tab === "hazards"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Hazard Types
        </button>
        <button
          onClick={() => setTab("links")}
          className={`flex-1 text-[10px] font-semibold py-1 rounded transition-all ${
            tab === "links"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Quick Launch
        </button>
      </div>

      {tab === "hazards" && (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {/* Hazard type selector */}
          <div className="flex gap-1">
            {HAZARD_TYPES.map((h) => (
              <button
                key={h.id}
                onClick={() => setActiveHazard(h.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-all ${
                  activeHazard === h.id
                    ? "bg-accent ring-1 ring-border"
                    : "bg-secondary hover:bg-accent"
                }`}
              >
                <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background: h.color + '22', color: h.color }}>{h.icon}</span>
                <span
                  className={`text-[9px] font-bold tracking-wide ${
                    activeHazard === h.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {h.label}
                </span>
              </button>
            ))}
          </div>

          {/* Selected hazard detail */}
          <div className="bg-secondary rounded-md p-2.5 border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background: selectedHazard.color + '22', color: selectedHazard.color }}>{selectedHazard.icon}</span>
              <div>
                <div className="text-[11px] font-bold text-foreground">{selectedHazard.label} Hazard</div>
                <div className="text-[9px] text-muted-foreground leading-tight">{selectedHazard.desc}</div>
              </div>
            </div>

            {/* Hazard levels */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">
                Classification Levels
              </div>
              {selectedHazard.levels.map((level) => (
                <div
                  key={level.label}
                  className="flex items-center gap-2 py-1 px-2 rounded bg-muted"
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: level.color }}
                  />
                  <span className="text-[10px] font-semibold text-foreground flex-1">{level.label}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{level.depth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open NOAH Studio CTA */}
          <a
            href="https://noah.up.edu.ph/noah-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 rounded-md bg-gradient-to-r from-[#0038A8] to-[#0050d0] hover:from-[#004cc4] hover:to-[#0060e0] text-white text-[11px] font-bold tracking-wide transition-all shadow-lg shadow-[#0038A8]/20 hover:shadow-[#0038A8]/40"
          >
            <span>Open NOAH Studio</span>
            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Data source info */}
          <div className="text-[8px] text-muted-foreground/60 text-center leading-relaxed">
            Data: UP Resilience Institute / NOAH Center — 81 provinces covered
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="flex flex-col gap-1.5 flex-1 overflow-auto">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 p-2.5 rounded-md transition-all group ${
                link.primary
                  ? "bg-gradient-to-r from-[#0038A8]/20 to-[#0038A8]/10 border border-[#0038A8]/30 hover:border-[#0038A8]/60"
                  : "bg-secondary border border-border hover:border-primary/30"
              }`}
            >
              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{link.icon}</span>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-foreground group-hover:text-[#60A5FA] transition-colors">
                  {link.label}
                </div>
                <div className="text-[9px] text-muted-foreground">{link.desc}</div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}

          {/* Additional info */}
          <div className="bg-secondary rounded-md p-2.5 border border-border mt-1">
            <div className="text-[9px] font-bold text-[#FCD116] mb-1">About Project NOAH</div>
            <div className="text-[9px] text-muted-foreground leading-relaxed">
              Nationwide Operational Assessment of Hazards — the Philippines' primary disaster risk reduction program by UP Resilience Institute. Covers flood, landslide, and storm surge hazard mapping for all 81 provinces using LiDAR, hydrological modeling, and satellite imagery.
            </div>
          </div>

          {/* NOAH App download */}
          <div className="flex gap-1.5 mt-1">
            <a
              href="https://apps.apple.com/ph/app/noah/id6738976792"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-muted border border-border hover:border-primary/30 transition-all"
            >
              <span className="text-[9px] font-semibold text-muted-foreground">iOS App</span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=ph.edu.up.noah"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-muted border border-border hover:border-primary/30 transition-all"
            >
              <span className="text-[9px] font-semibold text-muted-foreground">Android App</span>
            </a>
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
