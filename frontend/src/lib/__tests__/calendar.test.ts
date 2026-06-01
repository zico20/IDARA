import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  mapTasksToDays,
  tasksForDay,
  weekStartFor,
} from "../calendar";
import type { Task } from "../types";

function task(id: number, due: string | null): Task {
  return {
    id,
    column_id: 1,
    title: `T${id}`,
    description: null,
    due_date: due,
    priority: "medium",
    type: "task",
    position: id * 1000,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    labels: [],
    assignee_id: null,
    assignee: null,
    checklist_done: 0,
    checklist_total: 0,
  };
}

describe("buildMonthGrid", () => {
  it("returns whole weeks of 7 days each", () => {
    const grid = buildMonthGrid(2026, 5, 0); // June 2026
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid.length).toBeGreaterThanOrEqual(4);
    expect(grid.length).toBeLessThanOrEqual(6);
  });

  it("flags leading/trailing days from adjacent months", () => {
    // June 2026 starts on a Monday; with Sunday start, the first cell is May 31.
    const grid = buildMonthGrid(2026, 5, 0);
    const first = grid[0][0];
    expect(first.inCurrentMonth).toBe(false);
    expect(first.date.getMonth()).toBe(4); // May
    // Every in-current-month cell is actually in June.
    for (const week of grid) {
      for (const cell of week) {
        if (cell.inCurrentMonth) expect(cell.date.getMonth()).toBe(5);
      }
    }
  });

  it("covers all days of the target month exactly once", () => {
    const grid = buildMonthGrid(2026, 1, 0); // Feb 2026 (28 days)
    const febDays = grid
      .flat()
      .filter((c) => c.inCurrentMonth)
      .map((c) => c.date.getDate());
    expect(febDays).toEqual([...Array(28)].map((_, i) => i + 1));
  });

  it("handles leap-year February (2028 → 29 days)", () => {
    const grid = buildMonthGrid(2028, 1, 0);
    const days = grid.flat().filter((c) => c.inCurrentMonth).map((c) => c.date.getDate());
    expect(days[days.length - 1]).toBe(29);
  });

  it("respects a Saturday week start", () => {
    const grid = buildMonthGrid(2026, 5, 6);
    expect(grid[0][0].date.getDay()).toBe(6); // Saturday
  });
});

describe("weekStartFor", () => {
  it("is Saturday for ar and Sunday for en", () => {
    expect(weekStartFor("ar")).toBe(6);
    expect(weekStartFor("en")).toBe(0);
  });
});

describe("mapTasksToDays", () => {
  it("groups due-dated tasks by day and omits undated ones", () => {
    const tasks = [
      task(1, "2026-06-10T09:00:00"),
      task(2, "2026-06-10T15:00:00"),
      task(3, "2026-06-12T00:00:00"),
      task(4, null),
    ];
    const byDay = mapTasksToDays(tasks);
    expect(tasksForDay(byDay, new Date(2026, 5, 10)).map((t) => t.id)).toEqual([
      1, 2,
    ]);
    expect(tasksForDay(byDay, new Date(2026, 5, 12)).map((t) => t.id)).toEqual([3]);
    // Undated task is absent everywhere.
    expect([...byDay.values()].flat().some((t) => t.id === 4)).toBe(false);
  });

  it("returns an empty list for a day with no tasks", () => {
    const byDay = mapTasksToDays([task(1, "2026-06-10T00:00:00")]);
    expect(tasksForDay(byDay, new Date(2026, 5, 11))).toEqual([]);
  });
});
