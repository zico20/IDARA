// Pure presentation metadata for a task's type. No framework deps so it is
// trivially unit-testable and reusable across the card, dialog, filter, and
// analytics chart. Colors are explicit hexes from the existing palette so the
// badges read in both light and dark themes (same approach as priority colors).
import {
  ArrowUpCircle,
  CheckSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import type { TaskType } from "@/lib/types";

export interface TaskTypeMeta {
  icon: LucideIcon;
  color: string;
  labelKey: MessageKey;
}

export const TASK_TYPE_META: Record<TaskType, TaskTypeMeta> = {
  task: { icon: CheckSquare, color: "#58A6FF", labelKey: "type.task" },
  feature: { icon: Sparkles, color: "#3FB950", labelKey: "type.feature" },
  improvement: {
    icon: ArrowUpCircle,
    color: "#BC8CFF",
    labelKey: "type.improvement",
  },
};

/** Fixed display order for selects, filters, and charts. */
export const TASK_TYPES: TaskType[] = ["task", "feature", "improvement"];
