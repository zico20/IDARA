# Implementation Plan: Responsive Mobile & Tablet Support

**Branch**: `006-responsive-mobile` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-responsive-mobile/spec.md`

## Summary

Make the existing IDARA UI fully responsive on phones and tablets **without touching
the desktop layout (≥1280px)**. All changes are additive Tailwind responsive utilities +
a small global CSS layer + one new mobile-nav behavior. Concretely: add a viewport meta;
turn the always-present sidebar into an off-canvas drawer behind an accessible hamburger
below `md` (768px); guard against horizontal page scroll; make type fluid where it helps;
enforce 16px form inputs on mobile (no iOS zoom); add comfortable tap targets, touch
focus/active states, an `@media (hover: hover)` guard, and extend reduced-motion. **No
backend, no data model, no new runtime dependencies, no logic changes.**

The existing code already uses Tailwind responsive prefixes and has partial
`prefers-reduced-motion` handling, so this is an **incremental, low-risk** layering of
responsive rules onto known components — verified by typecheck/lint/test/build plus a
manual multi-width pass.

## Technical Context

**Language/Version**: Frontend only — TypeScript (strict), React 18.3, Next.js 14.2
(App Router), Tailwind CSS. No backend work.

**Primary Dependencies**: Existing only — Tailwind, TanStack Query, Zustand, lucide-react,
the in-repo i18n module. **No new dependencies** (the hamburger/drawer is built from
existing primitives + a tiny local hook or CSS-only state; no UI library added).

**Storage**: N/A. The only new state is the transient open/closed state of the mobile nav
drawer (client UI state, not persisted).

**Testing**: Vitest (existing suite, incl. AR/EN dictionary-parity) + `tsc --noEmit` +
`eslint` + `next build` + a manual responsive pass at 320 / 375 / 425 / 768 / 1024 / 1280px
across Dark/Light × AR/EN (per quickstart.md). Optional: Playwright viewport screenshots.

**Target Platform**: Web (Next.js App Router frontend).

**Project Type**: Web application — frontend-only change.

**Performance Goals**: No horizontal page scroll at any width; mobile nav opens/closes
smoothly; no heavy desktop-only motion on mobile; respect reduced-motion. No added network
or bundle weight of note (utility classes + one small component).

**Constraints**:
- **Desktop boundary = 1280px (`xl`)**: rules that must not affect desktop are written to
  apply only below `xl` (e.g. `max-xl:` or unprefixed-then-`xl:`-restores), so ≥1280px is
  byte-for-byte unchanged.
- **Mobile-nav boundary = 768px (`md`)**: the hamburger/drawer applies below `md`; at `md`+
  the sidebar shows.
- Additive only; reuse the existing design tokens and spacing scale; preserve RTL/LTR and
  both themes; the kanban board keeps its own contained horizontal scroll.

**Scale/Scope**: ~1 new component (mobile nav trigger/drawer or a responsive variant of
`Sidebar`), edits to `app/layout.tsx` (viewport) and `(app)/layout.tsx` (mobile nav slot),
`globals.css` (responsive global layer), `components/ui/input.tsx` (16px on mobile), and
targeted responsive class additions in the board page, boards page, dialogs, landing, and
the kanban column/board. No file is rewritten wholesale.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | Purely presentational. The only new state (mobile-nav open/closed) is local client UI state, kept in the component (or the existing Zustand UI store) — not conflated with server state. No backend layering touched. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | No backend change (coverage unaffected). Frontend gates (`tsc`/`eslint`/`vitest`/`build`) stay green; AR/EN parity test guards any string additions (e.g. a "menu"/"close" aria label). No business logic changes → no new logic tests; responsiveness verified by build + manual multi-width pass. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | Real-time/hooks untouched; only layout/CSS changes. |
| IV. Security & Privacy by Default | ✅ Pass | No auth/data/API changes. |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Builds the mobile nav from existing primitives (no UI library); reuses tokens/spacing; extends the existing reduced-motion block rather than duplicating. No speculative breakpoints beyond the spec's bands. |

**Result**: PASS — no violations; Complexity Tracking not required.

### Constitution alignment notes

- **Desktop-unchanged guarantee** is enforced structurally: responsive utilities are scoped
  below `xl` (1280px), so the desktop render path is identical. The plan's verification
  includes an explicit desktop-diff check (SC-003).
- **No new dependency** for the hamburger keeps Principle V; a CSS/Tailwind + small React
  state solution is sufficient.

## Project Structure

### Documentation (this feature)

```text
specs/006-responsive-mobile/
├── plan.md             # This file
├── spec.md             # Feature spec
├── research.md         # Phase 0 — breakpoint strategy & decisions
├── data-model.md       # Phase 1 — (no data; viewport buckets + nav state note)
├── quickstart.md       # Phase 1 — build/run/verify across widths
├── contracts/
│   └── responsive-contract.md  # Phase 1 — breakpoints, nav, type, touch, forms contract
├── checklists/
│   └── requirements.md # Spec quality checklist (from /speckit-specify)
└── tasks.md            # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

Frontend-only. Files grouped by the responsive concern they serve:

```text
frontend/
└── src/
    ├── app/
    │   ├── layout.tsx                    # EDIT — add viewport meta (export const viewport) for device-width
    │   ├── globals.css                   # EDIT — responsive global layer: body overflow-x guard,
    │   │                                  #        @media (hover: hover) wrapper for hover-only effects,
    │   │                                  #        fluid base type / line-height on mobile, extend reduced-motion
    │   ├── (app)/layout.tsx              # EDIT — render the mobile nav trigger + off-canvas drawer slot below md;
    │   │                                  #        keep the desktop sidebar flex layout at md+/unchanged at xl+
    │   ├── (app)/boards/[boardId]/page.tsx  # EDIT — header/toolbar wrap + spacing at small widths; full-width kanban
    │   └── (app)/boards/page.tsx         # EDIT — board grid uses auto-fit/minmax so it reflows 1→2→3 cols by width
    ├── components/
    │   ├── mobile-nav.tsx                # NEW — accessible hamburger trigger + off-canvas drawer that reuses the
    │   │                                  #        Sidebar contents; opens/closes (animation), closes on link/outside/Esc,
    │   │                                  #        ARIA-labeled, keyboard operable; shown only below md
    │   ├── sidebar.tsx                   # EDIT — make it render inside both the desktop rail and the mobile drawer
    │   │                                  #        (extract the contents so both share one source); hide the rail below md
    │   ├── ui/input.tsx                  # EDIT — inputs/textarea use a >=16px font on mobile (prevent iOS zoom),
    │   │                                  #        comfortable height/tap target; keep desktop sizing at md+/xl+
    │   ├── ui/button.tsx                 # EDIT (if needed) — ensure min 44x44 tap target on touch + :active/:focus-visible
    │   ├── kanban/{column,kanban-board}.tsx  # EDIT — keep board horizontal scroll contained; comfortable widths on phones
    │   ├── boards/board-card.tsx         # EDIT (if needed) — fluid card sizing within the grid
    │   ├── landing/landing-page.tsx      # EDIT — reflow hero/feature sections to single column on phones
    │   └── ui/dialog.tsx                 # EDIT (if needed) — full-width-with-margins + scroll-within on short viewports
    └── lib/i18n/dictionaries.ts          # EDIT (if needed) — add aria labels for the menu (open/close) in en + ar

# UNCHANGED: all hooks, lib/*, stores/* (unless the nav uses the UI store), types, tests,
#   tailwind.config.ts (default Tailwind breakpoints sm 640 / md 768 / lg 1024 / xl 1280
#   already match the spec's bands), backend/* (nothing).
```

**Structure Decision**: Frontend-only, additive responsive layering. The default Tailwind
breakpoints already line up with the spec's bands (`md`=768 for the nav switch, `xl`=1280
for the desktop boundary), so **no Tailwind config change is needed**. The one structural
addition is a mobile nav (hamburger + off-canvas drawer) that reuses the existing `Sidebar`
contents so there is a single source of truth for navigation. Everything else is responsive
utility classes on existing components plus a small global CSS layer. Desktop (≥1280px) is
left untouched by scoping rules below `xl`.

## Complexity Tracking

> No constitution violations — section intentionally empty.
