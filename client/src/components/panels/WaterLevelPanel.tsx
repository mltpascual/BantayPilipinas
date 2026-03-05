// Design: "Ops Center" — Real-time water level monitoring
// Philippine flag colors: Blue=normal, Yellow=alert, Orange=alarm, Red=critical
// Data from PAGASA FFWS — shows only latest reading per station
// Theme-aware styling for light/dark mode

import { useState, useEffect } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { useTheme } from "@/contexts/ThemeContext";
import {
  fetchWaterLevels,
  getWaterLevelColor,
  type WaterLevelStation,
} from "@/lib/feeds";
import { isDataFresh } from "@/lib/fetchUtils";

const STATUS_LABELS: Record<string, string> = {
  normal: "NORMAL",
  alert: "ALERT",
  alarm: "ALARM",
  critical: "CRITICAL",
};

const STATUS_ICONS: Record<string, string> = {
  normal: "OK",
  alert: "ALT",
  alarm: "ALM",
  critical: "CRT",
};

export default function WaterLevelPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stations, setStations] = useState<WaterLevelStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchWaterLevels();
        if (mounted) {
          // Filter to only stations with fresh data (within 48 hours)
          const freshData = data.filter(s => !s.timestamp || isDataFresh(s.timestamp, 48));
          setStations(freshData);
          setLoading(false);
          setError(false);
          if (data.length > 0 && data[0].timestamp) {
            setLastUpdate(data[0].timestamp);
          }
        }
      } catch {
        if (mounted) {
          setLoading(false);
          setError(true);
        }
      }
    }
    load();
    const interval = setInterval(load, 120000); // refresh every 2 min
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const alertCount = stations.filter((s) => s.status !== "normal").length;

  return (
    <PanelWrapper
      title="Water Levels"
      icon="WL"
      status={alertCount > 0 ? "alert" : "ok"}
      badge={
        alertCount > 0
          ? `${alertCount} alert${alertCount > 1 ? "s" : ""}`
          : `${stations.length} stations`
      }
    >
      <div className="flex flex-col h-full gap-1.5">
        {/* Header info */}
        <div className="flex items-center justify-between shrink-0">
          <div className={`text-[9px] font-mono ${isDark ? "text-[oklch(0.45_0.01_260)]" : "text-[oklch(0.45_0.015_260)]"}`}>
            PAGASA FFWS — Metro Manila
          </div>
          {lastUpdate && (
            <div className={`text-[8px] font-mono ${isDark ? "text-[oklch(0.35_0.01_260)]" : "text-[oklch(0.50_0.015_260)]"}`}>
              Updated: {lastUpdate}
            </div>
          )}
        </div>

        {/* Status summary bar */}
        {!loading && !error && stations.length > 0 && (
          <div className="flex gap-2 shrink-0 px-1">
            {(["normal", "alert", "alarm", "critical"] as const).map((s) => {
              const count = stations.filter((st) => st.status === s).length;
              if (count === 0) return null;
              return (
                <div key={s} className="flex items-center gap-1">
                  <span className="text-[7px] font-bold font-mono px-1 py-0.5 rounded" style={{ background: getWaterLevelColor(s) + '22', color: getWaterLevelColor(s) }}>{STATUS_ICONS[s]}</span>
                  <span
                    className="text-[9px] font-bold font-mono"
                    style={{ color: getWaterLevelColor(s) }}
                  >
                    {count} {STATUS_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Station list — only latest reading */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5 pr-0.5">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-xs font-mono font-bold text-muted-foreground animate-pulse">LOADING</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Loading water level data...
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-xs font-mono font-bold text-[#FF6B35]">ERROR</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                PAGASA FFWS unavailable
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            stations.map((station) => (
              <a
                key={station.id}
                href="http://121.58.193.173:8080/water/main_list.do"
                target="_blank"
                rel="noopener noreferrer"
                className={`group block rounded px-2 py-1.5 transition-all border-l-2 cursor-pointer no-underline ${
                  isDark ? "hover:bg-[oklch(0.16_0.02_260)]" : "hover:bg-[oklch(0.94_0.005_80)]"
                }`}
                style={{ borderLeftColor: getWaterLevelColor(station.status) }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[7px] font-bold font-mono px-1 py-0.5 rounded" style={{ background: getWaterLevelColor(station.status) + '22', color: getWaterLevelColor(station.status) }}>
                      {STATUS_ICONS[station.status]}
                    </span>
                    <span className={`text-[10px] font-semibold truncate ${isDark ? "text-[oklch(0.85_0.005_260)]" : "text-[oklch(0.20_0.02_260)]"}`}>
                      {station.name}
                    </span>
                    {station.name.includes("Dam") && (
                      <span className={`text-[7px] px-1 py-0.5 rounded font-bold shrink-0 ${
                        isDark ? "bg-[oklch(0.20_0.03_260)] text-[#0038A8]" : "bg-[oklch(0.90_0.03_260)] text-[#0038A8]"
                      }`}>
                        DAM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: getWaterLevelColor(station.status) }}
                    >
                      {station.currentWL}
                    </span>
                    <span className={`text-[8px] font-mono ${isDark ? "text-[oklch(0.40_0.01_260)]" : "text-[oklch(0.50_0.015_260)]"}`}>
                      EL.m
                    </span>
                  </div>
                </div>

                {/* Expanded details on hover — show change only */}
                <div className={`hidden group-hover:flex items-center gap-3 mt-1 text-[8px] font-mono ${
                  isDark ? "text-[oklch(0.45_0.01_260)]" : "text-[oklch(0.50_0.015_260)]"
                }`}>
                  {station.change !== "-" && (
                    <span
                      className={
                        station.change.includes("+")
                          ? "text-[#CE1126]"
                          : station.change.includes("-")
                            ? "text-[#0038A8]"
                            : ""
                      }
                    >
                      Change: {station.change}
                    </span>
                  )}
                  {station.timestamp && (
                    <span>Time: {station.timestamp}</span>
                  )}
                </div>

                {/* Threshold indicators */}
                {(station.alertWL || station.alarmWL || station.criticalWL) && (
                  <div className={`hidden group-hover:flex items-center gap-2 mt-0.5 text-[7px] font-mono ${
                    isDark ? "text-[oklch(0.35_0.01_260)]" : "text-[oklch(0.50_0.015_260)]"
                  }`}>
                    {station.alertWL && (
                      <span>Alert: {station.alertWL}m</span>
                    )}
                    {station.alarmWL && (
                      <span>Alarm: {station.alarmWL}m</span>
                    )}
                    {station.criticalWL && (
                      <span>Critical: {station.criticalWL}m</span>
                    )}
                  </div>
                )}
              </a>
            ))}
        </div>

        {/* Footer — Clickable source attribution */}
        <div className={`flex items-center gap-1.5 shrink-0 pt-1 border-t ${isDark ? "border-[oklch(0.20_0.015_260)]" : "border-[oklch(0.90_0.008_80)]"}`}>
          <svg className={`w-3 h-3 shrink-0 ${isDark ? "text-[oklch(0.35_0.01_260)]" : "text-[oklch(0.55_0.015_260)]"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <a
            href="http://121.58.193.173:8080/water/main_list.do"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[8px] font-mono underline decoration-dotted underline-offset-2 transition-colors ${
              isDark
                ? "text-[oklch(0.45_0.08_260)] hover:text-[oklch(0.60_0.12_260)]"
                : "text-[oklch(0.40_0.12_260)] hover:text-[oklch(0.35_0.18_260)]"
            }`}
          >
            Source: PAGASA Flood Forecasting & Warning System (FFWS)
          </a>
          <svg className={`w-2.5 h-2.5 shrink-0 ${isDark ? "text-[oklch(0.30_0.01_260)]" : "text-[oklch(0.50_0.015_260)]"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </div>
      </div>
    </PanelWrapper>
  );
}
