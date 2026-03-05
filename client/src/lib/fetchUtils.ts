// Shared utilities for date validation and cache-busting across all panels
// Architecture: Domain utility layer — no framework dependencies

/**
 * Check if a date string represents data that is "fresh" (within maxAgeHours).
 * Uses Philippine Time (UTC+8) as reference.
 * 
 * @param dateStr - Any parseable date string (ISO, RSS pubDate, etc.)
 * @param maxAgeHours - Maximum age in hours (default: 48)
 * @returns true if the date is within the allowed window, false otherwise
 */
export function isDataFresh(dateStr: string, maxAgeHours: number = 48): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    return (now - date.getTime()) <= maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Check if a date string is from today in Philippine Time (UTC+8).
 * 
 * @param dateStr - Any parseable date string
 * @returns true if the date is today in PHT
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const phtNow = new Date(Date.now() + (8 * 60 * 60 * 1000));
    const phtDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return (
      phtNow.getUTCFullYear() === phtDate.getUTCFullYear() &&
      phtNow.getUTCMonth() === phtDate.getUTCMonth() &&
      phtNow.getUTCDate() === phtDate.getUTCDate()
    );
  } catch {
    return false;
  }
}

/**
 * Append a cache-busting parameter to a URL to prevent stale proxy responses.
 * 
 * @param url - The URL to bust cache for
 * @returns URL with `_cb=<timestamp>` appended
 */
export function cacheBustUrl(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_cb=${Date.now()}`;
}

/**
 * Fetch with cache-busting and no-store cache policy.
 * Wraps native fetch with anti-caching headers and URL parameter.
 * 
 * @param url - The URL to fetch
 * @param options - Additional fetch options
 * @returns Response from fetch
 */
export async function fetchFresh(url: string, options: RequestInit = {}): Promise<Response> {
  const bustedUrl = cacheBustUrl(url);
  return fetch(bustedUrl, {
    ...options,
    cache: "no-store",
    headers: {
      ...options.headers,
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  });
}

/**
 * Fetch via CORS proxy with cache-busting.
 * Uses allorigins.win as the proxy with anti-caching measures.
 * 
 * @param targetUrl - The actual URL to fetch through the proxy
 * @param options - Additional fetch options (timeout, signal, etc.)
 * @returns Response from fetch
 */
export async function fetchViaProxy(targetUrl: string, options: RequestInit = {}): Promise<Response> {
  const proxyBase = "https://api.allorigins.win/raw?url=";
  const proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}&_cb=${Date.now()}`;
  return fetch(proxyUrl, {
    ...options,
    cache: "no-store",
  });
}

/**
 * Fetch via CORS proxy returning JSON-wrapped response with cache-busting.
 * 
 * @param targetUrl - The actual URL to fetch through the proxy
 * @param options - Additional fetch options
 * @returns Response from fetch (JSON with .contents field)
 */
export async function fetchViaProxyJson(targetUrl: string, options: RequestInit = {}): Promise<Response> {
  const proxyBase = "https://api.allorigins.win/get?url=";
  const proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}&_cb=${Date.now()}`;
  return fetch(proxyUrl, {
    ...options,
    cache: "no-store",
  });
}
