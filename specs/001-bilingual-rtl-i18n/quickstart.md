# Quickstart: Bilingual (Arabic/English) + RTL/LTR

**Feature**: `001-bilingual-rtl-i18n` | **Date**: 2026-05-30

How to build, run, and verify this feature. No new dependencies are required.

## Prerequisites

- Frontend deps already installed (`cd frontend && npm install`).
- Backend running (for the signed-in app); the demo/landing work without it.

## Build order (high level)

1. **i18n core** — `src/lib/i18n/`: `dictionaries.ts` (typed `en`/`ar`), `LocaleProvider`,
   `useLocale`/`useT`, `humanizeActivity`, `dateFnsLocale`.
2. **Wire SSR** — root `layout.tsx` reads the `idara-locale` cookie, sets `<html lang
   dir>`, wraps children in `LocaleProvider` seeded with the server locale. Add Zustand
   `locale`/`setLocale` (mirror to cookie).
3. **Language switcher** — a toggle component placed in the landing header and the app top
   bar (visible on every screen).
4. **Translate static UI** — replace hardcoded literals with `t(...)` across landing, demo,
   auth, boards list, board view, dialogs, empty states, toasts.
5. **Direction pass** — remove hardcoded `dir="rtl"` wrappers; convert physical Tailwind
   utilities to logical (`ps/pe`, `ms/me`, `start/end`, `text-start/end`, `rounded-s/e`);
   add `rtl:`/`ltr:` overrides for directional icons.
6. **Dynamic content** — localize `formatDistanceToNow` and the activity feed via
   `humanizeActivity`.
7. **dnd-kit RTL check** — verify column drag + cross-column drops in Arabic; adjust
   collision detection if needed.
8. **Arabic font (optional polish)** — add an Arabic `next/font`.

## Run

```bash
# from repo root, in two terminals
cd backend  && .venv/Scripts/uvicorn app.main:app --reload --port 8000   # app data
cd frontend && npm run dev                                               # http://localhost:3000
```

> Do NOT run `npm run build` while `npm run dev` is running (they share `.next`).

## Verify (maps to spec Success Criteria)

1. **SC-001 (full coverage)**: Visit `/`, `/demo`, `/login`, `/signup`, `/boards`, and a
   board. Toggle to English — confirm zero Arabic strings remain. Toggle to Arabic — confirm
   zero English interface strings remain.
2. **SC-002 (<1s switch, keep place)**: On a board, toggle language — text + direction flip
   in under a second and you stay on the same board.
3. **SC-003 (persistence)**: Choose a language, reload, navigate, close and reopen the
   tab — it stays in that language. First-ever visit (clear the `idara-locale` cookie) →
   defaults to Arabic/RTL with no flash.
4. **SC-004 (RTL journey)**: In Arabic, run demo → signup → create board → create task →
   move task. No clipped/overlapping/mis-aligned/wrong-direction elements; drag-and-drop
   works.
5. **SC-005 (mixed content)**: With Arabic UI, create a task titled in English (and vice
   versa); the title reads correctly (per-block direction), not reversed.
6. **SC-006 (discoverable)**: The switcher is visible on every screen.

## Automated checks (must stay green — constitution Principle II)

```bash
cd frontend && npm run typecheck && npm run lint && npm run test && npm run build
```

- Add Vitest unit tests for: `t` interpolation + missing-key fallback; `dir` derivation
  from locale; `humanizeActivity` for each `action_type` in both locales + unknown-type
  fallback.

## Rollback

Feature is frontend-only and additive. Reverting the branch removes the switcher and
restores the prior hardcoded behavior; no data migration is involved.
