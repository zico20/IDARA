import { describe, expect, it } from "vitest";
import { findColumnOfTask, moveTaskInColumns } from "./board-logic";
import type { ColumnWithTasks, Task } from "./types";

function task(id: number, columnId: number): Task {
  return {
    id,
    column_id: columnId,
    title: `Task ${id}`,
    description: null,
    due_date: null,
    priority: "medium",
    type: "task",
    position: id * 1000,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    labels: [],
    assignee_id: null,
    assignee: null,
    checklist_done: 0,
    checklist_total: 0,
  };
}

function makeBoard(): ColumnWithTasks[] {
  return [
    {
      id: 1,
      board_id: 1,
      name: "To Do",
      position: 1000,
      tasks: [task(1, 1), task(2, 1), task(3, 1)],
    },
    {
      id: 2,
      board_id: 1,
      name: "Done",
      position: 2000,
      tasks: [task(4, 2)],
    },
  ];
}

describe("findColumnOfTask", () => {
  it("finds the owning column", () => {
    expect(findColumnOfTask(makeBoard(), 2)?.id).toBe(1);
    expect(findColumnOfTask(makeBoard(), 4)?.id).toBe(2);
  });
  it("returns undefined for unknown task", () => {
    expect(findColumnOfTask(makeBoard(), 999)).toBeUndefined();
  });
});

describe("moveTaskInColumns", () => {
  it("reorders within the same column", () => {
    const result = moveTaskInColumns(makeBoard(), 3, 1, 0);
    expect(result[0].tasks.map((t) => t.id)).toEqual([3, 1, 2]);
  });

  it("moves a task across columns and updates column_id", () => {
    const result = moveTaskInColumns(makeBoard(), 1, 2, 0);
    expect(result[0].tasks.map((t) => t.id)).toEqual([2, 3]);
    expect(result[1].tasks.map((t) => t.id)).toEqual([1, 4]);
    const moved = result[1].tasks.find((t) => t.id === 1);
    expect(moved?.column_id).toBe(2);
  });

  it("clamps an out-of-range index to the end", () => {
    const result = moveTaskInColumns(makeBoard(), 4, 1, 99);
    expect(result[0].tasks.map((t) => t.id)).toEqual([1, 2, 3, 4]);
  });

  it("is a no-op for an unknown task", () => {
    const board = makeBoard();
    expect(moveTaskInColumns(board, 999, 2, 0)).toEqual(board);
  });
});
