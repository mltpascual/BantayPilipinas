// Design: "Ops Center" — Air Quality monitoring for PH cities
// AQI color-coded, PM2.5, PM10, UV Index, pollutant breakdown
// Theme-aware colors for light/dark mode
// Source: Open-Meteo Air Quality API (CAMS global model)

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import {
  AirQualityData,
  fetchAirQuality,
  getAqiCategory,
  getUvLabel,
} from "@/lib/feeds";

function AqiBadge({ aqi }: { aqi: number }) {
  const { label, color, bgColor } = getAqiCategory(aqi);
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[9px] font-bold font-mono" style={{ color }}>
        {aqi}
      </span>
      <span className="text-[8px] font-mono" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function UvBadge({ uv }: { uv: number }) {
  const { label, color } = getUvLabel(uv);
  return (
    <span className="text-[9px] font-mono font-semibold" style={{ color }}>
      UV {uv.toFixed(1)} · {label}
    </span>
  );
}

function PollutantBar({
  label,
  value,
  unit,
  max,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-mono text-muted-foreground w-8 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[8px] font-mono text-muted-foreground w-16 text-right shrink-0">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

export default function AirQualityPanel() {
  const [data, setData] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchAirQuality();
      setData(result);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 600000); // 10 min
    return () => clearInterval(interval);
  }, []);

  return (
    <PanelWrapper title="Air Quality" icon="AQ" status={loading ? "idle" : "active"}>
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
          Loading air quality...
        </div>
      ) : (
        <div className="space-y-1">
          {data.map((d) => {
            const { color } = getAqiCategory(d.usAqi);
            const isExpanded = expanded === d.city;
            return (
              <div key={d.city}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : d.city)}
                  className="w-full px-2 py-1.5 rounded bg-secondary hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-foreground">
                          {d.city}
                        </div>
                        <UvBadge uv={d.uvIndex} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <AqiBadge aqi={d.usAqi} />
                      <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground">
                        <span>PM2.5: {d.pm25.toFixed(1)}</span>
                        <span>PM10: {d.pm10.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded pollutant detail */}
                {isExpanded && (
                  <div
                    className="mx-1 mt-0.5 mb-1 px-2 py-2 rounded bg-muted/50 space-y-1.5"
                    style={{
                      animation: "fadeIn 0.2s ease-out",
                    }}
                  >
                    <div className="text-[8px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Pollutant Breakdown
                    </div>
                    <PollutantBar
                      label="PM2.5"
                      value={d.pm25}
                      unit="µg/m³"
                      max={75}
                      color={getAqiCategory(d.usAqi).color}
                    />
                    <PollutantBar
                      label="PM10"
                      value={d.pm10}
                      unit="µg/m³"
                      max={150}
                      color={getAqiCategory(d.usAqi).color}
                    />
                    <PollutantBar
                      label="O₃"
                      value={d.ozone}
                      unit="µg/m³"
                      max={240}
                      color="#6366F1"
                    />
                    <PollutantBar
                      label="CO"
                      value={d.carbonMonoxide}
                      unit="µg/m³"
                      max={1000}
                      color="#8B5CF6"
                    />
                    <PollutantBar
                      label="NO₂"
                      value={d.nitrogenDioxide}
                      unit="µg/m³"
                      max={200}
                      color="#EC4899"
                    />
                    <PollutantBar
                      label="SO₂"
                      value={d.sulphurDioxide}
                      unit="µg/m³"
                      max={350}
                      color="#F59E0B"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="text-[8px] text-muted-foreground/60 font-mono text-center mt-1.5 space-y-0.5">
            <div>US AQI Standard — Auto-refresh 10m</div>
            <a
              href="https://open-meteo.com/en/docs/air-quality-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary/60 hover:text-primary transition-colors"
            >
              Source: Open-Meteo Air Quality API (CAMS)
              <svg className="w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
