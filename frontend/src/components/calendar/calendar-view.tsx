"use client";

import { useMemo, useState } from "react";
import { addMonths, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildMonthGrid,
  mapTasksToDays,
  tasksForDay,
  weekStartFor,
} from "@/lib/calendar";
import { dueInfo } from "@/lib/due-status";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import type { BoardSnapshot, Task } from "@/lib/types";

export function CalendarView({
  snapshot,
  onOpenTask,
}: {
  snapshot: BoardSnapshot | undefined;
  onOpenTask: (task: Task) => void;
}) {
  const { locale } = useLocale();
  const dateLocale = locale === "ar" ? "ar" : "en";
  const today = useMemo(() => new Date(), []);
  // The visible month, as a date on its first day.
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const weekStartsOn = weekStartFor(locale);
  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth(), weekStartsOn),
    [cursor, weekStartsOn],
  );

  const tasks = useMemo(
    () => (snapshot?.columns ?? []).flatMap((c) => c.tasks),
    [snapshot],
  );
  const byDay = useMemo(() => mapTasksToDays(tasks), [tasks]);

  // Weekday headers from the grid's first row, localized.
  const weekdays = grid[0].map((cell) =>
    cell.date.toLocaleDateString(dateLocale, { weekday: "short" }),
  );

  const monthLabel = cursor.toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl pb-6">
      {/* Header: month + paging */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-fg">{monthLabel}</h2>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="previous month"
          >
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
            }
          >
            {format(today, "MMM d")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="next month"
          >
            <ChevronRight size={16} className="rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((w, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-fg-subtle"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {grid.flat().map((cell, i) => {
          const dayTasks = tasksForDay(byDay, cell.date);
          const isToday = isSameDay(cell.date, today);
          return (
            <div
              key={i}
              className={cn(
                "min-h-[88px] rounded-lg border border-border/70 bg-bg-subtle/40 p-1.5",
                !cell.inCurrentMonth && "opacity-40",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                  isToday
                    ? "bg-accent font-bold text-bg"
                    : "text-fg-subtle",
                )}
              >
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.map((task) => {
                  const overdue = dueInfo(task.due_date).status === "overdue";
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task)}
                      title={task.title}
                      dir="auto"
                      className={cn(
                        "block w-full truncate rounded px-1.5 py-0.5 text-start text-[11px] transition-colors motion-reduce:transition-none",
                        overdue
                          ? "bg-danger/15 text-danger hover:bg-danger/25"
                          : "bg-accent/15 text-fg hover:bg-accent/25",
                      )}
                    >
                      {task.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
