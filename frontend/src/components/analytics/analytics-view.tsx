"use client";

import {
  Activity,
  AlertTriangle,
  CircleCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { computeBoardAnalytics } from "@/lib/analytics";
import { TASK_TYPE_META } from "@/lib/task-type";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { BoardSnapshot, Priority } from "@/lib/types";

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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4 shadow-glass-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-medium text-fg-muted">{label}</span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tone}1f`, color: tone }}
        >
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-fg">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-5 shadow-glass-sm">
      <h3 className="mb-4 text-sm font-semibold text-fg">{title}</h3>
      {children}
    </div>
  );
}

/** Vertical bars (height ∝ count) — Tasks by Status. */
function BarChart({ data }: { data: { name: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0)
    return <EmptyChart />;
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d) => (
        <div key={d.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-[11px] tabular-nums text-fg-muted">{d.count}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-accent/80 transition-[height] motion-reduce:transition-none"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
            />
          </div>
          <span
            dir="auto"
            className="w-full truncate text-center text-[11px] text-fg-subtle"
            title={d.name}
          >
            {d.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Labeled horizontal proportion bars (width ∝ pct). */
function ProportionBars({
  rows,
}: {
  rows: { key: string; label: string; count: number; pct: number; color: string }[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="font-medium text-fg">{r.label}</span>
            <span className="tabular-nums text-fg-subtle">
              {r.count} · {r.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full transition-[width] motion-reduce:transition-none"
              style={{ width: `${r.pct}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  const t = useT();
  return (
    <p className="py-8 text-center text-sm text-fg-subtle">
      {t("analytics.empty")}
    </p>
  );
}

export function AnalyticsView({
  snapshot,
  teamSize,
}: {
  snapshot: BoardSnapshot | undefined;
  teamSize: number;
}) {
  const t = useT();
  const a = useMemo(
    () => computeBoardAnalytics(snapshot, teamSize),
    [snapshot, teamSize],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CircleCheck}
          label={t("analytics.completionRate")}
          value={`${a.completionRate}%`}
          tone="#3FB950"
        />
        <StatCard
          icon={Activity}
          label={t("analytics.active")}
          value={String(a.active)}
          tone="#58A6FF"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("analytics.overdue")}
          value={String(a.overdue)}
          tone="#F85149"
        />
        <StatCard
          icon={Users}
          label={t("analytics.teamSize")}
          value={String(a.teamSize)}
          tone="#BC8CFF"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("analytics.byStatus")}>
          <BarChart data={a.byStatus.map((s) => ({ name: s.name, count: s.count }))} />
        </Panel>
        <Panel title={t("analytics.byPriority")}>
          {a.total === 0 ? (
            <EmptyChart />
          ) : (
            <ProportionBars
              rows={a.byPriority.map((p) => ({
                key: p.priority,
                label: t(PRIORITY_KEY[p.priority]),
                count: p.count,
                pct: p.pct,
                color: PRIORITY_COLOR[p.priority],
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel title={t("analytics.byType")}>
        {a.total === 0 ? (
          <EmptyChart />
        ) : (
          <ProportionBars
            rows={a.byType.map((ty) => ({
              key: ty.type,
              label: t(TASK_TYPE_META[ty.type].labelKey),
              count: ty.count,
              pct: ty.pct,
              color: TASK_TYPE_META[ty.type].color,
            }))}
          />
        )}
      </Panel>
    </div>
  );
}
