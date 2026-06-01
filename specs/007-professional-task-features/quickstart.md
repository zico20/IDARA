# Quickstart: Professional Task Features

How to run, verify, and demo this feature end-to-end. Mirrors the project standard (signup → board → task → …).

## Prerequisites

- Backend deps installed (`backend/.venv`), `backend/.env` present.
- Frontend deps installed (`frontend/`), `frontend/.env.local` present.
- Local dev DB is SQLite (`backend/idara_dev.db`) — no Docker needed (per project memory).

## Apply the migration (dev)

Local SQLite dev/tests auto-create tables via `Base.metadata.create_all`, so a fresh dev DB picks up the new tables automatically. For an existing dev DB or production, run the Alembic migration:

```powershell
# from backend/
.\.venv\Scripts\alembic.exe upgrade head
```

## Run the app

```powershell
# Terminal 1 — backend (from backend/)
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000

# Terminal 2 — frontend (from frontend/)
npm run dev   # http://localhost:3000
```

## Manual verification flows

### Flow A — Checklist (P1)
1. Sign up / log in, create a board, add a column, create a task.
2. Open the task. In the new **Checklist** section, add 3 items.
3. Tick one complete → the board card shows **1/3**.
4. Reorder items; close and reopen the dialog → order persisted.
5. Open the same board in a second browser (different user invited as editor) → checklist changes appear within ~1s; the acting user sees no echo flicker.
6. Log in as a **viewer** → checklist is read-only (no add/toggle/reorder/delete).

### Flow B — Comments (P2)
1. As editor, open a task, post two comments → each shows author name + relative time, oldest first.
2. As a viewer in another session → comments visible, no compose box.
3. New comment from one session appears live in the other within ~1s.
4. Delete your own comment → disappears everywhere. Confirm you cannot delete someone else's (no delete affordance); board owner can delete any.

### Flow C — Filtering & Sorting (P2)
1. On a board with mixed labels/priorities/due dates, open the **filter bar**.
2. Filter by a label + priority + "overdue" → only matching tasks remain (conjunctive).
3. Clear filters → all tasks return.
4. Sort by **due date** → tasks reorder within each column (no-date last); a second member's view is unaffected.
5. Switch back to **manual** → drag-and-drop reorders as before. Under a non-manual sort, dragging is disabled.

### Flow D — Due badges (P3)
1. Create tasks due in the past / today / in 3 days.
2. Confirm badges: **Overdue** (urgent), **Due today** (warning), **In 3 days** (neutral); none for no-date tasks.
3. Toggle Arabic → badges localized + RTL. Toggle dark theme → still legible.

## Automated gates (must pass before commit)

```powershell
# Backend (from backend/)
.\.venv\Scripts\pytest.exe -q            # incl. new test_checklist.py, test_comments.py; coverage >=70%
.\.venv\Scripts\ruff.exe check .

# Frontend (from frontend/)
npm run lint
npx tsc --noEmit
npx vitest run                           # incl. due-status + filter/sort helpers + i18n parity
npm run build
```

## What to confirm for "desktop unchanged"

At ≥1280px, the board grid, card layout, and existing dialog fields look identical to before; only the additive elements differ: the checklist section + comments thread inside the dialog, and the progress + due badges on cards.
