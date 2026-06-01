---
description: "Task list for Adopting the Liquid Glass UI Redesign"
---

# Tasks: Adopt the "Liquid Glass" UI Redesign

**Input**: Design documents from `specs/004-liquid-glass-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: No new automated tests. This is a presentation-only change with **zero logic
changes** (hooks/lib/stores/types are byte-identical to current). Verification is the
existing Vitest suite (incl. the AR/EN dictionary-parity test) + `tsc` + `eslint` +
`build`, plus a manual theme × language × accessibility pass (per quickstart.md).
Adding render tests for pure styling would be low-value churn (Constitution Principle V).

**Organization**: Tasks are grouped by user story (US1–US3).

**Context — file sync from `NewDesign/` into `frontend/`.** A diff confirmed: 3 NEW
files, 21 restyled files, `tailwind.config.ts` → `frontend/`. All logic/data/test files
are identical and MUST NOT be touched. No new dependencies. The safest path is to copy
the differing/new files verbatim (the package was authored against this codebase), then
prove no regression with the gates + manual pass.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US3 (setup/foundational/polish carry no story label)

## Path Conventions

Frontend-only: source under `frontend/src/`, Tailwind config at `frontend/`. Design
source under `NewDesign/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the integration surface before changing anything; no new deps.

- [x] T001 Verify the integration baseline with a diff of `NewDesign/` vs `frontend/src/`: confirm logic/data/test files (`hooks/*`, `lib/{api,types,endpoints,board-logic,utils,demo-data}`, `lib/i18n/*` except `dictionaries.ts`, `stores/*`, all tests) are byte-identical and that every external import in `NewDesign/` already exists in `frontend/package.json` (no installs needed) — establishes the "do not touch logic / no new deps" baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Install the design-token system — the Tailwind config + CSS tokens that
every restyled component renders against. Until these land, restyled components would
render with the old color semantics, so this phase blocks all user stories.

**⚠️ CRITICAL**: Complete before the user-story phases.

- [x] T002 Replace `frontend/tailwind.config.ts` with `NewDesign/tailwind.config.ts` (colors via `rgb(var(--x) / <alpha-value>)`, bumped radii, `boxShadow.glass`/`glass-sm`); confirm it sits at `frontend/tailwind.config.ts` (one level above `src/`)
- [x] T003 Replace `frontend/src/app/globals.css` with `NewDesign/app/globals.css` (token `:root` dark + `html.light` overrides, `.glass-frost`/`.glass-clear`/`.glass-bar` utilities, `.tf-aurora`, and the `prefers-reduced-transparency` / `prefers-reduced-motion` fallbacks)
- [x] T004 [P] Update `frontend/src/lib/i18n/dictionaries.ts` to add the 8 new keys (`auth.login.forgot`, `auth.forgot.title/subtitle/submit/back/sent.title/sent.desc/sentAgain`) to BOTH `en` and `ar`, copying the values from `NewDesign/lib/i18n/dictionaries.ts`; remove no existing keys (the AR/EN parity test must stay green)

**Checkpoint**: Tokens, glass utilities, and the new strings exist — restyled screens
will now render with the new look and the dictionary stays in parity.

---

## Phase 3: User Story 1 - The whole app wears the new look (Priority: P1) 🎯 MVP

**Goal**: Every existing screen and shared element shows the Liquid Glass styling
(glass floating chrome over the aurora; solid, readable work surfaces), with no
behavior change.

**Independent Test**: Walk every screen (landing → login/signup → boards list → a board
with cards & dialogs → demo) and confirm the new styling everywhere, and that existing
actions still work identically.

### Implementation for User Story 1

- [x] T005 [P] [US1] Replace `frontend/src/components/ui/button.tsx` with the `NewDesign/` version (gradient/glass primary & secondary, inset highlight, press effect)
- [x] T006 [P] [US1] Replace `frontend/src/components/ui/dialog.tsx` with the `NewDesign/` version (glass scrim/material)
- [x] T007 [P] [US1] Replace `frontend/src/components/ui/misc.tsx` with the `NewDesign/` version (avatar/spinner/empty-state styling)
- [x] T008 [P] [US1] Replace `frontend/src/components/language-switcher.tsx` with the `NewDesign/` version (`.glass-clear`)
- [x] T009 [P] [US1] Replace `frontend/src/components/landing/landing-page.tsx` with the `NewDesign/` version
- [x] T010 [P] [US1] Replace `frontend/src/components/boards/board-card.tsx` with the `NewDesign/` version
- [x] T011 [P] [US1] Replace `frontend/src/components/demo/demo-board.tsx` with the `NewDesign/` version
- [x] T012 [P] [US1] Replace `frontend/src/components/kanban/column.tsx`, `frontend/src/components/kanban/task-card.tsx`, and `frontend/src/components/kanban/presence-bar.tsx` with their `NewDesign/` versions
- [x] T013 [P] [US1] Replace `frontend/src/app/(app)/boards/[boardId]/page.tsx` and `frontend/src/app/demo/page.tsx` with their `NewDesign/` versions
- [x] T014 [US1] Replace `frontend/src/components/providers.tsx` with the `NewDesign/` version (Toaster `theme="system"` + glass styling)

**Checkpoint**: The whole app renders in Liquid Glass; all existing flows behave as
before (US1; SC-001, SC-002). Theme toggle (US2) not wired yet — app shows default dark.

---

## Phase 4: User Story 2 - Switch between Light and Dark themes (Priority: P1)

**Goal**: A visible toggle (top bar + auth screens) switches the whole UI Dark↔Light
instantly, persists across visits, applies before first paint (no flash), defaults Dark.

**Independent Test**: Toggle Dark→Light (whole UI incl. glass swaps); reload (persists,
no flash); a fresh user starts Dark.

### Implementation for User Story 2

- [x] T015 [P] [US2] Add the new `frontend/src/components/backdrop.tsx` (fixed `.tf-aurora` brand layer) from `NewDesign/`
- [x] T016 [P] [US2] Add the new `frontend/src/components/theme-switcher.tsx` (toggles the `light`/`dark` class on `<html>`, persists to `localStorage` `idara-theme`) from `NewDesign/`
- [x] T017 [US2] Edit `frontend/src/app/layout.tsx` to add the no-flash inline `<script>` (reads `localStorage['idara-theme']`, sets the `light`/`dark` class before first paint) just before `<Providers>`, matching `NewDesign/app/layout.tsx`
- [x] T018 [US2] Replace `frontend/src/components/app-shell.tsx` with the `NewDesign/` version (mounts `<ThemeSwitcher/>` in the top bar; `.glass-bar` header; gradient logo) — depends on T016
- [x] T019 [US2] Replace `frontend/src/app/(app)/layout.tsx` with the `NewDesign/` version (renders `<Backdrop/>`, `z-10` content wrapper) — depends on T015

**Checkpoint**: Theme switching works end-to-end with no flash and persists; aurora
backdrop renders behind the app (US2; SC-003, SC-004).

---

## Phase 5: User Story 3 - "Forgot password" entry on login (Priority: P3)

**Goal**: A "Forgot password?" link on login leads to a bilingual, redesigned screen
that validates the email and shows a confirmation. UI-only (no email sent — decided).

**Independent Test**: From login → "Forgot password?" → submit a valid email → see the
confirmation; invalid email is blocked; screen reads correctly in AR and EN.

### Implementation for User Story 3

- [x] T020 [US3] Add the new `frontend/src/app/(auth)/forgot-password/page.tsx` (validates email, shows `auth.forgot.sent.*` confirmation, **no API call**) from `NewDesign/`
- [x] T021 [US3] Replace `frontend/src/app/(auth)/login/page.tsx` with the `NewDesign/` version (adds the `auth.login.forgot` link to `/forgot-password`; glass form) and `frontend/src/app/(auth)/signup/page.tsx` (glass form)
- [x] T022 [US3] Replace `frontend/src/app/(auth)/layout.tsx` with the `NewDesign/` version (renders `<Backdrop/>` + `<ThemeSwitcher/>`, glass styling) — depends on T015, T016

**Checkpoint**: Forgot-password reachable from login, validates, confirms, bilingual
(US3; SC-007). Theme toggle present on auth screens too.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Remove the staging folder, run all gates, verify visually, update docs.

- [x] T023 Delete the `NewDesign/` staging folder now that its content lives in `frontend/` (single source of truth)
- [x] T024 Run the frontend gates: `npm run lint && npx tsc --noEmit && npm run test && npm run build`; fix any failures (the AR/EN dictionary-parity Vitest test must pass)
- [ ] T025 Manual verification per `quickstart.md`: the new look on every screen (SC-001); existing actions unchanged (SC-002); theme toggle instant + persists + no flash + Dark default (SC-003); all four theme×language combos (SC-004); reduced-transparency/motion fallbacks (SC-005); forgot-password flow (SC-007); AR strings intact (SC-006)
- [x] T026 [P] Update `README.md` (features table) to note the Liquid Glass design + light/dark theme toggle

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — baseline diff check.
- **Foundational (Phase 2)**: tokens + config + strings — blocks all stories (restyled
  components need the tokens to render correctly).
- **US1 (P1, MVP)**: after Foundational. The bulk of the restyle.
- **US2 (P1)**: after Foundational. Adds Backdrop + ThemeSwitcher + no-flash script and
  wires them into app-shell/app-layout. Shares `app-shell.tsx`/`(app)/layout.tsx` with
  the look, so its replacements supersede US1's default rendering of those shells.
- **US3 (P3)**: after Foundational; the auth layout (T022) depends on the new Backdrop +
  ThemeSwitcher (T015, T016).
- **Polish (Phase 6)**: after the targeted stories; T023 (delete NewDesign) must come
  after every copy task; T024/T025 verify the whole thing.

### User Story Dependencies

- US1 → independent look adoption.
- US2 → needs Foundational; its shell replacements build on US1's surfaces.
- US3 → auth layout depends on US2's new components (Backdrop, ThemeSwitcher).

### Within Each Story

- Different files → parallel `[P]`. Files touched by more than one task run sequentially
  (e.g. `(auth)/layout.tsx` only in T022; `app-shell.tsx` only in T018).

### Parallel Opportunities

- Phase 2: T004 `[P]` runs alongside T002/T003 (different files; though T002+T003 pair
  conceptually, they are different files and can be applied together).
- US1: T005–T013 are all `[P]` (distinct files); T014 (providers) is also independent.
- US2: T015 ∥ T016 (two new files); T017/T018/T019 follow.
- Most copy tasks across stories are independent file writes and could be batched, but
  keep the story grouping for traceability and checkpointing.

---

## Parallel Example: User Story 1 (independent file copies)

```bash
Task: "Replace ui/button.tsx"          # T005
Task: "Replace ui/dialog.tsx"          # T006
Task: "Replace ui/misc.tsx"            # T007
Task: "Replace language-switcher.tsx"  # T008
Task: "Replace landing-page.tsx"       # T009
Task: "Replace board-card.tsx"         # T010
Task: "Replace kanban column/task-card/presence-bar"  # T012
```

---

## Implementation Strategy

### MVP First (Foundational + US1)

1. Phase 1 (baseline) → Phase 2 (tokens/config/strings).
2. US1 — restyle every surface. **STOP & VALIDATE**: the app looks fully redesigned and
   every existing action still works (the headline ask: "make the new design the main
   design").

### Incremental Delivery

1. Setup + Foundational → token system in place.
2. US1 → whole-app look (MVP, SC-001/SC-002).
3. US2 → light/dark theme toggle + aurora (SC-003/SC-004).
4. US3 → forgot-password screen (SC-007).
5. Polish → remove NewDesign, gates, manual a11y/RTL pass (SC-005/SC-006), docs.

---

## Notes

- [P] = different files, no dependencies.
- **Presentation-only**: do NOT modify hooks/lib/stores/types/tests (verified identical).
  **No new dependencies.** No backend, no migration.
- Theme is client UI state in `localStorage` — kept out of server state (Principle I).
- Forgot-password ships UI-only (no email) by explicit decision; a real reset flow is a
  separate future feature.
- Keep all frontend gates green (Principle II); commit after each phase or logical group.

## Implementation status

All tasks complete except **T025** (manual theme × language × accessibility
walkthrough), which was not run in this headless session. Correctness is otherwise
covered by the green gates (T024): `tsc --noEmit`, `eslint`, 36 Vitest tests
(including the AR/EN dictionary-parity test), and a clean `next build` (the new
`/forgot-password` route is in the build output). The visual/RTL/a11y pass per
`quickstart.md` remains for a manual check.
```
