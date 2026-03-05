# BantayPilipinas — Architecture Documentation

## Project Overview

BantayPilipinas (Philippine Mission Control) is a real-time disaster monitoring dashboard for the Philippines. It aggregates data from multiple government and international sources (PAGASA, USGS, GDACS, PhiVolcs, MMDA, Open-Meteo) into a single operational interface. The application is a static frontend (React 19 + Tailwind 4) with no backend server, relying entirely on public APIs and CORS proxies for data access.

---

## Architecture Pattern: Frontend Clean Architecture

The project applies **Clean Architecture** principles adapted for a frontend-only React application. Dependencies flow inward: UI components depend on domain utilities, never the reverse. External data sources are abstracted behind a single data-access layer (`lib/feeds.ts`), making it straightforward to swap APIs or add new data sources without touching presentation code.

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  pages/Dashboard.tsx    components/panels/*Panel.tsx     │
│  components/PAGASABulletinBanner.tsx                     │
│  components/PanelWrapper.tsx                             │
├─────────────────────────────────────────────────────────┤
│                  APPLICATION LAYER                       │
│  contexts/ThemeContext.tsx    hooks/useComposition.ts     │
│  hooks/useMobile.tsx         hooks/usePersistFn.ts       │
├─────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                          │
│  lib/feeds.ts (data fetching + domain types)             │
│  lib/fetchUtils.ts (cache-busting, date validation)      │
│  lib/provinces.ts (geographic reference data)            │
│  lib/utils.ts (general utilities)                        │
├─────────────────────────────────────────────────────────┤
│               INFRASTRUCTURE / EXTERNAL                  │
│  PAGASA FFWS API    USGS Earthquake API                  │
│  GDACS RSS Feed     Open-Meteo Weather API               │
│  allorigins.win     rss2json.com (CORS proxies)          │
│  MMDA Facebook      PhiVolcs RSS                         │
│  Google Maps API    ESRI Satellite Tiles                  │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure with Responsibilities

```
client/src/
├── pages/                    # Page-level route components (thin orchestrators)
│   ├── Dashboard.tsx         # Main dashboard — composes all panels, header, banner
│   ├── Home.tsx              # Landing/redirect page
│   └── NotFound.tsx          # 404 fallback
├── components/
│   ├── panels/               # Domain-specific data panels (one per data source)
│   │   ├── MapPanel.tsx      # Interactive map with earthquake/typhoon/water overlays
│   │   ├── NewsPanel.tsx     # Philippine news aggregator (RSS feeds)
│   │   ├── AccidentsPanel.tsx # Filtered accident/incident feed
│   │   ├── WeatherPanel.tsx  # Multi-city weather from Open-Meteo
│   │   ├── WaterLevelPanel.tsx # PAGASA FFWS water level monitoring
│   │   ├── PhiVolcsPanel.tsx # Earthquake + GDACS disaster alerts
│   │   ├── LivestreamPanel.tsx # PTV/GMA/ABS-CBN live stream embeds
│   │   ├── LivecamsPanel.tsx # Volcano camera feeds
│   │   ├── VolcanoCamsPanel.tsx # Mayon/Kanlaon volcano cams
│   │   ├── NOAHPanel.tsx     # Project NOAH flood/landslide maps
│   │   └── MMDAPanel.tsx     # MMDA traffic Facebook embed
│   ├── PAGASABulletinBanner.tsx # Alert banner (typhoon/earthquake/water)
│   ├── PanelWrapper.tsx      # Shared panel chrome (title, badges, collapse)
│   ├── Map.tsx               # Google Maps integration wrapper
│   └── ui/                   # shadcn/ui primitive components (not modified)
├── contexts/
│   └── ThemeContext.tsx       # Dark/light theme state management
├── hooks/
│   ├── useComposition.ts     # IME composition handling
│   ├── useMobile.tsx         # Responsive breakpoint detection
│   └── usePersistFn.ts       # Stable function reference hook
├── lib/                      # Domain utilities (no React dependencies)
│   ├── feeds.ts              # ALL external data fetching + domain types
│   ├── fetchUtils.ts         # Cache-busting, date validation, proxy helpers
│   ├── provinces.ts          # Philippine geographic reference data
│   └── utils.ts              # General utility functions (cn, etc.)
├── App.tsx                   # Route definitions + ThemeProvider
├── main.tsx                  # React entry point
└── index.css                 # Global theme tokens + animations
```

---

## Hexagonal Architecture: Ports and Adapters

The data-access layer (`lib/feeds.ts`) acts as the **adapter** layer in a Hexagonal Architecture sense. Each `fetch*` function is an adapter that connects to an external data source and returns a normalized domain type.

| Port (Interface) | Adapter (Implementation) | External Source |
|---|---|---|
| `fetchAllNews(): FeedItem[]` | RSS via rss2json / allorigins | GMA, Rappler, Inquirer, PhilStar |
| `fetchAccidentNews(): FeedItem[]` | RSS with keyword filtering | GMA Metro, Inquirer |
| `fetchEarthquakes(): EarthquakeFeature[]` | USGS GeoJSON API | USGS FDSNWS |
| `fetchWeather(): WeatherData[]` | Open-Meteo REST API | Open-Meteo |
| `fetchWaterLevels(): WaterLevelStation[]` | PAGASA JSON via allorigins | PAGASA FFWS |
| `fetchGDACS(): GDACSItem[]` | GDACS RSS via rss2json / allorigins | GDACS |
| `fetchTyphoons(): TyphoonData[]` | GDACS RSS (TC events) | GDACS |
| `fetchTyphoonTrack(): TyphoonTrackData` | GDACS GeoJSON API | GDACS Polygons |

### Swapping Adapters

To replace a data source (e.g., switch from Open-Meteo to a PAGASA weather API), only `feeds.ts` needs to change. The panel components consume the same `WeatherData` interface regardless of the underlying source. This is the core benefit of the hexagonal approach.

---

## Domain Types

All domain types are defined in `lib/feeds.ts` and exported for use by presentation components. Key types include:

| Type | Description | Key Fields |
|---|---|---|
| `FeedItem` | News/RSS article | title, link, pubDate, source |
| `EarthquakeFeature` | USGS earthquake event | mag, place, time, coordinates |
| `WeatherData` | City weather snapshot | city, temperature, windspeed, weathercode |
| `GDACSItem` | Disaster alert | title, eventType, severity, pubDate |
| `TyphoonData` | Active tropical cyclone | name, lat/lon, windSpeed, category, alertLevel |
| `WaterLevelStation` | River/dam water level | name, currentWL, status, alertWL/alarmWL/criticalWL |
| `TyphoonTrackData` | TC track geometry | trackLine, cone, windZones, trackPoints |

---

## Cross-Cutting Concerns

### Cache-Busting Strategy (`lib/fetchUtils.ts`)

All external API calls use cache-busting to prevent stale proxy responses. The `cacheBustUrl()` function appends a `_cb=<timestamp>` parameter. The `fetchFresh()` and `fetchViaProxy()` wrappers additionally set `cache: "no-store"` and anti-caching headers.

### Date Validation (`lib/fetchUtils.ts`)

The `isDataFresh(dateStr, maxAgeHours)` function validates that data is within an acceptable time window (default: 48 hours). This is applied at two levels: (1) in `feeds.ts` when filtering fetched items, and (2) in the `PAGASABulletinBanner` when parsing cyclone.dat to prevent stale typhoon alerts.

### Theme System (`contexts/ThemeContext.tsx` + `index.css`)

The application supports dark and light themes. Theme state is managed via React Context. CSS variables in `index.css` define semantic color tokens for both themes. Panel components use the `useTheme()` hook and apply conditional oklch colors for elements that need precise color control beyond Tailwind's semantic classes.

### Panel Composition Pattern (`PanelWrapper.tsx`)

All data panels share a common chrome provided by `PanelWrapper`. This component handles: panel title, category badge, live indicator, collapse/expand, and consistent padding/borders. Individual panels focus only on their domain-specific rendering.

---

## Data Flow

```
External API → CORS Proxy → feeds.ts (fetch + normalize) → Panel Component (useState/useEffect) → UI
                                ↓
                         fetchUtils.ts
                    (cache-bust, date validate)
```

Each panel follows the same pattern:

1. `useEffect` calls the appropriate `fetch*` function from `feeds.ts`
2. `feeds.ts` handles proxy routing, error fallback, and response parsing
3. `fetchUtils.ts` provides cache-busting and date validation
4. The panel receives normalized domain types and renders them
5. Refresh intervals (typically 5 minutes) keep data current

---

## Dependency Rule Compliance

The Clean Architecture dependency rule states that dependencies must point inward. In this project:

- **`lib/` (Domain)** has zero React dependencies. It can be tested independently.
- **`contexts/` and `hooks/` (Application)** depend on React but not on any specific panel.
- **`components/panels/` (Presentation)** depend on `lib/` and `contexts/` but never on each other.
- **`pages/` (Orchestration)** compose panels but contain no business logic.

This means a panel can be removed, replaced, or reordered without affecting any other panel or the data layer.

---

## Best Practices Applied

1. **Single Data-Access File**: All API calls consolidated in `feeds.ts` per the user's preference for streamlined deployment.
2. **Interface Segregation**: Each `fetch*` function returns a specific domain type, not raw API responses.
3. **Thin Components**: Panels delegate data fetching to `feeds.ts` and focus on rendering.
4. **Ubiquitous Language**: Types like `WaterLevelStation`, `EarthquakeFeature`, and `TyphoonData` use domain terminology consistent with PAGASA/USGS/GDACS.
5. **Fail-Safe Fetching**: Every fetch has timeout, fallback proxy, and graceful error handling.
6. **No Framework Coupling in Domain**: `lib/` files use only standard TypeScript — no React, no Tailwind, no browser APIs (except `fetch` and `DOMParser`).

---

## Future Architecture Considerations

If the project upgrades to full-stack (`web-db-user`), the architecture would extend naturally:

- `server/` would contain backend adapters (direct API calls without CORS proxies)
- `shared/` would hold domain types shared between client and server
- The client's `feeds.ts` would be replaced by tRPC calls to the server
- Push notifications and database caching would be added as new adapters

The current frontend-only architecture is designed to make this transition minimal.
