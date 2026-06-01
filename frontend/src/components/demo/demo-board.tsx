"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Trash2, X } from "lucide-react";
import { SortableTaskCard, TaskCardContent } from "@/components/kanban/task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { findColumnOfTask } from "@/lib/board-logic";
import { demoColumns, nextDemoId } from "@/lib/demo-data";
import type { ColumnWithTasks, Priority, Task } from "@/lib/types";

const parseId = (id: string) => Number(id.split("-")[1]);

/**
 * Fully local kanban — no backend. Reuses the same task cards and drag mechanics
 * as the real board, but state lives in React (resets on reload). This powers the
 * "try without signing up" experience.
 */
export function DemoBoard() {
  const [columns, setColumns] = useState<ColumnWithTasks[]>(() => demoColumns());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [composing, setComposing] = useState<number | null>(null); // columnId
  const [draft, setDraft] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (data?.type === "task") setActiveTask(data.task as Task);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("task-")) return;
    const activeTaskId = parseId(activeId);

    setColumns((cols) => {
      const fromCol = findColumnOfTask(cols, activeTaskId);
      if (!fromCol) return cols;
      let toCol: ColumnWithTasks | undefined;
      if (overId.startsWith("column-"))
        toCol = cols.find((c) => c.id === parseId(overId));
      else if (overId.startsWith("task-"))
        toCol = findColumnOfTask(cols, parseId(overId));
      if (!toCol || fromCol.id === toCol.id) return cols;

      const t = fromCol.tasks.find((x) => x.id === activeTaskId);
      if (!t) return cols;
      return cols.map((c) => {
        if (c.id === fromCol.id)
          return { ...c, tasks: c.tasks.filter((x) => x.id !== activeTaskId) };
        if (c.id === toCol!.id)
          return { ...c, tasks: [...c.tasks, { ...t, column_id: c.id }] };
        return c;
      });
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("task-") || !overId.startsWith("task-")) return;

    setColumns((cols) => {
      const col = findColumnOfTask(cols, parseId(activeId));
      if (!col) return cols;
      const oldIdx = col.tasks.findIndex((t) => t.id === parseId(activeId));
      const newIdx = col.tasks.findIndex((t) => t.id === parseId(overId));
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return cols;
      return cols.map((c) =>
        c.id === col.id
          ? { ...c, tasks: arrayMove(c.tasks, oldIdx, newIdx) }
          : c,
      );
    });
  };

  const addTask = (columnId: number) => {
    const title = draft.trim();
    if (!title) {
      setComposing(null);
      return;
    }
    const priorities: Priority[] = ["low", "medium", "high"];
    const newTask: Task = {
      id: nextDemoId(),
      column_id: columnId,
      title,
      description: null,
      due_date: null,
      priority: priorities[Math.floor(title.length % 3)],
      type: "task",
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
      assignee_id: null,
      assignee: null,
      checklist_done: 0,
      checklist_total: 0,
    };
    setColumns((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c,
      ),
    );
    setDraft("");
    setComposing(null);
  };

  const deleteTask = (taskId: number) => {
    setColumns((cols) =>
      cols.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      })),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <DemoColumn
            key={column.id}
            column={column}
            composing={composing === column.id}
            draft={draft}
            onDraftChange={setDraft}
            onStartCompose={() => {
              setComposing(column.id);
              setDraft("");
            }}
            onCancelCompose={() => setComposing(null)}
            onAddTask={() => addTask(column.id)}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-64 rotate-2 opacity-90">
            <TaskCardContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DemoColumn({
  column,
  composing,
  draft,
  onDraftChange,
  onStartCompose,
  onCancelCompose,
  onAddTask,
  onDeleteTask,
}: {
  column: ColumnWithTasks;
  composing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onStartCompose: () => void;
  onCancelCompose: () => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: number) => void;
}) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-fg">{column.name}</h3>
        <span className="rounded-full bg-bg-muted px-1.5 text-xs text-fg-subtle">
          {column.tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[60px] flex-col gap-2 rounded-xl border border-transparent bg-bg-subtle/60 p-2 transition-colors",
          isOver && "border-accent/40 bg-bg-subtle",
        )}
      >
        <SortableContext
          items={column.tasks.map((t) => `task-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <div key={task.id} className="group/task relative">
              <SortableTaskCard task={task} onClick={() => {}} />
              <button
                onClick={() => onDeleteTask(task.id)}
                className="absolute end-1.5 top-1.5 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-danger/15 hover:text-danger group-hover/task:opacity-100"
                title={t("demo.delete")}
                aria-label="Delete task"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </SortableContext>

        {column.tasks.length === 0 && !composing && (
          <p className="px-1 py-3 text-center text-xs text-fg-subtle">
            {t("demo.noTasks")}
          </p>
        )}

        {composing && (
          <div className="rounded-xl border border-accent/40 bg-bg-elevated p-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddTask();
                }
                if (e.key === "Escape") onCancelCompose();
              }}
              placeholder={t("demo.taskPlaceholder")}
              className="w-full resize-none bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              rows={2}
            />
            <div className="mt-1 flex items-center gap-2">
              <Button size="sm" onClick={onAddTask}>
                {t("common.add")}
              </Button>
              <button
                onClick={onCancelCompose}
                className="rounded p-1 text-fg-subtle hover:text-fg"
                aria-label={t("common.cancel")}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {!composing && (
        <button
          onClick={onStartCompose}
          className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <Plus size={15} /> {t("demo.addTask")}
        </button>
      )}
    </div>
  );
}
