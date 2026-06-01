# Quickstart: Tasks Power Features & Analytics (009)

## Run the app (dev)

Backend (from `backend/`, venv active) — SQLite dev DB, no Docker:

```pwsh
./.venv/Scripts/uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
```

Frontend (from `frontend/`):

```pwsh
npm run dev   # http://localhost:3000
```

> Do NOT run `npm run build` while `next dev` is running — they share `.next/` and the build corrupts the dev server's CSS. Stop dev first, or run build separately.

## Apply the migration

From `backend/` (venv active):

```pwsh
alembic upgrade head
```

(Local SQLite dev may auto-create tables, but run the migration to verify it applies cleanly; production MUST migrate.)

## Verify each story

**US1 — Assignee (P1)**
1. Create a board, invite a second user as editor and a third as viewer (Board Settings).
2. Open a task → set Assignee to the editor → save. Card shows their avatar; second member's open session updates live.
3. Set Assignee to "Unassigned" → avatar disappears.
4. As the viewer, open a task → assignee is read-only.
5. Filter bar → Assignee = that member → only their tasks show.

**US2 — Task Type (P2)**
1. New task with no type chosen → created as "Task".
2. Change a task's type to "Feature"/"Improvement" → distinct badge on card + dialog; broadcast live.
3. Filter bar → Type = Feature → only features show.

**US3 — Analytics (P3)**
1. Switch the board to the Analytics view.
2. Confirm Completion Rate / Active / Overdue / Team Size against a hand count.
3. Confirm the three charts (status/priority/type). Empty board → all zeros, no errors.
4. Toggle theme + language (AR/RTL) → stays legible and mirrored.

**US4 — Calendar (P4/P3)**
1. Switch to the Calendar view; due-dated tasks appear on their days.
2. Page prev/next month → tasks shift; leap-Feb renders correctly.
3. Click a task → existing TaskDialog opens.
4. Overdue days are marked; undated tasks are absent (still on Board view).

## Quality gates (must pass before commit)

Backend (from `backend/`):

```pwsh
pytest         # incl. new test_assignee.py, test_task_type.py; coverage >= 70%
ruff check .
```

Frontend (from `frontend/`):

```pwsh
npx tsc --noEmit
npx eslint .
npx vitest run   # incl. analytics.test.ts, calendar.test.ts, extended task-filter-sort.test.ts, dict parity
npm run build    # only when dev server is stopped
```

## Notes / conventions reused
- Errors: `{ error, code, details? }`. Assignee-not-member → 422 `invalid_assignee`.
- Real-time: REST is truth; `task.created`/`task.updated` carry the full task incl. `assignee`/`type`; ignore self-echo by `actor_id`.
- Filters live in the Zustand `board-view-store` (UI-only, per board, not persisted).
- Overdue everywhere uses `lib/due-status.ts`. Charts/calendar use CSS/SVG + existing `date-fns` (no new deps).
- Desktop ≥1280px settled appearance changes only additively.
