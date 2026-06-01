import type { ColumnWithTasks, Task } from "./types";

// Seed data for the no-signup demo board. Lives entirely in the browser.
let _id = 1000;
export const nextDemoId = () => ++_id;

function task(
  id: number,
  columnId: number,
  title: string,
  priority: Task["priority"],
  position: number,
): Task {
  return {
    id,
    column_id: columnId,
    title,
    description: null,
    due_date: null,
    priority,
    type: "task",
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: [],
    assignee_id: null,
    assignee: null,
    checklist_done: 0,
    checklist_total: 0,
  };
}

export function demoColumns(): ColumnWithTasks[] {
  return [
    {
      id: 1,
      board_id: 1,
      name: "To Do",
      position: 1000,
      tasks: [
        task(101, 1, "Design the landing page", "high", 1000),
        task(102, 1, "Write API documentation", "medium", 2000),
        task(103, 1, "Pick a color palette", "low", 3000),
      ],
    },
    {
      id: 2,
      board_id: 1,
      name: "In Progress",
      position: 2000,
      tasks: [task(201, 2, "Build the auth flow", "high", 1000)],
    },
    {
      id: 3,
      board_id: 1,
      name: "Done",
      position: 3000,
      tasks: [
        task(301, 3, "Set up the project", "low", 1000),
        task(302, 3, "Create database schema", "medium", 2000),
      ],
    },
  ];
}
