# Dashboard Update Tasks

## Completed
- [x] Add theme toggle button to header
- [x] Create light theme CSS variables
- [x] Ensure all panels respect theme
- [x] Research PAGASA bulletin feed/scraper
- [x] Add bulletin section above news panel
- [x] Audit typography
- [x] Audit color system
- [x] Audit spatial composition
- [x] Audit motion/interactions
- [x] Implement improvements

## Current Sprint

### 1. 48-Hour Date Validation (All Panels)
- [x] Create shared utility `isDataFresh(dateStr, maxAgeHours)` in `lib/fetchUtils.ts`
- [x] Apply to NewsPanel — filter articles older than 48h (via feeds.ts)
- [x] Apply to AccidentsPanel — filter incidents older than 48h (via feeds.ts)
- [x] Apply to PhiVolcsPanel — filter events older than 48h (via feeds.ts)
- [x] Apply to WaterLevelPanel — filter readings older than 48h
- [x] Apply to WeatherPanel — weather is always current (live API)
- [x] Banner already has 48h validation

### 2. Cache Busting (All External Fetches)
- [x] Create shared `cacheBustUrl`, `fetchFresh`, `fetchViaProxy` in `lib/fetchUtils.ts`
- [x] Apply to feeds.ts — all RSS/proxy fetches (proxyJsonUrl, proxyRawUrl)
- [x] Apply to WaterLevelPanel fetch (via feeds.ts)
- [x] Apply to WeatherPanel fetch (via feeds.ts)
- [x] Apply to PAGASABulletinBanner fetches (via fetchViaProxy)

### 3. "No Active Alerts" Indicator
- [x] Update PAGASABulletinBanner to show subtle "No active alerts — System monitoring PAGASA, USGS, FFWS" bar with green dot and PHT timestamp

### 4. Architecture Patterns Skill
- [x] Generated ARCHITECTURE.md applying Clean Architecture + Hexagonal Architecture patterns to the frontend codebase
