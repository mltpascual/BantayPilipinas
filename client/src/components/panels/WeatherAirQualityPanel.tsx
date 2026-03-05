// Design: "Ops Center" — Combined Weather + Air Quality panel
// Tabbed interface: Weather | Air Quality
// Theme-aware colors for light/dark mode
// Source: Open-Meteo Weather + Air Quality APIs

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import {
  WeatherData,
  AirQualityData,
  fetchWeather,
  fetchAirQuality,
  getWeatherIcon,
  getWeatherDescription,
  getAqiCategory,
  getUvLabel,
} from "@/lib/feeds";

type TabMode = "weather" | "airquality";

function AqiBadge({ aqi }: { aqi: number }) {
  const { label, color, bgColor } = getAqiCategory(aqi);
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[8px] font-bold font-mono" style={{ color }}>
        {aqi}
      </span>
      <span className="text-[7px] font-mono" style={{ color }}>
        {label}
      </span>
    </div>
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
      <span className="text-[7px] font-mono text-muted-foreground w-7 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[7px] font-mono text-muted-foreground w-14 text-right shrink-0">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

export default function WeatherAirQualityPanel() {
  const [tab, setTab] = useState<TabMode>("weather");
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [wx, aq] = await Promise.all([fetchWeather(), fetchAirQuality()]);
      setWeather(wx);
      setAirQuality(aq);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 600000); // 10 min
    return () => clearInterval(interval);
  }, []);

  const getTempColor = (temp: number): string => {
    if (temp >= 35) return "#CE1126";
    if (temp >= 30) return "#FF6B35";
    if (temp >= 25) return "#FCD116";
    if (temp >= 20) return "#0038A8";
    return "#6B7280";
  };

  const getWindDir = (deg: number): string => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  const panelStatus = loading ? "idle" : "active";
  const panelIcon = tab === "weather" ? "WX" : "AQ";

  return (
    <PanelWrapper title="Weather & Air Quality" icon={panelIcon} status={panelStatus}>
      {/* Tab switcher */}
      <div className="flex items-center gap-0.5 px-1.5 pt-1 pb-1">
        <button
          onClick={() => setTab("weather")}
          className={`text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded transition-all duration-200 ${
            tab === "weather"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          WEATHER
        </button>
        <button
          onClick={() => setTab("airquality")}
          className={`text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded transition-all duration-200 ${
            tab === "airquality"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          AIR QUALITY
        </button>
      </div>

      {loading && weather.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
          Loading data...
        </div>
      ) : tab === "weather" ? (
        /* ===== WEATHER TAB ===== */
        <div className="space-y-0.5 px-0.5">
          {weather.map((w) => (
            <div
              key={w.city}
              className="px-2 py-1 rounded bg-secondary hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground">
                    {getWeatherIcon(w.weathercode, w.is_day)}
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold text-foreground">{w.city}</div>
                    <div className="text-[8px] text-muted-foreground">
                      {getWeatherDescription(w.weathercode)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-bold font-mono"
                    style={{ color: getTempColor(w.temperature) }}
                  >
                    {w.temperature}°
                  </div>
                  <div className="text-[7px] text-muted-foreground font-mono">
                    {w.windspeed} km/h {getWindDir(w.winddirection)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-[7px] text-muted-foreground/60 font-mono text-center mt-1">
            <a
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-primary transition-colors"
            >
              Source: Open-Meteo Weather API — Auto-refresh 10m
              <svg className="w-2 h-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      ) : (
        /* ===== AIR QUALITY TAB ===== */
        <div className="space-y-0.5 px-0.5">
          {airQuality.map((d) => {
            const { color } = getAqiCategory(d.usAqi);
            const { label: uvLabel, color: uvColor } = getUvLabel(d.uvIndex);
            const isExpanded = expanded === d.city;
            return (
              <div key={d.city}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : d.city)}
                  className="w-full px-2 py-1 rounded bg-secondary hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-0.5 h-5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="text-[10px] font-semibold text-foreground">
                          {d.city}
                        </div>
                        <span className="text-[8px] font-mono font-semibold" style={{ color: uvColor }}>
                          UV {d.uvIndex.toFixed(1)} · {uvLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <AqiBadge aqi={d.usAqi} />
                      <div className="flex items-center gap-1.5 text-[7px] font-mono text-muted-foreground">
                        <span>PM2.5: {d.pm25.toFixed(1)}</span>
                        <span>PM10: {d.pm10.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded pollutant detail */}
                {isExpanded && (
                  <div
                    className="mx-0.5 mt-0.5 mb-0.5 px-2 py-1.5 rounded bg-muted/50 space-y-1"
                    style={{ animation: "fadeIn 0.2s ease-out" }}
                  >
                    <div className="text-[7px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Pollutant Breakdown
                    </div>
                    <PollutantBar label="PM2.5" value={d.pm25} unit="µg/m³" max={75} color={color} />
                    <PollutantBar label="PM10" value={d.pm10} unit="µg/m³" max={150} color={color} />
                    <PollutantBar label="O₃" value={d.ozone} unit="µg/m³" max={240} color="#6366F1" />
                    <PollutantBar label="CO" value={d.carbonMonoxide} unit="µg/m³" max={1000} color="#8B5CF6" />
                    <PollutantBar label="NO₂" value={d.nitrogenDioxide} unit="µg/m³" max={200} color="#EC4899" />
                    <PollutantBar label="SO₂" value={d.sulphurDioxide} unit="µg/m³" max={350} color="#F59E0B" />
                  </div>
                )}
              </div>
            );
          })}

          <div className="text-[7px] text-muted-foreground/60 font-mono text-center mt-1 space-y-0.5">
            <div>US AQI Standard — Auto-refresh 10m</div>
            <a
              href="https://open-meteo.com/en/docs/air-quality-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-primary transition-colors"
            >
              Source: Open-Meteo Air Quality API (CAMS)
              <svg className="w-2 h-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
