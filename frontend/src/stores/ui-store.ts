"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/locale";

/**
 * Client-only UI state (NOT server data — that lives in TanStack Query).
 * `activityPanelOpen` is persisted to localStorage. `locale` is intentionally
 * NOT persisted here: the authoritative store for first paint is the
 * `idara-locale` cookie (read server-side), and the client is seeded from the
 * server value. setLocale writes the cookie and flips <html> synchronously.
 */
interface UiState {
  activityPanelOpen: boolean;
  toggleActivityPanel: () => void;
  setActivityPanel: (open: boolean) => void;

  locale: Locale;
  setLocale: (next: Locale) => void;
  /** Seed locale from the server-resolved value on first client render. */
  initLocale: (locale: Locale) => void;
}

function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

function applyHtmlDir(locale: Locale) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.lang = locale;
  el.dir = dirFor(locale);
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      activityPanelOpen: true,
      toggleActivityPanel: () =>
        set((s) => ({ activityPanelOpen: !s.activityPanelOpen })),
      setActivityPanel: (open) => set({ activityPanelOpen: open }),

      locale: DEFAULT_LOCALE,
      setLocale: (next) => {
        const locale = normalizeLocale(next);
        writeLocaleCookie(locale);
        applyHtmlDir(locale);
        set({ locale });
      },
      initLocale: (locale) => {
        if (get().locale !== locale) set({ locale: normalizeLocale(locale) });
      },
    }),
    {
      name: "idara-ui",
      // Only persist UI prefs to localStorage — NOT locale (cookie owns that).
      partialize: (s) => ({ activityPanelOpen: s.activityPanelOpen }),
    },
  ),
);
