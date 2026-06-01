# Phase 1 Data Model: Adopt the "Liquid Glass" UI Redesign

This feature is **presentation-only**. There is **no database change, no migration, no
API, and no server-side entity**. The single piece of state it introduces is a
client-side UI preference.

## Entities

### Theme preference (client-only)

| Aspect | Value |
|--------|-------|
| What | The user's chosen interface appearance: `dark` or `light`. |
| Where stored | Browser `localStorage`, key `idara-theme`, value `"dark"` \| `"light"`. |
| Default | `dark` (no stored value → dark), matching today's app. |
| Scope | Per browser/device. **Not** synced to the account, **not** persisted server-side, **not** in the database. |
| How applied | The `light`/`dark` class on the `<html>` element. A no-flash inline script in the root layout applies the stored value before first paint; `ThemeSwitcher` updates both the class and `localStorage`. |
| Lifecycle | Read on load (pre-paint) → toggled by the user → written back to `localStorage`. No expiry. |

This is UI state, deliberately kept out of server state (Constitution Principle I).

## Design tokens (not data — presentation contract)

The redesign's "tokens" are CSS custom properties (in `globals.css`), not application
data. They are documented in [contracts/ui-contract.md](./contracts/ui-contract.md).
They are listed here only to note they are the single source of truth that both themes
and all glass surfaces derive from — there is no per-user or per-board token storage.

## Validation rules

- **VR-1**: Theme value is constrained to `dark` | `light`; any other/absent value
  falls back to `dark` (the no-flash script defaults to dark on parse failure).
- **VR-2 (forgot-password form)**: The email field must be a validly formatted, non-
  empty email before the confirmation state is shown. This is client-side validation
  only; no record is created and no request is sent (UI-only screen).

## Non-changes (explicit)

- No new tables, columns, or migrations.
- No changes to `User`, `Board`, `Task`, `Label`, `BoardMember`, or any backend model.
- No changes to API request/response shapes or types (`lib/types.ts` unchanged).
