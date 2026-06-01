"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const THEME_KEY = "idara-theme";

/**
 * Light/Dark toggle. The Liquid Glass tokens adapt automatically — switching
 * just flips the `light` class on <html>. Preference is persisted to
 * localStorage and applied before first paint by the inline script in
 * `app/layout.tsx` (no flash).
 *
 * Presentational only: no app/business state is touched.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { locale } = useLocale();
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const stored =
      document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const el = document.documentElement;
    el.classList.toggle("light", next === "light");
    el.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  const label =
    locale === "ar"
      ? theme === "dark"
        ? "الوضع الفاتح"
        : "الوضع الداكن"
      : theme === "dark"
        ? "Light mode"
        : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className={cn(
        "glass-clear inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:text-fg",
        className,
      )}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
