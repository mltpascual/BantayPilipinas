# Tech Stack — Bantay Pilipinas

## Architecture

**Type:** Static frontend (client-only). No backend server. All data fetched directly from public APIs and RSS feeds via CORS proxies.

**Hosting:** Manus platform with built-in CDN. Custom domain support available.

## Primary Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 19.2 | Component-based UI with hooks |
| **Language** | TypeScript | 5.6 | Type safety across the codebase |
| **CSS Framework** | Tailwind CSS | 4.1 | Utility-first styling with oklch colors |
| **Component Library** | shadcn/ui | Latest | Pre-built accessible UI primitives |
| **Build Tool** | Vite | 7.1 | Fast HMR and optimized production builds |
| **Package Manager** | pnpm | 10.x | Fast, disk-efficient dependency management |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-grid-layout` | 2.2 | Draggable/resizable dashboard grid (desktop) |
| `maplibre-gl` | 5.19 | Interactive map rendering (OpenStreetMap tiles) |
| `framer-motion` | 12.x | Entrance animations and transitions |
| `wouter` | 3.3 | Lightweight client-side routing |
| `recharts` | 2.15 | Chart rendering for data visualization |
| `lucide-react` | 0.453 | SVG icon library |
| `sonner` | 2.0 | Toast notification system |
| `axios` | 1.12 | HTTP client for API requests |
| `next-themes` | 0.4 | Theme management (dark/light) |
| `zod` | 4.1 | Runtime schema validation |

## External Data Sources

| Source | API/Protocol | Endpoint | Data |
|--------|-------------|----------|------|
| **USGS** | REST (GeoJSON) | `earthquake.usgs.gov/fdsnws/event/1/query` | Earthquakes (PH bounding box) |
| **GDACS** | RSS (XML via proxy) | `www.gdacs.org/xml/rss.xml` | Global disaster alerts |
| **PAGASA** | Raw data file | `pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat` | Typhoon track data |
| **Open-Meteo** | REST (JSON) | `api.open-meteo.com/v1/forecast` | Weather forecasts |
| **Open-Meteo AQ** | REST (JSON) | `air-quality-api.open-meteo.com/v1/air-quality` | Air quality index |
| **Inquirer** | RSS (XML) | `newsinfo.inquirer.net/category/latest-stories/feed` | Philippine news |
| **GMA** | RSS (XML) | `data.gmanetwork.com/gno/rss/news/metro/feed.xml` | Metro Manila news |
| **YouTube** | Embed (iframe) | `youtube.com/embed/live_stream` | Live news streams, volcano cams |

## CORS Proxies

Since this is a client-only app, RSS feeds require CORS proxies:

| Proxy | Usage | Fallback |
|-------|-------|----------|
| `api.rss2json.com` | Primary RSS-to-JSON converter | allorigins |
| `api.allorigins.win` | CORS proxy for raw data | N/A |

## Development Tools

| Tool | Purpose |
|------|---------|
| TypeScript strict mode | Type checking |
| Vite HMR | Hot module replacement during development |
| Prettier | Code formatting |
| Vitest | Unit/component testing framework |

## Infrastructure

- **Deployment:** Static files served via Manus CDN
- **Domain:** `phmission-bv7kxrqp.manus.space` (auto-generated, customizable)
- **SSL:** Automatic HTTPS via platform
- **CI/CD:** Manual checkpoint + publish via Manus UI

## Fonts

| Font | Source | Usage |
|------|--------|-------|
| Space Grotesk | Google Fonts CDN | Display headings, panel titles |
| IBM Plex Sans | Google Fonts CDN | Body text, data labels |
| System monospace | System | Numeric data, timestamps |

*Last updated: March 6, 2026*
