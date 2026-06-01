"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { BoardMember, Label as LabelType, Priority } from "@/lib/types";
import type { DueStatus } from "@/lib/due-status";
import type { SortMode } from "@/lib/task-filter-sort";
import { TASK_TYPES, TASK_TYPE_META } from "@/lib/task-type";
import { useBoardViewStore } from "@/stores/board-view-store";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const DUE_STATUSES: Exclude<DueStatus, never>[] = [
  "overdue",
  "today",
  "upcoming",
  "none",
];
const SORTS: SortMode[] = ["manual", "due", "priority", "created"];

const PRIORITY_KEY: Record<Priority, MessageKey> = {
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
};
const DUE_KEY: Record<DueStatus, MessageKey> = {
  overdue: "due.overdue",
  today: "due.today",
  upcoming: "due.upcoming",
  none: "due.none",
};

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors motion-reduce:transition-none",
        active
          ? "border-accent bg-accent/15 text-fg"
          : "border-border text-fg-muted hover:bg-bg-muted",
      )}
      style={
        active && color
          ? { borderColor: color, color, backgroundColor: `${color}1f` }
          : undefined
      }
    >
      {children}
    </button>
  );
}

interface BoardFilterBarProps {
  boardId: number;
  labels: LabelType[];
  members?: BoardMember[];
}

export function BoardFilterBar({
  boardId,
  labels,
  members = [],
}: BoardFilterBarProps) {
  const t = useT();
  const view = useBoardViewStore((s) => s.byBoard[boardId]);
  const toggleLabel = useBoardViewStore((s) => s.toggleLabel);
  const togglePriority = useBoardViewStore((s) => s.togglePriority);
  const toggleDue = useBoardViewStore((s) => s.toggleDue);
  const toggleAssignee = useBoardViewStore((s) => s.toggleAssignee);
  const toggleType = useBoardViewStore((s) => s.toggleType);
  const setSort = useBoardViewStore((s) => s.setSort);
  const clear = useBoardViewStore((s) => s.clear);
  const [open, setOpen] = useState(false);

  const labelFilter = view?.labelFilter ?? [];
  const priorityFilter = view?.priorityFilter ?? [];
  const dueFilter = view?.dueFilter ?? [];
  const assigneeFilter = view?.assigneeFilter ?? [];
  const typeFilter = view?.typeFilter ?? [];
  const sort = view?.sort ?? "manual";

  const activeCount =
    labelFilter.length +
    priorityFilter.length +
    dueFilter.length +
    assigneeFilter.length +
    typeFilter.length +
    (sort !== "manual" ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={open ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <Filter size={14} />
          {t("filter.title")}
          {activeCount > 0 && (
            <span className="ms-1 rounded-full bg-accent px-1.5 text-[10px] font-bold text-bg tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>

        {/* Sort selector is always visible (compact). */}
        <label className="flex items-center gap-1.5 text-[11.5px] text-fg-subtle">
          {t("sort.label")}
          <Select
            selectSize="sm"
            wrapperClassName="w-auto"
            value={sort}
            onChange={(e) => setSort(boardId, e.target.value as SortMode)}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}` as MessageKey)}
              </option>
            ))}
          </Select>
        </label>

        {sort !== "manual" && (
          <span className="text-[11px] text-fg-subtle">
            {t("sort.activeHint")}
          </span>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => clear(boardId)}
            className="inline-flex items-center gap-1 text-[11.5px] text-fg-subtle hover:text-fg"
          >
            <X size={12} />
            {t("filter.clear")}
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-bg-subtle/40 p-3 animate-fade-in">
          {/* Priority */}
          <FilterRow label={t("filter.priority")}>
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                active={priorityFilter.includes(p)}
                onClick={() => togglePriority(boardId, p)}
              >
                {t(PRIORITY_KEY[p])}
              </Chip>
            ))}
          </FilterRow>

          {/* Due status */}
          <FilterRow label={t("filter.due")}>
            {DUE_STATUSES.map((d) => (
              <Chip
                key={d}
                active={dueFilter.includes(d)}
                onClick={() => toggleDue(boardId, d)}
              >
                {t(DUE_KEY[d])}
              </Chip>
            ))}
          </FilterRow>

          {/* Type */}
          <FilterRow label={t("filter.type")}>
            {TASK_TYPES.map((ty) => (
              <Chip
                key={ty}
                active={typeFilter.includes(ty)}
                onClick={() => toggleType(boardId, ty)}
                color={TASK_TYPE_META[ty].color}
              >
                {t(TASK_TYPE_META[ty].labelKey)}
              </Chip>
            ))}
          </FilterRow>

          {/* Assignee */}
          {members.length > 0 && (
            <FilterRow label={t("filter.assignee")}>
              {members.map((m) => (
                <Chip
                  key={m.user.id}
                  active={assigneeFilter.includes(m.user.id)}
                  onClick={() => toggleAssignee(boardId, m.user.id)}
                >
                  {m.user.name}
                </Chip>
              ))}
            </FilterRow>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <FilterRow label={t("filter.label")}>
              {labels.map((l) => (
                <Chip
                  key={l.id}
                  active={labelFilter.includes(l.id)}
                  onClick={() => toggleLabel(boardId, l.id)}
                  color={l.color}
                >
                  {l.name}
                </Chip>
              ))}
            </FilterRow>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
