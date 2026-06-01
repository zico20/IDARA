"use client";

import Link from "next/link";
import { LayoutGrid, Info, LogIn } from "lucide-react";
import { DemoBoard } from "@/components/demo/demo-board";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Backdrop } from "@/components/backdrop";
import { useT } from "@/lib/i18n";

// Public, no-auth demo. Fully client-side — nothing is saved.
export default function DemoPage() {
  const t = useT();
  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <Backdrop />
      {/* Top bar — floating glass capsule (detached pill, rounded all around). */}
      <header className="sticky top-0 z-30 px-4 pt-4 max-md:mt-safe">
        <div className="glass-frost mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border border-border/60 px-4 sm:px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <LayoutGrid size={16} />
            </span>
            <span className="font-semibold">TaskFlow</span>
          </Link>
          {/* Consistent square icon buttons (theme · language · login) — icon-only
              so the bar never overflows on small phones. Signup is reachable from
              the trial banner / board CTA below. */}
          <div className="flex items-center gap-1.5">
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
          </div>
        </div>
      </header>

      {/* Trial banner — desktop only; hidden on mobile (<md) to save space. */}
      <div className="border-b border-accent/30 bg-accent/10 max-md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm">
          <Info size={16} className="shrink-0 text-accent" />
          <span className="text-fg-muted">{t("demo.banner")}</span>
          <Link
            href="/signup"
            className="ms-auto hidden shrink-0 text-accent hover:text-accent-hover sm:inline"
          >
            {t("demo.bannerCta")}
          </Link>
        </div>
      </div>

      {/* Board */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-5 w-1.5 rounded-full bg-accent" />
          <div>
            <h1 className="text-lg font-semibold">{t("demo.title")}</h1>
            <p className="text-xs text-fg-subtle">{t("demo.subtitle")}</p>
          </div>
        </div>
        {/* The board itself is LTR (the app's English UI). */}
        <div dir="ltr">
          <DemoBoard />
        </div>
      </main>
    </div>
  );
}
