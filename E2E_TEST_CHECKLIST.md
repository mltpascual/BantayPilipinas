# Bantay Pilipinas — End-to-End Test Checklist

**Project:** ph-mission-control (Bantay Pilipinas)
**Date:** March 8, 2026
**Author:** Manus AI

---

## Important Note on Roles

The current codebase is a **static frontend application with no authentication or role-based access control**. There are no Citizen, Admin, or Super Admin roles implemented — all users see the same dashboard. The features below are organized by **functional area** instead, with a note at the end about what role-based features would need to be built.

---

## 1. Application Shell & Global Features

These tests cover the top-level layout, header, theming, and error handling that affect every user.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.1 | App loads without errors | Navigate to root URL | Dashboard renders with header, panels, no console errors | ☐ |
| 1.2 | ErrorBoundary catches crashes | Force a component error | Fallback UI shown instead of white screen | ☐ |
| 1.3 | PHT clock displays correctly | Observe header clock | Shows current Philippine time (HH:MM:SS), date, "PHT" label | ☐ |
| 1.4 | Theme toggle (Light → Dark) | Click moon/sun icon in header | All panels, header, borders switch to dark theme | ☐ |
| 1.5 | Theme toggle (Dark → Light) | Click sun/moon icon again | All panels revert to light theme | ☐ |
| 1.6 | Theme persists on reload | Toggle to dark, refresh page | Dark theme is retained after reload | ☐ |
| 1.7 | "ONLINE" status indicator | Check header right side | Green dot + "ONLINE" text visible | ☐ |
| 1.8 | Version label visible | Check header near brand | "v1.0" text visible on desktop | ☐ |
| 1.9 | Favicon loads | Check browser tab | Custom PH favicon (blue/red/yellow) appears | ☐ |

---

## 2. PAGASA Tropical Cyclone Bulletin Banner

The top-most alert banner that appears when there is an active tropical cyclone, M5+ earthquake, or critical water level.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.1 | Banner hidden when no alerts | Load page with no active cyclone/M5+ EQ/critical WL | No red/orange banner at top | ☐ |
| 2.2 | Typhoon alert shows | Load when PAGASA cyclone.dat has active cyclone | Red banner with typhoon name, signal number, affected areas | ☐ |
| 2.3 | M5+ earthquake alert shows | Load when USGS reports M5+ quake near PH | Orange/red banner with earthquake details | ☐ |
| 2.4 | Critical water level alert shows | Load when La Mesa Dam or other station is CRITICAL | Red banner with station name and water level | ☐ |
| 2.5 | Banner dismiss (X button) | Click the X button on the banner | Banner closes, does not reappear until new data | ☐ |
| 2.6 | Date validation (48h) | Check with stale cyclone.dat (>48h old) | Banner does NOT show stale typhoon data | ☐ |
| 2.7 | Multiple alerts stacking | Trigger multiple alert types simultaneously | Multiple banners stack vertically | ☐ |

---

## 3. Desktop Layout — Grid System (react-grid-layout)

Panel arrangement, drag-and-drop, resize, and layout management on desktop viewports.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.1 | Default 7-panel layout loads | Open on desktop (>768px) | 7 panels: Map (7col), PhiVolcs (2col), Volcano Cams (3col) top row; PH News, Water Levels, Weather & AQ, Livestream bottom row | ☐ |
| 3.2 | Grid fits viewport (no overflow) | Load on 1920x1080 screen | All panels visible without scrolling or zooming out | ☐ |
| 3.3 | Grid fits viewport (smaller screen) | Load on 1366x768 screen | All panels visible, row height dynamically adjusted | ☐ |
| 3.4 | Drag panel to new position | Drag Map panel header to a different grid position | Panel moves, other panels reflow | ☐ |
| 3.5 | Resize panel (SE corner) | Drag SE resize handle of any panel | Panel grows/shrinks, respects minW/minH constraints | ☐ |
| 3.6 | Resize panel (all corners) | Drag NE, NW, SW resize handles | Panel resizes from all four corners | ☐ |
| 3.7 | Download layout as JSON | Click download icon in header | JSON file downloads with current panel positions | ☐ |
| 3.8 | Import layout from JSON | Click import icon, select a valid JSON file | Panels rearrange to match imported layout | ☐ |
| 3.9 | Import invalid JSON | Click import, select invalid file | Alert message "Invalid layout file" shown | ☐ |
| 3.10 | Reset layout to default | Click reset icon in header | All panels return to default 7-panel arrangement | ☐ |
| 3.11 | Panel maximize button | Click maximize icon on any panel header | Panel expands (behavior depends on implementation) | ☐ |
| 3.12 | Layout controls hidden on mobile | Open on mobile viewport | Download/Import/Reset buttons not visible | ☐ |

---

## 4. Mobile Bottom Navigation

iOS-style tab bar with 5 tabs for mobile viewports (<768px).

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.1 | Bottom nav visible on mobile | Open on mobile viewport | 5-tab bar at bottom: Home, Map, News, Video, Alerts | ☐ |
| 4.2 | Bottom nav hidden on desktop | Open on desktop viewport | No bottom navigation bar visible | ☐ |
| 4.3 | Home tab (default) | Load on mobile | All 7 panels stacked vertically, Home tab active (red) | ☐ |
| 4.4 | Map tab | Tap Map tab | Full-screen MapPanel shown, other panels hidden | ☐ |
| 4.5 | News tab | Tap News tab | Full-screen PHNewsPanel shown | ☐ |
| 4.6 | Video tab | Tap Video tab | LivecamsPanel + LivestreamPanel shown | ☐ |
| 4.7 | Alerts tab | Tap Alerts tab | PhiVolcsPanel + WaterLevelPanel + WeatherAirQualityPanel shown | ☐ |
| 4.8 | Tab switch preserves state | Switch Map → News → Map | Map panel retains zoom level, markers (no remount) | ☐ |
| 4.9 | Active tab icon styling | Tap each tab | Active tab: red filled icon + red label; inactive: gray outlined | ☐ |
| 4.10 | Frosted glass background | Observe nav bar | Backdrop blur effect visible behind the nav bar | ☐ |
| 4.11 | Safe area spacing | Test on iPhone with notch/home indicator | Content not obscured by device safe areas | ☐ |

---

## 5. MapPanel — Interactive Map

The primary map with earthquake markers, water levels, hazard overlays, location search, and quick zoom presets.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| **5A. Base Map** | | | | |
| 5.1 | Map renders with tiles | Load dashboard | MapLibre GL map loads with CARTO tiles, centered on Philippines | ☐ |
| 5.2 | Map zoom in/out | Use scroll wheel or +/- buttons | Map zooms smoothly | ☐ |
| 5.3 | Map pan/drag | Click and drag the map | Map pans to new area | ☐ |
| **5B. Quick Zoom Presets (4x2 grid)** | | | | |
| 5.4 | Presets display as 4x2 grid | Observe top-right of map | 8 buttons in 4-column, 2-row grid layout | ☐ |
| 5.5 | Philippines preset | Click "Philippines" | Map zooms to full PH view | ☐ |
| 5.6 | Metro Manila preset | Click "Metro Manila" | Map zooms to NCR area | ☐ |
| 5.7 | Cebu preset | Click "Cebu" | Map zooms to Cebu area | ☐ |
| 5.8 | Davao preset | Click "Davao" | Map zooms to Davao area | ☐ |
| 5.9 | Tacloban preset | Click "Tacloban" | Map zooms to Tacloban area | ☐ |
| 5.10 | Bicol preset | Click "Bicol" | Map zooms to Bicol region | ☐ |
| 5.11 | Cagayan preset | Click "Cagayan" | Map zooms to Cagayan Valley | ☐ |
| 5.12 | Zamboanga preset | Click "Zamboanga" | Map zooms to Zamboanga area | ☐ |
| 5.13 | Active preset highlight | Click any preset | Clicked button turns blue (#0038A8), others gray | ☐ |
| **5C. Location Search** | | | | |
| 5.14 | Search bar visible | Observe top-left of map | Search input with magnifying glass icon | ☐ |
| 5.15 | Search for province | Type "Cebu" in search | Dropdown shows matching provinces/cities | ☐ |
| 5.16 | Select search result | Click a result from dropdown | Map flies to that location, hazard layers auto-enable | ☐ |
| 5.17 | Search clear | Clear the search input | Dropdown closes | ☐ |
| **5D. Layer Controls** | | | | |
| 5.18 | Layers button visible | Observe bottom-left of map | "LAYERS" button with layer icon | ☐ |
| 5.19 | Open layers panel | Click "LAYERS" button | Panel opens upward showing 11 layer toggles | ☐ |
| 5.20 | Toggle Alerts (GDACS) | Toggle GDACS layer on/off | GDACS alert markers appear/disappear on map | ☐ |
| 5.21 | Toggle Earthquakes (USGS) | Toggle USGS layer on/off | Earthquake circle markers appear/disappear | ☐ |
| 5.22 | Toggle Typhoon Track | Toggle typhoon track on/off | Typhoon path polyline + markers appear/disappear | ☐ |
| 5.23 | Toggle Water Levels | Toggle water levels on/off | Water drop SVG markers appear/disappear | ☐ |
| 5.24 | Toggle Flood Risk Zones | Toggle flood layer on | GeoJSON flood zones load and render (loading spinner shown) | ☐ |
| 5.25 | Toggle Landslide Risk Zones | Toggle landslide layer on | GeoJSON landslide zones load and render | ☐ |
| 5.26 | Toggle Storm Surge Risk Zones | Toggle storm surge layer on | GeoJSON storm surge zones load and render | ☐ |
| 5.27 | Toggle Volcano Hazard Zones | Toggle volcano layer on | GeoJSON volcano PDZ/EDZ zones load and render | ☐ |
| 5.28 | Toggle Hospitals | Toggle hospitals layer on | Hospital markers appear on map | ☐ |
| 5.29 | Toggle Schools | Toggle schools layer on | School markers appear on map | ☐ |
| 5.30 | Toggle Evacuation Centers | Toggle evac layer on | Evacuation center markers appear on map | ☐ |
| 5.31 | Layer loading spinner | Enable a heavy GeoJSON layer (flood/landslide) | Spinner icon shown while loading, replaced by check when done | ☐ |
| **5E. Map Markers & Popups** | | | | |
| 5.32 | Earthquake markers visible | Default load (USGS enabled) | Yellow/orange circle markers on recent earthquake locations | ☐ |
| 5.33 | Earthquake popup | Click an earthquake marker | Popup with magnitude, location, depth, time | ☐ |
| 5.34 | Water level markers | Default load (water levels enabled) | Water drop SVG icons at PAGASA FFWS stations | ☐ |
| 5.35 | Water level popup | Click a water level marker | Popup with station name, level, status (Normal/Alert/Critical) | ☐ |
| 5.36 | GDACS alert markers | Default load (GDACS enabled) | Alert markers for active GDACS events | ☐ |
| **5F. Map Alert Banner** | | | | |
| 5.37 | Critical water level banner | When a station is CRITICAL | Red banner at top of map: "La Mesa Dam — CRITICAL (79.84m)" | ☐ |
| 5.38 | Dismiss alert banner | Click X on the alert banner | Banner dismissed for that alert | ☐ |
| **5G. Attribution** | | | | |
| 5.39 | Attribution visible | Observe bottom-right of map | "CARTO / OpenStreetMap" and data source credits | ☐ |

---

## 6. PhiVolcs / Disasters Panel

Earthquake list from USGS + GDACS disaster alerts with tab switching.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.1 | Earthquakes tab (default) | Load panel | List of recent earthquakes with magnitude, location, time | ☐ |
| 6.2 | Earthquake count badge | Observe tab | "Earthquakes (N)" shows correct count | ☐ |
| 6.3 | Magnitude color coding | Observe earthquake list | Strong (5+) = red, Moderate (4-5) = orange, Light (<4) = yellow | ☐ |
| 6.4 | GDACS Alerts tab | Click "GDACS Alerts" tab | Shows active GDACS disaster alerts for PH region | ☐ |
| 6.5 | GDACS count badge | Observe tab | "GDACS Alerts (N)" shows correct count | ☐ |
| 6.6 | Empty GDACS state | When no active alerts | "No active GDACS alerts for PH region" message | ☐ |
| 6.7 | Loading state | On initial fetch | Loading spinner/skeleton shown | ☐ |
| 6.8 | Data freshness indicator | Observe panel header area | Green/yellow/orange/red dot with "Xm ago" timestamp | ☐ |

---

## 7. Volcano Cams Panel

Live volcano streams from afarTV YouTube with alert level badges.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.1 | Default volcano selected | Load panel | First volcano (Bulusan) selected, embed loads | ☐ |
| 7.2 | Switch to Kanlaon | Click "Kanlaon" button | Kanlaon stream loads in iframe | ☐ |
| 7.3 | Switch to Mayon | Click "Mayon" button | Mayon stream loads (or "Watch on YouTube" if embed disabled) | ☐ |
| 7.4 | Alert level badges | Observe volcano buttons | Alert level badges (L1, L2, L3) with color coding | ☐ |
| 7.5 | Active volcano highlight | Click each button | Selected button has white background, others transparent | ☐ |
| 7.6 | YouTube embed loads | Select any volcano | YouTube iframe loads without errors | ☐ |
| 7.7 | Source attribution | Below the embed | "Source: afarTV YouTube" text visible | ☐ |

---

## 8. PH News Panel (RSS Aggregator)

Aggregates news from 13 Philippine outlets with category and source filters.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.1 | News loads from 13 sources | Wait for initial fetch | News items appear with source badges | ☐ |
| 8.2 | "All" filter (default) | Observe filter bar | "All (N)" button active, shows all today's news | ☐ |
| 8.3 | "National" category filter | Click "National" | Only national news outlets shown | ☐ |
| 8.4 | "Business" category filter | Click "Business" | Only business news outlets shown | ☐ |
| 8.5 | "Regional" category filter | Click "Regional" | Only regional news outlets shown | ☐ |
| 8.6 | Source picker dropdown | Click "Source ▼" | Dropdown shows all 13 outlets grouped by category with counts | ☐ |
| 8.7 | Filter by specific source | Select "Rappler" from source picker | Only Rappler articles shown | ☐ |
| 8.8 | News item click | Click a news headline | Opens article in new tab (external link) | ☐ |
| 8.9 | Source badge colors | Observe news items | Each outlet has a distinct color badge | ☐ |
| 8.10 | Today's news only | Check article dates | Only articles from today (PHT) are shown | ☐ |
| 8.11 | Loading state | On initial fetch | "LOADING — Fetching from 13 outlets..." message | ☐ |
| 8.12 | Empty state | If no news today | Appropriate empty message shown | ☐ |

---

## 9. Water Levels Panel

Real-time PAGASA FFWS water level monitoring with status color coding.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.1 | Stations load | Wait for fetch | List of water level stations with readings | ☐ |
| 9.2 | Status color coding | Observe station list | Blue=Normal, Yellow=Alert, Orange=Alarm, Red=Critical | ☐ |
| 9.3 | Alert count in header | Observe panel header | "N alert" count for non-normal stations | ☐ |
| 9.4 | Status filter buttons | Observe filter row | Normal/Alert/Alarm/Critical buttons with counts | ☐ |
| 9.5 | Station elevation display | Observe each station row | Water level in meters + "EL.m" suffix | ☐ |
| 9.6 | DAM badge | Observe dam stations | "DAM" badge next to dam station names | ☐ |
| 9.7 | Critical/Alert/Alarm thresholds | Observe expandable details | Threshold values shown when available | ☐ |
| 9.8 | Source attribution | Bottom of panel | "Source: PAGASA Flood Forecasting & Warning System (FFWS)" link | ☐ |
| 9.9 | Data freshness (48h filter) | Check station data | Only stations with data within 48 hours shown | ☐ |

---

## 10. Weather & Air Quality Panel

Unified weather + AQI for 6 Philippine cities with expandable pollutant details.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.1 | Cities load | Wait for fetch | Manila, Cebu, Davao, Baguio, Tacloban + more shown | ☐ |
| 10.2 | Temperature display | Observe each city row | Current temperature in °C | ☐ |
| 10.3 | Weather icon | Observe each city row | Appropriate weather emoji (☀️, ⛅, 🌧️, etc.) | ☐ |
| 10.4 | Weather description | Observe each city row | "Partly cloudy", "Clear sky", "Foggy", etc. | ☐ |
| 10.5 | Wind speed & direction | Observe each city row | Wind in km/h with direction arrow | ☐ |
| 10.6 | AQI badge | Observe each city row | AQI number with color-coded badge (Good/Moderate/etc.) | ☐ |
| 10.7 | PM2.5 and PM10 values | Observe each city row | PM2.5 and PM10 readings with color coding | ☐ |
| 10.8 | UV index | Observe each city row | UV value with label | ☐ |
| 10.9 | Expand city details | Click/tap a city row | Expanded view shows full pollutant breakdown | ☐ |
| 10.10 | Collapse city details | Click/tap expanded city | Row collapses back to summary | ☐ |
| 10.11 | Only one city expanded | Expand Manila, then Cebu | Manila collapses, Cebu expands | ☐ |

---

## 11. Livestream Panel

Live PH news network streams via YouTube channel embeds.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.1 | Default channel loads | Load panel | First channel (CNN PH) selected, YouTube embed loads | ☐ |
| 11.2 | Switch channels | Click ANC, GMA, ABS-CBN, PTV, ONE News, Net25 | Each channel's live stream embed loads | ☐ |
| 11.3 | Active channel highlight | Click a channel tab | Active tab has blue background, others default | ☐ |
| 11.4 | "LIVE" badge | Observe panel header | Red "LIVE" badge with pulse animation | ☐ |
| 11.5 | YouTube embed plays | Select any channel | Video iframe loads (may show "unavailable" if channel offline) | ☐ |
| 11.6 | Channel unavailable state | Select offline channel | "This video is unavailable" message from YouTube | ☐ |
| 11.7 | Attribution text | Below embed | "YouTube Live — streams auto-detect" text | ☐ |

---

## 12. Data Freshness System

Cross-cutting feature that tracks data age across all panels.

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 12.1 | Fresh indicator (< 5 min) | Immediately after data fetch | Green dot + "just now" or "Xm ago" | ☐ |
| 12.2 | Aging indicator (5-15 min) | Wait 5+ minutes | Yellow dot + "Xm ago" | ☐ |
| 12.3 | Stale indicator (15-30 min) | Wait 15+ minutes | Orange dot + "Xm ago" | ☐ |
| 12.4 | Very stale indicator (> 30 min) | Wait 30+ minutes | Red dot + warning icon + "Xm ago" | ☐ |
| 12.5 | Auto-refresh updates | Wait for data refresh cycle | Timestamp resets to green after fresh data arrives | ☐ |

---

## 13. Responsive Design & Cross-Browser

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 13.1 | Desktop (1920x1080) | Open on full HD | Grid layout, all 7 panels visible, no overflow | ☐ |
| 13.2 | Desktop (1366x768) | Open on laptop screen | Grid scales, dynamic row height, all panels visible | ☐ |
| 13.3 | Tablet (768x1024) | Open on iPad | Layout adapts (may show grid or mobile view) | ☐ |
| 13.4 | Mobile (375x812) | Open on iPhone | Mobile layout with bottom nav, stacked panels | ☐ |
| 13.5 | Mobile (360x640) | Open on small Android | All content accessible, no horizontal overflow | ☐ |
| 13.6 | Chrome | Open in Chrome | All features work correctly | ☐ |
| 13.7 | Firefox | Open in Firefox | All features work correctly | ☐ |
| 13.8 | Safari | Open in Safari | All features work, MapLibre renders correctly | ☐ |
| 13.9 | Edge | Open in Edge | All features work correctly | ☐ |

---

## 14. Error Handling & Edge Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 14.1 | Network offline | Disconnect internet | Panels show error/empty states, no crashes | ☐ |
| 14.2 | CORS proxy failure | Block allorigins/rss2json | Fallback proxy used, or graceful error message | ☐ |
| 14.3 | USGS API down | Mock USGS 500 response | PhiVolcs panel shows error state, map still works | ☐ |
| 14.4 | PAGASA FFWS down | Mock PAGASA failure | Water level panel shows error, other panels unaffected | ☐ |
| 14.5 | Open-Meteo API down | Mock weather API failure | Weather panel shows error state | ☐ |
| 14.6 | GeoJSON load failure | Mock S3 GeoJSON 404 | Layer toggle shows error, map still functional | ☐ |
| 14.7 | RSS feed timeout | Slow/timeout RSS feeds | News panel shows partial results or loading state | ☐ |
| 14.8 | YouTube embed blocked | Corporate firewall blocks YouTube | Livestream/Volcano panels show fallback message | ☐ |

---

## 15. Performance

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 15.1 | Initial load time | Measure with DevTools | First Contentful Paint < 3s on broadband | ☐ |
| 15.2 | Map tile loading | Pan around the map | Tiles load smoothly without white gaps | ☐ |
| 15.3 | GeoJSON overlay performance | Enable all hazard layers simultaneously | Map remains interactive (no freeze/lag) | ☐ |
| 15.4 | Mobile tab switch speed | Rapidly switch between tabs | Instant switch (CSS display:none, no remount) | ☐ |
| 15.5 | Memory usage | Monitor with DevTools over 30 min | No memory leaks, stable heap usage | ☐ |
| 15.6 | Multiple YouTube embeds | Have Volcano Cams + Livestream active | Both iframes load without page slowdown | ☐ |

---

## 16. Unused/Orphan Panels (Not in Dashboard)

The following panel components exist in the codebase but are **NOT currently rendered** in the Dashboard. They may be intended for future use or were removed from the layout.

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `AccidentsPanel` | `panels/AccidentsPanel.tsx` | Metro Manila accident/incident feed | Not used |
| `MMDAPanel` | `panels/MMDAPanel.tsx` | MMDA Facebook embed + traffic news | Not used |
| `SocialMediaPanel` | `panels/SocialMediaPanel.tsx` | Disaster-related social media aggregator | Not used |
| `NewsPanel` | `panels/NewsPanel.tsx` | General news feed (replaced by PHNewsPanel) | Not used |

**Recommendation:** Either integrate these into the dashboard as optional panels, or remove them from the codebase to reduce maintenance burden.

---

## 17. Role-Based Features — NOT YET IMPLEMENTED

The current application has **no authentication, no user roles, and no admin features**. Below is what would need to be built for a 3-tier role system:

### Citizen (Public User)
All features listed above in sections 1-15 are currently accessible to everyone. A Citizen role would be the default public view — essentially what exists today.

### Admin
Features that would need to be built:

- Login/authentication system
- Panel visibility management (show/hide panels for public users)
- Custom alert creation (manual alerts beyond automated PAGASA/USGS)
- News source management (add/remove RSS feeds)
- Water level threshold configuration
- User activity dashboard / analytics
- Content moderation for social media panel

### Super Admin
Features that would need to be built:

- All Admin features, plus:
- User management (create/edit/delete Admin accounts)
- Role assignment
- System configuration (API endpoints, proxy settings, refresh intervals)
- Audit logs
- Data export/backup
- Feature flags (enable/disable panels globally)

---

## Summary

| Section | Test Cases | Priority |
|---------|-----------|----------|
| App Shell & Global | 9 | High |
| PAGASA Banner | 7 | High |
| Desktop Grid Layout | 12 | High |
| Mobile Bottom Nav | 11 | High |
| MapPanel | 39 | Critical |
| PhiVolcs Panel | 8 | High |
| Volcano Cams | 7 | Medium |
| PH News Panel | 12 | Medium |
| Water Levels Panel | 9 | High |
| Weather & AQ Panel | 11 | Medium |
| Livestream Panel | 7 | Medium |
| Data Freshness | 5 | Medium |
| Responsive/Cross-Browser | 9 | High |
| Error Handling | 8 | High |
| Performance | 6 | Medium |
| **Total** | **160** | |

**Critical path for testing:** MapPanel (39 tests) → Desktop Grid (12) → Mobile Nav (11) → PAGASA Banner (7) → Water Levels (9) → PhiVolcs (8).
