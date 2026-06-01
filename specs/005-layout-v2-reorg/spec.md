# Feature Specification: Layout v2 — Navigation & Layout Reorganization

**Feature Branch**: `005-layout-v2-reorg`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "I made a new design in the NewDesign1/ folder. I changed the
positions of the cards/elements a bit without adding or removing anything — just adopt
and merge it into the project, cleanly."

## Overview

A reorganization of IDARA's **navigation and layout** (prepared in `NewDesign1/`,
the "Layout v2" pass). The same features, data, actions, and Liquid Glass styling are
kept — only **where things sit on screen** changes:

- The sticky **top bar** is replaced by a persistent **left sidebar** (brand, "All
  boards", a quick-switch list of the user's boards, and at the bottom the user, theme,
  language, and log-out controls). It collapses to a narrow icon rail on smaller
  screens. In Arabic it mirrors to the right.
- The boards list is **grouped by the user's role** on each board (owned, shared-with-
  edit, shared-view-only) instead of one flat grid.
- The board view gets a thin **context header** (breadcrumb › title + action icons) and
  a **toolbar row** (search + presence), with the kanban now full-width.
- The activity feed moves from a fixed inline column to a **slide-over drawer** toggled
  by the same control as today.
- The task dialog becomes **two columns** (content ǀ properties); board settings uses a
  **side tab rail** instead of a top tab bar.

Nothing is added or removed functionally: every existing capability works exactly as
before. Auth screens are unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate via the persistent sidebar (Priority: P1)

A signed-in user sees a persistent sidebar instead of the old top bar. It shows the
brand, an "All boards" link, and a quick-switch list of their boards (each with its
color dot and task count); the bottom holds their avatar/name, the theme and language
toggles, and log out. Clicking a board in the list opens it; "All boards" returns to the
list. On narrow screens the sidebar collapses to an icon-only rail. In Arabic the
sidebar sits on the right and everything mirrors.

**Why this priority**: The sidebar is the new primary navigation and the most visible
structural change; every in-app screen depends on it. It is the minimum slice that makes
"Layout v2" recognizable and usable.

**Independent Test**: Log in, confirm the sidebar shows "All boards" + your boards with
counts and the bottom controls; click a board to open it and "All boards" to go back;
resize narrow to see the icon rail; switch to Arabic and confirm it mirrors to the right.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** any in-app screen loads, **Then** a persistent
   sidebar is shown (brand, "All boards", their boards list, and bottom user/theme/
   language/logout controls) — and no old top bar remains.
2. **Given** the sidebar board list, **When** the user clicks a board, **Then** that
   board opens; **When** they click "All boards", **Then** the boards list opens.
3. **Given** a narrow viewport, **When** the app is shown, **Then** the sidebar collapses
   to a compact icon rail without losing access to navigation.
4. **Given** Arabic is active, **When** the app is shown, **Then** the sidebar is on the
   right and its contents are laid out right-to-left.
5. **Given** the sidebar bottom controls, **When** the user toggles theme or language or
   logs out, **Then** each behaves exactly as before.

---

### User Story 2 - Boards grouped by role (Priority: P2)

On the boards page, the user's boards are organized into clear sections by their role —
boards they own, boards shared with them that they can edit, and boards shared view-only
— each section labeled and showing how many boards it contains. A thin context header
sits above with the page title and the "New board" action.

**Why this priority**: It makes the boards list easier to scan as boards accumulate, and
is a self-contained change to one page. Valuable but secondary to the sidebar itself.

**Independent Test**: As a user who owns some boards and is a member (editor on some,
viewer on others), open the boards page and confirm three labeled groups (owned /
shared-can-edit / shared-view-only) each with the right boards and a count; creating a
board still works from the header.

**Acceptance Scenarios**:

1. **Given** a user with boards in multiple roles, **When** they open the boards page,
   **Then** the boards appear under labeled groups by role (owned, shared-can-edit,
   shared-view-only), each showing its count.
2. **Given** a role group with no boards, **When** the page is shown, **Then** that
   empty group is not displayed (no empty section).
3. **Given** the boards page, **When** the user creates, opens, or deletes a board,
   **Then** each action works exactly as before and the affected board appears in the
   correct group.

---

### User Story 3 - Restructured board, activity drawer, dialogs (Priority: P2)

Inside a board, the user sees a thin context header (breadcrumb › board title with action
icons) and a toolbar row (search + who's viewing), with the kanban now spanning the full
width. Opening the activity feed slides a drawer over the board (instead of a fixed
column). Opening a task shows a two-column dialog (content on one side, properties —
priority, due date, labels — on the other). Board settings shows its Details/Members tabs
as a side rail.

**Why this priority**: These refinements complete the Layout v2 feel and improve focus
(more room for the board, properties grouped), but the board is fully usable without them
once US1 lands. Grouped with US2 as secondary polish.

**Independent Test**: Open a board → confirm the breadcrumb header + toolbar + full-width
kanban; toggle activity → a drawer slides over and closes with the same control; open a
task → a two-column dialog with all the same fields; open board settings → side tab rail
with Details/Members. Every action (edit task, move, label, invite, etc.) behaves as
before.

**Acceptance Scenarios**:

1. **Given** a board view, **When** it loads, **Then** a context header (breadcrumb ›
   title + action icons) and a toolbar (search + presence) are shown above a full-width
   kanban.
2. **Given** a board, **When** the user toggles the activity feed, **Then** it appears as
   a slide-over drawer and closes via the same toggle, showing the same activity content.
3. **Given** a task, **When** the user opens it, **Then** a two-column dialog shows the
   content fields and the properties (priority, due date, labels), and saving/deleting
   behaves exactly as before.
4. **Given** board settings, **When** opened, **Then** Details and Members are presented
   as a side tab rail, with the same fields and actions as before.

---

### Edge Cases

- **Existing behavior preserved**: Drag-and-drop, real-time updates, presence, labels,
  member management, search, validation, and bilingual text all behave exactly as before
  — this is a layout move, not a behavior change.
- **No boards yet**: The sidebar board list and the boards page show their existing
  empty states; role groups with no boards are simply omitted.
- **Narrow screens / mobile**: The sidebar collapses to an icon rail; the activity drawer
  and two-column dialog adapt without hiding any control.
- **RTL (Arabic)**: The sidebar mirrors to the right and all v2 surfaces (drawer, dialog
  columns, settings rail, board header) lay out right-to-left.
- **Theme**: All v2 surfaces render correctly in both Light and Dark themes (the design
  reuses the existing token system).
- **Role changes**: If a user's role on a board changes, that board appears under the
  matching group on the next load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In-app navigation MUST be provided by a persistent sidebar (replacing the
  top bar), containing the brand, an "All boards" link, a quick-switch list of the user's
  boards (each with color and task count), and bottom controls for the user identity,
  theme toggle, language toggle, and log out.
- **FR-002**: The sidebar MUST collapse to a compact icon-only rail on narrow viewports
  while keeping navigation reachable.
- **FR-003**: Selecting a board in the sidebar MUST open that board; selecting "All
  boards" MUST open the boards list.
- **FR-004**: The boards page MUST group boards into labeled sections by the user's role
  (owned, shared-can-edit, shared-view-only), each showing a count; empty groups MUST be
  omitted.
- **FR-005**: The board view MUST present a context header (breadcrumb › title + action
  icons) and a toolbar (search + presence) above a full-width kanban.
- **FR-006**: The activity feed MUST be presented as a slide-over drawer toggled by the
  same control/state as today, showing the same activity content.
- **FR-007**: The task dialog MUST present its fields in two columns (content ǀ
  properties) while keeping all existing fields and actions.
- **FR-008**: Board settings MUST present its Details/Members tabs as a side tab rail
  with the same fields and actions.
- **FR-009**: The reorganization MUST NOT add or remove any feature, data, or action —
  every existing capability MUST behave exactly as before.
- **FR-010**: All v2 surfaces MUST remain fully bilingual (Arabic/English) with correct
  RTL/LTR layout (the sidebar mirrors to the right in Arabic), and all new on-screen text
  MUST be provided in both languages with no existing string lost.
- **FR-011**: All v2 surfaces MUST render correctly in both Light and Dark themes.
- **FR-012**: The reorganized layout MUST become the live, linked layout of the project
  (replacing the prior top-bar layout), and the old top bar MUST be removed.

### Key Entities *(include if feature involves data)*

No new data entities. This feature reorganizes presentation only; it relies on the
existing board/role/task/activity data and the existing client-side theme preference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every in-app screen shows the sidebar (no screen still shows the old top
  bar) — 100% coverage.
- **SC-002**: 100% of existing user actions behave identically before and after the
  reorganization (no functional regressions across boards, columns, tasks, drag-and-drop,
  labels, members, real-time, presence, activity, search).
- **SC-003**: On the boards page, every board appears under exactly one correct role
  group, and empty groups never appear.
- **SC-004**: A user can open any of their boards from the sidebar in one click, and
  return to the boards list in one click.
- **SC-005**: All v2 surfaces render correctly across both themes and both languages
  (Dark/Light × Arabic/English), with the sidebar mirrored in Arabic.
- **SC-006**: No existing localized string is lost; every new on-screen string is
  available in both Arabic and English.
- **SC-007**: On a narrow viewport the sidebar collapses to an icon rail with navigation
  still reachable (no loss of access).

## Assumptions

- **Layout/presentation-only adoption**: `NewDesign1/` changes only the presentation and
  layout. The application's logic, data handling, API usage, types, hooks, and stores are
  unchanged and identical to the current app (verified: those files match byte-for-byte).
  No backend, data-model, or dependency changes.
- **Builds on the adopted Liquid Glass design**: This feature is layered on top of the
  already-adopted redesign (branch `004`), reusing its token system, glass utilities,
  theme switcher, and backdrop. The Tailwind config is unchanged from `004`.
- **Net-new presentational pieces**: A `Sidebar` and an activity **drawer** are added;
  the old `app-shell`/top bar is removed. Other v2 files are restructured versions of
  existing screens/components.
- **i18n additions only**: New keys are added for the sidebar/board groups
  (`nav.allBoards`, `nav.boards`, `boards.group.owned`, `boards.group.editor`,
  `boards.group.viewer`) in both `en` and `ar`; no existing keys are removed.
- **Theme stays the same**: Light/Dark + the `localStorage` theme preference and no-flash
  behavior from `004` are unchanged.
- **Auth screens unchanged**: Login/signup/forgot-password keep their current layout per
  the design note.
- **Same role model**: The boards grouping reuses the existing owner/editor/viewer role
  already returned per board; no new role concept is introduced.

## Dependencies

- The `NewDesign1/` package (the new `Sidebar`, the activity drawer, the restructured
  app/board/boards/task-dialog/settings files, `globals.css` layout token, and the i18n
  additions) is the source material being adopted.
- This feature assumes the `004` Liquid Glass design is already in place (it builds on
  its tokens and components).
