# Implementation Plan: PWA & Edge-to-Edge

**Branch**: `010-pwa-edge-to-edge` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-pwa-edge-to-edge/spec.md`

## Summary

Turn the IDARA frontend into an installable PWA with an edge-to-edge mobile shell and graceful offline/error states, frontend-only and additive:

1. **Edge-to-edge + status-bar color** (P1) — set `viewport.themeColor` (per-theme via `media`) to the `--bg` background so the iOS status-bar area blends instead of showing black; set `viewport-fit=cover`; pad the app shell with `env(safe-area-inset-*)` on mobile only; switch the app shell height from `h-screen` (100vh) to `100dvh` so dynamic browser chrome doesn't clip content. Desktop untouched.
2. **Installability** (P2) — add a Next.js native `app/manifest.ts` (name, short_name, start_url, `display: standalone`, brand background/theme colors, icon set incl. maskable 512) + `app/icon.tsx`/`app/apple-icon.tsx` (generated via `ImageResponse`) + Apple PWA meta tags through the `metadata`/`viewport` API. No `next-pwa`.
3. **Offline + service worker** (P3) — a small hand-written service worker (`public/sw.js`) that precaches the app shell + static assets and serves a bilingual `/offline` page on navigation failure; network-first for navigations, cache-first for static assets; **never** caches API responses or auth. A tiny client registrar with an explicit update flow (skipWaiting + reload-on-new-version). Pure registration/update logic extracted to a Vitest-tested helper.
4. **Error/not-found boundaries** (P3) — `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` and a `/offline` route, all reusing `EmptyState` + glass, bilingual, with `role="alert"`.

**Technical approach**: Lean on Next.js 14 App Router native PWA primitives (`manifest.ts`, file-based `icon`/`apple-icon`, `metadata`/`viewport` API) so installability needs **no runtime dependency**. The service worker is the only hand-rolled piece, kept minimal and safe (no API/token caching, clear update strategy). All visual additions reuse `--bg` tokens, Liquid Glass, and `EmptyState`; everything is additive and mobile-scoped, so the settled desktop (≥1280px) view is unchanged. New strings are bilingual (AR فصحى/EN) with the existing Vitest parity test enforcing it.

## Technical Context

**Language/Version**: TypeScript 5 strict, Next.js 14.2 App Router, React 18.

**Primary Dependencies**: Next.js (native manifest/icon/metadata APIs), Tailwind, existing i18n + `EmptyState`. **No new runtime dependency** — `manifest.ts` + `ImageResponse` icons + a hand-written `public/sw.js`. (If a maintained SW helper proves necessary for correctness, it will be justified in research; current plan avoids it.)

**Storage**: None server-side. Client: a versioned Cache Storage bucket for the app shell + static assets only (no API data, no tokens). `localStorage` theme key reused as-is.

**Testing**: Vitest for pure logic (service-worker registration/update helper; any theme-color/safe-area pure helper; dictionary parity for new AR/EN strings). Manual/quickstart verification for install + status-bar + offline on a device/emulator (these are platform behaviors not unit-testable).

**Target Platform**: Modern mobile browsers (iOS Safari, Android Chrome) for install/edge-to-edge; all browsers for the graceful error/offline screens. Desktop ≥1280px settled, mobile additive.

**Performance Goals**: Install/launch with correct icon+name and no color flash; offline reopen shows the branded shell, not a browser error. SW precache is small (app shell + static assets only).

**Constraints**: REST stays the source of truth; the SW must not serve stale mutable API data as current and must not cache auth tokens/sensitive responses. New version must not lock users on a stale shell (defined update strategy). Reduced-motion/transparency respected; RTL/LTR + light/dark correct. Desktop static state unchanged except additively.

**Scale/Scope**: Single frontend app. Out of scope: push notifications, background sync, offline mutations/queueing, full keyboard DnD, any backend change.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|-----------|-----------|
| **I. Layered Architecture & Separation of Concerns** | Frontend-only. Server state stays in TanStack Query; the SW does NOT become a second source of truth (REST remains authoritative — SW only serves the static shell + an offline fallback). Pure SW registration/update logic is isolated in a lib helper, separate from React UI. ✅ |
| **II. Test Discipline (NON-NEGOTIABLE)** | No backend change, so backend coverage is unaffected (stays ≥70%). New pure frontend logic (SW register/update helper) gets Vitest; new AR/EN strings are covered by the existing dictionary-parity test. Platform behaviors (install, status-bar, offline) are verified via quickstart since they aren't unit-testable. No merge with failing tests/lint. ✅ |
| **III. Real-Time Consistency & Optimistic UX** | REST stays the single source of truth. The SW explicitly avoids caching API responses, so offline never presents stale board/task data as live; when online, live data is fetched as today. WebSocket/real-time path unchanged. ✅ |
| **IV. Security & Privacy by Default** | The SW MUST NOT cache auth tokens or sensitive API responses (explicit requirement + test/inspection). JWT stays in httpOnly cookies, untouched. No secrets added; manifest/icons are public brand assets. ✅ |
| **V. Pragmatic Simplicity (YAGNI)** | Installability uses Next's built-in primitives — **zero** new runtime deps. The only hand-rolled piece (SW) is kept minimal with a clear update strategy; a heavy lib (next-pwa/workbox) is deliberately avoided unless a documented gap forces it. Offline scope is shell-only (no sync engine). ✅ |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/010-pwa-edge-to-edge/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (theme-color per theme, safe-area, dvh, SW strategy, icon gen, no next-pwa)
├── data-model.md        # Phase 1 — manifest entity, cached shell, fallback screens (no persisted data)
├── quickstart.md        # Phase 1 — how to verify install / status-bar / offline / errors
├── contracts/
│   └── pwa-surface.md    # Phase 1 — manifest fields, SW cache/route contract, meta tags (no HTTP API)
└── tasks.md             # Phase 2 — /speckit-tasks output (NOT created here)
```

### Source Code (repository root)

```text
frontend/
├── public/
│   └── sw.js                          # NEW: minimal service worker (precache shell + static, offline fallback, versioned, skipWaiting)
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # viewport: + themeColor (per-theme via media), viewportFit:"cover"; <head> apple meta; mount SW registrar
│   │   ├── manifest.ts                # NEW: Next native web app manifest (name/short_name/start_url/display/colors/icons)
│   │   ├── icon.tsx                   # NEW: generated app icon (ImageResponse) — brand mark
│   │   ├── apple-icon.tsx             # NEW: generated Apple touch icon (ImageResponse)
│   │   ├── error.tsx                  # NEW: route error boundary (EmptyState + glass, bilingual, retry)
│   │   ├── global-error.tsx           # NEW: root error boundary (renders its own <html>/<body>)
│   │   ├── not-found.tsx              # NEW: not-found screen (EmptyState + glass, bilingual)
│   │   ├── offline/page.tsx           # NEW: offline fallback page (EmptyState + glass, bilingual)
│   │   └── (app)/layout.tsx           # h-screen → h-[100dvh] (mobile-safe); safe-area padding where needed
│   ├── components/
│   │   └── pwa/
│   │       └── service-worker-registrar.tsx   # NEW: client component that registers /sw.js + handles update→reload
│   ├── lib/
│   │   ├── pwa/
│   │   │   └── sw-register.ts          # NEW: pure register/update helper (Vitest-tested; guards no-window/unsupported)
│   │   └── i18n/dictionaries.ts        # + AR/EN keys (offline.*, error.*, notFound.*, pwa.*) with parity
│   └── app/globals.css                 # safe-area utilities / dvh helpers if needed (mobile-scoped, additive)
└── src/lib/__tests__/
    └── sw-register.test.ts             # NEW: Vitest for the register/update helper
```

**Structure Decision**: Existing Next.js App Router frontend. Installability is delivered through Next's file-conventions (`manifest.ts`, `icon.tsx`, `apple-icon.tsx`) and the `viewport`/`metadata` exports in the root layout — no new dependency. The edge-to-edge work is confined to the root layout `viewport`/`<head>`, mobile-scoped safe-area CSS, and the `(app)` shell height. The service worker is a single small `public/sw.js` plus a thin client registrar and a Vitest-covered pure helper; it never caches API data or tokens. Error/offline screens are new App-Router files reusing `EmptyState` + glass + i18n.

## Complexity Tracking

No constitution violations — section intentionally empty. (The single hand-written service worker is the deliberate minimal choice over a heavy PWA library; rationale in research.md.)
