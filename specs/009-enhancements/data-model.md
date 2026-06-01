# Phase 1 Data Model: Tasks Power Features & Analytics

## Persisted entities

### Task (extended)

Existing columns are unchanged. Two columns are added.

| Field | Type | Null | Default | Notes |
|-------|------|------|---------|-------|
| `assignee_id` | int (FK `users.id`) | yes | NULL | `ondelete="SET NULL"`, indexed. The assigned member. |
| `type` | enum `task_type` (`task`/`feature`/`improvement`) | no | `task` | DB `server_default='task'` backfills existing rows. |

**Relationship**: `assignee: User | None` (read-only on the task; no back-population needed on User).

**Validation rules**:
- On create/update, if `assignee_id` is not null it MUST be a member of the task's board (else **422** `{error, code: "invalid_assignee", details?}`). Validated in `task_service` via `board_repo.get_member(board_id, user_id)`.
- `type` MUST be one of the three enum values (Pydantic/enum enforces; invalid → 422).
- Write paths require edit rights (owner/editor). Viewer write → 403; non-member → 404 (unchanged guards).

**Lifecycle / state transitions**:
- Assignee removed from board OR user account deleted → FK `SET NULL` → task persists, becomes unassigned (FR-007). No cascade delete of the task.
- Type has no transitions beyond direct edit.

### Schema surface (Pydantic)

- **TaskCreate**: `+ assignee_id: int | None = None`, `+ type: TaskType = TaskType.task`.
- **TaskUpdate**: `+ assignee_id: int | None = None`, `+ type: TaskType | None = None` (partial update semantics as today).
- **TaskPublic**: `+ assignee_id: int | None`, `+ type: TaskType`, `+ assignee: UserPublic | None` (reuses the `UserPublic` already used by `Comment.author`). The existing `model_validator(mode="before")` that summarizes checklist counts is updated to carry the new fields through the reconstructed dict; `assignee` is eager-loaded in `task_repo` to avoid lazy-load surprises.

### Migration

- File: `backend/alembic/versions/<rev>_add_assignee_and_type.py`, `down_revision = "a1b2c3d4e5f6"`.
- `upgrade`: add `assignee_id` (nullable int) + FK→`users.id` `ondelete=SET NULL` + index; add `type` (`sa.Enum(name="task_type")`, not null, `server_default='task'`).
- `downgrade`: drop index, FK, `type`, `assignee_id` (and the enum type on Postgres).

## Client-only entities (not persisted)

### ViewState (extended) — `lib/task-filter-sort.ts` + Zustand `board-view-store`

| Field | Type | Notes |
|-------|------|-------|
| `assigneeFilter` | `number[]` | user ids; empty ⇒ all assignees (and unassigned). |
| `typeFilter` | `TaskType[]` | empty ⇒ all types. |

UI-only, per-board, never shared, not persisted (resets on reload), consistent with existing `labelFilter`/`priorityFilter`/`dueFilter`. `taskMatches` adds conjunctive checks; `isViewActive` includes the new filters.

### TaskType meta — `lib/task-type.ts` (pure)

| Type | Icon | Color token | Label key |
|------|------|-------------|-----------|
| `task` | square/check | neutral/accent | `type.task` |
| `feature` | zap | green/success | `type.feature` |
| `improvement` | arrow-up/sparkle | purple | `type.improvement` |

(Exact icons/colors finalized in implementation; must be legible in light/dark + RTL.)

### Analytics Summary — `lib/analytics.ts` (pure, derived)

`computeBoardAnalytics(snapshot, members)` →

- `total`, `complete` (tasks in the last column), `active` (= total − complete), `completionRate` (complete/total, 0 if total 0).
- `overdue` (count where `dueInfo(due_date).status === "overdue"`).
- `teamSize` (members.length).
- `byStatus`: `[{ columnId, name, count }]` (per column, in order).
- `byPriority`: `[{ priority, count, pct }]` for low/medium/high.
- `byType`: `[{ type, count, pct }]` for task/feature/improvement.

All derived from the already-loaded `BoardSnapshot` + member list — no new fetch, no mutation.

### Calendar Month — `lib/calendar.ts` (pure, derived)

`buildMonthGrid(year, month, weekStart)` → `DayCell[][]` (6 weeks × 7 days), each cell `{ date, inCurrentMonth }`. `mapTasksToDays(tasks)` groups due-dated tasks by local day. Tasks without a due date are omitted (remain on other views). Overdue marking reuses `dueInfo`.

## Relationships diagram (textual)

```
User 1 ──< Task.assignee_id (nullable, SET NULL)
Board 1 ──< Column 1 ──< Task   (unchanged)
Board 1 ──< BoardMember >── 1 User   (assignee MUST be one of these for the task's board)
Task ──> TaskType (enum)
```
