# Contract: i18n Module Public API

**Feature**: `001-bilingual-rtl-i18n` | **Date**: 2026-05-30

This feature exposes no new network endpoints. Its "contract" is the **internal frontend
module API** that the rest of the app consumes. Components depend only on these signatures,
so the implementation (dictionaries, provider wiring) can change without breaking callers.

Module location: `frontend/src/lib/i18n/`

## Types

```ts
export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

// Union of every valid translation key (compile-time safety).
export type MessageKey = keyof typeof en; // en is the reference dictionary
```

## Provider

```ts
// Wraps the app; seeded from the server-resolved locale to avoid hydration mismatch.
function LocaleProvider(props: {
  initialLocale: Locale;      // resolved on the server from the cookie
  children: React.ReactNode;
}): JSX.Element;
```

**Contract**:
- MUST render children immediately with `initialLocale` (no loading flash).
- MUST NOT read localStorage on first render for the initial value.

## Hooks

```ts
// Read + change the active locale.
function useLocale(): {
  locale: Locale;
  dir: Direction;             // derived: ar→rtl, en→ltr
  setLocale: (next: Locale) => void;
};

// Translate a key with optional interpolation params.
function useT(): (key: MessageKey, params?: Record<string, string | number>) => string;
```

**`setLocale` contract** (FR-003, FR-005):
- Writes the `idara-locale` cookie, updates the Zustand mirror, and sets
  `document.documentElement.{dir,lang}` synchronously.
- Takes visible effect in < 1 second (SC-002) without navigation/data reload.
- An invalid argument is ignored (no crash).

**`t` contract** (FR-001, FR-009):
- Returns the active-locale string for `key`, with `{param}` tokens replaced.
- On a missing key: falls back to the other locale, then to a readable default; never
  returns blank or throws.

## Activity humanizer

```ts
function humanizeActivity(
  actionType: string,
  userName: string,
  payload: Record<string, unknown>,
  t: ReturnType<typeof useT>,
): string;
```

**Contract** (FR-008):
- Returns a whole-sentence, grammatically correct string in the active locale for known
  `actionType` values (full backend verb set).
- Unknown `actionType` → falls back to the server-provided `message`.

## Date localization

```ts
function dateFnsLocale(locale: Locale): import("date-fns").Locale; // ar | enUS
```

**Contract** (FR-008): callers pass this to `formatDistanceToNow(..., { locale, addSuffix:
true })` so relative times read in the active language.

## Server-side resolution (root layout)

```ts
// Pseudocode contract for app/layout.tsx (Server Component)
const locale: Locale = readLocaleCookie() ?? "ar";   // FR-006, default = Arabic
const dir: Direction = locale === "ar" ? "rtl" : "ltr";
// <html lang={locale} dir={dir}> ... <LocaleProvider initialLocale={locale}>
```

**Contract** (FR-004, FR-011):
- The first server response MUST carry the correct `lang` and `dir` on `<html>` (no flash).
- `lang`/`dir` advertise the active language/direction to assistive tech.

## Consumer expectations (acceptance-tied)

- No component renders hardcoded user-facing English or Arabic literals; all go through `t`.
- No component sets its own `dir` wrapper for interface chrome; direction inherits from
  `<html>`. (Exception: a per-block `dir="auto"` is allowed on user-generated content — FR-007.)
