# Implementation Plan: Adopt the "Liquid Glass" UI Redesign

**Branch**: `004-liquid-glass-redesign` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-liquid-glass-redesign/spec.md`

## Summary

Adopt the prepared "Liquid Glass" redesign in `NewDesign/` as the project's main,
default UI. This is a **presentation-only** change: integrate the restyled
presentation layer (components + `globals.css` token system + `tailwind.config.ts`),
add two net-new presentational pieces (a brand-aurora `Backdrop` and a light/dark
`ThemeSwitcher`), and add one new UI-only screen (forgot-password). **No backend, no
data model, no API, no new dependencies, and no changes to logic** (hooks, `lib/*`,
stores, types are verified byte-identical to the current app).

The work is essentially a **deterministic file sync** from `NewDesign/` into
`frontend/src/` (and `tailwind.config.ts` into `frontend/`), verified by the existing
test suite + a typecheck/build + a manual theme/RTL pass. Risk is low because the
design package was authored against the current codebase: same import aliases, same
i18n keys plus additions only, same component names and props.

## Technical Context

**Language/Version**: Frontend only — TypeScript (strict), React 18.3, Next.js 14.2
(App Router), Tailwind CSS. No backend work.

**Primary Dependencies**: Existing only — Tailwind, TanStack Query, Zustand, sonner,
lucide-react, react-hook-form, zod, class-variance-authority, date-fns, the in-repo
i18n module. **No new dependencies** (every import in `NewDesign/` already resolves in
`frontend/package.json`).

**Storage**: N/A for data. The only persisted state is the theme preference, stored in
`localStorage` (`idara-theme`) on the device — not the account, not the database.

**Testing**: Vitest (existing suite, incl. the AR/EN dictionary-parity test) +
`tsc --noEmit` + `next build` + a manual theme × language (Dark/Light × AR/EN) and
reduced-transparency/motion pass per `quickstart.md`.

**Target Platform**: Web (Next.js App Router frontend).

**Project Type**: Web application — **frontend-only** change in this feature.

**Performance Goals**: Theme switch reflects across the UI in under 1s; theme applied
before first paint (no flash). Glass is applied only to discrete floating elements
(never stacked) to preserve mobile performance.

**Constraints**: Zero functional regressions across every existing flow; full
bilingual AR/EN + RTL preserved with no lost strings; legibility (contrast) maintained
in both themes; honor `prefers-reduced-transparency` (glass → solid) and
`prefers-reduced-motion` (animations/reflections off). `tailwind.config.ts` MUST live
at `frontend/tailwind.config.ts` (one level above `src/`).

**Scale/Scope**: 21 restyled files (8 `app/` route files, 11 components,
`globals.css`, `dictionaries.ts`), 3 new files (`backdrop.tsx`, `theme-switcher.tsx`,
`forgot-password/page.tsx`), and `tailwind.config.ts`. All other files unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | Purely presentational. Server state stays in TanStack Query, UI state in Zustand/local; the theme is local UI state persisted to `localStorage`, not conflated with server data. No backend layering touched. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | No backend changes, so backend coverage is unaffected (stays ≥70%). Frontend gates (`tsc`/`eslint`/`vitest`/`build`) must stay green; the existing AR/EN dictionary-parity Vitest test guards the i18n additions. No logic changed, so no new logic tests are required; the redesign is verified by build + manual visual pass. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | REST-is-truth / WS-notifies model untouched; `use-board-socket.ts` and all hooks are byte-identical. No real-time behavior changes. |
| IV. Security & Privacy by Default | ✅ Pass | No auth/data changes. The forgot-password screen is **UI-only** (no API call, no email) by explicit decision — it cannot leak anything because it does nothing server-side. JWT/cookie handling untouched. |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Adopts the prepared design as-is; adds only the genuinely new pieces (aurora, theme toggle, forgot-password placeholder). The forgot-password backend is explicitly deferred, not built speculatively. The token system is a single source of truth for both themes (no duplication). |

**Result**: PASS — no violations; Complexity Tracking not required.

### Constitution alignment notes

- **Constitution §"Technology & Quality Constraints"** lists `globals.css` as the
  single source of truth for tokens and notes the project uses logical Tailwind
  utilities for RTL — the redesign reinforces both (one token set drives dark + light;
  all new markup uses logical properties). No constitution amendment is needed.
- **Forgot-password caveat** is recorded as a Resolved Decision in the spec (ship UI-
  only); a real reset flow is a separate future feature.

## Project Structure

### Documentation (this feature)

```text
specs/004-liquid-glass-redesign/
├── plan.md             # This file
├── spec.md             # Feature spec
├── research.md         # Phase 0 — integration strategy & decisions
├── data-model.md       # Phase 1 — the only stateful entity (theme preference)
├── quickstart.md       # Phase 1 — build/run/verify (theme × language, a11y)
├── contracts/
│   └── ui-contract.md  # Phase 1 — design-token, glass, theme & i18n contract
├── checklists/
│   └── requirements.md # Spec quality checklist (from /speckit-specify)
└── tasks.md            # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

The change is a sync from `NewDesign/` into `frontend/`. Files grouped by action:

```text
frontend/
├── tailwind.config.ts                 # REPLACE  <- NewDesign/tailwind.config.ts (CSS-var colors, bumped radii, glass shadows)
└── src/
    ├── app/
    │   ├── globals.css                 # REPLACE  <- token system + glass utilities + aurora + a11y media queries
    │   ├── layout.tsx                  # EDIT     <- add no-flash theme <script> before <Providers>
    │   ├── (app)/layout.tsx            # EDIT     <- render <Backdrop/>, z-10 content wrapper
    │   ├── (app)/boards/[boardId]/page.tsx  # REPLACE (restyle)
    │   ├── (auth)/layout.tsx           # EDIT     <- <Backdrop/> + <ThemeSwitcher/>, glass styling
    │   ├── (auth)/login/page.tsx       # REPLACE (restyle) <- adds "Forgot password?" link
    │   ├── (auth)/signup/page.tsx      # REPLACE (restyle)
    │   ├── (auth)/forgot-password/page.tsx  # NEW (UI-only)
    │   └── demo/page.tsx               # REPLACE (restyle)
    ├── components/
    │   ├── backdrop.tsx                # NEW  (brand aurora layer)
    │   ├── theme-switcher.tsx          # NEW  (light/dark toggle, localStorage)
    │   ├── app-shell.tsx               # REPLACE (restyle) <- mounts ThemeSwitcher, glass-bar top bar
    │   ├── providers.tsx               # REPLACE (restyle) <- Toaster theme=system + glass
    │   ├── language-switcher.tsx       # REPLACE (restyle) <- glass-clear
    │   ├── landing/landing-page.tsx    # REPLACE (restyle)
    │   ├── boards/board-card.tsx       # REPLACE (restyle)
    │   ├── demo/demo-board.tsx         # REPLACE (restyle)
    │   ├── kanban/{column,task-card,presence-bar}.tsx  # REPLACE (restyle)
    │   └── ui/{button,dialog,misc}.tsx # REPLACE (restyle)
    └── lib/i18n/dictionaries.ts        # EDIT  <- add 8 auth.forgot.* / auth.login.forgot keys (en + ar), no removals

# UNCHANGED (verified byte-identical, do NOT touch):
#   all hooks/*, lib/{api,types,endpoints,board-logic,utils,demo-data}, stores/*,
#   lib/i18n/* (except dictionaries), all tests, and the SAME components/app files
#   (board-settings-dialog, create-board-dialog, activity-feed, add-column-dialog,
#    kanban-board, manage-labels-dialog, task-dialog, ui/confirm-dialog, ui/input,
#    app/(app)/boards/page.tsx, app/page.tsx)
```

After integration, **`NewDesign/` is removed** (it was a staging area; its content now
lives in `frontend/`).

**Structure Decision**: Frontend-only adoption via a file sync. Because `NewDesign/`
was authored against the current codebase (identical aliases, props, i18n keys + only
additions, identical logic files), the safest path is to copy the 24 differing/new
files verbatim into `frontend/src/` (and the config into `frontend/`) rather than
hand-patch each — then prove no regression with the existing tests + typecheck + build
+ a manual theme/RTL/a11y pass. No new top-level modules; no backend.

## Complexity Tracking

> No constitution violations — section intentionally empty.
