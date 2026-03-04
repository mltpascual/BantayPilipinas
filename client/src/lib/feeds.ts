// Design: "Ops Center Noir" — Data fetching utilities
// Philippine flag colors encode data: Blue=info, Red=alerts, Yellow=live
// Uses rss2json as primary proxy, allorigins as fallback

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category?: string;
}

export interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    alert: string | null;
    tsunami: number;
    sig: number;
    type: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  };
}

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
}

export interface GDACSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  eventType: string;
  severity: string;
}

export interface TyphoonData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  windSpeed: number;
  category: string;
  alertLevel: string;
  country: string;
  title: string;
  link: string;
  pubDate: string;
  bbox: [number, number, number, number] | null; // [lonMin, lonMax, latMin, latMax]
}

const CORS_PROXY_JSON = "https://api.allorigins.win/get?url=";
const CORS_PROXY_RAW = "https://api.allorigins.win/raw?url=";

function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function stripHTML(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

// Primary: rss2json (more reliable, returns JSON)
async function fetchViaRss2Json(url: string, source: string): Promise<FeedItem[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.status !== "ok") throw new Error("rss2json error");

  return (data.items || []).slice(0, 20).map((item: any) => ({
    title: decodeHTMLEntities(item.title || "").trim(),
    link: (item.link || "").trim(),
    description: stripHTML(decodeHTMLEntities(item.description || "")).trim().slice(0, 200),
    pubDate: item.pubDate || "",
    source,
  }));
}

// Fallback: allorigins JSON wrapper (more reliable CORS)
async function fetchViaAllOrigins(url: string, source: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(`${CORS_PROXY_JSON}${encodeURIComponent(url)}`, { signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const text = json.contents || "";
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = xml.querySelectorAll("item");
  const results: FeedItem[] = [];

  items.forEach((item, index) => {
    if (index >= 20) return;
    results.push({
      title: decodeHTMLEntities(item.querySelector("title")?.textContent || "").trim(),
      link: (item.querySelector("link")?.textContent || "").trim(),
      description: stripHTML(decodeHTMLEntities(item.querySelector("description")?.textContent || "")).trim().slice(0, 200),
      pubDate: item.querySelector("pubDate")?.textContent || "",
      source,
    });
  });

  return results;
}

export async function fetchRSSFeed(url: string, source: string): Promise<FeedItem[]> {
  try {
    return await fetchViaRss2Json(url, source);
  } catch {
    try {
      return await fetchViaAllOrigins(url, source);
    } catch (err) {
      console.warn(`Failed to fetch RSS from ${source}:`, err);
      return [];
    }
  }
}

export async function fetchAllNews(): Promise<FeedItem[]> {
  const feeds = [
    { url: "https://www.rappler.com/feed/", source: "Rappler" },
    { url: "https://newsinfo.inquirer.net/feed", source: "Inquirer" },
    { url: "https://data.gmanetwork.com/gno/rss/news/feed.xml", source: "GMA News" },
    { url: "https://www.philstar.com/rss/headlines", source: "PhilStar" },
  ];

  const results = await Promise.allSettled(feeds.map((f) => fetchRSSFeed(f.url, f.source)));
  const allItems: FeedItem[] = [];

  results.forEach((r) => {
    if (r.status === "fulfilled") allItems.push(...r.value);
  });

  return allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime() || 0;
    const dateB = new Date(b.pubDate).getTime() || 0;
    return dateB - dateA;
  });
}

export async function fetchAccidentNews(): Promise<FeedItem[]> {
  const feeds = [
    { url: "https://data.gmanetwork.com/gno/rss/news/metro/feed.xml", source: "GMA Metro" },
    { url: "https://newsinfo.inquirer.net/category/latest-stories/feed", source: "Inquirer" },
  ];

  const results = await Promise.allSettled(feeds.map((f) => fetchRSSFeed(f.url, f.source)));
  const allItems: FeedItem[] = [];

  results.forEach((r) => {
    if (r.status === "fulfilled") allItems.push(...r.value);
  });

  const keywords = ["accident", "crash", "collision", "traffic", "vehic", "road", "mmda", "flood", "fire", "incident", "killed", "died", "injury", "hurt", "landslide", "earthquake", "storm"];
  return allItems
    .filter((item) => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    })
    .sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });
}

export async function fetchEarthquakes(): Promise<EarthquakeFeature[]> {
  try {
    const url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4.5&maxlatitude=21.5&minlongitude=116&maxlongitude=127&limit=30&orderby=time";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.features || [];
  } catch (err) {
    console.warn("Failed to fetch earthquakes:", err);
    return [];
  }
}

const PH_CITIES = [
  { city: "Manila", latitude: 14.5995, longitude: 120.9842 },
  { city: "Cebu", latitude: 10.3157, longitude: 123.8854 },
  { city: "Davao", latitude: 7.1907, longitude: 125.4553 },
  { city: "Baguio", latitude: 16.4023, longitude: 120.5960 },
  { city: "Tacloban", latitude: 11.2543, longitude: 124.9600 },
];

export async function fetchWeather(): Promise<WeatherData[]> {
  try {
    const lats = PH_CITIES.map((c) => c.latitude).join(",");
    const lons = PH_CITIES.map((c) => c.longitude).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current_weather=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((d: any, i: number) => ({
        ...PH_CITIES[i],
        temperature: d.current_weather?.temperature ?? 0,
        windspeed: d.current_weather?.windspeed ?? 0,
        winddirection: d.current_weather?.winddirection ?? 0,
        weathercode: d.current_weather?.weathercode ?? 0,
        is_day: d.current_weather?.is_day ?? 1,
      }));
    } else {
      return [{
        ...PH_CITIES[0],
        temperature: data.current_weather?.temperature ?? 0,
        windspeed: data.current_weather?.windspeed ?? 0,
        winddirection: data.current_weather?.winddirection ?? 0,
        weathercode: data.current_weather?.weathercode ?? 0,
        is_day: data.current_weather?.is_day ?? 1,
      }];
    }
  } catch (err) {
    console.warn("Failed to fetch weather:", err);
    return [];
  }
}

export async function fetchGDACS(): Promise<GDACSItem[]> {
  const gdacsUrl = "https://www.gdacs.org/xml/rss.xml";

  async function tryRss2Json(): Promise<string> {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(gdacsUrl)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== "ok" || !data.items) throw new Error("rss2json error");
    // rss2json returns parsed items, convert back to XML-like processing
    return JSON.stringify(data.items);
  }

  async function tryAllOrigins(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch(`${CORS_PROXY_JSON}${encodeURIComponent(gdacsUrl)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jsonResp = await response.json();
    return jsonResp.contents || "";
  }

  try {
    // Try rss2json first (returns structured JSON)
    try {
      const jsonStr = await tryRss2Json();
      const items = JSON.parse(jsonStr);
      const results: GDACSItem[] = [];
      for (const item of items) {
        const title = decodeHTMLEntities(item.title || "").trim();
        const desc = stripHTML(decodeHTMLEntities(item.description || "")).trim().slice(0, 300);
        const link = (item.link || "").trim();
        const pubDate = item.pubDate || "";

        const text = `${title} ${desc}`.toLowerCase();
        const isRelevant = text.includes("philipp") || text.includes("pacific") || text.includes("typhoon") || text.includes("tropical") || text.includes("south china") || text.includes("manila");

        let eventType = "unknown";
        const titleLower = title.toLowerCase();
        if (titleLower.includes("cyclone") || titleLower.includes("typhoon") || titleLower.includes("tropical")) eventType = "cyclone";
        else if (titleLower.includes("earthquake")) eventType = "earthquake";
        else if (titleLower.includes("flood")) eventType = "flood";
        else if (titleLower.includes("volcano")) eventType = "volcano";

        let severity = "green";
        if (titleLower.includes("red") || titleLower.includes("alert 3")) severity = "high";
        else if (titleLower.includes("orange") || titleLower.includes("alert 2")) severity = "medium";

        if (isRelevant || results.length < 10) {
          results.push({ title, description: desc, link, pubDate, eventType, severity });
        }
      }
      return results.slice(0, 15);
    } catch {
      // Fall through to allorigins
    }

    // Fallback: allorigins
    const rawText = await tryAllOrigins();
    const parser = new DOMParser();
    const xml = parser.parseFromString(rawText, "text/xml");
    const items = xml.querySelectorAll("item");
    const results: GDACSItem[] = [];    

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent || "";
      const desc = item.querySelector("description")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";

      const text = `${title} ${desc}`.toLowerCase();
      const isRelevant = text.includes("philipp") || text.includes("pacific") || text.includes("typhoon") || text.includes("tropical") || text.includes("south china") || text.includes("manila");

      let eventType = "unknown";
      const titleLower = title.toLowerCase();
      if (titleLower.includes("cyclone") || titleLower.includes("typhoon") || titleLower.includes("tropical")) eventType = "cyclone";
      else if (titleLower.includes("earthquake")) eventType = "earthquake";
      else if (titleLower.includes("flood")) eventType = "flood";
      else if (titleLower.includes("volcano")) eventType = "volcano";

      let severity = "green";
      if (titleLower.includes("red") || titleLower.includes("alert 3")) severity = "high";
      else if (titleLower.includes("orange") || titleLower.includes("alert 2")) severity = "medium";

      if (isRelevant || results.length < 10) {
        results.push({
          title: decodeHTMLEntities(title).trim(),
          description: stripHTML(decodeHTMLEntities(desc)).trim().slice(0, 300),
          link: link.trim(),
          pubDate,
          eventType,
          severity,
        });
      }
    });

    return results.slice(0, 15);
  } catch (err) {
    console.warn("Failed to fetch GDACS:", err);
    return [];
  }
}

export function getWeatherIcon(code: number, isDay: number): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 3) return isDay ? "⛅" : "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "☁️";
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatMagnitude(mag: number): { color: string; label: string } {
  if (mag >= 7) return { color: "#CE1126", label: "Major" };
  if (mag >= 5) return { color: "#FF6B35", label: "Strong" };
  if (mag >= 4) return { color: "#FCD116", label: "Moderate" };
  if (mag >= 3) return { color: "#0038A8", label: "Light" };
  return { color: "#6B7280", label: "Minor" };
}

export async function fetchTyphoons(): Promise<TyphoonData[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch(
      `${CORS_PROXY_JSON}${encodeURIComponent("https://www.gdacs.org/xml/rss.xml")}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jsonResp = await response.json();
    const rawText = jsonResp.contents || "";

    if (!rawText.startsWith("<?xml") && !rawText.startsWith("<rss")) {
      throw new Error("Not XML response");
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(rawText, "text/xml");
    const items = xml.querySelectorAll("item");
    const typhoons: TyphoonData[] = [];

    items.forEach((item) => {
      const eventType = item.querySelector("eventtype")?.textContent;
      if (eventType !== "TC") return;

      const title = item.querySelector("title")?.textContent || "";
      const lat = parseFloat(item.querySelector("lat")?.textContent || "0");
      const lon = parseFloat(item.querySelector("long")?.textContent || "0");
      const eventName = item.querySelector("eventname")?.textContent || "Unknown";
      const eventId = item.querySelector("eventid")?.textContent || "";
      const alertLevel = item.querySelector("alertlevel")?.textContent || "Green";
      const country = item.querySelector("country")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      const severityEl = item.querySelector("severity");
      const windSpeed = parseFloat(severityEl?.getAttribute("value") || "0");
      const category = severityEl?.textContent || "";

      const bboxText = item.querySelector("bbox")?.textContent;
      let bbox: [number, number, number, number] | null = null;
      if (bboxText) {
        const parts = bboxText.trim().split(/\s+/).map(Number);
        if (parts.length === 4) bbox = parts as [number, number, number, number];
      }

      typhoons.push({
        id: `TC${eventId}`,
        name: eventName,
        lat,
        lon,
        windSpeed,
        category,
        alertLevel,
        country,
        title: decodeHTMLEntities(title).trim(),
        link: link.trim(),
        pubDate,
        bbox,
      });
    });

    return typhoons;
  } catch (err) {
    console.warn("Failed to fetch typhoons:", err);
    return [];
  }
}

export function getTyphoonColor(alertLevel: string, windSpeed: number): string {
  if (alertLevel === "Red" || windSpeed >= 178) return "#CE1126";
  if (alertLevel === "Orange" || windSpeed >= 119) return "#FF6B35";
  if (alertLevel === "Green" || windSpeed >= 63) return "#FCD116";
  return "#0038A8";
}

export function getTyphoonCategory(windSpeed: number): string {
  if (windSpeed >= 252) return "Super Typhoon";
  if (windSpeed >= 209) return "Cat 5";
  if (windSpeed >= 178) return "Cat 4";
  if (windSpeed >= 154) return "Cat 3";
  if (windSpeed >= 130) return "Cat 2";
  if (windSpeed >= 119) return "Cat 1";
  if (windSpeed >= 63) return "Tropical Storm";
  return "Tropical Depression";
}

// ===== PAGASA Water Level Monitoring =====

export interface WaterLevelStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  timestamp: string;
  currentWL: string;
  wl10m: string;
  wl30m: string;
  wl1h: string;
  wl2h: string;
  change: string;
  alertWL: number | null;
  alarmWL: number | null;
  criticalWL: number | null;
  status: "normal" | "alert" | "alarm" | "critical";
}

export async function fetchWaterLevels(): Promise<WaterLevelStation[]> {
  async function tryFetch(): Promise<any[]> {
    // Use allorigins JSON wrapper (raw endpoint hangs for this API)
    const response = await fetch(
      `${CORS_PROXY_JSON}${encodeURIComponent("http://121.58.193.173:8080/water/main_list.do")}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const contents = json.contents;
    if (typeof contents === "string") return JSON.parse(contents);
    if (Array.isArray(contents)) return contents;
    return [];
  }

  try {
    const data = await tryFetch();

    if (!Array.isArray(data)) return [];

    return data.map((station: any) => {
      const currentVal = parseFloat((station.wl || "0").replace(/[^\d.-]/g, ""));
      const alertVal = station.alertwl ? parseFloat(station.alertwl) : null;
      const alarmVal = station.alarmwl ? parseFloat(station.alarmwl) : null;
      const criticalVal = station.criticalwl ? parseFloat(station.criticalwl) : null;

      let status: "normal" | "alert" | "alarm" | "critical" = "normal";
      if (criticalVal && currentVal >= criticalVal) status = "critical";
      else if (alarmVal && currentVal >= alarmVal) status = "alarm";
      else if (alertVal && currentVal >= alertVal) status = "alert";

      return {
        id: station.obscd || "",
        name: station.obsnm || "Unknown",
        lat: station.lat || 0,
        lon: station.lon || 0,
        timestamp: station.timestr || "",
        currentWL: station.wl || "--",
        wl10m: station.wl10m || "--",
        wl30m: station.wl30m || "--",
        wl1h: station.wl1h || "--",
        wl2h: station.wl2h || "--",
        change: station.wlchange || "-",
        alertWL: alertVal,
        alarmWL: alarmVal,
        criticalWL: criticalVal,
        status,
      };
    });
  } catch (err) {
    console.warn("Failed to fetch water levels:", err);
    return [];
  }
}

export function getWaterLevelColor(status: string): string {
  switch (status) {
    case "critical": return "#CE1126";
    case "alarm": return "#FF6B35";
    case "alert": return "#FCD116";
    default: return "#0038A8";
  }
}
