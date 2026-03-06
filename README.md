# Bantay Pilipinas (PH Mission Control)

Real-time Philippine disaster monitoring and situational awareness dashboard. Aggregates earthquake, typhoon, weather, flood, and news data from USGS, GDACS, PAGASA, Open-Meteo, and Philippine news outlets into a single operations-center-style interface.

**Live:** [phmission-bv7kxrqp.manus.space](https://phmission-bv7kxrqp.manus.space)
**Repository:** [github.com/mltpascual/BantayPilipinas](https://github.com/mltpascual/BantayPilipinas)

---

## Features

| Feature | Description |
|---------|-------------|
| **Interactive Hazard Map** | MapLibre GL map with USGS earthquake markers, GDACS disaster alerts, and PAGASA typhoon tracks — all filterable by layer |
| **Earthquake Monitoring** | Real-time earthquake data from USGS (Philippine bounding box) with magnitude-colored markers and PhiVolcs alert feed |
| **Typhoon Tracking** | PAGASA cyclone.dat parser renders active typhoon tracks with position markers and storm details |
| **GDACS Alerts** | Global Disaster Alert and Coordination System alerts filtered to the Philippines with severity-based pulsing markers |
| **Volcano Cameras** | Live YouTube embeds of Philippine volcano monitoring cameras |
| **Live News Streams** | YouTube live stream embeds from major Philippine news networks |
| **News Aggregation** | RSS feeds from Inquirer and GMA Network with article previews |
| **Water Level Monitoring** | PAGASA water level data for major Philippine rivers and waterways |
| **Weather and Air Quality** | Open-Meteo weather forecasts and air quality index for Philippine cities |
| **Draggable Layout** | Desktop: 12-column react-grid-layout with drag, resize, export/import, and reset |
| **Mobile Navigation** | iOS-style bottom tab bar with 5 tabs (Home, Map, News, Video, Alerts) |
| **Dark/Light Theme** | Full theme support with oklch color system and Philippine flag accent colors |
| **Data Freshness** | Color-coded indicators showing how fresh each data source is (green/yellow/orange/red) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.6 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Map | MapLibre GL JS 5.19 |
| Layout | react-grid-layout 2.2 |
| Build | Vite 7.1 |
| Package Manager | pnpm |

Full dependency list and rationale: [conductor/tech-stack.md](./conductor/tech-stack.md)

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+

### Install and Run

```bash
# Clone the repository
git clone https://github.com/mltpascual/BantayPilipinas.git
cd BantayPilipinas

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The dashboard will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm run build
```

Output is in `dist/` — static files ready for any CDN or static hosting provider.

---

## Project Structure

```
ph-mission-control/
├── client/
│   ├── index.html                    # Entry HTML with Google Fonts
│   ├── public/                       # favicon, robots.txt only
│   └── src/
│       ├── App.tsx                   # Root component (providers + dashboard)
│       ├── main.tsx                  # React entry point
│       ├── index.css                 # Global styles, theme variables, Tailwind config
│       ├── pages/
│       │   └── Dashboard.tsx         # Main dashboard (grid layout + mobile tabs)
│       ├── components/
│       │   ├── panels/              # 11 dashboard panel components
│       │   │   ├── MapPanel.tsx      # Interactive hazard map (1,268 lines)
│       │   │   ├── PhiVolcsPanel.tsx # Earthquake + GDACS alerts list
│       │   │   ├── LivecamsPanel.tsx # Volcano camera embeds
│       │   │   ├── LivestreamPanel.tsx # Live news stream embeds
│       │   │   ├── PHNewsPanel.tsx   # Aggregated PH news feed
│       │   │   ├── WaterLevelPanel.tsx # Water level monitoring
│       │   │   ├── WeatherAirQualityPanel.tsx # Weather + AQ data
│       │   │   └── ...              # Additional panels
│       │   ├── ui/                  # shadcn/ui components
│       │   ├── ErrorBoundary.tsx    # App-level error boundary
│       │   ├── PAGASABulletinBanner.tsx # PAGASA weather bulletin
│       │   └── PanelWrapper.tsx     # Shared panel chrome
│       ├── contexts/
│       │   ├── ThemeContext.tsx      # Dark/light theme provider
│       │   └── FreshnessContext.tsx  # Data age tracking provider
│       ├── hooks/
│       │   ├── useMobile.tsx        # Mobile breakpoint detection
│       │   ├── useComposition.ts    # Input composition handling
│       │   └── usePersistFn.ts      # Stable callback reference
│       └── lib/
│           ├── feeds.ts             # RSS feed URLs and fetch helpers
│           ├── fetchUtils.ts        # Date validation, cache-busting
│           ├── provinces.ts         # Philippine province/city data
│           └── utils.ts             # General utilities
├── conductor/                       # Project context artifacts
│   ├── index.md                     # Navigation hub
│   ├── product.md                   # Product vision and goals
│   ├── product-guidelines.md        # Brand voice and terminology
│   ├── tech-stack.md                # Technology choices
│   └── workflow.md                  # Development practices
├── C4-Documentation/
│   └── c4-context.md                # C4 architecture (all 4 levels)
├── DESIGN.md                        # Visual design system
├── DEVELOPMENT_GUIDELINES.md        # Coding standards and best practices
└── README.md                        # This file
```

---

## Data Sources

All data is fetched client-side from public APIs. No API keys required.

| Source | Endpoint | Data | Refresh |
|--------|----------|------|---------|
| USGS | `earthquake.usgs.gov/fdsnws/event/1/query` | Earthquakes (PH region) | 2 min |
| GDACS | `www.gdacs.org/xml/rss.xml` (via rss2json) | Disaster alerts | 5 min |
| PAGASA | `pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat` (via allorigins) | Typhoon tracks | 10 min |
| Open-Meteo | `api.open-meteo.com/v1/forecast` | Weather forecasts | 15 min |
| Open-Meteo AQ | `air-quality-api.open-meteo.com/v1/air-quality` | Air quality index | 15 min |
| Inquirer | `newsinfo.inquirer.net/category/latest-stories/feed` (via rss2json) | PH news | 5 min |
| GMA | `data.gmanetwork.com/gno/rss/news/metro/feed.xml` (via rss2json) | Metro news | 5 min |
| YouTube | `youtube.com/embed/live_stream` | Live video | Real-time |

### CORS Proxies

Since this is a client-only app, two CORS proxies are used for RSS/XML feeds:

- **rss2json.com** — Primary RSS-to-JSON converter with CORS headers
- **allorigins.win** — Generic CORS proxy for raw data files (fallback)

---

## Architecture

The application follows a simple **fetch → state → render** pattern with no backend:

```
External APIs → fetch() → React state (useState) → Component render
                                    ↕
                    React Context (theme, freshness)
                                    ↕
                         localStorage (layout, preferences)
```

Full C4 architecture documentation: [C4-Documentation/c4-context.md](./C4-Documentation/c4-context.md)

---

## Design System

The dashboard uses an **"Ops Center Noir"** aesthetic with:

- **Colors:** oklch color space, dark navy default, Philippine flag accents (blue/red/yellow)
- **Typography:** Space Grotesk (display) + IBM Plex Sans (body) + JetBrains Mono (data)
- **Layout:** 12-column grid on desktop, 5-tab bottom nav on mobile

Full design system: [DESIGN.md](./DESIGN.md)

---

## Development

### Coding Standards

See [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) for:

- UI/UX and frontend design rules
- Code quality and clean code practices
- Security guidelines for client-side apps
- Testing strategy and TDD workflow

### Verification Commands

```bash
# TypeScript check (must pass with zero errors)
npx tsc --noEmit

# Production build (must succeed)
pnpm run build
```

### Product Context

See [conductor/product.md](./conductor/product.md) for product vision, target users, feature list, and roadmap.

---

## Deployment

The application is deployed as static files via the Manus platform:

1. Create a checkpoint in the Manus UI
2. Click "Publish" to deploy to the CDN
3. Custom domains can be configured in Settings > Domains

The production build output (`dist/`) can also be deployed to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

---

## License

Private repository. All rights reserved.

---

*Last updated: March 6, 2026*
