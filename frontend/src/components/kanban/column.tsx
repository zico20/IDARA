"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SortableTaskCard } from "./task-card";
import type { ColumnWithTasks, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface KanbanColumnProps {
  column: ColumnWithTasks;
  canEdit: boolean;
  /** Whether task cards can be dragged (false when a non-manual sort is active). */
  draggable?: boolean;
  onAddTask: (columnId: number) => void;
  onOpenTask: (task: Task) => void;
  onRename: (columnId: number, name: string) => void;
  onDelete: (columnId: number) => void;
}

export function KanbanColumn({
  column,
  canEdit,
  draggable = true,
  onAddTask,
  onOpenTask,
  onRename,
  onDelete,
}: KanbanColumnProps) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    setEditing(false);
  };

  return (
    // Mobile (<768px): full-width, natural height (board scrolls vertically).
    // Desktop/tablet (md+): fixed 288px column, capped to the board height.
    <div className="flex w-full shrink-0 flex-col md:max-h-full md:w-72">
      <div className="mb-2 flex items-center justify-between px-1">
        {editing ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setName(column.name);
                  setEditing(false);
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <button onClick={saveName} className="text-success">
              <Check size={15} />
            </button>
            <button
              onClick={() => {
                setName(column.name);
                setEditing(false);
              }}
              className="text-fg-subtle"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 dir="auto" className="text-sm font-semibold text-fg">{column.name}</h3>
            <span className="rounded-full bg-bg-muted px-1.5 text-xs text-fg-subtle">
              {column.tasks.length}
            </span>
          </div>
        )}

        {canEdit && !editing && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
              className="rounded p-1 text-fg-subtle hover:bg-bg-muted hover:text-fg"
              aria-label={t("column.options")}
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="glass-clear absolute end-0 z-30 mt-1.5 w-40 overflow-hidden rounded-xl py-1 animate-scale-in">
                <button
                  onMouseDown={() => setEditing(true)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
                >
                  <Pencil size={13} /> {t("column.rename")}
                </button>
                <button
                  onMouseDown={() => onDelete(column.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                >
                  <Trash2 size={13} /> {t("column.delete")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          // Hug the tasks: size to content (small min for an empty drop zone).
          // On md+ the column is height-capped so its tasks scroll internally;
          // on mobile the whole board scrolls, so no nested scroll here.
          "flex min-h-[52px] flex-col gap-2 rounded-xl border border-transparent bg-bg-subtle/60 p-2 transition-colors md:overflow-y-auto",
          isOver && "border-accent/40 bg-bg-subtle",
        )}
      >
        <SortableContext
          items={column.tasks.map((t) => `task-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              draggable={draggable}
              onClick={() => onOpenTask(task)}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-fg-subtle">
            {t("column.noTasks")}
          </p>
        )}
      </div>

      {canEdit && (
        <button
          onClick={() => onAddTask(column.id)}
          className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <Plus size={15} /> {t("column.addTask")}
        </button>
      )}
    </div>
  );
}
