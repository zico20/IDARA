// Locale primitives shared across server and client.

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export const LOCALES: readonly Locale[] = ["ar", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "idara-locale";

/** Direction for a locale. Arabic is RTL, English is LTR. */
export function dirFor(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Coerce any input to a valid Locale, falling back to the default. */
export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "ar" || value === "en" ? value : DEFAULT_LOCALE;
}

/** Human-readable names for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};
