// Pure month-grid generation + task→day mapping for the calendar view. Uses
// date-fns (already a dependency via due-status) — no new runtime dep. Framework
// free and deterministic, so month boundaries / leap years are unit-tested.
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Locale } from "./i18n/locale";
import type { Task } from "./types";

export interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
}

/** Week start per locale: Arabic calendars conventionally start on Saturday. */
export function weekStartFor(locale: Locale): 0 | 6 {
  return locale === "ar" ? 6 : 0; // 6=Saturday, 0=Sunday
}

/**
 * Build a month grid covering whole weeks (so the first/last week include
 * leading/trailing days from adjacent months, flagged `inCurrentMonth: false`).
 * Returns rows of 7 day cells.
 */
export function buildMonthGrid(
  year: number,
  month: number, // 0-based
  weekStartsOn: 0 | 6 = 0,
): DayCell[][] {
  const first = startOfMonth(new Date(year, month, 1));
  const last = endOfMonth(first);
  const gridStart = startOfWeek(first, { weekStartsOn });
  const gridEnd = endOfWeek(last, { weekStartsOn });

  const rows: DayCell[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: cursor, inCurrentMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    rows.push(week);
  }
  return rows;
}

/**
 * Group due-dated tasks by their local calendar day (YYYY-MM-DD key). Tasks
 * without a due date are omitted (they remain on the board's other views).
 */
export function mapTasksToDays(tasks: Task[]): Map<string, Task[]> {
  const byDay = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.due_date) continue;
    const key = format(new Date(t.due_date), "yyyy-MM-dd");
    const bucket = byDay.get(key);
    if (bucket) bucket.push(t);
    else byDay.set(key, [t]);
  }
  return byDay;
}

/** Tasks due on a specific calendar day. */
export function tasksForDay(byDay: Map<string, Task[]>, day: Date): Task[] {
  return byDay.get(format(day, "yyyy-MM-dd")) ?? [];
}

export { isSameDay };
