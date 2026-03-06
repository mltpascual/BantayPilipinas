# Workflow — Bantay Pilipinas

## Development Methodology

This project follows a **feature-first** workflow: implement all features, then resolve conflicts and polish at the end. Git synchronization is done in batches, not per-commit.

## Quality Gates

| Gate | Command | Requirement |
|------|---------|-------------|
| **TypeScript** | `npx tsc --noEmit` | Zero errors |
| **Build** | `pnpm run build` | Successful production build |
| **Visual** | Manual + Puppeteer screenshots | All breakpoints verified |
| **Code Review** | `/sp-requesting-code-review` | All Critical/Important items resolved |

## Git Workflow

- **Branch strategy:** Single main branch (deployed via Manus checkpoints).
- **Commit convention:** Descriptive messages summarizing the change (e.g., "Add mobile bottom navigation with 5 tabs").
- **Remote:** GitHub repository `mltpascual/BantayPilipinas` synced after checkpoints.
- **Checkpoints:** Created via `webdev_save_checkpoint` before publishing. Each checkpoint is a deployable snapshot.

## Code Review Process

1. Run `/sp-requesting-code-review` after completing a feature.
2. Evaluate each finding using `/sp-receiving-code-review` before implementing.
3. Categorize findings: Critical (must fix), Important (should fix), Minor (nice to fix).
4. Push back on findings that are technically unsound or would introduce regressions.
5. Re-verify after all changes (`npx tsc --noEmit` + `pnpm run build`).

## Testing Requirements

| Type | Coverage | Tool |
|------|----------|------|
| Type safety | 100% (no `any` where avoidable) | TypeScript strict |
| E2E critical paths | 7 core user journeys | Puppeteer/Playwright |
| Visual regression | All breakpoints (375, 768, 1024, 1440) | Screenshot comparison |
| Accessibility | WCAG 2.1 AA | axe-core in E2E suite |

## Deployment Procedure

1. Verify all quality gates pass.
2. Create checkpoint via `webdev_save_checkpoint`.
3. Push to GitHub via `git push`.
4. Publish via Manus UI "Publish" button.
5. Verify deployed site loads correctly.

## File Organization Conventions

| Directory | Contents | Naming |
|-----------|----------|--------|
| `client/src/pages/` | Page-level components | PascalCase (`Dashboard.tsx`) |
| `client/src/components/panels/` | Dashboard panel components | PascalCase with `Panel` suffix (`MapPanel.tsx`) |
| `client/src/components/ui/` | shadcn/ui primitives | kebab-case (`scroll-area.tsx`) |
| `client/src/components/` | Shared non-panel components | PascalCase (`ErrorBoundary.tsx`) |
| `client/src/contexts/` | React context providers | PascalCase with `Context` suffix |
| `client/src/hooks/` | Custom React hooks | camelCase with `use` prefix |
| `client/src/lib/` | Utility functions, data fetching | camelCase (`feeds.ts`, `fetchUtils.ts`) |

## Session Continuity

When resuming work on this project:

1. Read `conductor/index.md` to orient.
2. Check `DEVELOPMENT_GUIDELINES.md` for coding standards.
3. Run `npx tsc --noEmit` to verify current state compiles.
4. Check the dev server is running (`pnpm run dev`).
5. Review recent git log for context on last changes.

*Last updated: March 6, 2026*
