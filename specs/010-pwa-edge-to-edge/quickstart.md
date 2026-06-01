# Quickstart: PWA & Edge-to-Edge (010)

## Run the app (dev)

Backend (from `backend/`, venv active):
```pwsh
./.venv/Scripts/uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
```
Frontend (from `frontend/`):
```pwsh
npm run dev   # http://localhost:3000
```

> The service worker registers **only in production** (`npm run build` + `npm start`), so `next dev` is unaffected by SW caching. Test offline/install against a production build.
> Do NOT run `npm run build` while `next dev` is running — they share `.next/`. Stop dev first.

## Verify each story

**US1 — status bar blends (P1, MVP)**
1. Open the site on a phone (or device emulation) in **dark** mode → the status-bar area is the dark app background (`#0D1117`), no black strip.
2. Switch to **light** mode → status-bar area matches the light background.
3. On a notched device → background fills to the top edge; the top bar/clock don't overlap (content stays in the safe area).
4. On desktop (≥1280px) → nothing changed.

**US2 — install (P2)** — needs a production build (`npm run build && npm start`) over HTTPS (the devtunnel URL works):
1. Browser menu → "Add to Home Screen" / install is offered.
2. Launch the installed icon → opens standalone (no address bar), correct name + icon, brand background, no color flash.
3. Run a PWA audit (e.g. Lighthouse) → no manifest/icon errors.

**US3 — offline & errors (P3)** — production build:
1. Load once online, then go offline and reopen/navigate → branded `/offline` screen (bilingual), not the browser default.
2. Force a render error → `app/error.tsx` shows a branded retry screen; assistive tech announces it (`role="alert"`).
3. Visit an unknown path → branded not-found with a link back to boards.
4. Back online → live data fetches fresh (no stale cached app data shown as current).
5. Deploy a new version (bump SW cache version) and reopen → updated app, not stuck on the old shell.

## Quality gates (before commit)

Frontend (from `frontend/`):
```pwsh
npx tsc --noEmit
npx eslint .
npx vitest run     # incl. sw-register.test.ts + dictionary parity
npm run build      # only with the dev server stopped
```
Backend: unchanged by this feature (no backend edits); existing `pytest`/`ruff` remain green.

## Inspection checklist (security/consistency)
- DevTools → Application → Cache Storage: the `idara-shell-v{N}` cache contains **only** the shell + `/offline` + static assets — **no** `/api/*` responses, **no** tokens/cookies.
- DevTools → Application → Service Workers: a new build activates and reloads once (no manual "Update on reload" needed).

## Notes / conventions reused
- Colors are the existing `--bg` tokens (dark `#0D1117`, light `#EAEEF4`); no new palette.
- Offline/error/not-found screens reuse `EmptyState` + Liquid Glass + the i18n dictionary (AR فصحى/EN, parity-tested), mirror in RTL, and respect reduced-motion/transparency.
- Safe-area padding + `100dvh` are mobile-scoped (`max-md:`); desktop settled state unchanged.
- Installability uses Next's native `manifest.ts` / `icon` / `apple-icon` / `viewport` — no new runtime dependency. The only hand-written piece is `public/sw.js`.
