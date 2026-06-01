# Phase 1 Data Model: Layout v2 — Navigation & Layout Reorganization

This feature is **layout/presentation-only**. There is **no database change, no
migration, no API, and no new server-side or client-side entity**. It reorganizes where
existing data is displayed.

## Entities

**None added.** The feature renders existing data in new places:

| Existing data | Where it now appears |
|---|---|
| The user's boards (with `role`, color, `task_count`) | Sidebar quick-switch list; boards page grouped by `role` |
| Board details (name, description, color) | Board context header (breadcrumb › title) |
| Presence viewers | Board toolbar row |
| Activity entries | Slide-over activity **drawer** (was an inline column) |
| Task fields (title, description, priority, due, labels) | Two-column task dialog |
| Board members & settings | Side-tab-rail settings dialog |

## Client state (reused, not new)

- **`activityPanelOpen`** (existing Zustand UI-store flag): now toggles the activity
  drawer instead of the inline panel. Unchanged shape/behavior.
- **Theme preference** (`localStorage` `idara-theme`): unchanged from `004`.

## Validation rules

- **VR-1 (board grouping)**: Each board is placed in exactly one group by its `role`
  (owner → owned; editor → shared-can-edit; viewer → shared-view-only). A group with zero
  boards is not rendered.

## Non-changes (explicit)

- No new tables/columns/migrations; no backend model changes.
- No API request/response shape changes (`lib/types.ts`, `endpoints.ts` unchanged).
- No new dependencies.
