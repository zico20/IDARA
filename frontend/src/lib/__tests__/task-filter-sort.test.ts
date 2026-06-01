import { describe, expect, it } from "vitest";
import {
  applyView,
  isViewActive,
  taskMatches,
  EMPTY_VIEW,
  type ViewState,
} from "../task-filter-sort";
import type { ColumnWithTasks, Label, Task } from "../types";

const NOW = new Date("2026-05-30T12:00:00Z");

function label(id: number, name: string): Label {
  return { id, board_id: 1, name, color: "#fff" };
}

function task(over: Partial<Task> & { id: number }): Task {
  return {
    id: over.id,
    column_id: over.column_id ?? 1,
    title: over.title ?? `Task ${over.id}`,
    description: null,
    due_date: over.due_date ?? null,
    priority: over.priority ?? "medium",
    type: over.type ?? "task",
    position: over.position ?? over.id * 1000,
    created_at: over.created_at ?? "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    labels: over.labels ?? [],
    assignee_id: over.assignee_id ?? null,
    assignee: over.assignee ?? null,
    checklist_done: 0,
    checklist_total: 0,
  };
}

const bug = label(1, "bug");
const feat = label(2, "feature");

function col(tasks: Task[]): ColumnWithTasks {
  return { id: 1, board_id: 1, name: "C", position: 1000, tasks };
}

describe("taskMatches", () => {
  const t1 = task({ id: 1, title: "Fix login", priority: "high", labels: [bug] });

  it("matches when no filters are active", () => {
    expect(taskMatches(t1, EMPTY_VIEW, "", NOW)).toBe(true);
  });

  it("filters by label", () => {
    const view: ViewState = { ...EMPTY_VIEW, labelFilter: [feat.id] };
    expect(taskMatches(t1, view, "", NOW)).toBe(false);
    expect(taskMatches(t1, { ...EMPTY_VIEW, labelFilter: [bug.id] }, "", NOW)).toBe(
      true,
    );
  });

  it("filters by priority", () => {
    expect(
      taskMatches(t1, { ...EMPTY_VIEW, priorityFilter: ["low"] }, "", NOW),
    ).toBe(false);
    expect(
      taskMatches(t1, { ...EMPTY_VIEW, priorityFilter: ["high"] }, "", NOW),
    ).toBe(true);
  });

  it("filters by due status", () => {
    const overdue = task({ id: 9, due_date: "2026-05-20T00:00:00Z" });
    expect(
      taskMatches(overdue, { ...EMPTY_VIEW, dueFilter: ["overdue"] }, "", NOW),
    ).toBe(true);
    expect(
      taskMatches(overdue, { ...EMPTY_VIEW, dueFilter: ["today"] }, "", NOW),
    ).toBe(false);
  });

  it("combines filters conjunctively (must match ALL)", () => {
    const view: ViewState = {
      ...EMPTY_VIEW,
      labelFilter: [bug.id],
      priorityFilter: ["low"], // t1 is high → should fail overall
    };
    expect(taskMatches(t1, view, "", NOW)).toBe(false);
  });

  it("honors text search over title and label names", () => {
    expect(taskMatches(t1, EMPTY_VIEW, "login", NOW)).toBe(true);
    expect(taskMatches(t1, EMPTY_VIEW, "bug", NOW)).toBe(true); // label name
    expect(taskMatches(t1, EMPTY_VIEW, "zzz", NOW)).toBe(false);
  });

  it("filters by assignee (empty filter = all)", () => {
    const assigned = task({ id: 20, assignee_id: 7 });
    const unassigned = task({ id: 21, assignee_id: null });
    // Empty assignee filter matches everything.
    expect(taskMatches(assigned, EMPTY_VIEW, "", NOW)).toBe(true);
    expect(taskMatches(unassigned, EMPTY_VIEW, "", NOW)).toBe(true);
    // Filtering to user 7 keeps only their tasks.
    const view: ViewState = { ...EMPTY_VIEW, assigneeFilter: [7] };
    expect(taskMatches(assigned, view, "", NOW)).toBe(true);
    expect(taskMatches(unassigned, view, "", NOW)).toBe(false);
  });

  it("filters by type (empty filter = all)", () => {
    const feature = task({ id: 30, type: "feature" });
    const plain = task({ id: 31, type: "task" });
    const view: ViewState = { ...EMPTY_VIEW, typeFilter: ["feature"] };
    expect(taskMatches(feature, view, "", NOW)).toBe(true);
    expect(taskMatches(plain, view, "", NOW)).toBe(false);
    expect(taskMatches(plain, EMPTY_VIEW, "", NOW)).toBe(true);
  });

  it("combines assignee + type conjunctively", () => {
    const t = task({ id: 40, type: "feature", assignee_id: 7 });
    expect(
      taskMatches(t, { ...EMPTY_VIEW, typeFilter: ["feature"], assigneeFilter: [7] }, "", NOW),
    ).toBe(true);
    expect(
      taskMatches(t, { ...EMPTY_VIEW, typeFilter: ["feature"], assigneeFilter: [8] }, "", NOW),
    ).toBe(false);
  });
});

describe("applyView sorting", () => {
  const tasks = [
    task({ id: 1, position: 3000, priority: "low", due_date: "2026-06-10T00:00:00Z", created_at: "2026-05-03T00:00:00Z" }),
    task({ id: 2, position: 1000, priority: "high", due_date: null, created_at: "2026-05-01T00:00:00Z" }),
    task({ id: 3, position: 2000, priority: "medium", due_date: "2026-06-01T00:00:00Z", created_at: "2026-05-02T00:00:00Z" }),
  ];

  it("manual sort preserves the given order", () => {
    const out = applyView([col(tasks)], EMPTY_VIEW, "", NOW);
    expect(out[0].tasks.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("due sort orders by date with no-date last", () => {
    const out = applyView([col(tasks)], { ...EMPTY_VIEW, sort: "due" }, "", NOW);
    expect(out[0].tasks.map((t) => t.id)).toEqual([3, 1, 2]); // 06-01, 06-10, none
  });

  it("priority sort orders high → medium → low", () => {
    const out = applyView(
      [col(tasks)],
      { ...EMPTY_VIEW, sort: "priority" },
      "",
      NOW,
    );
    expect(out[0].tasks.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it("created sort orders oldest first", () => {
    const out = applyView(
      [col(tasks)],
      { ...EMPTY_VIEW, sort: "created" },
      "",
      NOW,
    );
    expect(out[0].tasks.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it("does not mutate the input tasks array", () => {
    const input = col(tasks);
    applyView([input], { ...EMPTY_VIEW, sort: "priority" }, "", NOW);
    expect(input.tasks.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("yields an empty task list for a column with no matches", () => {
    const out = applyView(
      [col(tasks)],
      { ...EMPTY_VIEW, priorityFilter: ["high"] },
      "",
      NOW,
    );
    expect(out[0].tasks.map((t) => t.id)).toEqual([2]);
    const none = applyView(
      [col(tasks)],
      { ...EMPTY_VIEW, labelFilter: [999] },
      "",
      NOW,
    );
    expect(none[0].tasks).toEqual([]);
  });
});

describe("isViewActive", () => {
  it("is false for the empty view", () => {
    expect(isViewActive(EMPTY_VIEW)).toBe(false);
  });
  it("is true when any filter or non-manual sort is set", () => {
    expect(isViewActive({ ...EMPTY_VIEW, sort: "due" })).toBe(true);
    expect(isViewActive({ ...EMPTY_VIEW, priorityFilter: ["high"] })).toBe(true);
    expect(isViewActive({ ...EMPTY_VIEW, assigneeFilter: [7] })).toBe(true);
    expect(isViewActive({ ...EMPTY_VIEW, typeFilter: ["feature"] })).toBe(true);
  });
});
