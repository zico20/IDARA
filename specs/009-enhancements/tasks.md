---

description: "Task list for Tasks Power Features & Analytics (009-enhancements)"
---

# Tasks: Tasks Power Features & Analytics

**Input**: Design documents from `specs/009-enhancements/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: INCLUDED — the spec + constitution require pytest (backend, ≥70%) and Vitest (pure frontend logic + AR/EN dictionary parity).

**Organization**: Grouped by user story (P1 Assignee → P2 Type → P3 Analytics → P3 Calendar). Stories are independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1=Assignee, US2=Task Type, US3=Analytics, US4=Calendar
- Paths are repo-relative: `backend/...`, `frontend/...`

## Path Conventions

Web app: `backend/app/...` + `backend/tests/...`, `frontend/src/...` + `frontend/src/lib/__tests__/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new tooling/deps needed (CSS/SVG charts + existing date-fns). Just confirm a clean baseline.

- [X] T001 Confirm clean baseline on branch `009-enhancements`: backend `pytest` + `ruff check .` green; frontend `npx tsc --noEmit` + `npx eslint .` + `npx vitest run` green. Record any pre-existing issues before adding code.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The Task model/schema/migration extension is shared by US1 (assignee) and US2 (type). It MUST land before US1/US2 UI. US3/US4 (frontend-only views) depend only on the frontend types being extended (T008).

**⚠️ CRITICAL**: US1 and US2 backend work cannot begin until T002–T007 are complete.

- [X] T002 Add `TaskType(str, Enum)` (`task`/`feature`/`improvement`) and the `assignee_id` FK column (`users.id`, nullable, `ondelete="SET NULL"`, indexed), the `type` column (`SAEnum(TaskType, name="task_type")`, not null, default `TaskType.task`), and an `assignee` relationship in `backend/app/models/task.py` (mirror the existing `TaskPriority`/FK idioms).
- [X] T003 Create Alembic migration `backend/alembic/versions/<rev>_add_assignee_and_type.py` with `down_revision = "a1b2c3d4e5f6"`: add `assignee_id` + FK (`SET NULL`) + index and `type` (`sa.Enum(name="task_type")`, not null, `server_default='task'`); provide a clean `downgrade()`. Use `batch_alter_table` for SQLite/Postgres portability.
- [X] T004 Extend Pydantic schemas in `backend/app/schemas/task.py`: `TaskCreate` (`assignee_id: int | None = None`, `type: TaskType = TaskType.task`), `TaskUpdate` (`assignee_id: int | None = None`, `type: TaskType | None = None`), `TaskPublic` (`assignee_id: int | None`, `type: TaskType`, `assignee: UserPublic | None = None`); update the existing `model_validator(mode="before")` to carry the new fields through the reconstructed dict.
- [X] T005 Update `backend/app/repositories/task_repo.py`: `create`/`update` accept and persist `assignee_id` + `type`; eager-load `Task.assignee` (e.g. `selectinload(Task.assignee)`) in the get/list queries so `TaskPublic.assignee` serializes without a lazy-load.
- [X] T006 Add `_validate_assignee_on_board(db, *, board_id, assignee_id)` to `backend/app/services/task_service.py` (reuse `board_repo.get_member`); raise the project's structured **422** `invalid_assignee` when `assignee_id` is not null and not a board member. Wire it into both `create_task` and `update_task` (only validate when `assignee_id` is provided / changing).
- [X] T007 Verify `backend/app/api/routes/tasks.py` needs no logic change (schemas propagate; `task.created`/`task.updated` already serialize full `TaskPublic` with `actor_id`). Add only what's needed so the new fields flow through (no new WS events).
- [X] T008 [P] Extend frontend shared types in `frontend/src/lib/types.ts`: add `TaskType = "task" | "feature" | "improvement"`; add `assignee_id: number | null`, `assignee: User | null`, `type: TaskType` to `Task`. (Unblocks all four stories' frontend.)
- [X] T009 [P] Update mock/demo Task objects so they compile with the new required `type` field: `frontend/src/lib/demo-data.ts`, `frontend/src/components/demo/demo-board.tsx`, and any board-logic test fixtures (default `type: "task"`, `assignee_id: null`, `assignee: null`).

**Checkpoint**: Model + migration + schemas + service validation + frontend types ready.

---

## Phase 3: User Story 1 - Assignee (Priority: P1) 🎯 MVP

**Goal**: Editors/owners assign a task to a board member; avatar on card + Select in dialog; assignee filter; real-time; viewers read-only; non-member rejected (422); SET NULL on member/user removal.

**Independent Test**: On a board with ≥2 members, assign a task, see the avatar on the card, reload to confirm persistence, see it update live on a second session, and filter by that assignee. Assigning a non-member fails; a viewer cannot change it.

### Tests for User Story 1 ⚠️ (write first, expect fail)

- [X] T010 [P] [US1] `backend/tests/test_assignee.py`: editor/owner can set & clear assignee (200 + persisted); `TaskPublic.assignee` returns the member's public info.
- [X] T011 [P] [US1] In `backend/tests/test_assignee.py`: assigning to a non-member → **422** `invalid_assignee`, task unchanged; viewer attempting to set assignee → **403**; non-member → **404**.
- [X] T012 [P] [US1] In `backend/tests/test_assignee.py`: FK `SET NULL` behavior — removing the assignee's membership (and/or deleting the user) leaves the task and clears `assignee_id` (FR-007).
- [X] T013 [P] [US1] Extend `frontend/src/lib/__tests__/task-filter-sort.test.ts`: tasks pass/fail the new `assigneeFilter` conjunctively with existing filters + search; empty filter = all.

### Implementation for User Story 1

- [X] T014 [US1] Extend the filter pipeline in `frontend/src/lib/task-filter-sort.ts`: add `assigneeFilter: number[]` to `ViewState` + `EMPTY_VIEW`; add the conjunctive check to `taskMatches`; include it in `isViewActive`.
- [X] T015 [US1] Extend `frontend/src/stores/board-view-store.ts`: add `setAssignee`/`toggleAssignee` (UI-only, per board).
- [X] T016 [US1] Add an Assignee `Select` (board members + an "Unassigned" option) to `frontend/src/components/kanban/task-dialog.tsx`, wired to create/update; disabled/read-only for viewers; reuse the existing `Select` primitive.
- [X] T017 [US1] Show the assignee avatar on `frontend/src/components/kanban/task-card.tsx` (reuse `Avatar`; additive, RTL/theme-safe).
- [X] T018 [US1] Add an assignee filter control (members + "All") to `frontend/src/components/kanban/board-filter-bar.tsx`, consistent with existing label/priority/due controls; drives `assigneeFilter`.
- [X] T019 [P] [US1] Add AR/EN dictionary keys for assignee UI (e.g. `task.assignee`, `task.unassigned`, `filter.assignee`, `filter.allAssignees`) in `frontend/src/lib/i18n/dictionaries.ts` with full parity.

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Task Type (Priority: P2)

**Goal**: Each task has a type (Task/Feature/Improvement, default Task) shown as an icon+color badge on card/dialog, editable via Select, and filterable.

**Independent Test**: Create a task (defaults to Task), change a task to Feature/Improvement (badge shows + broadcasts), filter by type.

### Tests for User Story 2 ⚠️

- [X] T020 [P] [US2] `backend/tests/test_task_type.py`: a task created without `type` defaults to `task`; editor can set `feature`/`improvement` (200 + persisted); invalid value → **422**.
- [X] T021 [P] [US2] Extend `frontend/src/lib/__tests__/task-filter-sort.test.ts`: `typeFilter` filters conjunctively; empty = all.

### Implementation for User Story 2

- [X] T022 [P] [US2] Create pure `frontend/src/lib/task-type.ts`: `TASK_TYPE_META` mapping each type → `{ icon, color, labelKey }` (legible light/dark + RTL).
- [X] T023 [US2] Extend `frontend/src/lib/task-filter-sort.ts`: add `typeFilter: TaskType[]` to `ViewState`/`EMPTY_VIEW`; conjunctive check in `taskMatches`; include in `isViewActive`.
- [X] T024 [US2] Extend `frontend/src/stores/board-view-store.ts`: add `toggleType` (UI-only).
- [X] T025 [US2] Add a Type `Select` to `frontend/src/components/kanban/task-dialog.tsx` (defaults to Task on create; read-only for viewers).
- [X] T026 [US2] Render the type badge (icon+color from `task-type.ts`) on `frontend/src/components/kanban/task-card.tsx` (additive).
- [X] T027 [US2] Add a type filter control to `frontend/src/components/kanban/board-filter-bar.tsx`.
- [X] T028 [P] [US2] Add AR/EN dictionary keys (`type.task`, `type.feature`, `type.improvement`, `filter.type`, `filter.allTypes`) in `frontend/src/lib/i18n/dictionaries.ts` with parity.

**Checkpoint**: US1 + US2 both independently functional.

---

## Phase 5: User Story 3 - Analytics (Priority: P3)

**Goal**: A per-board Analytics view with completion rate, active/overdue counts, team size, and three CSS/SVG charts (by status / priority / type), computed client-side from the loaded snapshot + members.

**Independent Test**: On a board with known tasks, every metric/chart matches a hand computation; empty board → zeros + empty states; AR/RTL + dark/light legible.

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] `frontend/src/lib/__tests__/analytics.test.ts`: `computeBoardAnalytics` returns correct `total/complete/active/completionRate/overdue/teamSize/byStatus/byPriority/byType` on a representative board; empty board → all zeros, no division-by-zero; "complete = last column" rule verified (incl. single-column board).

### Implementation for User Story 3

- [X] T030 [P] [US3] Create pure `frontend/src/lib/analytics.ts`: `computeBoardAnalytics(snapshot, members)` per data-model (last-column = complete; overdue via `dueInfo`).
- [X] T031 [P] [US3] Create CSS/SVG chart primitives in `frontend/src/components/analytics/`: a stat card, a vertical bar chart (by status), and a labeled proportion bar (priority/type) — token-driven, RTL/theme-safe, no animation under reduced-motion.
- [X] T032 [US3] Create `frontend/src/components/analytics/analytics-view.tsx` composing the stat cards + three charts from `computeBoardAnalytics`, with an empty state.
- [X] T033 [P] [US3] Add AR/EN dictionary keys (`analytics.completionRate`, `.active`, `.overdue`, `.teamSize`, `.byStatus`, `.byPriority`, `.byType`, `.empty`) in `frontend/src/lib/i18n/dictionaries.ts` with parity.

**Checkpoint**: Analytics view renders correctly and independently (wired into the board in Phase 7).

---

## Phase 6: User Story 4 - Calendar (Priority: P3)

**Goal**: A monthly grid placing due-dated tasks on their day, month paging, overdue marking, click-to-open the existing TaskDialog. Zero backend.

**Independent Test**: Tasks land on correct days; paging (incl. leap-Feb) works; clicking opens the dialog; undated tasks absent; overdue marked.

### Tests for User Story 4 ⚠️

- [X] T034 [P] [US4] `frontend/src/lib/__tests__/calendar.test.ts`: `buildMonthGrid(year, month, weekStart)` returns a correct 6×7 grid (leading/trailing days flagged, month start on any weekday, leap-year Feb); `mapTasksToDays` groups due-dated tasks by local day and omits undated ones.

### Implementation for User Story 4

- [X] T035 [P] [US4] Create pure `frontend/src/lib/calendar.ts`: `buildMonthGrid` + `mapTasksToDays` using existing `date-fns`; week start derived from locale (ar=Sat, en=Sun).
- [X] T036 [US4] Create `frontend/src/components/calendar/calendar-view.tsx` (month grid + prev/next paging; overdue days marked via `dueInfo`; click a task → call the board page's existing open-task handler), reusing Liquid Glass tokens.
- [X] T037 [P] [US4] Add AR/EN dictionary keys (`calendar.title`, `.prevMonth`, `.nextMonth`, `.today`, weekday/month labels if not already localized via date-fns) in `frontend/src/lib/i18n/dictionaries.ts` with parity.

**Checkpoint**: Calendar view renders correctly and independently (wired into the board in Phase 7).

---

## Phase 7: Integration — Board View Switcher

**Purpose**: Surface Analytics + Calendar on the board page without changing the default Board view's settled desktop appearance.

- [X] T038 Add an additive view switcher (Board | Analytics | Calendar) to `frontend/src/app/(app)/boards/[boardId]/page.tsx` using existing glass/Select idioms; default = Board (unchanged). Pass the already-loaded snapshot + members to `AnalyticsView`; pass the snapshot + the existing open-task handler to `CalendarView`.

**Checkpoint**: All four stories reachable from the board.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T039 [P] Update `docs/ARCHITECTURE.md` (and README if user-facing) to note assignee, task type, analytics, and calendar (per constitution docs rule).
- [X] T040 Backend quality gate: `pytest` (≥70% coverage, incl. new tests) + `ruff check .` from `backend/`.
- [X] T041 Frontend quality gate: `npx tsc --noEmit` + `npx eslint .` + `npx vitest run` (incl. dictionary-parity test) from `frontend/`; `npm run build` only with the dev server stopped.
- [X] T042 Run `specs/009-enhancements/quickstart.md` end-to-end (automated API smoke test confirmed assignee/type create + 422/403/SET-NULL via pytest; manual AR/RTL + second-session real-time check recommended in the browser) (signup → board with members → assign → type → analytics → calendar), confirming real-time on a second session and AR/RTL + dark/light.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: none.
- **Foundational (P2)**: after Setup. Backend (T002–T007) BLOCKS US1/US2 implementation. Frontend types (T008–T009) BLOCK all four stories' frontend.
- **US1 (P3)** and **US2 (P4)**: after Foundational. Both touch `task-dialog.tsx`, `task-card.tsx`, `board-filter-bar.tsx`, `task-filter-sort.ts`, `board-view-store.ts`, `dictionaries.ts` → do US1 fully, then US2 (sequential on shared files), to avoid conflicts.
- **US3 (P5)** & **US4 (P6)**: after Foundational; independent of US1/US2 and of each other (US3's type chart is richer once US2 lands, but doesn't block). Can be built in parallel with each other (different files).
- **Integration (P7)**: after the views (US3/US4) exist.
- **Polish (P8)**: last.

### Within Each User Story

- Tests first (expect fail) → lib/logic → store → dialog/card → filter → i18n.

### Parallel Opportunities

- T008/T009 (frontend types + fixtures) parallel with each other.
- All `[P]` test tasks within a story (different files) parallel.
- US3 and US4 pure libs/components (T029–T037) are largely `[P]` across the two stories (distinct files).
- i18n tasks are `[P]` only if edits target distinct keys/sections (same file → coordinate to avoid conflicts).

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational (model+migration+schema+service+frontend types) → 3. Phase 3 US1 (Assignee) → **STOP & VALIDATE** (assign, persist, real-time, filter, 422/403, SET NULL).

### Incremental Delivery

US1 (MVP) → US2 (Type) → US3 (Analytics) → US4 (Calendar) → Integration → Polish. Each story is independently testable and adds value without breaking the previous.

---

## Notes

- `[P]` = different files, no incomplete dependencies. `[Story]` maps task → US for traceability.
- Backend: REST is truth; reuse `task.created`/`task.updated` (no new WS events); ignore self-echo by `actor_id`.
- Frontend: filters in Zustand (UI-only, per board, not persisted); overdue via `lib/due-status.ts`; charts CSS/SVG; calendar uses existing `date-fns` — **no new runtime deps**.
- Desktop ≥1280px settled appearance changes only additively. All new UI bilingual AR/EN (parity test) + RTL/LTR + light/dark, reduced-motion/transparency safe.
- Commit once at the end of the chain (skip the optional per-step auto-commit hooks), per the established workflow.
