# Phase 0 Research: Tasks Power Features & Analytics

All items below were resolved from the existing codebase (no open NEEDS CLARIFICATION). Each records the decision, rationale, and alternatives considered.

## 1. Backend shape for `assignee_id`

- **Decision**: Add `assignee_id: int | None` as a nullable FK `users.id` with `ondelete="SET NULL"` and an index; expose `assignee_id` + `assignee: UserPublic | None` on `TaskPublic`. Validate membership in the service layer (`task_service._validate_assignee_on_board`) using the existing `board_repo.get_member(board_id, user_id)`; raise the project's structured 422 when not a member.
- **Rationale**: Mirrors the existing `priority` enum column and the existing FK/cascade idioms in `task.py`. `SET NULL` directly satisfies FR-007 (assignee leaving the board → task becomes unassigned, no orphan). `UserPublic` is already reused by `Comment.author` and `BoardMember.user`, so the avatar/name surface is free. Membership validation belongs in the service per Principle I (routes stay thin).
- **Alternatives considered**: (a) FK with `CASCADE` — rejected: would delete the task when a member leaves. (b) Validate in the route — rejected: business rule belongs in the service. (c) Store assignee as free text — rejected: breaks referential integrity and the avatar/filter story.

## 2. Backend shape for `type`

- **Decision**: Add `TaskType(str, Enum)` = `task|feature|improvement` and a non-null `type` column with `server_default='task'` (DB default for the migration backfill) and Python default `TaskType.task`. Add to `TaskCreate` (default `task`), `TaskUpdate` (`TaskType | None`), `TaskPublic`.
- **Rationale**: Identical pattern to the existing `TaskPriority` enum, so validation, serialization, and migration are well-trodden. `server_default` backfills existing rows safely.
- **Alternatives considered**: Free-string with app-level validation — rejected: enum gives DB-level integrity and matches `priority`. A separate `task_types` table — rejected (YAGNI): three fixed values, no user-defined types in scope.

## 3. Migration & enum portability (SQLite dev + Postgres prod)

- **Decision**: New migration `down_revision = 'a1b2c3d4e5f6'` (current head). Use `sa.Enum(..., name="task_type")` for the column and `batch_alter_table` to add `assignee_id`, `type`, the FK (`ondelete='SET NULL'`), and the index. Provide a clean `downgrade()`.
- **Rationale**: `a1b2c3d4e5f6` (add checklist & comments) is the current head per the versions chain. `sa.Enum` + batch ops are the portable idiom that already works for this project's SQLite-dev / Postgres-prod split; SQLAlchemy renders a CHECK constraint on SQLite and a native enum type on Postgres. Tests auto-create the schema from models (in-memory SQLite), so the migration is exercised for shape, and models stay DB-agnostic per the constitution.
- **Alternatives considered**: Raw `CREATE TYPE` only (Postgres-specific) — rejected: breaks SQLite dev/test. No migration, rely on dev auto-create — rejected: constitution requires a migration for any model change.

## 4. Real-time broadcast reuse

- **Decision**: No new WS message types. Assignee/type ride on the existing `task.created` / `task.updated` events, which already serialize the full `TaskPublic` (`dto.model_dump(mode="json")`) and carry `actor_id`. Clients already ignore self-echo and merge `Task` objects by id.
- **Rationale**: Assignee/type are intrinsic Task fields; the existing socket handler replaces the task in the snapshot cache wholesale, so new fields propagate automatically. Adding event types would be redundant complexity (Principle V).
- **Alternatives considered**: Dedicated `task.assigned` event — rejected: no consumer needs it distinctly; activity-log messaging can still be enriched later via the existing `payload`.

## 5. Completion-rate rule (analytics)

- **Decision**: A task is **complete** when it is in the board's **last column** (the column with the highest `position`). **Completion rate** = complete / total (0 when no tasks). **Active** = total − complete. Documented in `analytics.ts` and the data model.
- **Rationale**: Deterministic for every board with zero schema additions; matches the common kanban convention (rightmost column = done) and the reference screenshots (TODO/IN PROGRESS/DONE). Avoids a speculative per-column `is_done` flag (Principle V) while remaining easy to evolve.
- **Alternatives considered**: Match a column literally named "Done" — rejected: locale/naming-fragile (boards are bilingual and user-named). Per-column done-flag — deferred as a documented follow-up; adds schema + UI not justified now.
- **Edge handling**: Empty board → all metrics 0, charts show empty state, no division by zero. Single-column board → that column is the last, so its tasks count as complete (documented; acceptable for v1).

## 6. Charts without a charting library

- **Decision**: Build the three charts with plain CSS/SVG: "Tasks by Status" as flex bars (height ∝ count) like the reference; "Tasks by Priority" and "Tasks by Type" as labeled proportion bars (width ∝ percentage) with count + %. Colors come from existing tokens / the per-priority and per-type palettes.
- **Rationale**: Three simple charts do not justify a runtime dependency such as recharts/chart.js (Principle V, "no new heavy deps"). CSS/SVG is theme-token-driven (works in light/dark), trivially RTL-mirrored, and respects reduced-motion by simply not animating.
- **Alternatives considered**: recharts — rejected: large dependency, SSR/RTL friction, overkill for 3 static charts.

## 7. Calendar month-grid generation & week start

- **Decision**: Pure `buildMonthGrid(year, month, weekStart)` returns a 6×7 array of day cells (with `inCurrentMonth` flags) using `date-fns` (`startOfMonth`, `startOfWeek`, `addDays`, etc.). Map tasks to days by `due_date` (local day, consistent with `due-status.ts`). **Week start = Saturday for `ar` locale, Sunday for `en`** is the chosen default, derived from locale; finalize in implementation against existing date formatting. Overdue days reuse the existing `dueInfo` "overdue" status and styling.
- **Rationale**: `date-fns` is already a dependency (used by `due-status.ts`) — zero new deps. A pure generator is directly Vitest-testable for month boundaries, leap years, and leading/trailing days (FR-018, SC-006). Reusing `dueInfo` keeps "overdue" identical across the app (FR-015/FR-021).
- **Alternatives considered**: A calendar component library — rejected (YAGNI + RTL/theme control). Hand-rolled date math without date-fns — rejected: error-prone vs. the already-present, tested library.

## 8. Filter integration (assignee + type)

- **Decision**: Extend `ViewState` with `assigneeFilter: number[]` (user ids; empty = all) and `typeFilter: TaskType[]`; extend `taskMatches` (conjunctive) and `isViewActive`; add `setAssignee`/`toggleType` to the Zustand `board-view-store`. The filter bar gains an assignee Select (members + "All") and type chips, consistent with the existing label/priority/due controls.
- **Rationale**: Reuses the existing pure, Vitest-covered filter pipeline (`applyView`) and the UI-only Zustand store (Principle I — never shared, never persisted). Conjunctive semantics match the current filters exactly.
- **Alternatives considered**: A separate filtering path for the new fields — rejected: duplication; the existing pipeline already composes filters + search + sort.

## 9. View switching (Board | Analytics | Calendar)

- **Decision**: Add an additive view switcher on the board page (segmented tabs styled with existing glass/Select idioms). Default view = Board (unchanged). Analytics and Calendar render from the same already-loaded `BoardSnapshot` + members; no route change required (client view state), keeping deep-linking simple and desktop static state unchanged until the user switches.
- **Rationale**: Additive and presentation-only; satisfies FR-024 (desktop settled state unchanged except additively). Reusing the loaded snapshot avoids extra fetches.
- **Alternatives considered**: Separate routes/pages per view — heavier; can be layered later if deep-linking to a view is desired (left as a possible follow-up).
