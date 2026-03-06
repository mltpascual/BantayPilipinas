# Development Guidelines — Bantay Pilipinas (PH Mission Control)

> **Purpose:** Single reference for all developers and AI agents working on this project. Covers UI/UX, code quality, security, and testing standards. Read this file before making any changes.

**Stack:** React 19 + Tailwind CSS 4 + shadcn/ui + Wouter + Leaflet + Chart.js
**Architecture:** Static frontend (client-only), no backend server. All data fetched from public APIs (PAGASA, PhiVolcs, USGS, GDACS, RSS feeds).

---

## Table of Contents

1. [UI/UX and Frontend Design](#1-uiux-and-frontend-design)
2. [Code Quality and Best Practices](#2-code-quality-and-best-practices)
3. [Security](#3-security)
4. [Testing](#4-testing)
5. [Pre-Delivery Checklist](#5-pre-delivery-checklist)

---

## 1. UI/UX and Frontend Design

*Synthesized from: frontend-design, ui-ux-pro-max, web-design-guidelines*

### 1.1 Design Philosophy

This project follows an **"Ops Center / Industrial Utilitarian"** aesthetic — dark-themed, data-dense, real-time monitoring dashboard. Every design decision must reinforce this identity.

| Principle | Guideline |
|-----------|-----------|
| **Aesthetic Direction** | Industrial utilitarian with military ops-center influence. No SaaS gradients, no rounded-corner card spam. |
| **Typography** | Space Grotesk (display) + system monospace (data). Never use Inter, Roboto, or Arial as primary fonts. |
| **Color Story** | Dark background (oklch-based), Philippine flag accents (blue `#0038A8`, red `#CE1126`, yellow `#FCD116`). One dominant tone, one accent, one neutral system. |
| **Spatial Composition** | Dense grid layout on desktop (react-grid-layout). Asymmetric panel sizes. White space is intentional, not leftover. |
| **Motion** | Minimal and purposeful. 150-300ms for micro-interactions. Use `transform`/`opacity` only — never animate `width`/`height`. Respect `prefers-reduced-motion`. |

### 1.2 Accessibility (CRITICAL Priority)

These are non-negotiable requirements:

- **Color contrast:** Minimum 4.5:1 ratio for normal text, 3:1 for large text.
- **Focus states:** Visible focus rings on all interactive elements. Never remove `outline` without replacement.
- **ARIA labels:** All icon-only buttons must have `aria-label`. Use `role` and `aria-current` on navigation.
- **Keyboard navigation:** Tab order must match visual order. All functionality reachable via keyboard.
- **Alt text:** Descriptive alt text for meaningful images. Decorative images use `alt=""`.
- **Form labels:** Every input must have an associated `<label>` with `htmlFor`.

### 1.3 Touch and Interaction (CRITICAL Priority)

- **Touch targets:** Minimum 44x44px on mobile.
- **Tap feedback:** Use `-webkit-tap-highlight-color: transparent` with custom `:active` states.
- **Loading states:** Disable buttons during async operations. Use skeleton screens or spinners.
- **Error feedback:** Clear error messages positioned near the problem element.
- **Cursor:** Add `cursor-pointer` to all clickable elements.

### 1.4 Layout and Responsive Design

- **Desktop:** 12-column react-grid-layout with drag/resize. Panels bounded to viewport (no overflow).
- **Mobile (<768px):** Bottom tab navigation with 5 tabs (Home, Map, News, Video, Alerts). CSS `display:none` for tab switching (no conditional rendering — prevents remounting).
- **Breakpoints:** Test at 375px, 768px, 1024px, 1440px.
- **No horizontal scroll** on any viewport size.
- **Safe areas:** Use `env(safe-area-inset-bottom)` for iOS devices.
- **Z-index scale:** Use consistent z-index values (10, 20, 30, 50, 9999 for mobile nav).

### 1.5 Theme and Color System

- Use CSS variables exclusively (defined in `client/src/index.css`).
- Support both dark and light modes via ThemeProvider.
- Always pair `bg-{semantic}` with `text-{semantic}-foreground`.
- Use oklch color format for Tailwind CSS 4 `@theme` blocks.
- Avoid evenly-balanced palettes — commit to a dominant color story.

### 1.6 Anti-Patterns (Immediate Failure)

- Inter/Roboto/system fonts as primary display font
- Purple-on-white SaaS gradients
- Default Tailwind/shadcn layouts without customization
- Symmetrical, predictable section layouts
- Emojis as UI icons (use SVG from Lucide or Heroicons)
- Decorative animations without purpose
- Scale transforms on hover that shift layout

---

## 2. Code Quality and Best Practices

*Synthesized from: clean-code, code-reviewer*

### 2.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `MapPanel`, `PhiVolcsPanel` |
| Hooks | camelCase with `use` prefix | `useIsMobile`, `useMaxRows` |
| Constants | UPPER_SNAKE_CASE | `MOBILE_NAV_HEIGHT`, `PANELS` |
| Types/Interfaces | PascalCase | `PanelConfig`, `MobileTab` |
| CSS variables | kebab-case with `--` prefix | `--font-display`, `--ph-red` |
| Files | PascalCase for components, camelCase for utilities | `MapPanel.tsx`, `useTheme.ts` |

- Use intention-revealing names: `elapsedTimeInDays` not `d`.
- Avoid disinformation: do not use `panelList` if it is a `Map`.
- Class/component names are nouns; function/method names are verbs.

### 2.2 Functions and Components

- **Small:** Functions should be under 20 lines when possible. Components under 100 lines; extract sub-components if larger.
- **Single Responsibility:** Each function/component does one thing well.
- **One Level of Abstraction:** Do not mix high-level layout logic with low-level data parsing.
- **Arguments:** 0-2 is ideal. 3+ requires a config object or refactoring.
- **No Side Effects:** Functions should not secretly change global state. Use `useEffect` for side effects.
- **Extract Constants:** Magic numbers and repeated values must be named constants (e.g., `MOBILE_NAV_HEIGHT = 64`).

### 2.3 React-Specific Patterns

- **Functional components only.** No class components.
- **Never call setState or navigation in render phase.** Wrap in `useEffect`.
- **Stabilize references:** Use `useState(() => initialValue)` or `useMemo` for objects/arrays passed as query inputs to prevent infinite re-renders.
- **Avoid nested anchor tags:** `<Link>` already renders `<a>` — do not wrap with another `<a>`.
- **Every `<Select.Item>` must have a non-empty `value` prop.**
- **Use sonner for toasts.** Do not add react-toastify or @radix-ui/react-toast.

### 2.4 Comments

- Do not comment bad code — rewrite it.
- Good comments: legal notices, clarification of external library behavior, TODOs with ticket references.
- Bad comments: redundant descriptions of obvious code, commented-out code blocks, position markers.

### 2.5 Error Handling

- Use try-catch for async operations.
- Never return or pass `null` when an empty state or error boundary is more appropriate.
- Use `<ErrorBoundary>` components for graceful UI failure recovery.
- Sanitize error messages — never expose stack traces or internal paths to users.

### 2.6 Code Review Checklist

Before submitting any change:

- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] Production build succeeds (`pnpm run build`)
- [ ] No unused imports or dead code
- [ ] No hardcoded magic numbers (extract to constants)
- [ ] Component props are typed with interfaces
- [ ] Accessibility attributes present on interactive elements
- [ ] Both dark and light themes tested
- [ ] Mobile and desktop layouts verified

---

## 3. Security

*Synthesized from: api-security-best-practices, find-bugs*

### 3.1 Client-Side Security (Static Frontend)

Since this is a client-only application with no backend, security focuses on:

| Threat | Mitigation |
|--------|-----------|
| **XSS via RSS/API data** | Sanitize all external data before rendering. Use React's built-in JSX escaping. Never use `dangerouslySetInnerHTML` without DOMPurify. |
| **Open redirect** | Validate all external URLs before opening. Only allow `https://` protocol. |
| **Sensitive data exposure** | No API keys in client code. Use environment variables via `VITE_` prefix. Never log sensitive data to console. |
| **Dependency vulnerabilities** | Run `pnpm audit` regularly. Keep dependencies updated. |
| **CORS abuse** | Only fetch from trusted, known API endpoints. |

### 3.2 Input Validation

- Validate all user inputs (search queries, file uploads for layout import).
- Use `try-catch` around `JSON.parse` for imported layout files.
- Sanitize URL parameters before use.
- Limit input lengths to prevent DoS via oversized payloads.

### 3.3 Security Checklist for Code Changes

For every changed file, verify:

- [ ] No user input directly interpolated into DOM without escaping
- [ ] No `eval()`, `Function()`, or `innerHTML` with untrusted data
- [ ] No secrets or API keys hardcoded in source
- [ ] External URLs validated before navigation
- [ ] Error messages do not leak internal implementation details
- [ ] `JSON.parse` wrapped in try-catch for user-provided data

### 3.4 Attack Surface Awareness

When adding new features, identify and document:

- All user inputs (search params, file uploads, URL components)
- All external API calls (new endpoints, data sources)
- All state operations (localStorage, sessionStorage)
- All third-party script inclusions

---

## 4. Testing

*Synthesized from: e2e-testing-patterns*

### 4.1 Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| **E2E (Critical Paths)** | Playwright or Puppeteer | Core user journeys |
| **Component** | Vitest + Testing Library | Reusable components |
| **Type Safety** | TypeScript strict mode | 100% (zero `any` where avoidable) |
| **Visual** | Manual + screenshot comparison | All breakpoints |

### 4.2 Critical User Journeys to Test

1. **Dashboard loads** — All 7 panels render without errors on desktop.
2. **Mobile tab navigation** — Switching between all 5 tabs preserves panel state (no remounting).
3. **Map interaction** — Earthquake markers load, popups open, layer switching works.
4. **Theme toggle** — Dark/light mode switches correctly, all text remains readable.
5. **Layout drag/resize** — Desktop panels can be rearranged and reset.
6. **Layout export/import** — JSON download and re-import restores layout.
7. **Real-time data** — Clock updates, earthquake data refreshes, water level alerts appear.

### 4.3 Test Implementation Guidelines

- **Stable selectors:** Use `data-testid` attributes, not CSS classes or DOM structure.
- **Test isolation:** Each test should be independent — no shared state between tests.
- **Retry logic:** Use built-in retry mechanisms for flaky network-dependent tests.
- **Mobile testing:** Test at 375px width with touch event simulation.
- **Accessibility testing:** Include axe-core checks in E2E suite.

### 4.4 TDD Workflow (for new features)

1. **Red:** Write a failing test that describes the expected behavior.
2. **Green:** Write the minimum code to make the test pass.
3. **Refactor:** Clean up the code while keeping tests green.

### 4.5 Pre-Merge Verification

Before claiming any work is complete:

```bash
# TypeScript check
npx tsc --noEmit

# Production build
pnpm run build

# Run tests (when test suite exists)
pnpm test
```

All three must pass with zero errors.

---

## 5. Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (SVG only)
- [ ] All icons from consistent icon set (Lucide)
- [ ] Hover states do not cause layout shift
- [ ] Theme colors used via CSS variables, not hardcoded hex

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are 150-300ms
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Both modes tested before delivery

### Layout
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed elements
- [ ] Safe area insets handled for iOS

### Code
- [ ] TypeScript compiles with zero errors
- [ ] Production build succeeds
- [ ] No unused imports or dead code
- [ ] No `console.log` in production code (use conditional logging)
- [ ] All external data sanitized before rendering

### Security
- [ ] No hardcoded secrets or API keys
- [ ] All user inputs validated
- [ ] External URLs validated before navigation
- [ ] Error messages do not leak internal details

---

*Last updated: March 6, 2026*
*Generated by: master-orchestrator → dev-orchestrator*
