"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Zap,
  MousePointerClick,
  Users,
  Activity,
  ArrowRight,
  Check,
  LogIn,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Backdrop } from "@/components/backdrop";
import type { MessageKey } from "@/lib/i18n";

// Public landing page. Direction is inherited from <html> (set server-side from
// the locale cookie) — no hardcoded dir here.

const FEATURES: {
  icon: typeof LayoutGrid;
  titleKey: MessageKey;
  descKey: MessageKey;
}[] = [
  { icon: LayoutGrid, titleKey: "landing.feature.kanban.title", descKey: "landing.feature.kanban.desc" },
  { icon: Zap, titleKey: "landing.feature.realtime.title", descKey: "landing.feature.realtime.desc" },
  { icon: MousePointerClick, titleKey: "landing.feature.dnd.title", descKey: "landing.feature.dnd.desc" },
  { icon: Users, titleKey: "landing.feature.presence.title", descKey: "landing.feature.presence.desc" },
  { icon: Activity, titleKey: "landing.feature.activity.title", descKey: "landing.feature.activity.desc" },
  { icon: Check, titleKey: "landing.feature.priorities.title", descKey: "landing.feature.priorities.desc" },
];

export function LandingPage() {
  const t = useT();

  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <Backdrop />
      {/* Nav — floating glass capsule (detached pill, rounded all around). */}
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="glass-frost mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border border-border/60 px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <LayoutGrid size={18} />
            </span>
            <span className="text-lg font-semibold">{t("common.appName")}</span>
          </div>
          {/* Compact, consistent square icon buttons (theme · language · login).
              Icon-only so the bar never overflows on small phones. Signup stays
              reachable from the hero/CTA buttons below. */}
          <nav className="flex items-center gap-1.5">
            <ThemeSwitcher />
            <LanguageSwitcher iconOnly />
            <Link
              href="/login"
              title={t("landing.nav.login")}
              aria-label={t("landing.nav.login")}
              className="glass-clear inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:text-fg"
            >
              <LogIn size={16} className="rtl:rotate-180" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 text-center sm:pt-12">
        <div className="animate-fade-in">
          <span className="glass-clear inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {t("landing.hero.badge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {t("landing.hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-accent-hover to-accent text-bg shadow-[0_4px_14px_-4px_rgb(var(--accent)/0.5),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.07] px-6 py-3 font-semibold transition sm:w-auto"
            >
              {t("landing.hero.tryDemo")}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center glass-clear rounded-md px-6 py-3 font-medium text-fg transition sm:w-auto"
            >
              {t("landing.hero.createAccount")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{t("landing.hero.noCard")}</p>
        </div>

        {/* App preview mockup (stays LTR — English column names) */}
        <div className="mx-auto mt-16 max-w-4xl animate-fade-in">
          <BoardPreview />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-subtle/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            {t("landing.features.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-fg-muted">
            {t("landing.features.subheading")}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-2xl border border-border bg-bg-subtle p-6 shadow-glass-sm transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("landing.cta.heading")}</h2>
          <p className="mt-3 text-fg-muted">{t("landing.cta.subtitle")}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-accent-hover to-accent text-bg shadow-[0_4px_14px_-4px_rgb(var(--accent)/0.5),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.07] px-6 py-3 font-semibold transition sm:w-auto"
            >
              {t("landing.cta.tryDemo")}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center glass-clear rounded-md px-6 py-3 font-medium text-fg transition sm:w-auto"
            >
              {t("landing.cta.createAccount")}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-fg-subtle">
          {t("landing.footer")}
        </div>
      </footer>
    </div>
  );
}

// Static, decorative preview of the kanban board. Always LTR (English content).
function BoardPreview() {
  const cols = [
    {
      name: "To Do",
      color: "#58A6FF",
      tasks: [
        { t: "Design landing page", p: "high", pc: "#F85149" },
        { t: "Set up CI pipeline", p: "medium", pc: "#D29922" },
      ],
    },
    {
      name: "In Progress",
      color: "#D29922",
      tasks: [{ t: "Build auth flow", p: "high", pc: "#F85149" }],
    },
    {
      name: "Done",
      color: "#3FB950",
      tasks: [
        { t: "Project scaffold", p: "low", pc: "#3FB950" },
        { t: "Database schema", p: "medium", pc: "#D29922" },
      ],
    },
  ];
  return (
    <div
      dir="ltr"
      className="overflow-hidden rounded-2xl border border-border bg-bg-subtle p-4 shadow-glass"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className="h-3 w-3 rounded-full bg-danger/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ms-2 text-xs text-fg-subtle">TaskFlow — Sprint Board</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((c) => (
          <div key={c.name}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs font-semibold text-fg">{c.name}</span>
              <span className="rounded-full bg-bg-muted px-1.5 text-[10px] text-fg-subtle">
                {c.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {c.tasks.map((task) => (
                <div
                  key={task.t}
                  className="rounded-xl border border-border bg-bg-elevated p-2.5 text-start"
                >
                  <p className="text-xs font-medium text-fg">{task.t}</p>
                  <span
                    className="mt-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                    style={{
                      backgroundColor: `${task.pc}22`,
                      color: task.pc,
                      border: `1px solid ${task.pc}55`,
                    }}
                  >
                    {task.p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
