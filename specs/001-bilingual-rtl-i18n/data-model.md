# Data Model: Full Bilingual (Arabic/English) Support with RTL/LTR

**Feature**: `001-bilingual-rtl-i18n` | **Date**: 2026-05-30

This feature is **frontend-only** and introduces **no database schema changes**. The
"data" is client-side configuration and a static set of translatable strings. No backend
models, migrations, or API contract changes are required.

## Entities

### Locale (value)

The active interface language.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `locale` | enum | `"ar"` \| `"en"` | The two supported languages |
| `dir` (derived) | enum | `"rtl"` \| `"ltr"` | `ar → rtl`, `en → ltr`. Never stored; always derived from `locale` |

**Validation / rules**:
- Any value other than `"ar"`/`"en"` (e.g. a tampered cookie) MUST resolve to the default
  (`"ar"`).
- `dir` is always derived, never persisted independently, so the two can never disagree.

### Language preference (persisted)

Where the chosen `locale` lives across reloads and visits.

| Store | Key | Authority | Purpose |
|-------|-----|-----------|---------|
| Cookie | `idara-locale` | **Source of truth** for first server paint | Lets the Server Component render correct `<html lang dir>` with no flash |
| Zustand (`ui-store`) | `locale` | Reactive client mirror | Ergonomic `useLocale()` reads + re-render on change |

**Rules**:
- Cookie: `path=/`, `max-age` ≈ 1 year, `SameSite=Lax`, NOT `HttpOnly` (client JS must
  update it on toggle).
- On toggle: write cookie + update Zustand + set `document.documentElement.dir/lang`
  synchronously (instant flip, no server round-trip needed).
- First render: client state is seeded from the **server-resolved** value (passed as a prop),
  not from localStorage — prevents hydration mismatch.
- v1 stores preference per-device (cookie). Account-level sync is out of scope (Assumptions).

### Translatable string set (static)

The catalogue of all user-facing text, one entry per key, in both languages.

| Field | Type | Notes |
|-------|------|-------|
| `key` | string (typed union) | Stable identifier, e.g. `"auth.login.title"` |
| `en` | string | English text; may contain `{param}` placeholders |
| `ar` | string | Arabic text; same placeholders |

**Rules**:
- Every key MUST exist in both `en` and `ar` (enforced at compile time via a shared key
  union type — a missing key is a type error).
- Interpolation uses `{paramName}` tokens replaced at render (`t(key, { paramName })`).
- Lookup of an unknown key MUST fall back to a readable value (the other language, then the
  key text) and MUST NOT render blank or crash (FR-009).

### Activity message template (derived, not stored)

Activity-feed sentences are **rebuilt on the client** from existing data, not stored.

| Input | Source | Notes |
|-------|--------|-------|
| `action_type` | existing `ActivityEntry.action_type` | e.g. `task.moved` |
| `payload` | existing `ActivityEntry.payload` | e.g. `{ title, to_column }` |
| `userName` | existing `ActivityEntry.user.name` | actor |
| template | translatable string set | one whole-sentence template per `action_type` per locale |

**Rules**:
- Templates MUST cover the full backend verb set: `task.created/updated/deleted/moved`,
  `column.created/renamed/deleted/reordered`, `board.created/updated`, `member.added`.
- Unknown `action_type` MUST fall back to the server-provided `message`.
- Each action is a **whole-sentence** template per language (no `${user} ${verb}`
  concatenation) so Arabic word order is correct.

## Relationships

```text
Locale (ar|en) ──derives──> dir (rtl|ltr) ──sets──> <html dir lang>
   │
   ├── persisted in ──> Cookie (idara-locale)  [SSR source of truth]
   └── mirrored in  ──> Zustand ui-store.locale    [client reactive]

Translatable string set ──keyed by──> typed key union
   └── consumed by ──> t(key, params)  AND  humanizeActivity(action_type, payload, ...)
```

## Out of scope (no changes)

- Backend models, Alembic migrations, REST/WebSocket contracts — unchanged.
- User-generated content (board/task names) — shown verbatim, never translated; only its
  per-block text direction is handled at render time.
