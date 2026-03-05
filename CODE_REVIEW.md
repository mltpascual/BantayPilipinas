# Code Review — BantayPilipinas Dashboard

**Date:** March 5, 2026  
**Scope:** Full codebase review (client/src/)

---

## Critical Issues

### C1. No AbortController on any fetch useEffect
**Files:** All panels with data fetching (WaterLevelPanel, NewsPanel, AccidentsPanel, PhiVolcsPanel, WeatherAirQualityPanel, MapPanel, PAGASABulletinBanner)  
**Risk:** Memory leaks. If a component unmounts while a fetch is in-flight, the response callback will try to setState on an unmounted component. React 18+ handles this gracefully with a warning, but it's still a leak.  
**Fix:** Add AbortController to every useEffect that fetches data. Pass signal to fetch, abort on cleanup.

### C2. MapPanel has hardcoded dark-mode oklch colors for overlays
**File:** MapPanel.tsx  
**Risk:** Map overlay controls (buttons, legend, counts badge) use hardcoded dark oklch values that won't adapt to light mode. The map itself has a dark basemap, so this is partially intentional, but the legend and controls should still be readable.  
**Fix:** Low priority — map controls are always on a dark map background, so dark-themed overlays make sense. Document this as intentional.

---

## Important Issues

### I1. Dead code: NOAHPanel.tsx is never imported
**File:** client/src/components/panels/NOAHPanel.tsx (78 lines)  
**Risk:** Dead code increases bundle size and confuses maintainers.  
**Fix:** Delete NOAHPanel.tsx — its functionality is now in MapPanel's NOAH hazard overlays.

### I2. Dead code: Home.tsx and NotFound.tsx are never imported
**Files:** client/src/pages/Home.tsx, client/src/pages/NotFound.tsx  
**Risk:** Dead code. App.tsx renders Dashboard directly, no router.  
**Fix:** Delete both files.

### I3. Zero aria-labels across entire codebase
**Files:** All panels, Dashboard, PanelWrapper, Banner  
**Risk:** Screen readers cannot navigate the dashboard. Buttons, interactive elements, and landmark regions have no accessible names.  
**Fix:** Add aria-labels to key interactive elements (map toggle buttons, search input, volcano cam buttons, theme toggle, banner dismiss button).

### I4. Missing error handling in several panels
**Files:** AccidentsPanel, NewsPanel, PhiVolcsPanel, WeatherAirQualityPanel  
**Risk:** These panels call feeds.ts functions in useEffect but don't have local try/catch. The feeds.ts functions do have try/catch internally, but if they throw unexpectedly, the panel will crash.  
**Fix:** Wrap fetch calls in try/catch at the panel level too, set error state.

### I5. Bundle size warning (1.8MB JS)
**Risk:** Slow initial load on mobile/3G connections.  
**Fix:** Code-split MapPanel (heaviest) with React.lazy(). Consider lazy-loading maplibre-gl.

---

## Minor Issues

### M1. No key diversity — some lists use array index as key
**Risk:** React reconciliation issues if list items reorder.  
**Fix:** Use unique identifiers (station name, article URL, etc.) as keys where available.

### M2. Missing alt text on some img elements
**Risk:** Accessibility gap.  
**Fix:** Add descriptive alt text to all images.

### M3. fetchUtils.ts CORS proxy fallback could be more robust
**Risk:** If corsproxy.io is down, the single fallback to allorigins may also fail.  
**Fix:** Add a third fallback or implement a retry with exponential backoff.

---

## Architecture Notes (Positive)

- Clean separation: feeds.ts handles all data fetching, panels handle presentation
- Shared utilities (fetchUtils.ts) for cache-busting and date validation — good DRY
- Theme context properly propagated through all panels
- PanelWrapper provides consistent panel chrome
- ErrorBoundary at app root catches render crashes

---

## Implementation Priority

1. **C1** — AbortController (prevents memory leaks)
2. **I1, I2** — Delete dead code (NOAHPanel, Home, NotFound)
3. **I3** — Add aria-labels (accessibility)
4. **I4** — Error handling in panels
5. **I5** — Code splitting (performance)
6. **M1, M2, M3** — Minor fixes
