// Data Freshness Context — centralized timestamp tracking for all data sources
// Provides updateTimestamp(source) and getTimestamp(source) across all panels
// Visual: green=fresh (<5min), yellow=aging (5-15min), orange=stale (15-30min), red=very stale (>30min)

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface FreshnessState {
  timestamps: Record<string, number>;
  updateTimestamp: (source: string) => void;
  getTimestamp: (source: string) => number | null;
  getAge: (source: string) => number | null; // age in seconds
}

const FreshnessContext = createContext<FreshnessState>({
  timestamps: {},
  updateTimestamp: () => {},
  getTimestamp: () => null,
  getAge: () => null,
});

export function FreshnessProvider({ children }: { children: ReactNode }) {
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const [, setTick] = useState(0);

  // Force re-render every 30 seconds to update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const updateTimestamp = useCallback((source: string) => {
    setTimestamps((prev) => ({ ...prev, [source]: Date.now() }));
  }, []);

  const getTimestamp = useCallback(
    (source: string) => timestamps[source] ?? null,
    [timestamps]
  );

  const getAge = useCallback(
    (source: string) => {
      const ts = timestamps[source];
      if (!ts) return null;
      return Math.floor((Date.now() - ts) / 1000);
    },
    [timestamps]
  );

  return (
    <FreshnessContext.Provider value={{ timestamps, updateTimestamp, getTimestamp, getAge }}>
      {children}
    </FreshnessContext.Provider>
  );
}

export function useFreshness() {
  return useContext(FreshnessContext);
}

// Reusable FreshnessIndicator component
export function FreshnessIndicator({ source, className = "" }: { source: string; className?: string }) {
  const { getAge } = useFreshness();
  const [, setTick] = useState(0);

  // Update every 15 seconds for smooth relative time
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const age = getAge(source);
  if (age === null) return null;

  const minutes = Math.floor(age / 60);
  const hours = Math.floor(minutes / 60);

  let label: string;
  if (age < 60) label = "just now";
  else if (minutes < 60) label = `${minutes}m ago`;
  else label = `${hours}h ${minutes % 60}m ago`;

  // Color coding: green < 5min, yellow 5-15min, orange 15-30min, red > 30min
  let dotColor: string;
  let textColor: string;
  if (minutes < 5) {
    dotColor = "#22C55E";
    textColor = "text-[#22C55E]";
  } else if (minutes < 15) {
    dotColor = "#FCD116";
    textColor = "text-[#FCD116]";
  } else if (minutes < 30) {
    dotColor = "#FF6B35";
    textColor = "text-[#FF6B35]";
  } else {
    dotColor = "#CE1126";
    textColor = "text-[#CE1126]";
  }

  return (
    <div className={`flex items-center gap-1 ${className}`} title={`Last updated: ${label}`}>
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 4px ${dotColor}40` }}
      />
      <span className={`text-[8px] font-mono tracking-wide ${textColor}`}>
        {label}
      </span>
      {minutes >= 30 && (
        <svg className="w-2.5 h-2.5 shrink-0 text-[#CE1126]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
      )}
    </div>
  );
}
