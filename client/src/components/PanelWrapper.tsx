// Design: "Ops Center" — Frosted glass panel wrapper
// Space Grotesk headers, IBM Plex Sans body
// Entrance animation, theme-aware styling

import { ReactNode, useEffect, useState } from "react";

interface PanelWrapperProps {
  title: string;
  icon: string;
  status?: "live" | "active" | "idle" | "alert" | "ok";
  children: ReactNode;
  className?: string;
  badge?: string;
  onMaximize?: () => void;
}

export default function PanelWrapper({
  title,
  icon,
  status = "active",
  children,
  className = "",
  onMaximize,
  badge,
}: PanelWrapperProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const statusColors: Record<string, string> = {
    live: "bg-ph-red shadow-[0_0_6px_oklch(0.55_0.22_25)]",
    active: "bg-[#22C55E] shadow-[0_0_6px_#22C55E]",
    idle: "bg-muted-foreground",
    alert: "bg-ph-yellow shadow-[0_0_6px_oklch(0.85_0.17_85)]",
    ok: "bg-ph-blue shadow-[0_0_6px_oklch(0.40_0.15_260)]",
  };

  return (
    <div
      className={`panel-glass flex flex-col h-full overflow-hidden ${className}`}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
      }}
    >
      {/* Header */}
      <div className="panel-header px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 cursor-move select-none drag-handle shrink-0">
        <span className="text-[7px] sm:text-[8px] font-bold font-mono tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{icon}</span>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-muted-foreground" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          {title}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} ${status === "live" ? "pulse-red" : ""}`} />
        {status === "live" && <span className="live-badge">LIVE</span>}
        {status === "alert" && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-ph-yellow/20 text-ph-yellow font-mono">ALERT</span>}
        {badge && <span className="text-[8px] font-mono text-muted-foreground">{badge}</span>}
        <div className="flex-1" />
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
            title="Maximize"
          >
            <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto p-2 min-h-0">
        {children}
      </div>
    </div>
  );
}
