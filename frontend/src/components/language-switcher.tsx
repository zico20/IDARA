"use client";

import { Languages } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Toggle between Arabic and English. Shows the name of the OTHER language so the
 * label is the action ("العربية" when in English, "English" when in Arabic).
 *
 * `iconOnly` renders a compact square icon button (matching ThemeSwitcher), used
 * where space is tight (e.g. the mobile landing nav). The default keeps the
 * icon + label pill used in the sidebar / auth screens.
 */
export function LanguageSwitcher({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const next: Locale = locale === "ar" ? "en" : "ar";
  const label = next === "ar" ? "العربية" : "English";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      title={label}
      aria-label={label}
      className={cn(
        "glass-clear inline-flex items-center rounded-md text-fg-muted transition-colors hover:text-fg",
        iconOnly
          ? "h-9 w-9 justify-center"
          : "gap-1.5 px-2.5 py-1.5 text-sm font-medium",
        className,
      )}
    >
      <Languages size={iconOnly ? 16 : 15} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
