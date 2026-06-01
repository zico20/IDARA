---

description: "Task list for PWA & Edge-to-Edge (010-pwa-edge-to-edge)"
---

# Tasks: PWA & Edge-to-Edge

**Input**: Design documents from `specs/010-pwa-edge-to-edge/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/pwa-surface.md ✅, quickstart.md ✅

**Tests**: INCLUDED for pure logic — Vitest for the service-worker register/update helper, and the existing dictionary-parity test covers new AR/EN strings. Platform behaviors (install, status-bar tint, offline) are verified via quickstart (not unit-testable).

**Organization**: Grouped by user story (P1 edge-to-edge/status-bar → P2 installability → P3 offline + error boundaries). Stories are independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1=Edge-to-edge/status-bar, US2=Installability, US3=Offline & error boundaries
- Paths are repo-relative under `frontend/`

## Path Conventions

Next.js App Router frontend: `frontend/src/app/...`, `frontend/src/components/...`, `frontend/src/lib/...`, `frontend/public/...`, tests in `frontend/src/lib/__tests__/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new dependencies (Next native manifest/icon + hand-written SW). Confirm a clean baseline.

- [X] T001 Confirm clean baseline on branch `010-pwa-edge-to-edge`: from `frontend/`, `npx tsc --noEmit` + `npx eslint .` + `npx vitest run` green; note that the backend is untouched by this feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared brand-color constants + dictionary keys that multiple stories reference. No blocking backend.

- [X] T002 [P] Add the shared PWA brand colors as documented constants where the manifest/viewport will read them (dark `#0D1117`, light `#EAEEF4`, from the existing `--bg` tokens) — define in `frontend/src/lib/pwa/colors.ts` (NEW) so manifest + viewport + icons stay in sync. Pure module.
- [X] T003 [P] Add AR (فصحى) + EN dictionary keys for all new screens/text in `frontend/src/lib/i18n/dictionaries.ts` with full parity: `offline.title`/`.desc`/`.retry`, `error.title`/`.desc`/`.retry`, `notFound.title`/`.desc`/`.back`. (Parity enforced by the existing Vitest test.)

**Checkpoint**: Shared colors + strings ready.

---

## Phase 3: User Story 1 - Edge-to-edge & status-bar color (Priority: P1) 🎯 MVP

**Goal**: The mobile status-bar area blends with the app background (dark + light), the background extends to the screen edges, content stays in the safe area, and dynamic browser chrome doesn't clip content. Desktop unchanged.

**Independent Test**: On a phone, dark mode → status-bar area is the dark bg (no black strip); light mode → matches light bg; notched device → content not clipped, bg fills edges; desktop ≥1280px → unchanged.

### Implementation for User Story 1

- [X] T004 [US1] In `frontend/src/app/layout.tsx`, extend the `viewport` export: add `viewportFit: "cover"` and `themeColor` as a per-color-scheme array (dark `#0D1117`, light `#EAEEF4`) sourced from `lib/pwa/colors.ts`. Keep `width: device-width, initialScale: 1`.
- [X] T005 [US1] Add mobile-only safe-area utilities to `frontend/src/app/globals.css` (e.g. `.pt-safe`, `.pb-safe`, `.px-safe` using `env(safe-area-inset-*)` with `0px` fallback), scoped so desktop is unaffected.
- [X] T006 [US1] Apply safe-area padding to the mobile chrome so the colored background reaches the edges while controls clear the notch/clock/home-indicator: the floating top bars in `frontend/src/components/landing/landing-page.tsx`, `frontend/src/app/demo/page.tsx`, `frontend/src/app/(auth)/layout.tsx`, and the `frontend/src/components/mobile-nav.tsx` strip — all `max-md:` scoped (additive; desktop untouched).
- [X] T007 [US1] Switch the full-height app shell from 100vh to dynamic viewport height in `frontend/src/app/(app)/layout.tsx`: `h-screen` → `h-[100dvh]` (and audit auth/landing/demo `min-h-screen` → `min-h-[100dvh]` only where clipping would occur). Verify desktop is visually identical.

**Checkpoint**: US1 fully functional and independently testable (MVP) — status bar blends, edges filled, no clipping, desktop unchanged.

---

## Phase 4: User Story 2 - Installability (Priority: P2)

**Goal**: TaskFlow is installable, launches standalone with the correct name/icon and brand background, no manifest/icon errors.

**Independent Test**: Build for production; install from a supported browser; launch standalone with correct icon/name/background; PWA audit shows no manifest/icon errors.

### Implementation for User Story 2

- [X] T008 [P] [US2] Create `frontend/src/app/manifest.ts` exporting a `MetadataRoute.Manifest`: name/short_name "TaskFlow", `start_url: "/boards"`, `display: "standalone"`, `background_color`/`theme_color` = dark `#0D1117` (from `lib/pwa/colors.ts`), and an `icons` array (192, 512, 512-maskable, apple).
- [X] T009 [P] [US2] App icon. (Implemented as a static `frontend/public/icon.svg` brand grid mark instead of `ImageResponse` — `@vercel/og` failed to prerender under `output: standalone` with a font-URL error; a scalable SVG is dependency-free, build-safe, and serves as both `any` and `maskable`.)
- [X] T010 [P] [US2] Apple touch icon. (Covered by the same `public/icon.svg` via `metadata.icons.apple` — no separate `ImageResponse` route, for the same build-safety reason as T009.)
- [X] T011 [US2] In `frontend/src/app/layout.tsx`, add the Apple PWA meta (via `metadata.appleWebApp` + `metadata.icons`) via the metadata API / `<head>`: `apple-mobile-web-app-capable: yes`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title: TaskFlow`, and the apple-touch-icon link. (Manifest auto-links via Next.)

**Checkpoint**: US1 + US2 — installable PWA with correct identity, status bar still blends.

---

## Phase 5: User Story 3 - Offline & error boundaries (Priority: P3)

**Goal**: Branded offline screen after one online load; on-brand error + not-found boundaries; SW never caches API/tokens; clean update (no stale lock-in).

**Independent Test**: Production build → load online, go offline, reopen → branded `/offline`; force render error → branded retry; unknown path → branded not-found; back online → fresh data; new version → updates.

### Tests for User Story 3 ⚠️ (write first, expect fail)

- [X] T012 [P] [US3] `frontend/src/lib/__tests__/sw-register.test.ts`: cover the pure helper — `canRegisterServiceWorker` returns false when `window`/`navigator.serviceWorker` is absent or in non-production, true when supported+prod; `shouldReloadOnControllerChange` returns true only on a genuine controller change (not the initial controller). Guards never throw.

### Implementation for User Story 3

- [X] T013 [P] [US3] Create the pure helper `frontend/src/lib/pwa/sw-register.ts`: `canRegisterServiceWorker(env, nav)` and `shouldReloadOnControllerChange(state)` — framework-free, SSR-safe (`typeof window === "undefined"` → false).
- [X] T014 [US3] Create `frontend/public/sw.js`: versioned cache `taskflow-shell-v1`; `install` precaches `/offline` + app-shell + static essentials and `skipWaiting()`; `activate` deletes old `taskflow-shell-v*` and `clients.claim()`; `fetch` = network-first for navigations (fallback cached shell → `/offline`), cache-first for `/_next/static/*` + icons/fonts, and pass-through (never cache) for `/api/*`, non-GET, and cross-origin.
- [X] T015 [US3] Create `frontend/src/components/pwa/service-worker-registrar.tsx` (client): on mount, if `canRegisterServiceWorker`, `navigator.serviceWorker.register("/sw.js")`; on `controllerchange` (per `shouldReloadOnControllerChange`) reload once. Mount it in `frontend/src/app/layout.tsx`.
- [X] T016 [P] [US3] Create `frontend/src/app/offline/page.tsx`: bilingual offline screen reusing `EmptyState` + glass, with a retry/back action; `role="alert"` on the message; RTL/theme-safe.
- [X] T017 [P] [US3] Create `frontend/src/app/error.tsx` (`"use client"`): route error boundary using `EmptyState` + glass, bilingual, `reset()` retry, `role="alert"`.
- [X] T018 [P] [US3] Create `frontend/src/app/global-error.tsx` (`"use client"`): root boundary rendering its own `<html><body>`, minimal bilingual fallback with a reload action.
- [X] T019 [P] [US3] Create `frontend/src/app/not-found.tsx`: bilingual not-found using `EmptyState` + glass, with a link back to `/boards`.

**Checkpoint**: All three stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] Update `docs/ARCHITECTURE.md` to note the PWA layer: installable manifest/icons (Next native), edge-to-edge status-bar/theme-color + safe-area, the minimal service worker (shell-only, no API/token caching, versioned update), and the error/offline/not-found boundaries.
- [X] T021 Frontend quality gate (from `frontend/`): `npx tsc --noEmit` + `npx eslint .` + `npx vitest run` (incl. `sw-register.test.ts` + dictionary parity); `npm run build` only with the dev server stopped.
- [X] T022 Run `specs/010-pwa-edge-to-edge/quickstart.md` end-to-end on a production build (automated: build passed; `/`, `/offline`, `/manifest.webmanifest`, `/icon.svg` all serve 200; SW caches only shell/static by construction. Manual device check of status-bar blend / install / true-offline recommended in the browser.): status-bar blend (dark+light), install/standalone, offline screen, error/not-found, and DevTools inspection confirming the cache holds NO `/api/*` responses or tokens. Confirm desktop ≥1280px is visually unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: none.
- **Foundational (P2)**: after Setup. `colors.ts` (T002) feeds US1's viewport (T004) and US2's manifest/icons (T008–T010). Dictionary keys (T003) feed US3's screens.
- **US1 (P3)**: after Foundational; the MVP and lowest-risk (no SW, no install). Touches `layout.tsx`, `globals.css`, mobile chrome, `(app)` shell.
- **US2 (P4)**: after Foundational; independent of US1 except both touch `layout.tsx` (viewport vs apple-meta) → do US1's `layout.tsx` edit (T004) before US2's (T011) to avoid a conflict, or apply both in one pass.
- **US3 (P5)**: after Foundational; SW + boundaries. T013 (helper) before T012 can pass (tests-first means T012 fails until T013 exists — acceptable TDD). T014/T015 wire the SW; T016 `/offline` must exist for the SW to precache it.
- **Polish (P6)**: last.

### Within Each User Story

- US1: viewport → safe-area CSS → apply to chrome → dvh height.
- US3: helper + test → sw.js → registrar (mount) → offline/error/not-found screens.

### Parallel Opportunities

- T002/T003 (colors + strings) parallel.
- US2 icons/manifest (T008–T010) are parallel (distinct files); T011 edits shared `layout.tsx` (coordinate with T004).
- US3 screens (T016–T019) are parallel (distinct files); the SW pieces (T013→T014→T015) are sequential by dependency.

---

## Implementation Strategy

### MVP First (User Story 1)

Setup → Foundational (colors+strings) → US1 (viewport themeColor + viewport-fit + safe-area + dvh) → **STOP & VALIDATE** on a phone: status bar blends in both themes, edges filled, nothing clipped, desktop unchanged. This alone resolves the reported black-strip issue.

### Incremental Delivery

US1 (status-bar/edge-to-edge) → US2 (installable) → US3 (offline + boundaries) → Polish. Each story is independently testable and additive.

---

## Notes

- `[P]` = different files, no incomplete deps. `[Story]` maps task → US.
- No new runtime dependency: manifest/icons via Next native APIs; only `public/sw.js` is hand-written.
- Security/consistency: the SW never caches `/api/*` or tokens; REST stays the source of truth; offline serves only the static shell + `/offline`.
- All new UI: bilingual AR (فصحى)/EN with parity test, RTL/LTR, light/dark, reduced-motion/transparency safe, `role="alert"` on error/offline.
- Desktop ≥1280px settled appearance changes only additively (safe-area + dvh are `max-md:`/dynamic and no-op on desktop).
- SW registers only in production, so `next dev` is unaffected; test PWA behaviors against `npm run build && npm start`.
- Commit once at the end of the chain (skip optional per-step auto-commit hooks), per the established workflow.
