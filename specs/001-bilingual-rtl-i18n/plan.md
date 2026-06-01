# Implementation Plan: Full Bilingual (Arabic/English) Support with RTL/LTR

**Branch**: `001-bilingual-rtl-i18n` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-bilingual-rtl-i18n/spec.md`

## Summary

Add complete Arabic/English bilingual support with correct RTL/LTR direction across the
entire frontend. A language switcher (available on every screen) flips the active locale;
the choice persists via a cookie (authoritative for server first-paint) mirrored into the
existing Zustand UI store. Direction is set on the root `<html>` server-side from the cookie
(default Arabic/RTL), and the UI uses Tailwind logical properties so layout mirrors
automatically. Static text moves into two typed dictionaries consumed via a tiny custom
`useT()` hook; dynamic content (relative dates, activity-feed sentences) is localized on the
client from existing structured data. **No new runtime dependencies; no backend changes.**

## Technical Context

**Language/Version**: TypeScript (strict), React 18.3, Next.js 14.2.33 (App Router)

**Primary Dependencies**: Existing only — Tailwind CSS 3.4 (logical utilities + `rtl:`
variants, built in), Zustand 5 (`persist`), TanStack Query 5, date-fns 4 (ships `ar` +
`enUS` locales), dnd-kit 6. Optional: one Arabic `next/font` for typography polish.

**Storage**: Cookie `idara-locale` (SSR source of truth) + Zustand mirror. No database.

**Testing**: Vitest (unit) for the i18n module; manual + Playwright walkthrough for the RTL
journey and dnd-kit behavior.

**Target Platform**: Modern browsers (web); SSR via Next.js App Router.

**Project Type**: Web application (frontend-only change to the existing `frontend/`).

**Performance Goals**: Language switch visible in < 1s with no navigation/data reload; no
flash of wrong direction on first paint.

**Constraints**: No new runtime deps (constitution Principle V); no backend/API/schema
changes; REST/WebSocket contracts untouched; existing dark theme/design preserved.

**Scale/Scope**: 2 languages; ~all existing screens (landing, demo, auth, boards list,
board view, dialogs, activity feed, toasts, empty states).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | i18n lives in a dedicated `src/lib/i18n/` module; server state stays in TanStack Query, the `locale` UI preference goes in Zustand (UI state) — not conflated. Activity sentences are rebuilt on the **frontend** from existing structured data, keeping the backend locale-agnostic. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | Vitest unit tests planned for `t` interpolation + missing-key fallback, `dir` derivation, and `humanizeActivity` (all action types + unknown fallback). All gates (`tsc`/`eslint`/`vitest`/`build`) must stay green. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | No change to REST-as-source-of-truth. Localizing activity client-side actually improves consistency (existing feed entries re-localize live on toggle, no refetch). |
| IV. Security & Privacy by Default | ✅ Pass | The `idara-locale` cookie is a non-sensitive UI preference (`SameSite=Lax`, not HttpOnly by necessity). No auth/secret/role changes; error messages now localized still use the consistent shape. |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Custom ~40-line i18n over heavy libraries; toggle (no locale routing); zero new runtime deps; reuse Zustand + date-fns + Tailwind built-ins. |

**Result**: PASS (no violations; Complexity Tracking not required).

## Project Structure

### Documentation (this feature)

```text
specs/001-bilingual-rtl-i18n/
├── plan.md              # This file
├── spec.md              # Feature spec
├── research.md          # Phase 0 — decisions (i18n approach, RTL, persistence)
├── data-model.md        # Phase 1 — entities (locale, preference, string set)
├── quickstart.md        # Phase 1 — build/run/verify
├── contracts/
│   └── i18n-api.md       # Phase 1 — i18n module public API contract
└── tasks.md             # Phase 2 — created by /speckit-tasks (not here)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── lib/
│   │   └── i18n/                 # NEW — i18n core
│   │       ├── dictionaries.ts   # typed en + ar maps, MessageKey union
│   │       ├── locale-provider.tsx
│   │       ├── use-locale.ts
│   │       ├── use-t.ts
│   │       ├── humanize-activity.ts
│   │       └── date-locale.ts
│   ├── components/
│   │   ├── language-switcher.tsx # NEW — toggle (landing header + app top bar)
│   │   ├── app-shell.tsx         # EDIT — add switcher
│   │   ├── landing/landing-page.tsx   # EDIT — remove dir="rtl", use t()
│   │   ├── demo/demo-board.tsx        # EDIT — strings + RTL
│   │   ├── kanban/*.tsx               # EDIT — strings, logical utilities, dnd-kit RTL
│   │   ├── boards/*.tsx               # EDIT — strings
│   │   └── ui/*.tsx                   # EDIT — logical utilities where physical
│   ├── app/
│   │   ├── layout.tsx            # EDIT — read cookie, <html lang dir>, provider, Arabic font
│   │   ├── page.tsx              # EDIT — landing (inherits dir)
│   │   ├── demo/page.tsx         # EDIT — remove hardcoded dir, use t()
│   │   ├── (auth)/**             # EDIT — strings
│   │   └── (app)/**              # EDIT — strings, switcher in top bar
│   └── stores/ui-store.ts        # EDIT — add locale + setLocale (cookie mirror)
└── src/lib/i18n/__tests__/       # NEW — Vitest unit tests
```

**Structure Decision**: Frontend-only web-app change. All work is under `frontend/src/`,
centered on a new `lib/i18n/` module plus edits across existing components for strings and
logical-direction utilities. The `backend/` is untouched.

## Complexity Tracking

> No constitution violations — section intentionally empty.
