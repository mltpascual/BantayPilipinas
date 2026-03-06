# C4 Architecture — Bantay Pilipinas

## Level 1: System Context

Bantay Pilipinas is a **static frontend application** that aggregates data from multiple external systems to provide real-time Philippine disaster monitoring.

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Systems                            │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   USGS   │  │  GDACS   │  │  PAGASA  │  │   Open-Meteo     │   │
│  │ (Quakes) │  │ (Alerts) │  │(Typhoons)│  │ (Weather + AQ)   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘   │
│       │              │             │                │              │
│  ┌────┴─────┐  ┌─────┴────┐  ┌────┴─────┐          │              │
│  │ GeoJSON  │  │ RSS/XML  │  │ Raw .dat │          │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │              │
│       │              │             │                │              │
│       │         ┌────┴─────┐  ┌───┴──────┐          │              │
│       │         │rss2json  │  │allorigins│          │              │
│       │         │ (proxy)  │  │ (proxy)  │          │              │
│       │         └────┬─────┘  └───┬──────┘          │              │
│       │              │            │                 │              │
│  ┌────┴──────┐  ┌────┴────┐  ┌───┴──────┐  ┌──────┴──────┐       │
│  │ Inquirer  │  │  GMA    │  │ YouTube  │  │   Google    │       │
│  │  (News)   │  │ (News)  │  │ (Video)  │  │   Fonts     │       │
│  └────┬──────┘  └────┬────┘  └────┬─────┘  └──────┬──────┘       │
│       │              │            │                │              │
└───────┼──────────────┼────────────┼────────────────┼──────────────┘
        │              │            │                │
        ▼              ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    Bantay Pilipinas (Browser)                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Static)                        │   │
│  │                                                              │   │
│  │  Fetches data → Renders panels → Displays on map/lists      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│     Users        │
│                  │
│  - Citizens      │
│  - Responders    │
│  - OFWs          │
│  - News Watchers │
└─────────────────┘
```

### Key Relationships

| From | To | Protocol | Data |
|------|----|----------|------|
| Browser | USGS | HTTPS (REST) | Earthquake GeoJSON |
| Browser | rss2json proxy | HTTPS (REST) | GDACS alerts, News RSS |
| Browser | allorigins proxy | HTTPS (REST) | PAGASA cyclone data |
| Browser | Open-Meteo | HTTPS (REST) | Weather + Air Quality JSON |
| Browser | YouTube | HTTPS (iframe) | Live video embeds |
| Browser | Manus CDN | HTTPS | Static assets (HTML, JS, CSS) |
| Browser | Google Fonts | HTTPS | Font files |

### Why CORS Proxies?

Since this is a **client-only** application with no backend, the browser's Same-Origin Policy blocks direct requests to RSS feeds and some government data endpoints. Two CORS proxies are used:

- **rss2json.com** — Converts RSS/XML to JSON and adds CORS headers. Primary proxy for GDACS and news feeds.
- **allorigins.win** — Generic CORS proxy for raw data files. Used for PAGASA cyclone.dat and as fallback.

---

## Level 2: Container Diagram

The system has a single container: a React Single-Page Application served as static files.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Bantay Pilipinas SPA                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    App Shell                              │   │
│  │  (App.tsx → ErrorBoundary → ThemeProvider →               │   │
│  │   FreshnessProvider → TooltipProvider → Dashboard)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard   │  │   Contexts   │  │     Lib      │          │
│  │   (Layout)    │  │  (State)     │  │  (Data)      │          │
│  │               │  │              │  │              │          │
│  │ - Header      │  │ - Theme      │  │ - feeds.ts   │          │
│  │ - Grid/Tabs   │  │ - Freshness  │  │ - fetchUtils │          │
│  │ - 7 Panels    │  │              │  │ - provinces  │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Panel Components                       │   │
│  │                                                           │   │
│  │  MapPanel │ PhiVolcsPanel │ LivecamsPanel │ LivestreamPanel│  │
│  │  PHNewsPanel │ WaterLevelPanel │ WeatherAirQualityPanel   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    UI Components (shadcn/ui)              │   │
│  │  Button │ Card │ Dialog │ ScrollArea │ Tooltip │ Tabs     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Level 3: Component Diagram

### Dashboard Component (594 lines)

The central orchestrator managing layout, theme, and mobile navigation.

```
Dashboard.tsx
├── State Management
│   ├── layout (panel positions/sizes, persisted to localStorage)
│   ├── activeTab (mobile tab: home|map|news|video|alerts)
│   ├── headerHeight (dynamic, measured via ref)
│   └── maxRows (computed from viewport)
│
├── Desktop Mode (≥768px)
│   ├── Header (title, clock, theme toggle, layout controls)
│   ├── PAGASA Bulletin Banner (conditional)
│   └── GridLayout (react-grid-layout)
│       └── 7 Panel instances (drag/resize enabled)
│
├── Mobile Mode (<768px)
│   ├── Header (compact)
│   ├── PAGASA Bulletin Banner (conditional)
│   ├── Tab Content (CSS display:none switching)
│   │   ├── Home tab → All 7 panels stacked
│   │   ├── Map tab → MapPanel fullscreen
│   │   ├── News tab → PHNewsPanel fullscreen
│   │   ├── Video tab → LivestreamPanel + LivecamsPanel
│   │   └── Alerts tab → PhiVolcsPanel + WaterLevelPanel + WeatherAirQualityPanel
│   └── Bottom Nav Bar (fixed, frosted glass, 5 tabs)
│
└── Layout Persistence
    ├── Save to localStorage on change
    ├── Export as JSON file
    ├── Import from JSON file
    └── Reset to defaults
```

### MapPanel Component (1,268 lines)

The largest and most complex component. Renders an interactive map with multiple data layers.

```
MapPanel.tsx
├── Map Engine (MapLibre GL JS)
│   ├── OpenStreetMap tile layer
│   ├── Terrain/satellite toggle
│   └── Philippine bounding box focus
│
├── Data Layers (toggleable)
│   ├── USGS Earthquakes
│   │   ├── Fetch: earthquake.usgs.gov (GeoJSON)
│   │   ├── Render: Colored circle markers (magnitude-based)
│   │   └── Popup: Magnitude, depth, location, time
│   │
│   ├── GDACS Alerts
│   │   ├── Fetch: gdacs.org/xml/rss.xml (via rss2json)
│   │   ├── Filter: Philippines bounding box
│   │   ├── Render: Pulsing markers (severity-colored)
│   │   └── Popup: Event type, severity, description
│   │
│   ├── PAGASA Typhoon Tracks
│   │   ├── Fetch: pagasa.dost.gov.ph/cyclone.dat (via allorigins)
│   │   ├── Parse: Custom .dat format parser
│   │   ├── Render: Polyline track + position markers
│   │   └── Popup: Storm name, category, wind speed
│   │
│   └── Province Search
│       ├── Data: lib/provinces.ts (PSA data)
│       └── Action: Fly-to animation on selection
│
├── Layer Controls
│   ├── Toggle buttons for each data layer
│   ├── Layer count badges
│   └── Map style switcher
│
└── Auto-Refresh
    ├── USGS: Every 2 minutes
    ├── GDACS: Every 5 minutes
    └── PAGASA: Every 10 minutes
```

### Data Flow Architecture

```
External API → fetch() → JSON parse → React state → Render

Specific flows:
1. USGS → fetch(GeoJSON) → setUsgsQuakes → MapLibre markers
2. GDACS → rss2json proxy → fetch(JSON) → setGdacsAlerts → MapLibre markers
3. PAGASA → allorigins proxy → fetch(text) → parse cyclone.dat → setTyphoonTracks → MapLibre polylines
4. Open-Meteo → fetch(JSON) → setWeatherData → WeatherAirQualityPanel cards
5. News RSS → rss2json proxy → fetch(JSON) → setArticles → PHNewsPanel list
6. YouTube → iframe embed URL → LivestreamPanel/LivecamsPanel iframes
```

---

## Level 4: Code-Level Details

### Key Abstractions

| Abstraction | File | Purpose |
|-------------|------|---------|
| `PanelConfig` | Dashboard.tsx | Panel registration (id, title, icon, component, layout) |
| `TabConfig` | Dashboard.tsx | Mobile tab definition (id, label, icon renderer) |
| `FreshnessContext` | contexts/FreshnessContext.tsx | Centralized data age tracking across panels |
| `ThemeContext` | contexts/ThemeContext.tsx | Dark/light theme state with localStorage persistence |
| `feeds.ts` | lib/feeds.ts | RSS feed URLs and fetch helpers with proxy fallback |
| `fetchUtils.ts` | lib/fetchUtils.ts | Date validation, cache-busting, freshness checks |
| `provinces.ts` | lib/provinces.ts | Philippine province/city data for map search |

### State Management Pattern

No external state library. All state is managed via:

1. **React useState** — Component-local state (panel data, UI toggles).
2. **React Context** — Cross-component state (theme, data freshness).
3. **localStorage** — Persistence (layout, theme preference, active tab).
4. **URL** — No URL-based state (single-page, no routing beyond `/`).

### Error Handling Pattern

```
App.tsx
└── ErrorBoundary (catches render errors, shows fallback UI)
    └── Each panel: try-catch in useEffect for fetch errors
        └── Panel-level error state → "Failed to load" message
        └── Toast notification via sonner for transient errors
```

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| **Theming** | CSS variables + ThemeContext + `.dark`/`.light` class toggle |
| **Responsiveness** | `useIsMobile()` hook (768px breakpoint) + Tailwind responsive classes |
| **Data freshness** | FreshnessContext tracks last-update timestamps per source |
| **Error recovery** | ErrorBoundary at app level + per-panel error states |
| **Performance** | CSS display:none for mobile tabs (prevents remounting) |
| **Accessibility** | Semantic HTML, ARIA labels, focus management, contrast ratios |

---

*Generated via bottom-up codebase analysis on March 6, 2026*
*Source: 82 TypeScript/TSX files, ~5,800 lines of application code*
