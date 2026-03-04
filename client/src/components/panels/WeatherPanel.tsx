// Design: "Ops Center Noir" — Weather dashboard for PH cities
// Temperature color-coded, weather icons, wind data
// Compact layout to fit more cities in smaller panel

import { useEffect, useState } from "react";
import PanelWrapper from "@/components/PanelWrapper";
import { WeatherData, fetchWeather, getWeatherIcon, getWeatherDescription } from "@/lib/feeds";

export default function WeatherPanel() {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchWeather();
      setWeather(data);
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

  return (
    <PanelWrapper title="Weather" icon="WX" status={loading ? "idle" : "active"}>
      {loading && weather.length === 0 ? (
        <div className="flex items-center justify-center h-full text-[oklch(0.50_0.01_260)] text-xs font-mono">
          Loading weather...
        </div>
      ) : (
        <div className="space-y-1">
          {weather.map((w) => (
            <div
              key={w.city}
              className="px-2 py-1.5 rounded bg-[oklch(0.15_0.02_260)] hover:bg-[oklch(0.18_0.02_260)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-bold font-mono px-1.5 py-1 rounded bg-[oklch(0.18_0.02_260)] text-[oklch(0.65_0.01_260)]">{getWeatherIcon(w.weathercode, w.is_day)}</span>
                  <div>
                    <div className="text-[11px] font-semibold text-[oklch(0.88_0.005_260)]">{w.city}</div>
                    <div className="text-[9px] text-[oklch(0.50_0.01_260)]">
                      {getWeatherDescription(w.weathercode)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-base font-bold font-mono"
                    style={{ color: getTempColor(w.temperature) }}
                  >
                    {w.temperature}°
                  </div>
                  <div className="text-[8px] text-[oklch(0.45_0.01_260)] font-mono">
                    {w.windspeed} km/h {getWindDir(w.winddirection)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-[8px] text-[oklch(0.30_0.01_260)] font-mono text-center mt-1">
            Open-Meteo API • Auto-refresh 10m
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
