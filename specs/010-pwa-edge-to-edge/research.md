# Phase 0 Research: PWA & Edge-to-Edge

All items resolved from the codebase + platform constraints (no open NEEDS CLARIFICATION). Each records decision, rationale, alternatives.

## 1. Status-bar color per theme (theme-color)

- **Decision**: Export `themeColor` from `viewport` in `app/layout.tsx` as an array keyed by `prefers-color-scheme`: dark `#0D1117` (the `--bg` dark value) and light `#EAEEF4` (`rgb(234 238 244)`, the `--bg` light value). Add `apple-mobile-web-app-status-bar-style` = `black-translucent` so iOS lets the page paint under the status bar (with `default`/colored as the documented fallback).
- **Rationale**: `theme-color` is the standard control for the browser/status-bar tint and is exactly what removes the disconnected black strip the user reported. Keying by `prefers-color-scheme` covers both themes at the platform level. Reuses existing `--bg` values so there's no new palette.
- **Alternatives considered**: A single static dark theme-color — rejected: would mismatch in light mode. JS that rewrites the `<meta theme-color>` on theme toggle — kept as a possible enhancement but not required; the media-keyed values + dark default cover the first-paint case, and the app's own background already fills the area so a live rewrite is a nice-to-have, not core.
- **Note on the theme/system mismatch**: the app theme is user-chosen via a class on `<html>` while `theme-color` media keys off the OS color scheme. Baseline is acceptable (background fills the area regardless); a follow-up could sync the meta tag to the chosen class for perfect match. Documented, not blocking.

## 2. Edge-to-edge: viewport-fit + safe-area

- **Decision**: Add `viewportFit: "cover"` to the `viewport` export. Apply `env(safe-area-inset-*)` padding **only on mobile** (`max-md:`) to the interactive shells (the floating top bars / `(app)` chrome) so the colored background extends to the physical edges while controls stay out from under the notch/clock and home indicator. Provide small CSS utilities (e.g. `.pt-safe`, `.pb-safe`) in `globals.css` using `env(...)` with a `0px` fallback.
- **Rationale**: `viewport-fit=cover` is required for `env(safe-area-inset-*)` to be non-zero; combining it with safe-area padding is the canonical iOS edge-to-edge recipe. Scoping the padding to `max-md:` guarantees desktop is untouched (FR-005/SC-008).
- **Alternatives considered**: Padding everything unconditionally — rejected: would shift desktop. Fixed pixel offsets for the notch — rejected: not device-portable; `env()` is the correct primitive.

## 3. Dynamic viewport height (100dvh)

- **Decision**: Replace `h-screen` (100vh) with `h-[100dvh]` on the `(app)` shell (and any other 100vh full-height shells) so the mobile address bar showing/hiding doesn't clip the bottom. Keep `min-h-screen` pages as-is unless they clip (they grow, so they're safe), optionally upgrading to `min-h-[100dvh]`.
- **Rationale**: `100dvh` tracks the *dynamic* viewport (excludes/﻿includes the retracting browser chrome), eliminating the classic mobile bottom-cutoff. `dvh` is broadly supported on current iOS/Android. Additive on desktop (dvh == vh when there's no dynamic chrome).
- **Alternatives considered**: JS `--vh` custom-property hack (`window.innerHeight`) — rejected: `dvh` is native and avoids JS/resize listeners. Leaving 100vh — rejected: reintroduces the clipping the spec calls out (FR-004).

## 4. Web app manifest — Next native, no next-pwa

- **Decision**: Add `app/manifest.ts` exporting a `MetadataRoute.Manifest`: `name`="TaskFlow", `short_name`="TaskFlow", `start_url`="/boards" (the app home; falls through to /login when unauthenticated), `display`="standalone", `background_color`/`theme_color`=`#0D1117` (dark baseline), `dir`/`lang` left default (the app is bilingual and sets dir at runtime), and an `icons` array referencing the generated icons incl. a `512` `maskable` entry.
- **Rationale**: Next 14 serves `app/manifest.ts` at `/manifest.webmanifest` and auto-links it — no dependency, no public file to hand-maintain. `start_url=/boards` lands an installed user in the app; the existing auth guard redirects to /login if needed.
- **Alternatives considered**: `next-pwa` — rejected (YAGNI + heavy + opinionated SW). A static `public/manifest.json` — rejected: `manifest.ts` is type-checked and co-located.

## 5. Icons — generated via ImageResponse

- **Decision**: Generate `app/icon.tsx` and `app/apple-icon.tsx` with `next/og`'s `ImageResponse`, drawing the existing brand mark (the rounded-square grid glyph on the accent gradient, matching the in-app logo) at the required sizes (incl. a 512 maskable with safe padding). Optionally a small `favicon`.
- **Rationale**: Generating from code avoids committing binary assets, keeps the icon in sync with the brand, and uses a built-in Next capability (no new dep, `ImageResponse` ships with Next). Maskable padding ensures Android adaptive icons don't crop the glyph.
- **Alternatives considered**: Hand-authored PNG asset set — rejected: binary churn, and `sharp`/icon tooling would be a new dev dep. A single non-maskable icon — rejected: Android needs maskable to avoid cropping (FR-006).

## 6. Service worker strategy

- **Decision**: A small hand-written `public/sw.js`:
  - `install`: precache the app shell essentials + `/offline` + build static assets; `self.skipWaiting()`.
  - `activate`: delete old caches by version key; `clients.claim()`.
  - `fetch`: only handle GET. **Navigations** → network-first, fall back to the cached shell / `/offline` when the network fails. **Static assets** (`/_next/static/*`, icons, fonts) → cache-first. **Everything else, especially `/api/*` and cross-origin** → pass through to the network (never cached).
  - Versioned cache name (e.g. `taskflow-shell-v{N}`) bumped on each deploy so a new version supersedes the old; the client registrar reloads once the new SW takes control.
- **Rationale**: Meets FR-010/011/012/013 with the minimum surface: shell works offline, API/tokens are never cached, and the version bump + skipWaiting/claim prevents stale lock-in. Hand-written keeps it auditable and dependency-free.
- **Alternatives considered**: Workbox/next-pwa precaching — rejected (YAGNI; opaque generated SW harder to audit for the "no API/token caching" guarantee). Caching API GETs for offline reads — rejected: violates "no stale data as current" and risks leaking sensitive responses.
- **Update strategy (explicit)**: bump the cache version constant per release; `skipWaiting` + `clients.claim` activate the new SW immediately; the registrar listens for `controllerchange` and triggers a single reload so users land on the fresh shell without manual cache-clearing.

## 7. SW registration + Vitest-testable helper

- **Decision**: A pure `lib/pwa/sw-register.ts` exposing e.g. `canRegisterServiceWorker(nav)` and `shouldReloadOnControllerChange(state)` — pure functions guarding for `typeof window`/`navigator.serviceWorker` support — plus a thin `components/pwa/service-worker-registrar.tsx` client component (mounted in the root layout) that calls `navigator.serviceWorker.register('/sw.js')` and wires the update→reload flow. Only register in production (`process.env.NODE_ENV === 'production'`) to avoid interfering with `next dev` HMR.
- **Rationale**: Isolating the decision logic makes it unit-testable (Constitution II) without a browser; the registrar stays a tiny side-effect shell. Registering only in prod avoids the dev-server `.next`/HMR friction.
- **Alternatives considered**: Inline registration in layout — rejected: not testable, mixes concerns. Registering in dev — rejected: SW + HMR cause stale-asset confusion during development.

## 8. Error / not-found / offline screens

- **Decision**: `app/error.tsx` (route error boundary, `"use client"`, `reset()` retry), `app/global-error.tsx` (renders its own `<html><body>` per Next requirement, minimal), `app/not-found.tsx`, and `app/offline/page.tsx`. All reuse `EmptyState` + glass tokens, are bilingual via the dictionary, mirror in RTL, and mark the message `role="alert"` for assistive tech.
- **Rationale**: App-Router native files are the correct boundaries; reusing `EmptyState` keeps them on-brand with zero new components. `role="alert"` satisfies FR-016's announce requirement.
- **Alternatives considered**: A single shared component switched by prop — fine, but the App-Router file conventions are required for `error`/`not-found` to actually catch; the `/offline` route is what the SW navigates to.

## 9. New strings (AR فصحى / EN)

- **Decision**: Add `offline.*`, `error.*`, `notFound.*`, and any `pwa.*`/install-hint keys to both dictionaries in Modern Standard Arabic and English, preserving the existing Vitest parity test.
- **Rationale**: Consistency with the rest of the app and the constitution's i18n rule; the parity test fails the build if a key is missing on either side.
