---
description: "Task list for Full Bilingual (Arabic/English) Support with RTL/LTR"
---

# Tasks: Full Bilingual (Arabic/English) Support with RTL/LTR

**Input**: Design documents from `specs/001-bilingual-rtl-i18n/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/i18n-api.md

**Tests**: Included. The project constitution (Principle II) requires Vitest coverage for
critical frontend logic; the spec's quickstart names specific unit tests. Test tasks are
written before their implementation within each story.

**Organization**: Tasks are grouped by user story (US1–US4) so each can be implemented and
verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 (setup/foundational/polish carry no story label)
- All paths are under `frontend/` unless noted.

## Path Conventions

Web app — frontend-only feature. All work is under `frontend/src/`. Backend untouched.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the i18n module skeleton and (optional) Arabic font.

- [x] T001 Create the i18n module directory `frontend/src/lib/i18n/` and a test directory `frontend/src/lib/i18n/__tests__/`
- [x] T002 [P] Add an Arabic-capable web font via `next/font` (e.g. IBM Plex Sans Arabic or Cairo) in `frontend/src/app/layout.tsx` font setup, exposed as a CSS variable for use when `lang="ar"` (optional polish; no new npm dependency)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The i18n core that every user story depends on — locale types, dictionaries,
provider, hooks, cookie/Zustand persistence, and SSR direction wiring.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Define `Locale`/`Direction` types and the `dir` derivation helper (`ar→rtl`, `en→ltr`, invalid→default `ar`) in `frontend/src/lib/i18n/locale.ts`
- [x] T004 Create typed dictionaries `en` and `ar` as flat maps with a shared `MessageKey` union (start with shared/common keys; story phases add their own) in `frontend/src/lib/i18n/dictionaries.ts`
- [x] T005 Implement the `t(key, params?)` lookup with `{param}` interpolation and missing-key fallback (active locale → other locale → key text; never blank/throw) in `frontend/src/lib/i18n/translate.ts`
- [x] T006 Add `locale` + `setLocale(next)` to the Zustand UI store, writing the `idara-locale` cookie (`path=/`, ~1y, `SameSite=Lax`, not HttpOnly) and updating `document.documentElement.{dir,lang}` synchronously, in `frontend/src/stores/ui-store.ts`
- [x] T007 Implement `LocaleProvider` (client) seeded from an `initialLocale` prop — must NOT read localStorage on first render — and `useLocale()`/`useT()` hooks in `frontend/src/lib/i18n/locale-provider.tsx`
- [x] T008 Read the `idara-locale` cookie server-side in `frontend/src/app/layout.tsx`, set `<html lang dir>` accordingly (default `ar`/`rtl`), apply the Arabic font class when `lang="ar"`, and wrap children in `LocaleProvider initialLocale={locale}` (via `frontend/src/components/providers.tsx`)
- [x] T009 Build the `LanguageSwitcher` component (AR/EN toggle calling `setLocale`) in `frontend/src/components/language-switcher.tsx`
- [x] T010 [P] Unit test the foundational core (`dir` derivation, `t` interpolation + missing-key fallback) in `frontend/src/lib/i18n/__tests__/translate.test.ts`

**Checkpoint**: Locale can be set/read, persists, drives `<html dir/lang>` with no flash, and
the switcher exists — user stories can now begin.

---

## Phase 3: User Story 1 - Switch the entire interface language (Priority: P1) 🎯 MVP

**Goal**: A discoverable switcher on every screen flips ALL interface text between Arabic and
English (with direction), across landing, demo, auth, boards list, and board view.

**Independent Test**: Toggle the switcher on each screen; confirm every visible interface
string changes language and no wrong-language text remains.

### Tests for User Story 1

- [x] T011 [P] [US1] Unit test that a representative set of keys resolves in both `en` and `ar` and that no key returns blank, in `frontend/src/lib/i18n/__tests__/dictionaries.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Place `LanguageSwitcher` in the landing header (`frontend/src/components/landing/landing-page.tsx`) and the app top bar (`frontend/src/components/app-shell.tsx`) and the demo top bar (`frontend/src/app/demo/page.tsx`) so it is on every screen
- [x] T013 [P] [US1] Move all landing strings into dictionaries and replace literals with `t(...)` in `frontend/src/components/landing/landing-page.tsx`
- [x] T014 [P] [US1] Move all auth strings (login + signup, "Home" link, field labels, errors) into dictionaries and replace literals with `t(...)` in `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/signup/page.tsx`, `frontend/src/app/(auth)/layout.tsx`
- [x] T015 [P] [US1] Move boards-list strings (title, "New board", empty state, "tasks", role badges) into dictionaries and replace literals with `t(...)` in `frontend/src/app/(app)/boards/page.tsx` and `frontend/src/components/boards/board-card.tsx` and `frontend/src/components/boards/create-board-dialog.tsx`
- [x] T016 [P] [US1] Move board-view + kanban strings (search placeholder, "Add column", "Add task", column menu, dialogs, confirm dialog, presence/activity headers) into dictionaries and replace literals with `t(...)` in `frontend/src/app/(app)/boards/[boardId]/page.tsx`, `frontend/src/components/kanban/*.tsx`, `frontend/src/components/ui/confirm-dialog.tsx`
- [x] T017 [P] [US1] Move demo-board strings into dictionaries and replace literals with `t(...)` in `frontend/src/components/demo/demo-board.tsx` and `frontend/src/app/demo/page.tsx`
- [x] T018 [US1] Localize toast messages and form/validation error text (sonner toasts, zod messages, API error display) to use `t(...)` across the edited components
- [x] T019 [US1] Localize `<title>`/`<meta description>` per locale via `generateMetadata` reading the cookie in `frontend/src/app/layout.tsx`

**Checkpoint**: Toggling language changes 100% of interface text on every screen (SC-001).

---

## Phase 4: User Story 2 - Remember my language across visits (Priority: P2)

**Goal**: The chosen language persists across reloads, navigation, and new visits; first-time
visitors get the default (Arabic) with no flash.

**Independent Test**: Pick a language, reload/navigate, reopen the tab — it stays; clear the
cookie and load — defaults to Arabic/RTL with no flash.

### Tests for User Story 2

- [x] T020 [P] [US2] Unit test that `setLocale` persists to the cookie and that an absent/invalid cookie resolves to the default `ar`, in `frontend/src/lib/i18n/__tests__/persistence.test.ts`

### Implementation for User Story 2

- [x] T021 [US2] Verify cookie read/write round-trip: confirm the server layout reads the same value `setLocale` writes, and that client provider seeding matches the server value (no hydration mismatch) — adjust `frontend/src/app/layout.tsx` / `frontend/src/lib/i18n/locale-provider.tsx` as needed
- [x] T022 [US2] Guard against FOUC: ensure first server paint already carries correct `dir`/`lang` and the client does not re-flip on hydration (validate in `frontend/src/app/layout.tsx`)

**Checkpoint**: Language choice survives reloads and new visits; default applies with no flash
(SC-003).

---

## Phase 5: User Story 3 - Correct, readable layout in both directions (Priority: P2)

**Goal**: Every screen and interaction (forms, kanban drag-and-drop, dialogs, activity feed,
presence) mirrors correctly and stays fully usable in both RTL and LTR.

**Independent Test**: In Arabic (RTL), walk all screens + drag tasks; confirm alignment,
directional icons, and interactions are correct, and identical correctness in English (LTR).

### Implementation for User Story 3

- [x] T023 [US3] Remove all hardcoded `dir="rtl"`/`dir="ltr"` wrappers so direction inherits from `<html>` in `frontend/src/components/landing/landing-page.tsx` and `frontend/src/app/demo/page.tsx` (decide explicitly whether the demo board chrome inherits direction)
- [x] T024 [P] [US3] Convert physical Tailwind utilities to logical ones (`pl/pr`→`ps/pe`, `ml/mr`→`ms/me`, `left/right`→`start/end`, `text-left/right`→`text-start/end`, `rounded-l/r`→`rounded-s/e`) in `frontend/src/components/ui/*.tsx` and `frontend/src/components/kanban/*.tsx`
- [x] T025 [P] [US3] Convert physical→logical utilities and add `rtl:`/`ltr:` overrides for directional icons (back/forward arrows, chevrons, panel toggles) in `frontend/src/components/landing/landing-page.tsx`, `frontend/src/components/app-shell.tsx`, `frontend/src/app/(app)/boards/[boardId]/page.tsx`, `frontend/src/components/boards/*.tsx`
- [x] T026 [US3] Verify and fix dnd-kit under RTL: test horizontal column drag and cross-column task drops in Arabic; if drops misland, switch the affected DndContext from `closestCorners` to `closestCenter`/`pointerWithin` in `frontend/src/components/kanban/kanban-board.tsx` and `frontend/src/components/demo/demo-board.tsx`
- [x] T027 [US3] Apply `dir="auto"` to user-generated content blocks (board names, task titles/descriptions, labels) so mixed-language content reads correctly regardless of UI locale, in `frontend/src/components/kanban/task-card.tsx`, `frontend/src/components/boards/board-card.tsx`, and task/board dialogs

**Checkpoint**: The full Arabic (RTL) journey has zero layout defects and full functionality
parity with English (SC-004, SC-005).

---

## Phase 6: User Story 4 - Localized dates, numbers, and dynamic messages (Priority: P3)

**Goal**: Relative timestamps, activity-feed sentences, and counts read naturally in the
active language.

**Independent Test**: View the activity feed and timestamps in each language and trigger
counts/errors; confirm all dynamic content is localized and grammatically correct.

### Tests for User Story 4

- [x] T028 [P] [US4] Unit test `humanizeActivity` for every `action_type` in both locales plus unknown-type fallback to the server `message`, in `frontend/src/lib/i18n/__tests__/humanize-activity.test.ts`

### Implementation for User Story 4

- [x] T029 [P] [US4] Implement `dateFnsLocale(locale)` returning date-fns `ar`/`enUS` in `frontend/src/lib/i18n/date-locale.ts`
- [x] T030 [P] [US4] Implement `humanizeActivity(actionType, userName, payload, t)` with whole-sentence per-action templates (full backend verb set: task.created/updated/deleted/moved, column.created/renamed/deleted/reordered, board.created/updated, member.added) + unknown→server `message` fallback, in `frontend/src/lib/i18n/humanize-activity.ts` (add the templates to dictionaries)
- [x] T031 [US4] Use `humanizeActivity` and `formatDistanceToNow(..., { locale: dateFnsLocale(locale), addSuffix: true })` in `frontend/src/components/kanban/activity-feed.tsx`
- [x] T032 [P] [US4] Localize relative timestamps on the boards list ("updated X ago") via `dateFnsLocale` in `frontend/src/components/boards/board-card.tsx`
- [x] T033 [US4] Localize counts/pluralization (e.g. "{n} boards", "{n} tasks", presence "+{n}") with locale-correct forms in the boards list and board view

**Checkpoint**: All dynamic content localizes and re-localizes live on toggle (SC-002 for
feed) with correct grammar.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, docs, and quality gates across all stories.

- [x] T034 [P] Audit every screen in both languages for any remaining hardcoded literals or wrong-language strings (SC-001); fix stragglers in the relevant component files
- [x] T035 Run the full quality gate: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` in `frontend/` and fix any failures
- [x] T036 Run the `quickstart.md` verification walkthrough (SC-001…SC-006) via a Playwright pass in both locales, including the RTL core journey
- [x] T037 [P] Update `README.md` (and `docs/ARCHITECTURE.md` if relevant) to document bilingual/RTL support and the language switcher

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**.
- **User Stories (Phases 3–6)**: All depend on Foundational.
  - US1 (P1) is the MVP. US3 (RTL) depends on US1 having moved most strings/markup (shared
    files), so run US3 after US1. US2 and US4 are largely independent of US1's string moves
    but build on the foundational core.
- **Polish (Phase 7)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. The MVP.
- **US2 (P2)**: After Foundational. Independent of US1 (persistence of the core).
- **US3 (P2)**: After Foundational; best after US1 (touches the same component files for
  direction utilities).
- **US4 (P3)**: After Foundational. Independent; touches activity feed + date helpers.

### Within Each User Story

- Tests (where present) before implementation.
- Foundational core before any consumer.
- Story complete and independently testable before the next priority.

### Parallel Opportunities

- T002 (font) ∥ other setup.
- Within US1: T013–T017 are `[P]` (different component files); T012/T018/T019 follow.
- Within US3: T024 ∥ T025 (different file groups); T026/T027 follow.
- Within US4: T028/T029/T030/T032 are `[P]`; T031/T033 follow.
- US2 and US4 can proceed in parallel with US3 if staffed separately (different files), but
  all share the foundational core.

---

## Parallel Example: User Story 1

```bash
# After T012 places the switcher, translate component groups in parallel:
Task: "Move landing strings to dictionaries + t() in landing-page.tsx"      # T013
Task: "Move auth strings to dictionaries + t() in (auth)/*"                  # T014
Task: "Move boards-list strings to dictionaries + t() in boards/page.tsx"    # T015
Task: "Move board-view/kanban strings to dictionaries + t() in kanban/*"     # T016
Task: "Move demo strings to dictionaries + t() in demo-board.tsx"           # T017
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL) → 3. Phase 3 US1.
4. **STOP & VALIDATE**: toggle works and translates all interface text on every screen.
5. Demo if ready — this alone satisfies the user's core request ("a button to change
   language, fully bilingual").

### Incremental Delivery

1. Setup + Foundational → core ready.
2. US1 → full interface translation (MVP, SC-001).
3. US2 → persistence + no-flash default (SC-003).
4. US3 → correct RTL/LTR layout + dnd-kit (SC-004, SC-005).
5. US4 → localized dates/activity/counts (polish).
6. Polish → audit + gates + docs.

---

## Notes

- [P] = different files, no dependencies.
- This is a frontend-only feature: **no backend, API, or DB changes**.
- **No new runtime npm dependencies** (date-fns locales + Tailwind logical/`rtl:` are built
  in; Arabic `next/font` is optional, not a runtime dep).
- Keep all quality gates green (constitution Principle II); commit after each task or logical
  group.
- Verify dnd-kit behavior manually in RTL — it is the highest-risk item (T026).
