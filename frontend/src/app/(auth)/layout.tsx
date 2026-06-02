"use client";

import Link from "next/link";
import { Home, LayoutGrid } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Backdrop } from "@/components/backdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  // Mobile (<md): start content below the floating top bar (it's absolute, so it
  // doesn't reserve space) — pad the top so the logo never overlaps the bar, and
  // pad the bottom so the card breathes above the browser chrome instead of
  // sitting flush against the screen edge. Desktop (>=md): vertically centered.
  return (
    <div className="relative flex min-h-screen justify-center px-4 max-md:items-start max-md:pb-12 max-md:pt-24 md:items-center">
      <Backdrop />
      {/* Floating glass capsule (matches the landing/demo top bar). */}
      <div className="glass-frost absolute left-1/2 top-4 z-10 flex h-16 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-2xl border border-border/60 px-4 sm:px-5">
        {/* Consistent square icon buttons (home · theme · language). */}
        <Link
          href="/"
          title={t("common.home")}
          aria-label={t("common.home")}
          className="glass-clear inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:text-fg"
        >
          <Home size={16} />
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <LanguageSwitcher iconOnly />
        </div>
      </div>
      {/* Mobile (<md): brand stacked above the card, centered. Desktop (>=md):
          brand to one side and the card to the other (two columns) so the card
          gets its own breathing room. Direction follows RTL/LTR automatically. */}
      <div className="relative z-10 flex w-full max-w-sm animate-fade-in flex-col items-stretch gap-8 md:max-w-4xl md:flex-row md:items-center md:justify-center md:gap-16">
        <Link
          href="/"
          className="flex flex-col items-center text-center md:flex-1 md:items-start md:text-start"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] md:h-16 md:w-16">
            <LayoutGrid size={22} className="md:hidden" />
            <LayoutGrid size={30} className="max-md:hidden" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-fg md:text-4xl">
            {t("common.appName")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted md:mt-2 md:text-base">
            {t("common.tagline")}
          </p>
        </Link>
        <div className="w-full md:max-w-sm md:flex-1">{children}</div>
      </div>
    </div>
  );
}
