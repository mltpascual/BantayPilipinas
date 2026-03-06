// Design: "Ops Center" — Unified Weather + Air Quality panel
// All data visible at a glance — no tabs, no clicks needed
// Each city row: weather icon, temp, wind, AQI badge, PM2.5, UV
// Expandable pollutant breakdown on tap for deeper detail
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

function AqiBadge({ aqi }: { aqi: number }) {
  const { label, color, bgColor } = getAqiCategory(aqi);
  return (
    <div
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shrink-0"
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

interface CityData {
  city: string;
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
}

export default function WeatherAirQualityPanel() {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [wx, aq] = await Promise.all([fetchWeather(), fetchAirQuality()]);
        if (!mounted) return;
        setWeather(wx);
        setAirQuality(aq);
      } catch {
        // handled internally
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 600000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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

  // Merge weather + air quality by city
  const cities: CityData[] = (() => {
    const cityNames = new Set<string>();
    weather.forEach((w) => cityNames.add(w.city));
    airQuality.forEach((a) => cityNames.add(a.city));

    const order = [
      "Manila", "Cebu", "Davao", "Baguio", "Tacloban",
      "Zamboanga", "Cagayan de Oro", "General Santos", "Angeles",
    ];

    return order
      .filter((c) => cityNames.has(c))
      .map((city) => ({
        city,
        weather: weather.find((w) => w.city === city) || null,
        airQuality: airQuality.find((a) => a.city === city) || null,
      }));
  })();

  const panelStatus = loading ? "idle" : "active";

  return (
    <PanelWrapper title="Weather & Air Quality" icon="WX" status={panelStatus}>
      {loading && weather.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
          Loading data...
        </div>
      ) : (
        <div className="space-y-0.5 px-0.5">
          {cities.map(({ city, weather: w, airQuality: aq }) => {
            const isExpanded = expanded === city;
            const aqColor = aq ? getAqiCategory(aq.usAqi).color : "#6B7280";

            return (
              <div key={city}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : city)}
                  className="w-full px-2 py-1.5 rounded bg-secondary hover:bg-accent transition-colors text-left"
                  aria-label={`${city} weather and air quality details`}
                >
                  {/* Row 1: City name + Weather icon + Temp | AQI badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {w && (
                        <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {getWeatherIcon(w.weathercode, w.is_day)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-foreground truncate">
                          {city}
                        </div>
                        {w && (
                          <div className="text-[7px] text-muted-foreground font-mono">
                            {getWeatherDescription(w.weathercode)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Temperature */}
                      {w && (
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: getTempColor(w.temperature) }}
                        >
                          {w.temperature}°
                        </span>
                      )}
                      {/* AQI Badge */}
                      {aq && <AqiBadge aqi={aq.usAqi} />}
                    </div>
                  </div>

                  {/* Row 2: Wind + PM2.5 + PM10 + UV — all at a glance */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                    {w && (
                      <span className="text-[7px] font-mono text-muted-foreground">
                        💨 {w.windspeed} km/h {getWindDir(w.winddirection)}
                      </span>
                    )}
                    {aq && (
                      <>
                        <span className="text-[7px] font-mono text-muted-foreground">
                          PM2.5: <span style={{ color: aqColor }}>{aq.pm25.toFixed(1)}</span>
                        </span>
                        <span className="text-[7px] font-mono text-muted-foreground">
                          PM10: <span style={{ color: aqColor }}>{aq.pm10.toFixed(1)}</span>
                        </span>
                        <span
                          className="text-[7px] font-mono font-semibold"
                          style={{ color: getUvLabel(aq.uvIndex).color }}
                        >
                          UV {aq.uvIndex.toFixed(1)}
                        </span>
                      </>
                    )}
                    {/* Expand indicator */}
                    <span className="ml-auto text-[7px] text-muted-foreground/40">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded pollutant breakdown */}
                {isExpanded && aq && (
                  <div
                    className="mx-0.5 mt-0.5 mb-0.5 px-2 py-1.5 rounded bg-muted/50 space-y-1"
                    style={{ animation: "fadeIn 0.2s ease-out" }}
                  >
                    <div className="text-[7px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Pollutant Breakdown
                    </div>
                    <PollutantBar label="PM2.5" value={aq.pm25} unit="µg/m³" max={75} color={aqColor} />
                    <PollutantBar label="PM10" value={aq.pm10} unit="µg/m³" max={150} color={aqColor} />
                    <PollutantBar label="O₃" value={aq.ozone} unit="µg/m³" max={240} color="#6366F1" />
                    <PollutantBar label="CO" value={aq.carbonMonoxide} unit="µg/m³" max={1000} color="#8B5CF6" />
                    <PollutantBar label="NO₂" value={aq.nitrogenDioxide} unit="µg/m³" max={200} color="#EC4899" />
                    <PollutantBar label="SO₂" value={aq.sulphurDioxide} unit="µg/m³" max={350} color="#F59E0B" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Source attribution */}
          <div className="text-[7px] text-muted-foreground/60 font-mono text-center mt-1.5 space-y-0.5">
            <div>Auto-refresh 10m</div>
            <div className="flex items-center justify-center gap-2">
              <a
                href="https://open-meteo.com/en/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-primary transition-colors"
              >
                Weather: Open-Meteo
                <svg className="w-2 h-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <span className="text-muted-foreground/30">|</span>
              <a
                href="https://open-meteo.com/en/docs/air-quality-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-primary transition-colors"
              >
                AQ: Open-Meteo CAMS
                <svg className="w-2 h-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
