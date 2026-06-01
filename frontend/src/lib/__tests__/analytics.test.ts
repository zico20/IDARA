import { describe, expect, it } from "vitest";
import { computeBoardAnalytics } from "../analytics";
import type { BoardSnapshot, ColumnWithTasks, Task } from "../types";

const NOW = new Date("2026-05-30T12:00:00Z");

function task(over: Partial<Task> & { id: number }): Task {
  return {
    id: over.id,
    column_id: over.column_id ?? 1,
    title: over.title ?? `T${over.id}`,
    description: null,
    due_date: over.due_date ?? null,
    priority: over.priority ?? "medium",
    type: over.type ?? "task",
    position: over.position ?? over.id * 1000,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    labels: [],
    assignee_id: over.assignee_id ?? null,
    assignee: null,
    checklist_done: 0,
    checklist_total: 0,
  };
}

function col(id: number, name: string, tasks: Task[]): ColumnWithTasks {
  return { id, board_id: 1, name, position: id * 1000, tasks };
}

function snap(columns: ColumnWithTasks[]): BoardSnapshot {
  return { board_id: 1, columns };
}

describe("computeBoardAnalytics", () => {
  it("computes metrics over a representative board", () => {
    const s = snap([
      col(1, "To Do", [
        task({ id: 1, priority: "high", type: "feature" }),
        task({ id: 2, priority: "low", type: "task" }),
      ]),
      col(2, "In Progress", [task({ id: 3, priority: "high", type: "improvement" })]),
      col(3, "Done", [task({ id: 4, priority: "medium", type: "task" })]),
    ]);
    const a = computeBoardAnalytics(s, 3, NOW);

    expect(a.total).toBe(4);
    expect(a.complete).toBe(1); // last column "Done" has 1
    expect(a.active).toBe(3);
    expect(a.completionRate).toBe(25);
    expect(a.teamSize).toBe(3);

    expect(a.byStatus).toEqual([
      { columnId: 1, name: "To Do", count: 2 },
      { columnId: 2, name: "In Progress", count: 1 },
      { columnId: 3, name: "Done", count: 1 },
    ]);

    const high = a.byPriority.find((p) => p.priority === "high")!;
    expect(high.count).toBe(2);
    expect(high.pct).toBe(50);

    const feature = a.byType.find((t) => t.type === "feature")!;
    expect(feature.count).toBe(1);
    expect(feature.pct).toBe(25);
  });

  it("counts overdue tasks using the shared due rule", () => {
    const s = snap([
      col(1, "To Do", [
        task({ id: 1, due_date: "2026-05-20T00:00:00Z" }), // overdue vs NOW
        task({ id: 2, due_date: "2026-06-10T00:00:00Z" }), // upcoming
        task({ id: 3, due_date: null }), // none
      ]),
    ]);
    expect(computeBoardAnalytics(s, 1, NOW).overdue).toBe(1);
  });

  it("handles an empty board with no errors and no division by zero", () => {
    const a = computeBoardAnalytics(snap([]), 0, NOW);
    expect(a.total).toBe(0);
    expect(a.complete).toBe(0);
    expect(a.active).toBe(0);
    expect(a.completionRate).toBe(0);
    expect(a.overdue).toBe(0);
    expect(a.byStatus).toEqual([]);
    expect(a.byPriority.every((p) => p.count === 0 && p.pct === 0)).toBe(true);
    expect(a.byType.every((t) => t.count === 0 && t.pct === 0)).toBe(true);
  });

  it("treats the single column as the last (all its tasks complete)", () => {
    const s = snap([col(1, "Only", [task({ id: 1 }), task({ id: 2 })])]);
    const a = computeBoardAnalytics(s, 1, NOW);
    expect(a.complete).toBe(2);
    expect(a.completionRate).toBe(100);
  });

  it("handles an undefined snapshot gracefully", () => {
    const a = computeBoardAnalytics(undefined, 0, NOW);
    expect(a.total).toBe(0);
    expect(a.byStatus).toEqual([]);
  });
});
