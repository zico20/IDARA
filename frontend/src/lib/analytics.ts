// Pure, presentation-only board analytics computed from the already-loaded
// board snapshot + member list. No fetching, no mutation, framework-free — so
// it is trivially unit-tested. See research.md §5 for the completion rule.
import type { BoardSnapshot, Priority, TaskType } from "./types";
import { dueInfo } from "./due-status";

export interface StatusDatum {
  columnId: number;
  name: string;
  count: number;
}
export interface PriorityDatum {
  priority: Priority;
  count: number;
  pct: number; // 0..100, rounded
}
export interface TypeDatum {
  type: TaskType;
  count: number;
  pct: number; // 0..100, rounded
}

export interface BoardAnalytics {
  total: number;
  complete: number;
  active: number;
  completionRate: number; // 0..100, rounded
  overdue: number;
  teamSize: number;
  byStatus: StatusDatum[];
  byPriority: PriorityDatum[];
  byType: TypeDatum[];
}

const PRIORITIES: Priority[] = ["low", "medium", "high"];
const TYPES: TaskType[] = ["task", "feature", "improvement"];

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/**
 * Compute board metrics + chart datasets.
 *
 * Completion rule (documented): a task is "complete" when it sits in the board's
 * LAST column (the final column in the snapshot's column order). "Active" is the
 * remainder. Empty board → all zeros, no division by zero.
 *
 * @param now injectable for deterministic overdue tests.
 */
export function computeBoardAnalytics(
  snapshot: BoardSnapshot | undefined,
  teamSize: number,
  now: Date = new Date(),
): BoardAnalytics {
  const columns = snapshot?.columns ?? [];
  const allTasks = columns.flatMap((c) => c.tasks);
  const total = allTasks.length;

  const lastColumn = columns[columns.length - 1];
  const complete = lastColumn ? lastColumn.tasks.length : 0;
  const active = total - complete;

  const overdue = allTasks.filter(
    (t) => dueInfo(t.due_date, now).status === "overdue",
  ).length;

  const byStatus: StatusDatum[] = columns.map((c) => ({
    columnId: c.id,
    name: c.name,
    count: c.tasks.length,
  }));

  const byPriority: PriorityDatum[] = PRIORITIES.map((p) => {
    const count = allTasks.filter((t) => t.priority === p).length;
    return { priority: p, count, pct: pct(count, total) };
  });

  const byType: TypeDatum[] = TYPES.map((ty) => {
    const count = allTasks.filter((t) => t.type === ty).length;
    return { type: ty, count, pct: pct(count, total) };
  });

  return {
    total,
    complete,
    active,
    completionRate: pct(complete, total),
    overdue,
    teamSize,
    byStatus,
    byPriority,
    byType,
  };
}
