# Feature Specification: Tasks Power Features & Analytics

**Feature Branch**: `009-enhancements`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: Four interlocking capabilities added on top of the existing board / column / task model — task assignee, task type, a board analytics dashboard, and a calendar view — while preserving real-time sync, the Liquid Glass design, AR/EN bilingual + RTL/LTR, reduced-motion/transparency respect, and the settled desktop (≥1280px) static appearance (additive only).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assign a task to a teammate (Priority: P1)

A board editor or owner opens a task and assigns it to one of the board's members so everyone can see who is responsible. The assignee's avatar appears on the task card and in the task dialog. The board can then be filtered to show only one person's tasks. Viewers see assignments but cannot change them.

**Why this priority**: Ownership of work is the single most-requested capability for a collaborative board and underpins the "Team Members" / "Assignee" columns seen in comparable tools. It also unlocks the assignee filter and feeds the analytics team metrics.

**Independent Test**: On a board with ≥2 members, open a task, pick an assignee from the member list, save, and confirm the avatar shows on the card and the task dialog; reload and confirm it persisted; open the board on a second member's session and confirm the assignment appears in real time. Filtering by that assignee shows only their tasks.

**Acceptance Scenarios**:

1. **Given** a board with members Amelia (owner), Ben (editor), Clara (viewer), **When** Amelia opens a task and selects Ben as assignee and saves, **Then** the task shows Ben's avatar on its card and the change is broadcast to other connected members in real time.
2. **Given** a task assigned to Ben, **When** Amelia re-opens the task and selects "Unassigned", **Then** the assignee is cleared and the avatar disappears from the card.
3. **Given** a viewer (Clara) viewing the board, **When** she opens a task, **Then** the assignee is shown read-only and she cannot change it.
4. **Given** a user who is NOT a member of the board, **When** an attempt is made to assign the task to that user, **Then** the system rejects it with a validation error and the assignment does not change.
5. **Given** the assignee filter set to "Ben", **When** the board renders, **Then** only tasks assigned to Ben are shown (combined conjunctively with any other active filters and the text search).
6. **Given** a task assigned to Ben, **When** Ben's membership is removed from the board (or his account is deleted), **Then** the task remains and simply becomes unassigned (no error, no orphaned reference).

---

### User Story 2 - Classify a task by type (Priority: P2)

A user categorizes each task as a **Task**, **Feature**, or **Improvement** so the board communicates the nature of work at a glance and can be filtered and measured by type. The type shows as a small icon+color badge on the card, in the task dialog, and is filterable.

**Why this priority**: Type adds lightweight structure that several screens (task table, "Tasks by Type" chart) depend on, and it is low-risk. It ranks below assignee because work ownership is more universally needed than work classification.

**Independent Test**: Create a task, set its type to "Feature", save, and confirm the Feature badge (distinct icon + color) appears on the card and dialog; filter the board by "Feature" and confirm only feature tasks show; confirm a task created without choosing a type defaults to "Task".

**Acceptance Scenarios**:

1. **Given** the new-task dialog, **When** a user creates a task without choosing a type, **Then** the task is created with type "Task" (the default).
2. **Given** an existing task, **When** an editor changes its type to "Improvement" and saves, **Then** the Improvement badge shows on the card and the change is broadcast in real time.
3. **Given** tasks of mixed types, **When** the "Feature" type filter is active, **Then** only feature tasks are shown (conjunctive with other filters).
4. **Given** any task type, **When** the badge is rendered, **Then** each of the three types has a visually distinct icon and color that is legible in both light and dark themes and in RTL.

---

### User Story 3 - See board analytics at a glance (Priority: P3)

A user opens an Analytics view for a board and sees headline metrics — completion rate, active tasks, overdue tasks, team size — and three simple charts: tasks by status (per column), tasks by priority, and tasks by type. This gives a quick health read without leaving the board.

**Why this priority**: High informational value and zero data risk (it reads existing board data), but it is a read-only summary that depends on Stories 1–2 to be fully meaningful (type chart, team size), so it follows them.

**Independent Test**: On a board with a known set of tasks across columns/priorities/types, open the Analytics view and confirm each metric and chart matches a hand-computed expectation; toggle theme and language and confirm the view stays legible and correctly mirrored.

**Acceptance Scenarios**:

1. **Given** a board whose tasks are distributed across its columns, **When** the Analytics view is opened, **Then** "Tasks by Status" shows one bar per column sized to that column's task count, and "Completion Rate" reflects the share of tasks considered complete per the documented rule.
2. **Given** tasks with assorted priorities, **When** the Analytics view is opened, **Then** "Tasks by Priority" shows a labeled proportion bar per priority (low/medium/high) with the count and percentage.
3. **Given** tasks of assorted types, **When** the Analytics view is opened, **Then** "Tasks by Type" shows the distribution across Task/Feature/Improvement.
4. **Given** some tasks are past due, **When** the Analytics view is opened, **Then** the "Overdue Tasks" metric equals the count of tasks whose due date is before today (using the existing due-status rule).
5. **Given** an empty board (no tasks), **When** the Analytics view is opened, **Then** metrics read zero and charts show an empty state without errors or division-by-zero artifacts.

---

### User Story 4 - View tasks on a calendar (Priority: P3)

A user switches to a monthly Calendar view that places each task with a due date on its day, can page between months, sees overdue days highlighted, and clicks a task to open the existing task dialog.

**Why this priority**: A useful alternate lens over due dates with zero backend cost, but secondary to the data-bearing stories. Equal priority to analytics; both are presentation-only views.

**Independent Test**: On a board with tasks due on known dates, open the Calendar view and confirm each task appears on the correct day; page to the previous/next month and confirm tasks shift accordingly; click a task and confirm the task dialog opens; confirm overdue days are visually marked.

**Acceptance Scenarios**:

1. **Given** tasks with due dates in the current month, **When** the Calendar view is opened, **Then** each task is shown on its due day in a correctly laid-out month grid.
2. **Given** the calendar on the current month, **When** the user pages to the next/previous month, **Then** the grid and the tasks shown update to that month.
3. **Given** a task shown on the calendar, **When** the user clicks it, **Then** the existing task dialog opens for that task.
4. **Given** tasks without a due date, **When** the Calendar view is opened, **Then** those tasks are not placed on any day (and are not lost — they remain on the board's other views).
5. **Given** a day in the past with an incomplete task, **When** the calendar renders, **Then** that task/day is visually marked as overdue, consistent with the board's overdue styling.

---

### Edge Cases

- **Assignee no longer a member**: if a task's assignee is removed from the board or deleted, the task must remain and show as unassigned (the reference clears rather than erroring).
- **Assigning to a non-member**: attempting to set an assignee who is not a board member is rejected with a validation error; the task is unchanged.
- **Permission boundary**: a viewer can read assignee/type but any attempt to change them is rejected; a non-member cannot see the board at all.
- **Completion rate with no "done" column**: the completion rule must be defined and not error when the board has no obviously-terminal column (see Assumptions).
- **Empty / single-column board**: analytics and calendar must render with zero tasks without errors.
- **Month boundaries & leading/trailing days**: the calendar grid must correctly render days from adjacent months in the first/last week, and handle months starting on any weekday and leap-year February.
- **Real-time echo**: an assignee/type change made by the current user must not be double-applied when its own broadcast returns (self-echo ignored by actor id, as today).
- **Reduced motion / transparency**: any new chart/transition must become static under reduced-motion and avoid relying on translucency under reduced-transparency.

## Requirements *(mandatory)*

### Functional Requirements

**Assignee (Story 1)**

- **FR-001**: A task MUST support an optional assignee that is one of the board's current members.
- **FR-002**: Users with edit rights (owner or editor) MUST be able to set or clear a task's assignee; viewers MUST NOT be able to change it but MUST be able to see it.
- **FR-003**: The system MUST reject an attempt to assign a task to a user who is not a member of that board, with a validation error, leaving the task unchanged.
- **FR-004**: A task's assignee MUST be visible as the member's avatar on the task card and selectable from the board's members (plus an "Unassigned" option) in the task dialog.
- **FR-005**: Assignee changes MUST be broadcast to other connected members in real time, consistent with existing task updates (and the originator must not double-apply its own echo).
- **FR-006**: The board filter MUST offer filtering by assignee (including a way to show all), combined conjunctively with the existing label/priority/due filters and text search.
- **FR-007**: If a task's assignee ceases to be a board member (membership removed or account deleted), the task MUST remain and become unassigned without error.

**Task Type (Story 2)**

- **FR-008**: A task MUST have a type with exactly one of three values — Task, Feature, Improvement — defaulting to Task when not specified.
- **FR-009**: Users with edit rights MUST be able to change a task's type; the change MUST be broadcast in real time.
- **FR-010**: Each type MUST render as a distinct icon+color badge on the task card and in the task dialog, legible in both themes and in RTL/LTR.
- **FR-011**: The board filter MUST offer filtering by type, combined conjunctively with the other filters and search.

**Analytics (Story 3)**

- **FR-012**: The system MUST provide a per-board Analytics view showing: completion rate, active task count, overdue task count, and team size (number of members).
- **FR-013**: The Analytics view MUST show three charts: tasks by status (per column), tasks by priority, and tasks by type, each labeled with counts and (where proportional) percentages.
- **FR-014**: Analytics metrics MUST be derived from the board's existing data (its columns/tasks/members) and MUST NOT require entering or duplicating data.
- **FR-015**: "Overdue" in analytics MUST use the same definition as the rest of the board (due date before today, local time).
- **FR-016**: The Analytics view MUST render correctly for an empty board (all zeros, empty-state charts, no errors).
- **FR-017**: The completion-rate rule MUST be documented and deterministic (see Assumptions) and MUST NOT error when the board lacks a terminal column.

**Calendar (Story 4)**

- **FR-018**: The system MUST provide a monthly Calendar view that places each task with a due date on its day within a correct month grid.
- **FR-019**: The Calendar view MUST allow paging to the previous and next month.
- **FR-020**: Clicking a task in the calendar MUST open the existing task dialog for that task.
- **FR-021**: Overdue days/tasks MUST be visually marked consistent with the board's overdue styling; tasks without a due date MUST simply not appear on the calendar (and not be lost elsewhere).

**Cross-cutting**

- **FR-022**: All new UI MUST be available in both Arabic and English with full dictionary-key parity, and MUST render correctly in both RTL and LTR and in both light and dark themes.
- **FR-023**: All new motion/transitions MUST become effectively instant under prefers-reduced-motion, and MUST not depend on translucency under prefers-reduced-transparency.
- **FR-024**: The settled (non-interactive) desktop appearance at ≥1280px MUST NOT change for existing screens except by additive elements (new badges, new filter controls, new views).
- **FR-025**: Permissions for all new write paths MUST honor the existing owner/editor/viewer roles, and errors MUST follow the existing structured error shape.

### Key Entities *(include if feature involves data)*

- **Task** (extended): gains an optional **assignee** (a reference to a board member / user) and a **type** (one of Task, Feature, Improvement; default Task). All existing attributes (title, description, due date, priority, position, labels, checklist counts) are unchanged.
- **Board Member**: unchanged; the set of valid assignees for a board's tasks and the basis for "team size".
- **Board View State** (client-only, extended): the existing per-board filter/sort state gains an **assignee filter** and a **type filter**; it remains presentation-only and is never shared between members.
- **Analytics Summary** (derived, not stored): the computed metrics and chart datasets for a board, produced from its current tasks/columns/members.
- **Calendar Month** (derived, not stored): the grid of days for a selected month and the mapping of tasks to days by due date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a board with multiple members, a user with edit rights can assign or reassign a task and see the assignee reflected on the card in under 5 seconds, and a second connected member sees the change without reloading.
- **SC-002**: 100% of attempts to assign a task to a non-member are rejected, and 0 tasks are left in an inconsistent state after such an attempt.
- **SC-003**: A user can narrow a board to a single assignee or a single type and see only matching tasks, with the result consistent with the other active filters.
- **SC-004**: Every task displays its type, and a task created without choosing a type is classified as "Task" 100% of the time.
- **SC-005**: For any given board, every analytics metric and chart equals an independent hand computation over that board's tasks/columns/members (verified on representative and empty boards).
- **SC-006**: The Calendar view places 100% of due-dated tasks on their correct day for the current month and after paging across month boundaries (including leap-year February), and clicking a task opens its dialog.
- **SC-007**: All four capabilities are fully usable in Arabic (RTL) and English (LTR) and in both themes, with no missing translated strings.
- **SC-008**: With reduced motion enabled, no new view introduces perceptible animation; with reduced transparency enabled, all new UI remains legible.

## Assumptions

- **Completion-rate rule**: a task is counted as "complete" when it resides in the board's last column (highest position). "Active" tasks are all non-complete tasks. This is deterministic for any board and degrades gracefully (a single-column board reports its tasks as complete only if that column is the last/only one — to be confirmed during planning and documented in the analytics module). If product feedback later prefers a named "Done" column or a per-column "is-done" flag, that is a follow-up.
- **Assignee source**: assignees are chosen only from the board's existing members (owner/editor/viewer); there is no new invitation flow in this feature.
- **Type values**: exactly three fixed types (Task, Feature, Improvement) with Task as default; custom user-defined types are out of scope.
- **Analytics scope**: analytics are per-board and computed client-side from the already-loaded board snapshot and member list; no new server endpoint is required unless planning finds the snapshot insufficient. No historical/time-series analytics in this feature.
- **Calendar scope**: monthly grid only (no week/day/agenda views), keyed off the existing task due date; no creating/editing tasks by clicking empty days (clicking an existing task opens the current dialog). The week start (Sunday vs Monday) follows the existing locale/date conventions used elsewhere in the app and will be fixed during planning.
- **Reused foundations**: the existing structured task model, real-time broadcast channel, role checks, Liquid Glass tokens, the existing Select and date components, the existing due-status rule, and the existing filter/sort pipeline are reused rather than re-created.
- **Out of scope**: Workspaces and Projects (a higher organizational layer above boards) are explicitly deferred and not part of this feature.
- **Charts**: charts are built with lightweight CSS/SVG primitives rather than a heavy external charting dependency.
