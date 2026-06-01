# Implementation Plan: Tasks Power Features & Analytics

**Branch**: `009-enhancements` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-enhancements/spec.md`

## Summary

Add four interlocking capabilities on top of the existing board/column/task model:

1. **Assignee** (P1) — optional `assignee_id` on Task referencing a board member; avatar on card + Select in dialog; assignee filter; validated server-side (assignee MUST be a board member, else 422); broadcast via the existing `task.updated`/`task.created` channel.
2. **Task Type** (P2) — `type` enum on Task (`task`|`feature`|`improvement`, default `task`); icon+color badge on card/dialog; type filter.
3. **Analytics** (P3) — a per-board Analytics view computed client-side from the already-loaded `BoardSnapshot` + members: completion rate, active/overdue counts, team size, and three CSS/SVG charts (by status / by priority / by type). Pure compute extracted to a tested lib.
4. **Calendar** (P4/P3) — a monthly grid placing due-dated tasks on their day, month paging, overdue marking, click-to-open the existing `TaskDialog`. Pure month-grid generator extracted to a tested lib.

**Technical approach**: Stories 1–2 require a *minimal, layered* backend change (one migration adding `assignee_id` FK + `type` enum to `tasks`, schema + service + repo updates, pytest coverage) — everything else is frontend-only over existing data. No new heavy runtime dependency: charts use CSS/SVG, the calendar uses the already-present `date-fns`. All UI is additive, bilingual (AR/EN parity enforced by the existing Vitest test), RTL/LTR- and theme-correct, and respects reduced-motion/transparency. Desktop ≥1280px static appearance only changes additively (new badge, new filter chips, new view tabs).

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5 strict (frontend, Next.js 14 App Router)

**Primary Dependencies**: FastAPI, async SQLAlchemy 2.0, Pydantic v2, Alembic (backend); React 18, TanStack Query, Zustand, dnd-kit, date-fns, lucide-react, Tailwind (frontend). **No new runtime dependency** — charts are CSS/SVG; calendar reuses `date-fns`.

**Storage**: PostgreSQL (prod/Docker), SQLite + aiosqlite (local dev/tests). Models stay DB-agnostic. One Alembic migration adds the two Task columns.

**Testing**: pytest (backend, ≥70% coverage, in-memory SQLite per test); Vitest (frontend pure logic: analytics compute, calendar month grid, filter integration, dictionary parity).

**Target Platform**: Linux server (backend) + modern browsers (responsive web; desktop ≥1280px settled, mobile/tablet additive).

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: Real-time assignee/type changes reflected to other members within a couple seconds (existing WS path). Analytics/calendar compute is O(tasks) over an already-loaded snapshot — instant for realistic board sizes.

**Constraints**: REST is source of truth; WS notifies (ignore self-echo by `actor_id`). Errors use `{error, code, details?}`. AR/EN dictionary parity enforced by Vitest. Reduced-motion → instant; reduced-transparency → no reliance on translucency. Desktop ≥1280px static state unchanged except additively.

**Scale/Scope**: Per-board feature; team sizes and task counts in the tens–hundreds. No historical/time-series analytics; monthly calendar only; Workspaces/Projects out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|-----------|-----------|
| **I. Layered Architecture** | Backend change strictly `route → service → repository → model`: assignee-membership validation lives in `task_service`, all queries in `task_repo`/`board_repo`, routes only orchestrate + broadcast. Frontend: server state stays in TanStack Query (task data via the board snapshot/socket); the new assignee/type **filters** live in the existing Zustand `board-view-store` (UI-only, never shared). Analytics/calendar are pure derived views — no state conflation. ✅ |
| **II. Test Discipline (NON-NEGOTIABLE)** | New backend fields/validation get pytest tests (create/update with assignee, 422 on non-member, type default/validation, viewer 403, FK SET NULL on member/user removal). Pure frontend logic (analytics compute, calendar grid, filter predicate) gets Vitest. Backend coverage stays ≥70%. No merge with failing tests/lint. ✅ |
| **III. Real-Time Consistency** | Assignee/type are part of Task; changes go through existing REST update → broadcast `task.updated`/`task.created` with `actor_id`; clients ignore their own echo (unchanged path). No new authoritative state outside REST. ✅ |
| **IV. Security & Privacy** | All new writes go through board-scoped endpoints already enforcing owner/editor/viewer (viewer read-only → 403 on write; non-member → 404). Assignee validated against board membership (422 via structured error). No secrets, no new auth surface. ✅ |
| **V. Pragmatic Simplicity (YAGNI)** | Minimal backend (2 nullable/defaulted columns, no new tables). Analytics/calendar add **zero** backend and **zero** runtime deps (CSS/SVG + existing date-fns). Completion-rate uses a documented deterministic rule (last column = complete) rather than a speculative per-column done-flag, noted as a possible follow-up. ✅ |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/009-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (completion rule, week start, chart approach, broadcast reuse)
├── data-model.md        # Phase 1 — Task extension, derived Analytics/Calendar entities, view-state extension
├── quickstart.md        # Phase 1 — how to run, verify, and test each story
├── contracts/
│   └── api.md           # Phase 1 — task create/update request+response deltas, error codes
└── tasks.md             # Phase 2 — /speckit-tasks output (NOT created here)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/task.py                 # + TaskType enum, assignee_id FK (SET NULL), type column, assignee relationship
│   ├── schemas/task.py                # + assignee_id/type on Create/Update/Public; + assignee: UserPublic|None on Public; validator updated
│   ├── repositories/task_repo.py      # create/update accept assignee_id+type; eager-load assignee; (board_repo.get_member reused)
│   ├── services/task_service.py       # _validate_assignee_on_board() → 422 if not a member; wire into create/update
│   └── api/routes/tasks.py            # unchanged flow; schemas propagate; broadcast already serializes TaskPublic
├── alembic/versions/
│   └── <new>_add_assignee_and_type.py # down_revision = a1b2c3d4e5f6; add columns + FK + index + enum
└── tests/
    ├── test_assignee.py               # assign/clear, 422 non-member, viewer 403, SET NULL on member/user removal
    └── test_task_type.py              # default task, set/validate type, invalid value 422

frontend/
├── src/
│   ├── lib/
│   │   ├── types.ts                   # + assignee_id, assignee?: User, type on Task; TaskType union
│   │   ├── task-filter-sort.ts        # ViewState += assigneeFilter, typeFilter; taskMatches/isViewActive updated
│   │   ├── task-type.ts               # NEW: TaskType meta (icon/color/labelKey) — pure
│   │   ├── analytics.ts               # NEW: pure computeBoardAnalytics(snapshot, members) → metrics + chart data
│   │   └── calendar.ts                # NEW: pure buildMonthGrid(year, month, weekStart) + task→day mapping
│   ├── stores/board-view-store.ts     # + setAssignee/toggleType (UI-only)
│   ├── components/
│   │   ├── kanban/task-card.tsx       # + assignee avatar + type badge (additive)
│   │   ├── kanban/task-dialog.tsx     # + assignee Select (members + Unassigned) + type Select
│   │   ├── kanban/board-filter-bar.tsx# + assignee filter + type filter chips/selects
│   │   ├── analytics/                 # NEW: analytics-view + stat-card + bar-chart + proportion-bar (CSS/SVG)
│   │   └── calendar/                  # NEW: calendar-view + month-grid (reuses TaskDialog open handler)
│   ├── app/(app)/boards/[boardId]/    # + view switch (Board | Analytics | Calendar) — additive tabs
│   └── lib/i18n/dictionaries.ts       # + AR/EN keys (assignee, type.*, analytics.*, calendar.*) with parity
└── src/lib/__tests__/
    ├── analytics.test.ts              # NEW
    ├── calendar.test.ts               # NEW
    └── task-filter-sort.test.ts       # extend: assignee + type filters
```

**Structure Decision**: Existing web-app layout (`backend/` + `frontend/`). The backend touches only the Task vertical (model→schema→repo→service→migration→tests), reusing `board_repo.get_member` for membership validation. The frontend isolates all new *logic* into pure, Vitest-covered libs (`task-type`, `analytics`, `calendar`) and keeps new *UI-only* filter state in the existing Zustand view store; presentation components are additive and reuse existing primitives (`Select`, `Badge`, `Avatar`, `TaskDialog`, due-status, Liquid Glass tokens).

## Complexity Tracking

No constitution violations — section intentionally empty.
