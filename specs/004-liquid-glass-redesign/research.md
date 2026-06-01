# Phase 0 Research: Adopt the "Liquid Glass" UI Redesign

The redesign is prepared in `NewDesign/` (a workspace-level mirror of `frontend/src/`
plus `tailwind.config.ts` and `app/globals.css`). This phase establishes exactly what
must move where and resolves the integration decisions. A full file-by-file comparison
against the current `frontend/` was performed; results below.

## File delta (verified by diff)

### NEW — no counterpart in `frontend/src/` (3)
- `components/backdrop.tsx` — fixed brand-aurora layer (`<div class="tf-aurora">`).
- `components/theme-switcher.tsx` — light/dark toggle; flips `light` class on `<html>`,
  persists to `localStorage` (`idara-theme`).
- `app/(auth)/forgot-password/page.tsx` — UI-only reset-request screen.

### DIFFERENT — restyle of an existing file (21)
- `app/globals.css` (859 B → ~7.5 KB token system + glass utilities + aurora + a11y).
- `app/layout.tsx` (+ no-flash theme `<script>`).
- `app/(app)/layout.tsx`, `app/(auth)/layout.tsx` (mount `Backdrop`; auth also mounts
  `ThemeSwitcher`).
- `app/(app)/boards/[boardId]/page.tsx`, `app/(auth)/login/page.tsx`
  (+ "Forgot password?" link), `app/(auth)/signup/page.tsx`, `app/demo/page.tsx`.
- `components/app-shell.tsx` (mounts `ThemeSwitcher`, glass-bar top bar),
  `components/providers.tsx` (Toaster `theme="system"` + glass),
  `components/language-switcher.tsx`, `components/landing/landing-page.tsx`,
  `components/boards/board-card.tsx`, `components/demo/demo-board.tsx`,
  `components/kanban/{column,task-card,presence-bar}.tsx`,
  `components/ui/{button,dialog,misc}.tsx`.
- `lib/i18n/dictionaries.ts` (+8 keys, additions only).
- `tailwind.config.ts` → must land at `frontend/tailwind.config.ts`.

### IDENTICAL — do not touch (verified byte-identical)
All `hooks/*`; `lib/{api,types,endpoints,board-logic,utils,demo-data}`; `stores/*`;
`lib/i18n/*` except `dictionaries.ts`; all tests; and the unchanged components/app
files (`board-settings-dialog`, `create-board-dialog`, `activity-feed`,
`add-column-dialog`, `kanban-board`, `manage-labels-dialog`, `task-dialog`,
`ui/confirm-dialog`, `ui/input`, `app/(app)/boards/page.tsx`, `app/page.tsx`).

## Decisions

### D1 — Adopt by file sync, not hand-patching
- **Decision**: Copy the 24 differing/new files verbatim from `NewDesign/` into the
  matching `frontend/src/` paths (and `tailwind.config.ts` into `frontend/`). Edit only
  the two files where a verbatim copy is risky to reason about diff-wise but still a
  full replace is fine (`layout.tsx`, `dictionaries.ts` are full-content swaps too,
  since their NewDesign versions are supersets).
- **Rationale**: The package was authored against this exact codebase — identical
  aliases (`@/…`), identical props/exports, identical logic files, i18n additions only.
  A verbatim sync is lower-risk and faster than reconstructing 21 diffs by hand, and the
  test suite + typecheck + build catch any mismatch.
- **Alternatives considered**: Hand-apply each styling diff — rejected as more error-
  prone for zero benefit (the source files are known-good).

### D2 — `tailwind.config.ts` location
- **Decision**: Place at `frontend/tailwind.config.ts` (replacing the current one), per
  the design doc's explicit caveat (the package rooted it at workspace level only
  because of how it was exported).
- **Rationale**: Tailwind in this project resolves config from `frontend/`; the new
  config switches colors to `rgb(var(--x) / <alpha-value>)`, which only works paired
  with the new `globals.css` tokens — so config + globals.css must land together.
- **Alternatives considered**: Leave config at root — rejected; Tailwind wouldn't pick
  it up and opacity modifiers would break.

### D3 — Theme switching mechanism
- **Decision**: Keep the design's approach: a no-flash inline `<script>` in
  `app/layout.tsx` reads `localStorage['idara-theme']` and sets the `light`/`dark`
  class on `<html>` before first paint; `ThemeSwitcher` toggles that class and
  persists. Dark is the default (matches today).
- **Rationale**: Standard, dependency-free, SSR-safe (no hydration flash). Theme is
  pure client UI state — correctly kept out of server state (Principle I).
- **Alternatives considered**: A theme library (next-themes) — rejected (YAGNI; new
  dependency for what a 1-line script + one component already does). Cookie-synced
  theme — rejected for v1 (localStorage matches the design and needs no SSR plumbing).

### D4 — Forgot-password is UI-only (resolved with the user)
- **Decision**: Ship `forgot-password/page.tsx` exactly as designed: validate the
  email, show the "check your inbox" confirmation, make **no** API call. Add the login
  link. Do not build a backend reset flow.
- **Rationale**: No reset endpoint exists; the project has no outbound email yet.
  Recorded as a Resolved Decision in the spec. A real flow is a separate future feature.
- **Alternatives considered**: Build the reset endpoints now (rejected — out of the
  presentation-only scope, much larger); drop the screen (rejected — the user wants the
  full design adopted, and a clearly-scoped placeholder is harmless).

### D5 — Remove `NewDesign/` after integration
- **Decision**: Once the files are synced and gates pass, delete the `NewDesign/`
  staging folder so there is one source of truth (`frontend/`).
- **Rationale**: Avoids a confusing duplicate tree and a second `globals.css`/config.
- **Alternatives considered**: Keep `NewDesign/` for reference — rejected; the spec
  folder + git history preserve the provenance, and a stale mirror invites drift.

### D6 — Verification strategy (no new logic tests)
- **Decision**: Rely on the existing Vitest suite (incl. the AR/EN dictionary-parity
  test), `tsc --noEmit`, `eslint`, `next build`, plus a manual theme × language and
  reduced-transparency/motion pass. Add no new unit tests.
- **Rationale**: No logic changed (Principle II) — the risk is visual/build, which the
  build + parity test + manual pass cover. Writing render tests for pure styling would
  be low-value churn (YAGNI).
- **Alternatives considered**: Snapshot/visual-regression tests — rejected for v1 as
  disproportionate to a one-time adoption.

## Risk review

- **No new dependencies** — every external import in `NewDesign/` (`lucide-react`,
  `sonner`, `class-variance-authority`, `date-fns`, `zod`, `react-hook-form`, `next/*`,
  `react`) already exists in `frontend/package.json`. Build will not need installs.
- **No logic regression** — logic/data/test files are byte-identical, so behavior is
  preserved by construction; only rendering changes.
- **i18n parity** — only additive keys in both `en` and `ar`; the existing parity test
  enforces both dictionaries stay in sync and will fail loudly if a key is missed.
- **Contrast/a11y** — the token system includes a `--scrim`, AA-contrast light values,
  and `prefers-reduced-transparency/motion` fallbacks; verified visually in quickstart.

## Open questions

None. The single scope question (forgot-password backend) was resolved with the user
(UI-only placeholder).
