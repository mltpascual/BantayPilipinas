# Product — Bantay Pilipinas (PH Mission Control)

## One-Line Description

Real-time Philippine disaster monitoring and situational awareness dashboard aggregating earthquake, typhoon, weather, flood, and news data into a single operations-center-style interface.

## Problem Statement

The Philippines is one of the most disaster-prone countries in the world, experiencing an average of 20 typhoons per year, frequent earthquakes (sitting on the Pacific Ring of Fire), volcanic eruptions, and flooding. Critical information is scattered across multiple government agencies (PAGASA, PhiVolcs, DOST), international organizations (USGS, GDACS), and news outlets. During emergencies, citizens, responders, and officials must manually check 5-10 different websites to build a complete situational picture.

## Solution Approach

Bantay Pilipinas consolidates all Philippine disaster-related data sources into a single, real-time dashboard with an interactive map as the centerpiece. Users see earthquakes, typhoon tracks, GDACS alerts, volcano monitoring, water levels, weather conditions, air quality, and breaking news — all in one view. The interface follows an "ops center" aesthetic designed for continuous monitoring.

## Target Users

| Persona | Description | Primary Need |
|---------|-------------|-------------|
| **Concerned Citizen** | Filipino residents monitoring conditions in their area | Quick situational awareness during weather events |
| **Emergency Responder** | LGU disaster risk reduction officers, BFP, PNP | Real-time multi-source data for decision-making |
| **News Watcher** | People following breaking Philippine news | Aggregated news feeds with disaster context |
| **Overseas Filipino** | OFWs monitoring conditions back home | Remote situational awareness for family safety |

## Core Features (Implemented)

| Feature | Panel | Data Source | Status |
|---------|-------|------------|--------|
| Interactive hazard map | MapPanel | USGS, GDACS, PAGASA cyclone.dat | Live |
| Earthquake monitoring | MapPanel + PhiVolcsPanel | USGS FDSNWS API, PhiVolcs RSS | Live |
| Typhoon tracking | MapPanel | PAGASA cyclone.dat | Live |
| GDACS disaster alerts | MapPanel + PhiVolcsPanel | GDACS RSS | Live |
| Volcano live cameras | LivecamsPanel | YouTube embeds | Live |
| Live news streams | LivestreamPanel | YouTube live embeds | Live |
| Philippine news aggregation | PHNewsPanel | Inquirer, GMA RSS feeds | Live |
| Water level monitoring | WaterLevelPanel | PAGASA water level data | Live |
| Weather and air quality | WeatherAirQualityPanel | Open-Meteo API | Live |
| PAGASA bulletin banner | PAGASABulletinBanner | PAGASA RSS | Live |
| Draggable/resizable layout | Dashboard | react-grid-layout | Live |
| Layout export/import | Dashboard | localStorage + JSON | Live |
| Mobile bottom navigation | Dashboard | N/A | Live |
| Dark/light theme | ThemeContext | N/A | Live |
| Data freshness indicators | FreshnessContext | N/A | Live |

## Success Metrics

- **Load time:** Dashboard fully interactive within 5 seconds on 4G connection.
- **Data freshness:** All panels refresh within 5-minute intervals; freshness indicators show green.
- **Mobile usability:** All critical data accessible via 5-tab bottom navigation on mobile.
- **Uptime:** Static frontend available 99.9% (dependent on hosting provider).

## Product Roadmap (High-Level)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Core dashboard with all panels | Done |
| P0 | Mobile responsive with bottom nav | Done |
| P1 | Notification badges on Alerts tab | Planned |
| P1 | Swipe gesture between mobile tabs | Planned |
| P1 | Persist active tab to localStorage | Planned |
| P2 | Push notifications for high-magnitude earthquakes | Planned |
| P2 | Historical timeline view for past events | Planned |
| P2 | Panel visibility toggle from header | Planned |
| P3 | Offline mode with service worker caching | Planned |
| P3 | Multi-language support (Filipino/English) | Planned |

*Last updated: March 6, 2026*
