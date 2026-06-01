# Quickstart: Layout v2 — Navigation & Layout Reorganization

How to integrate, build, and verify. **Frontend-only** — the backend is untouched.

## Integrate (file sync from NewDesign1/ → frontend/)

1. Copy the 2 new files: `components/sidebar.tsx`, `components/kanban/activity-drawer.tsx`.
2. Replace the 9 restructured files: `app/globals.css`, `app/(app)/layout.tsx`,
   `app/(app)/boards/page.tsx`, `app/(app)/boards/[boardId]/page.tsx`, `app/demo/page.tsx`,
   `components/boards/board-settings-dialog.tsx`, `components/kanban/task-dialog.tsx`,
   `components/landing/landing-page.tsx`, `lib/i18n/dictionaries.ts`.
3. **Delete** `frontend/src/components/app-shell.tsx` (old top bar, replaced by Sidebar).
4. Delete the `NewDesign1/` staging folder.

(See [plan.md](./plan.md) "Project Structure" for the exact list. `tailwind.config.ts`
is unchanged from `004`.)

## Gates

```powershell
# from frontend/
npm run lint            # eslint
npx tsc --noEmit        # strict type check — also catches any dangling app-shell import
npm run test            # vitest — incl. AR/EN dictionary-parity test
npm run build           # must build clean
```

Backend is unchanged; no backend gate required for this feature.

## Manual verification

Run the app (`npm run dev` in `frontend/`, backend on :8000) and check:

### A. Sidebar navigation (US1, SC-001/SC-004/SC-007)
1. Log in → a persistent sidebar shows brand, "All boards", your boards (with color +
   task count), and bottom user/theme/language/logout. No old top bar anywhere.
2. Click a board in the sidebar → it opens; click "All boards" → boards list.
3. Toggle theme and language and log out from the sidebar bottom → each works as before.
4. Resize narrow → the sidebar collapses to an icon rail; nav still reachable.

### B. Boards grouped by role (US2, SC-003)
5. As a user who owns some boards and is editor/viewer on others, open the boards page →
   three labeled groups (owned / shared-can-edit / shared-view-only) each with a count;
   each board in the right group; empty groups absent.
6. Create / open / delete a board → unchanged behavior.

### C. Board view, drawer, dialogs (US3)
7. Open a board → breadcrumb header (IDARA/boards › title) + toolbar (search +
   presence) + full-width kanban.
8. Toggle activity → a drawer slides over and closes with the same control; same content.
9. Open a task → two-column dialog (content ǀ properties: priority, due, labels); save/
   delete unchanged.
10. Open board settings → side tab rail (Details / Members); invite/role/remove/edit work.

### D. RTL + theme matrix (SC-005)
11. Switch to Arabic → the sidebar mirrors to the right; the drawer, dialog columns,
    settings rail, and board header all lay out RTL.
12. Check Dark and Light for the v2 surfaces.

### E. No regressions / no lost strings (SC-002, SC-006)
13. Exercise drag-and-drop, labels, member management, search, real-time (second
    session) → all behave as before.
14. The Vitest dictionary-parity test passing confirms AR/EN key parity; spot-check
    Arabic text still appears where expected.

## Acceptance ↔ verification map

| Spec | Verified by |
|------|-------------|
| US1 / SC-001, SC-004, SC-007 | Steps 1–4 |
| US2 / SC-003 | Steps 5–6 |
| US3 | Steps 7–10 |
| SC-005 | Steps 11–12 |
| SC-002 | Step 13 + green build + identical logic files |
| SC-006 | Step 14 + Vitest parity test |
