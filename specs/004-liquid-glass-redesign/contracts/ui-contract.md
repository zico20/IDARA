# Contract: UI / Design-System (Liquid Glass)

This feature exposes no REST/WS API. Its "contract" is the presentation system the rest
of the app renders against: the design tokens, the glass material utilities, the theme
mechanism, and the bilingual string additions. Keeping these stable is what guarantees
no functional regression.

## 1. Design tokens (CSS custom properties — `frontend/src/app/globals.css`)

All colors are stored as **space-separated RGB channels** so Tailwind opacity modifiers
work (`bg-accent/60`, `ring-accent/40`). One token set in `:root` (dark) and overrides
in `html.light` (light) drive everything.

| Token group | Tokens |
|---|---|
| Surfaces | `--bg`, `--bg-subtle`, `--bg-muted`, `--bg-elevated` |
| Borders | `--border`, `--border-subtle` |
| Text | `--fg`, `--fg-muted`, `--fg-subtle` |
| Accent / semantic | `--accent`, `--accent-hover`, `--accent-subtle`, `--success`, `--warning`, `--danger` |
| Glass geometry | `--glass-blur-frosted`, `--glass-blur-clear`, `--glass-saturate` |
| Glass material | `--glass-frost-bg/-border/-highlight`, `--glass-clear-bg/-border/-highlight` |
| Depth / scrim | `--glass-shadow`, `--glass-shadow-sm`, `--scrim` |
| Aurora | `--aurora-1`, `--aurora-2`, `--aurora-3`, `--aurora-opacity` |

**Contract**: existing utility class names (`bg-bg`, `text-fg`, `border-border`,
`bg-accent`, `/<opacity>` modifiers, etc.) keep resolving — Tailwind config maps them to
the variables — so unchanged components render correctly without edits.

## 2. Tailwind config (`frontend/tailwind.config.ts`)

- Colors resolve via `rgb(var(--x) / <alpha-value>)` (preserves every `/<opacity>` use).
- Border radii bumped (squircle-leaning): `sm 0.5rem`, `md 0.75rem`, `lg 1.125rem`.
- Added `boxShadow.glass` = `var(--glass-shadow)`, `boxShadow.glass-sm` =
  `var(--glass-shadow-sm)`.
- **Must live at `frontend/tailwind.config.ts`** (one level above `src/`).

## 3. Glass material utilities (`@layer components` in `globals.css`)

| Class | Use | Notes |
|---|---|---|
| `.glass-frost` | Large floating surfaces (modals, side panel) | Strong blur; opaque-ish tint doubles as text scrim |
| `.glass-clear` | Small floating bits (secondary buttons, menus, pills, toggles) | Lighter blur, thinner edge |
| `.glass-bar` | Full-width top nav | Frosted bg + hairline + inset highlight, no full border |
| `.tf-aurora` | Fixed brand backdrop behind content | `z-0`, `aria-hidden` |

**Rule**: glass = floating chrome only. Work surfaces (kanban columns, task cards, board
cards, inputs/textareas/selects) stay **solid** for readability.

## 4. Theme mechanism

- **Storage**: `localStorage["idara-theme"]` = `"dark"` | `"light"`; default `dark`.
- **Application**: `light`/`dark` class on `<html>`. No-flash inline `<script>` in
  `app/layout.tsx` applies the stored value before first paint.
- **Toggle**: `ThemeSwitcher` component (top bar + auth screens) flips the class and
  writes `localStorage`.
- **Contract**: switching theme updates all tokens (incl. glass tints) at once; under
  `prefers-reduced-transparency` glass becomes solid; under `prefers-reduced-motion`
  animations/reflections are disabled.

## 5. New components

| Component | Export / props | Mounted in |
|---|---|---|
| `Backdrop` | `Backdrop()` — fixed `.tf-aurora` layer | `app/(app)/layout.tsx`, `app/(auth)/layout.tsx` |
| `ThemeSwitcher` | `ThemeSwitcher({ className?: string })` | `app-shell.tsx` (top bar), `app/(auth)/layout.tsx` |

## 6. i18n additions (additive only — `lib/i18n/dictionaries.ts`)

8 keys added to **both** `en` and `ar`; **no keys removed**:

```
auth.login.forgot
auth.forgot.title
auth.forgot.subtitle
auth.forgot.submit
auth.forgot.back
auth.forgot.sent.title
auth.forgot.sent.desc
auth.forgot.sentAgain
```

**Contract**: the existing AR/EN dictionary-parity Vitest test must stay green (both
dictionaries expose exactly the same key set).

## 7. Forgot-password screen behavior (UI-only)

- Route: `/(auth)/forgot-password`. Reached via the `auth.login.forgot` link on login.
- On submit: validates the email, then shows the `auth.forgot.sent.*` confirmation.
- **Makes no API call and sends no email** (no backend reset endpoint). Wiring a real
  flow is out of scope (future feature).

## 8. Invariants preserved (regression contract)

- Every existing flow (auth, boards, columns, tasks, drag-and-drop, labels, members,
  real-time, presence, activity) behaves identically — logic/hooks/types/stores
  unchanged.
- Bilingual AR/EN + RTL/LTR preserved on every screen; all new markup uses logical
  properties (`ms-/me-`, `ps-/pe-`, `end-0`, `rtl:rotate-180`).
