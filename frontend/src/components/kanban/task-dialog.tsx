"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type {
  BoardMember,
  Label as LabelType,
  Priority,
  Task,
} from "@/lib/types";
import { TASK_TYPES, TASK_TYPE_META } from "@/lib/task-type";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "@/hooks/use-board";
import { ChecklistSection } from "./checklist-section";
import { CommentsThread } from "./comments-thread";

const schema = z.object({
  title: z.string().min(1, "task.titleRequired").max(255),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  type: z.enum(["task", "feature", "improvement"]),
  // Stored as a string in the form ("" = unassigned); coerced on submit.
  assignee_id: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const PRIORITIES: Priority[] = ["low", "medium", "high"];

interface TaskDialogProps {
  boardId: number;
  open: boolean;
  onClose: () => void;
  // create mode: pass columnId; edit mode: pass task
  columnId?: number;
  task?: Task | null;
  labels: LabelType[];
  members?: BoardMember[];
  canEdit?: boolean;
  isOwner?: boolean;
  currentUserId?: number;
}

export function TaskDialog({
  boardId,
  open,
  onClose,
  columnId,
  task,
  labels,
  members = [],
  canEdit = true,
  isOwner = false,
  currentUserId,
}: TaskDialogProps) {
  const t = useT();
  const isEdit = Boolean(task);
  const createTask = useCreateTask(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", type: "task", assignee_id: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        due_date: task?.due_date ? task.due_date.slice(0, 10) : "",
        priority: task?.priority ?? "medium",
        type: task?.type ?? "task",
        assignee_id: task?.assignee_id != null ? String(task.assignee_id) : "",
      });
      setSelectedLabels(task?.labels.map((l) => l.id) ?? []);
    }
  }, [open, task, reset]);

  const toggleLabel = (id: number) =>
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || null,
      due_date: values.due_date
        ? new Date(values.due_date).toISOString()
        : null,
      priority: values.priority,
      type: values.type,
      assignee_id:
        values.assignee_id && values.assignee_id !== ""
          ? Number(values.assignee_id)
          : null,
      label_ids: selectedLabels,
    };

    if (isEdit && task) {
      updateTask.mutate(
        { taskId: task.id, data: payload },
        {
          onSuccess: () => {
            toast.success(t("task.updated"));
            onClose();
          },
          onError: () => toast.error(t("task.updateError")),
        },
      );
    } else if (columnId) {
      createTask.mutate(
        { columnId, data: payload },
        {
          onSuccess: () => {
            toast.success(t("task.created"));
            onClose();
          },
          onError: () => toast.error(t("task.createError")),
        },
      );
    }
  };

  const onDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success(t("task.deleted"));
        onClose();
      },
    });
  };

  const pending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader title={isEdit ? t("task.edit") : t("task.new")} onClose={onClose}>
        {isEdit && (
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-fg-subtle hover:bg-danger/15 hover:text-danger"
            title={t("task.delete")}
            aria-label={t("task.delete")}
          >
            <Trash2 size={16} />
          </button>
        )}
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-[1fr_240px]">
          {/* Main column: title + description */}
          <div className="space-y-4 p-5">
            <div>
              <Label htmlFor="title">{t("task.title")}</Label>
              <Input
                id="title"
                autoFocus
                placeholder={t("task.titlePlaceholder")}
                className="mt-1 text-base font-medium"
                {...register("title")}
              />
              <FieldError
                message={errors.title?.message ? t(errors.title.message) : undefined}
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t("task.description")}{" "}
                <span className="text-fg-subtle">{t("task.descriptionHint")}</span>
              </Label>
              <Textarea
                id="description"
                placeholder={t("task.descriptionPlaceholder")}
                className="mt-1 min-h-[160px]"
                {...register("description")}
              />
            </div>
          </div>

          {/* Side column: properties */}
          <div className="space-y-4 border-t border-border/70 bg-bg/30 p-5 md:border-s md:border-t-0">
            <div>
              <Label htmlFor="priority">{t("task.priority")}</Label>
              <Select
                id="priority"
                className="mt-1"
                disabled={!canEdit}
                {...register("priority")}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="type">{t("task.type")}</Label>
              <Select
                id="type"
                className="mt-1"
                disabled={!canEdit}
                {...register("type")}
              >
                {TASK_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {t(TASK_TYPE_META[ty].labelKey)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="assignee_id">{t("task.assignee")}</Label>
              <Select
                id="assignee_id"
                className="mt-1"
                disabled={!canEdit}
                {...register("assignee_id")}
              >
                <option value="">{t("task.unassigned")}</option>
                {members.map((m) => (
                  <option key={m.user.id} value={String(m.user.id)}>
                    {m.user.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">{t("task.dueDate")}</Label>
              <DateField id="due_date" disabled={!canEdit} {...register("due_date")} />
            </div>

            <div>
              <Label>{t("task.labels")}</Label>
              {labels.length === 0 ? (
                <p className="mt-1 text-xs text-fg-subtle">
                  {t("task.noLabels")}{" "}
                  <span className="text-fg-muted">{t("task.manageLabels")}</span>
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {labels.map((l) => {
                    const active = selectedLabels.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l.id)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                          active ? "ring-2 ring-offset-1 ring-offset-bg-subtle" : "opacity-60",
                        )}
                        style={{
                          backgroundColor: `${l.color}22`,
                          color: l.color,
                          ...(active ? { boxShadow: `0 0 0 1px ${l.color}` } : {}),
                        }}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checklist + comments (edit mode only — need a persisted task id).
            Additive: desktop layout above is unchanged. */}
        {isEdit && task && (
          <div className="space-y-6 border-t border-border/70 px-5 py-5">
            <ChecklistSection
              boardId={boardId}
              taskId={task.id}
              canEdit={canEdit}
            />
            <CommentsThread
              boardId={boardId}
              taskId={task.id}
              canEdit={canEdit}
              isOwner={isOwner}
              currentUserId={currentUserId}
            />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={pending}>
            {isEdit ? t("common.save") : t("task.create")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
