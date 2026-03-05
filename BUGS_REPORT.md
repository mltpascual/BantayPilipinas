# Find-Bugs Report — BantayPilipinas / PH Mission Control

**Date:** 2026-03-05
**Scope:** All custom source files (3,949 lines across 18 files)

---

## Files Reviewed

| File | Lines | Reviewed |
|------|-------|----------|
| `client/src/pages/Dashboard.tsx` | 261 | Complete |
| `client/src/components/PAGASABulletinBanner.tsx` | 315 | Complete |
| `client/src/components/PanelWrapper.tsx` | 76 | Complete |
| `client/src/components/panels/MapPanel.tsx` | 931 | Complete |
| `client/src/components/panels/WeatherAirQualityPanel.tsx` | 276 | Complete |
| `client/src/components/panels/WaterLevelPanel.tsx` | 239 | Complete |
| `client/src/components/panels/MMDAPanel.tsx` | 199 | Complete |
| `client/src/components/panels/LivecamsPanel.tsx` | 170 | Complete |
| `client/src/components/panels/PhiVolcsPanel.tsx` | 156 | Complete |
| `client/src/components/panels/LivestreamPanel.tsx` | 132 | Complete |
| `client/src/components/panels/AccidentsPanel.tsx` | 112 | Complete |
| `client/src/components/panels/NewsPanel.tsx` | 98 | Complete |
| `client/src/lib/feeds.ts` | 540 | Complete |
| `client/src/lib/fetchUtils.ts` | 111 | Complete |
| `client/src/lib/provinces.ts` | 242 | Complete |
| `client/src/contexts/ThemeContext.tsx` | 66 | Complete |
| `client/src/App.tsx` | 20 | Complete |
| `client/src/main.tsx` | 5 | Complete |

---

## Security Checklist Summary

| Check | Status |
|-------|--------|
| Injection (SQL, command, template) | N/A — no backend/database |
| XSS | **2 Medium issues found** |
| Authentication | N/A — static frontend |
| Authorization/IDOR | N/A — no protected resources |
| CSRF | N/A — no state-changing backend ops |
| Race conditions | Clean |
| Session | N/A — no sessions |
| Cryptography | N/A — no crypto operations |
| Information disclosure | **1 Low issue** |
| DoS | **1 Medium issue** |
| Business logic | **1 Low issue** |

---

## Issues Found

### 1. XSS via unsanitized external data in `setHTML()` popups

- **File:Line** — `MapPanel.tsx:211`
- **Severity:** Medium
- **Problem:** Station names (`st.name`) and water level values (`st.currentWL`) from the PAGASA API are interpolated directly into HTML via `setHTML()` template literals. If the API returns malicious content (e.g., `<script>` or `<img onerror>`), it would execute in the user's browser.
- **Evidence:** `st.name` comes from `station.obsnm` in `feeds.ts:445` — raw external API data with no sanitization. The `setHTML()` method on MapLibre popups renders raw HTML.
- **Fix:** Escape HTML entities before interpolation:
  ```ts
  function escapeHtml(s: string): string {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  // Then use: ${escapeHtml(st.name)}
  ```
- **References:** OWASP XSS Prevention Cheat Sheet

### 2. XSS via `innerHTML` in feeds.ts helper functions

- **File:Line** — `feeds.ts:66, feeds.ts:72`
- **Severity:** Medium
- **Problem:** `decodeHTMLEntities()` and `stripHTML()` use `innerHTML` to process RSS feed content. While `textarea.innerHTML` is relatively safe (textarea doesn't execute scripts), `div.innerHTML` in `stripHTML()` can execute embedded scripts or event handlers in some edge cases during DOM parsing.
- **Evidence:** RSS feed content from external sources (GMA, ABS-CBN, Rappler, etc.) is passed through these functions. A compromised RSS feed could inject malicious HTML.
- **Fix:** Use DOMParser instead:
  ```ts
  function stripHTML(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  ```
- **References:** OWASP DOM-based XSS

### 3. Potential client-side DoS from unbounded GeoJSON loading

- **File:Line** — `MapPanel.tsx:234-310`
- **Severity:** Medium
- **Problem:** NOAH hazard GeoJSON files (flood, landslide, storm surge) and critical facilities (hospitals, schools, evacuation centers) are loaded without size limits. A single nationwide GeoJSON can be several MB. Loading multiple layers simultaneously on a mobile device could exhaust memory and crash the browser tab.
- **Evidence:** Users can toggle all 8 layers on simultaneously. Each GeoJSON is fetched and parsed into MapLibre sources without any size check or progressive loading.
- **Fix:** Add a maximum concurrent layer limit (e.g., 3 at a time) and show a warning when the user tries to enable more. Consider using vector tiles instead of raw GeoJSON for nationwide data.

### 4. HTTP (non-HTTPS) external link

- **File:Line** — `WaterLevelPanel.tsx:140, WaterLevelPanel.tsx:223`
- **Severity:** Low
- **Problem:** The PAGASA FFWS source link uses plain HTTP (`http://121.58.193.173:8080/water/main_list.do`). This is an IP-based URL with no TLS, meaning the connection is unencrypted.
- **Evidence:** This is the actual PAGASA server URL — they don't offer HTTPS. Not a code bug per se, but users clicking this link from an HTTPS site will get a mixed-content warning in some browsers.
- **Fix:** Add `rel="noopener noreferrer"` (already present) and consider adding a small note "(HTTP — government server)" next to the link. No HTTPS alternative exists.

### 5. MMDAPanel Facebook SDK script injection without cleanup

- **File:Line** — `MMDAPanel.tsx:30-47`
- **Severity:** Low
- **Problem:** The Facebook SDK script is appended to `document.body` in a `useEffect` but never removed on unmount. If the component remounts, it may append duplicate script tags. The `setTimeout` calls (lines 37, 44, 68) are also not cleaned up on unmount.
- **Evidence:** No cleanup function for the script element or timeouts in the first useEffect.
- **Fix:** Track the script element and remove it in the cleanup function. Store timeout IDs and clear them on unmount.

---

## Areas Not Fully Verified

1. **MapLibre GL internal security** — The map library handles tile loading and WebGL rendering internally; we trust the library's own security.
2. **shadcn/ui components** — Pre-built UI library components were not audited (out of scope).
3. **Third-party CDN integrity** — Google Fonts, Facebook SDK, and YouTube embeds are loaded without SRI hashes, which is standard practice but noted.

---

## Summary

No critical vulnerabilities found. The 2 medium XSS issues are the highest priority — both involve rendering unsanitized external API data as HTML. The DoS concern around GeoJSON loading is worth addressing for mobile users. The remaining issues are low severity.
