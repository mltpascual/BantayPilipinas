// Design: "Ops Center Noir" — Frosted glass panel wrapper
// Blue header gradient, status dot, thin luminous borders
// Drag handle on header, overflow managed

import { ReactNode } from "react";

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
  const statusColors: Record<string, string> = {
    live: "bg-[#CE1126] shadow-[0_0_6px_#CE1126]",
    active: "bg-[#22C55E] shadow-[0_0_6px_#22C55E]",
    idle: "bg-[#6B7280]",
    alert: "bg-[#FCD116] shadow-[0_0_6px_#FCD116]",
    ok: "bg-[#0038A8] shadow-[0_0_6px_#0038A8]",
  };

  return (
    <div className={`panel-glass flex flex-col h-full overflow-hidden ${className}`}>
      {/* Drag handle header */}
      <div className="panel-header px-3 py-1.5 flex items-center gap-2 cursor-move select-none drag-handle shrink-0">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] font-semibold tracking-wide uppercase text-[oklch(0.75_0.005_260)]">
          {title}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} ${status === "live" ? "pulse-red" : ""}`} />
        {status === "live" && <span className="live-badge">LIVE</span>}
        {status === "alert" && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#FCD116]/20 text-[#FCD116] font-mono">ALERT</span>}
        {badge && <span className="text-[8px] font-mono text-[oklch(0.50_0.01_260)]">{badge}</span>}
        <div className="flex-1" />
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="text-[oklch(0.50_0.01_260)] hover:text-[oklch(0.80_0.005_260)] transition-colors text-xs"
            title="Maximize"
          >
            ⛶
          </button>
        )}
      </div>
      {/* Panel content */}
      <div className="flex-1 overflow-auto p-2 min-h-0">
        {children}
      </div>
    </div>
  );
}
