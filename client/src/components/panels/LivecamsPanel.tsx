// Design: "Ops Center" — Volcano monitoring cameras from PHIVOLCS WOVODAT
// Two modes: PHIVOLCS snapshot images (auto-refresh) and YouTube 24/7 live streams
// Theme-aware colors for light/dark mode

import { useState, useEffect, useCallback, useRef } from "react";
import PanelWrapper from "@/components/PanelWrapper";

type CamMode = "phivolcs" | "youtube";

interface VolcanoCam {
  volcano: string;
  name: string;
  mode: CamMode;
  volcanoCode?: string;
  camPath?: string;
  videoId?: string;
  location: string;
  alertLevel?: string;
}

const VOLCANO_CAMS: VolcanoCam[] = [
  {
    volcano: "Mayon",
    name: "Crater (RasPiCam)",
    mode: "phivolcs",
    volcanoCode: "mvo",
    camPath: "cam/crater2wovo",
    location: "Ligñon Hill, Albay",
    alertLevel: "Level 2",
  },
  {
    volcano: "Mayon",
    name: "Ligñon Hill (4K)",
    mode: "phivolcs",
    volcanoCode: "mvo",
    camPath: "cam2/vmlh2wovo",
    location: "Ligñon Hill, Albay",
    alertLevel: "Level 2",
  },
  {
    volcano: "Kanlaon",
    name: "Cabagnaan",
    mode: "phivolcs",
    volcanoCode: "kvo",
    camPath: "cam3/vknv2wovo",
    location: "Cabagnaan, Negros Occidental",
    alertLevel: "Level 2",
  },
  {
    volcano: "Kanlaon",
    name: "Observatory",
    mode: "phivolcs",
    volcanoCode: "kvo",
    camPath: "cam2/vkmn2wovo",
    location: "Canlaon City, Negros Oriental",
    alertLevel: "Level 2",
  },
  {
    volcano: "Kanlaon",
    name: "24/7 Live Stream",
    mode: "youtube",
    videoId: "JVLVCSfQLYQ",
    location: "afarTV — Negros Occidental",
  },
  {
    volcano: "Bulusan",
    name: "24/7 4K Stream",
    mode: "youtube",
    videoId: "sSavszvmqHY",
    location: "afarTV — Sorsogon, 4K Ultra HD",
  },
  {
    volcano: "Mayon",
    name: "Eruption 4K Stream",
    mode: "youtube",
    videoId: "UDAZWxehMAI",
    location: "afarTV — Legazpi, Albay, 4K Ultra HD",
  },
];

function getPhivolcsImageUrl(cam: VolcanoCam): string {
  const now = new Date();
  const pht = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const year = pht.getFullYear();
  const month = String(pht.getMonth() + 1).padStart(2, "0");
  const day = String(pht.getDate()).padStart(2, "0");
  const hour = String(pht.getHours()).padStart(2, "0");
  const mins = Math.floor(pht.getMinutes() / 2) * 2;
  const minute = String(mins).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  return `https://wovodat.phivolcs.dost.gov.ph/img/monitoring/${cam.volcanoCode}/${dateStr}/${cam.camPath}_${hour}${minute}.png`;
}

export default function LivecamsPanel() {
  const [selected, setSelected] = useState(0);
  const [imgUrl, setImgUrl] = useState("");
  const [imgError, setImgError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cam = VOLCANO_CAMS[selected];

  const refreshImage = useCallback(() => {
    if (cam.mode === "phivolcs") {
      const url = getPhivolcsImageUrl(cam);
      setImgUrl(url);
      setImgError(false);
      const now = new Date();
      const pht = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
      setLastUpdate(
        pht.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
    }
  }, [cam]);

  useEffect(() => {
    refreshImage();
    if (cam.mode === "phivolcs") {
      refreshRef.current = setInterval(refreshImage, 60000);
      return () => {
        if (refreshRef.current) clearInterval(refreshRef.current);
      };
    }
  }, [selected, cam.mode, refreshImage]);

  const handleImgError = useCallback(() => {
    if (!imgError) {
      setImgError(true);
      const now = new Date();
      const pht = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
      pht.setMinutes(pht.getMinutes() - 4);
      const year = pht.getFullYear();
      const month = String(pht.getMonth() + 1).padStart(2, "0");
      const day = String(pht.getDate()).padStart(2, "0");
      const hour = String(pht.getHours()).padStart(2, "0");
      const mins = Math.floor(pht.getMinutes() / 2) * 2;
      const minute = String(mins).padStart(2, "0");
      const dateStr = `${year}${month}${day}`;
      const fallbackUrl = `https://wovodat.phivolcs.dost.gov.ph/img/monitoring/${cam.volcanoCode}/${dateStr}/${cam.camPath}_${hour}${minute}.png`;
      setImgUrl(fallbackUrl);
    }
  }, [imgError, cam]);

  const volcanoGroups = VOLCANO_CAMS.reduce<Record<string, number[]>>((acc, c, i) => {
    if (!acc[c.volcano]) acc[c.volcano] = [];
    acc[c.volcano].push(i);
    return acc;
  }, {});

  return (
    <PanelWrapper title="Volcano Cams" icon="VCAM" status="live">
      <div className="flex flex-col h-full gap-1.5">
        {/* Main view */}
        <div className="flex-1 relative rounded overflow-hidden bg-black min-h-0">
          {cam.mode === "youtube" ? (
            <iframe
              key={cam.videoId}
              src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${cam.volcano} — ${cam.name}`}
            />
          ) : (
            <>
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={`${cam.volcano} — ${cam.name}`}
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={handleImgError}
                />
              )}
              <button
                onClick={refreshImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white text-[9px] font-mono px-2 py-1 rounded transition-all"
                title="Refresh snapshot"
              >
                REFRESH
              </button>
            </>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-white">
                  {cam.volcano} — {cam.name}
                </div>
                <div className="text-[9px] text-white/60 font-mono">{cam.location}</div>
              </div>
              <div className="text-right">
                {cam.alertLevel && (
                  <div className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#CE1126]/80 text-white">
                    {cam.alertLevel}
                  </div>
                )}
                {cam.mode === "phivolcs" && lastUpdate && (
                  <div className="text-[8px] text-white/50 font-mono mt-0.5">
                    {lastUpdate} PHT
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Camera selector — grouped by volcano */}
        <div className="shrink-0 space-y-1 overflow-y-auto max-h-[120px]">
          {Object.entries(volcanoGroups).map(([volcano, indices]) => (
            <div key={volcano}>
              <div className="text-[8px] font-bold font-mono text-muted-foreground tracking-wider uppercase mb-0.5">
                {volcano}
              </div>
              <div className="flex gap-1 flex-wrap">
                {indices.map((i) => {
                  const c = VOLCANO_CAMS[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`shrink-0 rounded px-2 py-1 transition-all text-left ${
                        i === selected
                          ? "bg-accent border border-[#CE1126] shadow-[0_0_6px_#CE112640]"
                          : "bg-secondary border border-transparent hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-muted text-muted-foreground">
                          {c.mode === "phivolcs" ? "IMG" : "LIVE"}
                        </span>
                        <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">
                          {c.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[8px] text-muted-foreground/60 font-mono shrink-0">
          Source: DOST-PHIVOLCS WOVODAT / afarTV — IMG snapshots refresh every 60s
        </div>
      </div>
    </PanelWrapper>
  );
}
