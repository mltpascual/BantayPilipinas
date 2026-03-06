# Product Guidelines — Bantay Pilipinas

## Brand Voice

**Tone:** Authoritative yet accessible. The dashboard communicates urgency without panic. Data is presented factually; the interface does the explaining, not verbose copy.

**Language style:** Taglish (Tagalog-English mix) is acceptable for user-facing labels where it improves clarity. Avoid deep/formal Tagalog. Technical terms use English.

**Text casing:** Title Case Per Word for all UI labels, button text, and navigation items (e.g., "Water Levels", "Volcano Cams", "PH News").

## Terminology

| Term | Usage | Avoid |
|------|-------|-------|
| **Earthquake** | Standard term for seismic events | "Quake" in formal contexts |
| **Typhoon** | Philippine term for tropical cyclones | "Hurricane" (wrong basin) |
| **PAGASA** | Always uppercase, no periods | "P.A.G.A.S.A." |
| **PhiVolcs** | Capital P, capital V | "PHIVOLCS" or "Phivolcs" |
| **GDACS** | Always uppercase | Spelled out unless first mention |
| **USGS** | Always uppercase | Spelled out unless first mention |
| **Panel** | A dashboard widget/card | "Module", "Widget" |
| **Freshness** | Data age indicator | "Staleness" |

## Error Messages

- Keep error messages short and actionable.
- Format: "[What happened]. [What to do]." Example: "Failed to load earthquake data. Check your connection and try again."
- Never expose technical details (API URLs, stack traces) to users.
- Use toast notifications (sonner) for transient errors.

## Data Attribution

- Always cite the data source in panel headers or footers (e.g., "Source: USGS", "Source: PAGASA").
- External links open in new tabs with `target="_blank" rel="noopener noreferrer"`.

## Color Semantics

| Color | Meaning |
|-------|---------|
| Green | Fresh data (<5 min), safe conditions |
| Yellow | Aging data (5-15 min), moderate alert |
| Orange | Stale data (15-30 min), elevated alert |
| Red | Very stale data (>30 min), critical alert, Philippine flag accent |
| Blue | Information, Philippine flag accent |

*Last updated: March 6, 2026*
