# Research: Full Bilingual (Arabic/English) Support with RTL/LTR

**Feature**: `001-bilingual-rtl-i18n` | **Date**: 2026-05-30
**Inputs**: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md)

All Technical-Context unknowns are resolved below. Net new runtime dependencies: **none**
(optional: one Arabic `next/font` for polish).

## Codebase grounding

- No i18n dependency exists. Stack: Next 14.2.33 App Router, React 18.3, Tailwind 3.4,
  Zustand 5 (with `persist`), TanStack Query 5, date-fns 4, dnd-kit 6.
- `dir` is currently **hardcoded per page** (`landing-page.tsx`, `demo/page.tsx` use
  `dir="rtl"`), not on `<html>`. Root `layout.tsx` is a Server Component with static
  `<html lang="en">`.
- Logical Tailwind utilities are barely used (~4 `ms-/me-/...` occurrences); most layout
  uses physical utilities — a conversion pass is required.
- Zustand store persists to localStorage (`idara-ui`); localStorage is client-only
  (invisible to SSR → relevant to first-paint direction).
- dnd-kit boards use `closestCorners` with a horizontal column `SortableContext` — the
  RTL-sensitive spot.
- Activity feed renders a pre-built `e.message`; backend `realtime.py human_action()`
  builds English-only sentences from `action_type` + `payload`. The frontend
  `ActivityEntry` type **already carries `action_type` and `payload`**, so sentences can
  be rebuilt per-locale on the client without backend changes.

## Decision 1 — Minimal custom i18n (no library)

**Decision**: A small custom solution — a client `LocaleProvider` (React Context) + two
typed flat dictionary objects (`en`, `ar`) + a `useT()` hook returning `t(key, params?)`
with simple `{param}` interpolation. No external i18n library.

**Rationale**: Only 2 static languages, no locale-routed URLs, no lazy message loading, no
ICU needs beyond interpolation/counts. A typed dictionary gives compile-time key safety
under TS strict. This is the YAGNI choice (constitution Principle V); next-intl and
react-i18next both add weight and assume larger surface areas / locale routing.

**Alternatives**: next-intl (best with `/[locale]` SEO routes — overkill); react-i18next
(heaviest, runtime init); tiny libs like rosetta (a ~40-line hook removes the dep
entirely).

**Gotchas**: Keep dictionaries flat with a typed key union so a missing key is a type
error. Write tiny interpolation; handle the few plural/count cases inline.

## Decision 2 — Toggle-based, no locale in URL

**Decision**: A language button flips a `locale` value held in client state + mirrored to
a cookie. Routes stay as-is (`/`, `/demo`, `/boards/...`).

**Rationale**: The requirement is "a button to change language" + persistence, not
shareable per-locale URLs or SEO. Path-based routing would force restructuring every route
under `app/[locale]/...`. App Router does **not** support the legacy `next.config` i18n
routing anyway.

**Alternatives**: Path-based `/[locale]/...` (needed only for crawlable localized URLs —
rejected); legacy Next i18n routing (unavailable in App Router).

**Gotchas**: Without a URL segment the server learns locale only from the **cookie** — that
cookie drives correct first paint (Decisions 4 & 5).

## Decision 3 — RTL/LTR via `<html dir>` + Tailwind logical properties

**Decision**:
1. Set `dir` and `lang` on the **root `<html>`** dynamically by reading the locale cookie
   in the Server Component layout (`cookies()` from `next/headers`). Remove hardcoded
   `dir="rtl"` wrappers from landing/demo.
2. Standardize on Tailwind **logical utilities**: `pl/pr`→`ps/pe`, `ml/mr`→`ms/me`,
   `left/right`→`start/end`, `text-left/right`→`text-start/end`, `rounded-l/r`→`rounded-s/e`.
3. For genuinely physical cases (chevron/arrow icons, decorative absolute positioning), use
   Tailwind's built-in **`rtl:` / `ltr:` variants** (native in 3.4, no plugin).

**Rationale**: Logical properties are the modern, lowest-maintenance approach; Tailwind 3.4
supports them and `rtl:`/`ltr:` variants natively — no extra dependency (YAGNI). The
codebase already started this (`ms-auto`).

**dnd-kit RTL gotcha**: `closestCorners` + horizontal column `SortableContext` compute
positions geometrically; under RTL the visual order reverses vs array index, which can
invert horizontal column reordering / cross-column drops. Keep the data model index-based;
**manually test** horizontal column drag and cross-column drops in RTL. If drops misland,
switch that DndContext to `closestCenter`/`pointerWithin`. Vertical sorting within a column
and `<DragOverlay>` are unaffected.

**Alternatives**: `tailwindcss-rtl`/dir-variant plugins (redundant with 3.4 — rejected);
manual `[dir=rtl]` CSS (high maintenance — rejected).

**Gotchas**: prefer `gap-*` over `space-x-*` (doesn't always flip); existing keyframes use
`translateY` only (safe); decide explicitly whether the demo board stays LTR inside Arabic
mode (English column names read fine LTR).

## Decision 4 — Persistence: cookie (source of truth) + Zustand mirror

**Decision**: Store `locale` in a cookie (`idara-locale`, `path=/`, ~1y, `SameSite=Lax`,
not HttpOnly) as the authoritative value for first paint; mirror into the existing Zustand
store for reactive client reads. On toggle: update Zustand **and** write the cookie, then
update `document.documentElement.dir/lang` directly for an instant flip.

**Rationale**: The root `<html>` is server-rendered, so the server must know the locale
before emitting `dir`/`lang`. localStorage is invisible to the server → guaranteed flash +
hydration mismatch. A cookie is readable via `cookies()`. The Zustand mirror keeps the
existing UI-state pattern and gives a clean `useLocale()`.

**FOUC/hydration approach**: (1) layout reads cookie → `<html lang dir>`; (2) seed the
client provider from the **same server-resolved value** (pass as prop; do NOT init client
state from localStorage on first render); (3) on toggle, set cookie + update
`document.documentElement` synchronously.

**Alternatives**: localStorage-only (matches existing code but guaranteed FOUC — rejected);
cookie-only (works but re-reads cookies everywhere — Zustand mirror is cheap/idiomatic).

**Gotchas**: cookie must be authoritative for first paint; `cookies()` makes the route
dynamic (acceptable for this interactive app).

## Decision 5 — Default = Arabic/RTL, resolved server-side

**Decision**: When no cookie is present, default to Arabic/RTL in the root layout:
`cookies().get("idara-locale")?.value ?? "ar"` → `<html lang="ar" dir="rtl">` on the
first server response.

**Rationale**: Computing the default server-side from cookie absence means the first HTML
byte already has the correct `dir` — no client correction, no flash. Matches the spec's
documented default.

**Alternatives**: `Accept-Language` sniffing (spec fixes default to Arabic — skip for
determinism; possible later); client-side default (reintroduces FOUC — rejected).

**Gotchas**: Inter covers Latin only; add an Arabic-capable `next/font` (e.g. IBM Plex Sans
Arabic / Cairo) applied when `lang="ar"` for visual polish. Optional localized metadata via
`generateMetadata`.

## Decision 6 — Dynamic content (dates, activity, counts)

**Decision**:
- **date-fns**: import `ar` and `enUS` locales; pass `{ locale, addSuffix: true }` to
  `formatDistanceToNow`, selecting via `useLocale()`.
- **Activity feed**: rebuild the sentence on the frontend from `action_type` + `payload`
  per locale (port `human_action`'s switch into `humanizeActivity(action_type, userName,
  payload, t)` reading templated dictionary strings). Server `message` becomes a fallback.
- **Counts/plurals**: handle the few cases inline (`Intl.PluralRules` or simple checks); no
  plural library.

**Rationale**: The activity data is already on the client; rebuilding sentences client-side
needs **no backend change**, re-localizes existing entries instantly on toggle, and keeps
the backend locale-agnostic (correct separation of concerns). date-fns locale switching is
the zero-dep fix for timestamps.

**Alternatives**: backend-localized `message` (needs backend i18n; historical entries frozen
in original locale — rejected); backend returns both `message_en`/`message_ar` (payload
bloat, presentation logic in backend — rejected).

**Gotchas**: mirror the full backend verb/key set (task.created/updated/deleted/moved,
column.created/renamed/deleted/reordered, board.created/updated, member.added) and fall back
to `e.message` for unknown types. Make the **whole sentence** a per-action template (don't
concatenate `${user} ${verb}`) so Arabic word order is correct. Keep numerals Western.

## Net dependency impact

- **New runtime deps: none.** date-fns locales ship with date-fns; Tailwind logical
  utilities + `rtl:` variants are built into 3.4.
- **Optional**: one Arabic `next/font` for typography polish.
