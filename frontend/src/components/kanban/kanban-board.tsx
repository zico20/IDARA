"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./column";
import { TaskCardContent } from "./task-card";
import { Button } from "@/components/ui/button";
import type {
  BoardSnapshot,
  ColumnWithTasks,
  Label as LabelType,
  Task,
} from "@/lib/types";
import {
  snapshotKey,
  useDeleteColumn,
  useMoveTask,
  useRenameColumn,
} from "@/hooks/use-board";

interface KanbanBoardProps {
  boardId: number;
  columns: ColumnWithTasks[];
  canEdit: boolean;
  /** When false (a non-manual sort is active), drag reordering is disabled so we
   *  never persist an order that contradicts the visible sort. Defaults to true. */
  dragEnabled?: boolean;
  labels: LabelType[];
  onAddTask: (columnId: number) => void;
  onOpenTask: (task: Task) => void;
  onAddColumn: () => void;
}

function findColumnOfTask(
  cols: ColumnWithTasks[],
  taskId: number,
): ColumnWithTasks | undefined {
  return cols.find((c) => c.tasks.some((t) => t.id === taskId));
}

const parseId = (id: string) => Number(id.split("-")[1]);

export function KanbanBoard({
  boardId,
  columns,
  canEdit,
  dragEnabled = true,
  labels,
  onAddTask,
  onOpenTask,
  onAddColumn,
}: KanbanBoardProps) {
  const qc = useQueryClient();
  const moveTask = useMoveTask(boardId);
  const renameColumn = useRenameColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Tasks are draggable only with edit rights AND manual sort (FR-022, FR-023).
  const canDrag = canEdit && dragEnabled;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const setSnapshot = (
    fn: (cols: ColumnWithTasks[]) => ColumnWithTasks[],
  ) => {
    qc.setQueryData<BoardSnapshot>(snapshotKey(boardId), (prev) =>
      prev ? { ...prev, columns: fn(prev.columns) } : prev,
    );
  };

  const onDragStart = (e: DragStartEvent) => {
    if (!canDrag) return;
    const data = e.active.data.current;
    if (data?.type === "task") setActiveTask(data.task as Task);
  };

  // Move the dragged task between columns live while hovering, so the layout
  // reflows under the cursor (the hallmark of a good kanban feel).
  const onDragOver = (e: DragOverEvent) => {
    if (!canDrag) return;
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("task-")) return;

    const activeTaskId = parseId(activeId);

    setSnapshot((cols) => {
      const fromCol = findColumnOfTask(cols, activeTaskId);
      if (!fromCol) return cols;

      // Determine the destination column.
      let toCol: ColumnWithTasks | undefined;
      if (overId.startsWith("column-")) {
        toCol = cols.find((c) => c.id === parseId(overId));
      } else if (overId.startsWith("task-")) {
        toCol = findColumnOfTask(cols, parseId(overId));
      }
      if (!toCol || fromCol.id === toCol.id) return cols;

      const task = fromCol.tasks.find((t) => t.id === activeTaskId);
      if (!task) return cols;

      return cols.map((c) => {
        if (c.id === fromCol.id) {
          return { ...c, tasks: c.tasks.filter((t) => t.id !== activeTaskId) };
        }
        if (c.id === toCol!.id) {
          return { ...c, tasks: [...c.tasks, { ...task, column_id: c.id }] };
        }
        return c;
      });
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    if (!canDrag) return;
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("task-")) return;

    const activeTaskId = parseId(activeId);

    // Read current (already-reflowed) cache to compute final ordering.
    const snapshot = qc.getQueryData<BoardSnapshot>(snapshotKey(boardId));
    if (!snapshot) return;
    let cols = snapshot.columns;

    const destCol = findColumnOfTask(cols, activeTaskId);
    if (!destCol) return;

    // Reorder within the destination column if dropped over another task.
    if (overId.startsWith("task-")) {
      const overTaskId = parseId(overId);
      const oldIndex = destCol.tasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = destCol.tasks.findIndex((t) => t.id === overTaskId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(destCol.tasks, oldIndex, newIndex);
        cols = cols.map((c) =>
          c.id === destCol.id ? { ...c, tasks: reordered } : c,
        );
        setSnapshot(() => cols);
      }
    }

    const finalCol = findColumnOfTask(cols, activeTaskId)!;
    const finalIndex = finalCol.tasks.findIndex((t) => t.id === activeTaskId);

    // Persist to the backend (optimistic cache already reflects the result).
    moveTask.mutate({
      taskId: activeTaskId,
      columnId: finalCol.id,
      position: finalIndex,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Mobile (<md) and desktop (>=md) layouts are fully separated: every
          layout-critical property is scoped to exactly one side (max-md: vs md:)
          so editing one never affects the other. Mobile: vertical stack that
          scrolls down. Desktop: horizontal board that scrolls sideways. */}
      <div className="flex h-full gap-4 pb-4 max-md:flex-col max-md:overflow-y-auto md:flex-row md:items-start md:overflow-x-auto md:overflow-y-hidden">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            canEdit={canEdit}
            draggable={canDrag}
            onAddTask={onAddTask}
            onOpenTask={onOpenTask}
            onRename={(columnId, name) =>
              renameColumn.mutate({ columnId, name })
            }
            onDelete={(columnId) => deleteColumn.mutate(columnId)}
          />
        ))}

        {canEdit && (
          <div className="shrink-0 max-md:w-full md:w-72">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={onAddColumn}
            >
              <Plus size={16} /> Add column
            </Button>
          </div>
        )}
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
