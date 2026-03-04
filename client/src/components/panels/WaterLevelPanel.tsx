// Design: "Ops Center Noir" — Real-time water level monitoring
// Philippine flag colors: Blue=normal, Yellow=alert, Orange=alarm, Red=critical
// Data from PAGASA FFWS Metro Manila

import { useState, useEffect } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import {
  fetchWaterLevels,
  getWaterLevelColor,
  type WaterLevelStation,
} from "@/lib/feeds";

const STATUS_LABELS: Record<string, string> = {
  normal: "NORMAL",
  alert: "ALERT",
  alarm: "ALARM",
  critical: "CRITICAL",
};

const STATUS_ICONS: Record<string, string> = {
  normal: "🟢",
  alert: "🟡",
  alarm: "🟠",
  critical: "🔴",
};

export default function WaterLevelPanel() {
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
          setStations(data);
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
      icon="🌊"
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
          <div className="text-[9px] font-mono text-[oklch(0.45_0.01_260)]">
            PAGASA FFWS — Metro Manila
          </div>
          {lastUpdate && (
            <div className="text-[8px] font-mono text-[oklch(0.35_0.01_260)]">
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
                  <span className="text-[9px]">{STATUS_ICONS[s]}</span>
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

        {/* Station list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5 pr-0.5">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-xl animate-pulse">🌊</div>
              <div className="text-[10px] text-[oklch(0.45_0.01_260)] font-mono">
                Loading water level data...
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-xl">⚠️</div>
              <div className="text-[10px] text-[oklch(0.45_0.01_260)] font-mono">
                PAGASA FFWS unavailable
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            stations.map((station) => (
              <div
                key={station.id}
                className="group rounded px-2 py-1.5 transition-all hover:bg-[oklch(0.16_0.02_260)] border-l-2"
                style={{ borderLeftColor: getWaterLevelColor(station.status) }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px]">
                      {STATUS_ICONS[station.status]}
                    </span>
                    <span className="text-[10px] font-semibold text-[oklch(0.85_0.005_260)] truncate">
                      {station.name}
                    </span>
                    {station.name.includes("Dam") && (
                      <span className="text-[7px] px-1 py-0.5 rounded bg-[oklch(0.20_0.03_260)] text-[#0038A8] font-bold shrink-0">
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
                    <span className="text-[8px] text-[oklch(0.40_0.01_260)] font-mono">
                      EL.m
                    </span>
                  </div>
                </div>

                {/* Expanded details on hover */}
                <div className="hidden group-hover:flex items-center gap-3 mt-1 text-[8px] font-mono text-[oklch(0.45_0.01_260)]">
                  <span>-10m: {station.wl10m}</span>
                  <span>-30m: {station.wl30m}</span>
                  <span>-1h: {station.wl1h}</span>
                  <span>-2h: {station.wl2h}</span>
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
                      Δ{station.change}
                    </span>
                  )}
                </div>

                {/* Threshold indicators */}
                {(station.alertWL || station.alarmWL || station.criticalWL) && (
                  <div className="hidden group-hover:flex items-center gap-2 mt-0.5 text-[7px] font-mono text-[oklch(0.35_0.01_260)]">
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
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="text-[8px] text-[oklch(0.30_0.01_260)] font-mono shrink-0">
          Source: PAGASA Flood Forecasting & Warning System • Hover for details
        </div>
      </div>
    </PanelWrapper>
  );
}
