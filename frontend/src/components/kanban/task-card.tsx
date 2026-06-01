"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { useT, useTCount } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { Priority, Task } from "@/lib/types";
import { dueInfo, type DueStatus } from "@/lib/due-status";
import { TASK_TYPE_META } from "@/lib/task-type";

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "#3FB950",
  medium: "#D29922",
  high: "#F85149",
};

const PRIORITY_KEY: Record<Priority, MessageKey> = {
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
};

// Per-status badge color (CSS-var driven where possible; explicit hexes match the
// existing palette used elsewhere on the card).
const DUE_COLOR: Record<Exclude<DueStatus, "none">, string> = {
  overdue: "#F85149", // danger
  today: "#D29922", // warning
  upcoming: "#8B949E", // neutral / fg-subtle
};

function DueBadge({ dueDate }: { dueDate: string | null }) {
  const t = useT();
  const tc = useTCount();
  const info = dueInfo(dueDate);
  if (info.status === "none") return null;

  const label =
    info.status === "overdue"
      ? t("due.overdue")
      : info.status === "today"
        ? t("due.today")
        : tc("due.inDays", info.days);

  return <Badge color={DUE_COLOR[info.status]}>{label}</Badge>;
}

function TypeBadge({ type }: { type: Task["type"] }) {
  const t = useT();
  const meta = TASK_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Badge color={meta.color} className="gap-1">
      <Icon size={11} />
      {t(meta.labelKey)}
    </Badge>
  );
}

export function TaskCardContent({ task }: { task: Task }) {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-3 shadow-glass-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 motion-reduce:transition-none">
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="h-1.5 w-7 rounded-full"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}
      <p dir="auto" className="text-sm font-medium leading-snug text-fg">
        {task.title}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <TypeBadge type={task.type} />
        <Badge color={PRIORITY_COLOR[task.priority]}>
          {t(PRIORITY_KEY[task.priority])}
        </Badge>
        <DueBadge dueDate={task.due_date} />
        {task.checklist_total > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-fg-subtle">
            <CheckSquare size={11} />
            {task.checklist_done}/{task.checklist_total}
          </span>
        )}
        {task.assignee && (
          <span className="ms-auto">
            <Avatar
              name={task.assignee.name}
              src={task.assignee.avatar_url}
              size={20}
              title={task.assignee.name}
            />
          </span>
        )}
      </div>
    </div>
  );
}

export function SortableTaskCard({
  task,
  onClick,
  draggable = true,
}: {
  task: Task;
  onClick: () => void;
  draggable?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    data: { type: "task", task },
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      onClick={onClick}
      className={cn(
        "touch-none",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
    >
      <TaskCardContent task={task} />
    </div>
  );
}
