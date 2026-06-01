// Pure, presentation-only filtering + sorting over the board snapshot. Never
// mutates server data; never shared between members. Unit-tested in isolation.
import type { ColumnWithTasks, Priority, Task, TaskType } from "./types";
import { dueInfo, type DueStatus } from "./due-status";

export type SortMode = "manual" | "due" | "priority" | "created";

export interface ViewState {
  labelFilter: number[];
  priorityFilter: Priority[];
  dueFilter: DueStatus[];
  assigneeFilter: number[];
  typeFilter: TaskType[];
  sort: SortMode;
}

export const EMPTY_VIEW: ViewState = {
  labelFilter: [],
  priorityFilter: [],
  dueFilter: [],
  assigneeFilter: [],
  typeFilter: [],
  sort: "manual",
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** True if a task passes ALL active filters (conjunctive) + the text search. */
export function taskMatches(
  task: Task,
  view: ViewState,
  search: string,
  now: Date = new Date(),
): boolean {
  // Text search (title or label name) — same semantics as the existing search.
  const q = search.trim().toLowerCase();
  if (q) {
    const inText =
      task.title.toLowerCase().includes(q) ||
      task.labels.some((l) => l.name.toLowerCase().includes(q));
    if (!inText) return false;
  }

  if (view.labelFilter.length > 0) {
    const ids = new Set(task.labels.map((l) => l.id));
    if (!view.labelFilter.some((id) => ids.has(id))) return false;
  }

  if (view.priorityFilter.length > 0 && !view.priorityFilter.includes(task.priority)) {
    return false;
  }

  if (view.dueFilter.length > 0) {
    const status = dueInfo(task.due_date, now).status;
    if (!view.dueFilter.includes(status)) return false;
  }

  if (view.assigneeFilter.length > 0) {
    if (task.assignee_id === null) return false;
    if (!view.assigneeFilter.includes(task.assignee_id)) return false;
  }

  if (view.typeFilter.length > 0 && !view.typeFilter.includes(task.type)) {
    return false;
  }

  return true;
}

function sortTasks(tasks: Task[], sort: SortMode): Task[] {
  if (sort === "manual") return tasks; // preserve stored order (and DnD)
  const copy = [...tasks];
  switch (sort) {
    case "due":
      // Ascending by due date; tasks with no date sort last.
      copy.sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      });
      break;
    case "priority":
      copy.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      break;
    case "created":
      copy.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      break;
  }
  return copy;
}

/**
 * Apply filters + sort to every column. Returns NEW arrays (no mutation of the
 * cached snapshot). Columns themselves are preserved (order/identity), only
 * their `tasks` arrays are transformed.
 */
export function applyView(
  columns: ColumnWithTasks[],
  view: ViewState,
  search: string,
  now: Date = new Date(),
): ColumnWithTasks[] {
  return columns.map((c) => {
    const filtered = c.tasks.filter((t) => taskMatches(t, view, search, now));
    return { ...c, tasks: sortTasks(filtered, view.sort) };
  });
}

/** Whether any filter or non-manual sort is active. */
export function isViewActive(view: ViewState): boolean {
  return (
    view.labelFilter.length > 0 ||
    view.priorityFilter.length > 0 ||
    view.dueFilter.length > 0 ||
    view.assigneeFilter.length > 0 ||
    view.typeFilter.length > 0 ||
    view.sort !== "manual"
  );
}
