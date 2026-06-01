# Feature Specification: Adopt the "Liquid Glass" UI Redesign

**Feature Branch**: `004-liquid-glass-redesign`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "I added a new UI design for the project in @NewDesign/ folder, i want to adopt this new design and link it with the project to become the main design."

## Overview

A complete visual redesign of IDARA's interface — the "Liquid Glass" aesthetic
(translucent, luminous *floating* surfaces layered over solid, readable work
surfaces) — has been prepared in the `NewDesign/` folder. This feature adopts that
redesign as the product's main, default appearance.

The redesign is **presentation-only**: it changes how the app looks, not what it
does. Every screen, control, and interaction behaves exactly as today; only the
visual styling, two new presentational pieces (a background aurora and a light/dark
theme toggle), and one new auth screen (forgot password) are added. All product
behavior — boards, columns, tasks, drag-and-drop, labels, members, real-time
updates, presence, activity feed, bilingual Arabic/English with RTL/LTR — is
unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The whole app wears the new look (Priority: P1)

Any user opening IDARA sees the new Liquid Glass appearance everywhere — the
landing page, login/signup, the boards list, a board with its columns and cards,
dialogs, the activity panel, presence avatars, and the demo board. Floating chrome
(top bar, modals, menus, pills, toasts, the activity panel) has the translucent
glass treatment with a soft luminous edge over a brand "aurora" background, while
the surfaces people actually work on (columns, task cards, board cards, inputs)
stay solid and readable. Nothing about how the app works changes.

**Why this priority**: This is the entire point of the request — make the new design
the main design. A consistent new look across every screen is the deliverable; it is
also the minimum that delivers the value (a refreshed product).

**Independent Test**: Walk through every screen (landing → signup/login → boards
list → a board with cards and dialogs → demo) and confirm each shows the new glass
styling and that every existing action (create board, add column, add/move/label a
task, invite a member, etc.) still works exactly as before.

**Acceptance Scenarios**:

1. **Given** a visitor on any screen, **When** the page loads, **Then** the new
   Liquid Glass styling is applied consistently (glass floating chrome over the
   aurora background; solid, readable work surfaces).
2. **Given** a user performing any existing action (e.g., creating a task, moving a
   card, applying a label, inviting a member), **When** they complete it, **Then**
   the action behaves identically to before the redesign — same result, same
   real-time and validation behavior.
3. **Given** the boards list, a board view, and the demo board, **When** each is
   opened, **Then** all three present the new design with no un-restyled ("old
   look") screens remaining.
4. **Given** any text over a glass surface, **When** it is displayed, **Then** it
   remains clearly legible (sufficient contrast) in both themes.

---

### User Story 2 - Switch between Light and Dark themes (Priority: P1)

A user can switch the whole interface between a Dark and a Light theme using a toggle
available in the top bar (and on the authentication screens). The choice takes effect
immediately across the app, is remembered for the next visit, and applies before the
first paint so there is no flash of the wrong theme. Dark remains the default for new
users, matching today's app.

**Why this priority**: Theme switching is a headline capability of the new design and
a net-new user-facing feature. It is tied with US1 as the most visible change.

**Independent Test**: Toggle from Dark to Light and confirm the entire UI (including
glass surfaces) swaps; reload the page and confirm the chosen theme persists with no
flash; confirm a brand-new user starts in Dark.

**Acceptance Scenarios**:

1. **Given** a user in Dark theme, **When** they activate the Light toggle, **Then**
   the entire interface — backgrounds, text, accents, and glass tints — switches to
   Light immediately.
2. **Given** a user who chose a theme, **When** they reload or revisit the app,
   **Then** their chosen theme is restored automatically and is applied before the
   page first renders (no flash of the other theme).
3. **Given** a first-time user with no saved preference, **When** they open the app,
   **Then** it appears in Dark theme by default.
4. **Given** either theme is active, **When** content is shown, **Then** text and
   controls meet legibility/contrast expectations in that theme.

---

### User Story 3 - "Forgot password" entry on login (Priority: P3)

A user who cannot remember their password sees a "Forgot password?" link on the login
screen. Following it opens a dedicated screen where they enter their email and submit;
they then see a friendly "check your inbox" confirmation. The screen carries the new
design and is fully bilingual.

**Why this priority**: It rounds out the auth flow visually and was part of the design
package, but it is the least critical — and, importantly, its back-end is not yet
available (see Assumptions and the open question), so it is lowest priority and may
ship as a visual-only placeholder.

**Independent Test**: From login, follow "Forgot password?", enter a valid email,
submit, and confirm the confirmation message appears; confirm an invalid email is
blocked with a validation message; confirm the screen reads correctly in both Arabic
and English.

**Acceptance Scenarios**:

1. **Given** a user on the login screen, **When** they look for password help,
   **Then** a clearly labeled "Forgot password?" link is present and leads to the
   forgot-password screen.
2. **Given** the forgot-password screen, **When** the user submits a validly
   formatted email, **Then** they see a "check your inbox" confirmation.
3. **Given** the forgot-password screen, **When** the user submits an empty or
   malformed email, **Then** submission is blocked with a clear validation message.
4. **Given** either language is active, **When** the screen is shown, **Then** all of
   its text is localized and laid out correctly for that language's direction.

---

### Edge Cases

- **Reduced transparency preference**: When the user's system requests reduced
  transparency, glass surfaces fall back to solid, opaque equivalents (and the sheen
  and aurora are removed) so the UI stays fully legible.
- **Reduced motion preference**: When the user's system requests reduced motion,
  animations, transitions, and the glass reflections are disabled.
- **Mobile / lower-powered devices**: The glass treatment is applied only to discrete
  floating elements and never stacked, so the redesign does not degrade responsiveness
  or performance on phones.
- **RTL (Arabic)**: All redesigned screens lay out correctly right-to-left; nothing is
  hard-pinned to a physical side, and direction flips live with the language switch.
- **Theme + language combinations**: All four combinations (Dark/Light × Arabic/
  English) render correctly.
- **Forgot password with no backend**: Submitting the forgot-password form shows the
  confirmation but does not actually send an email yet (no reset email is dispatched),
  consistent with the product's current "no outbound email" state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The new Liquid Glass visual design MUST be applied as the default,
  main appearance across every existing screen (landing, login, signup, boards list,
  board view, demo) and every shared element (top bar, dialogs, menus, buttons,
  inputs, pills/badges, toasts, presence bar, activity panel, empty states).
- **FR-002**: Adopting the redesign MUST NOT change any existing product behavior or
  capability — all flows (auth, boards, columns, tasks, drag-and-drop, labels,
  members/roles, real-time updates, presence, activity feed) MUST continue to work
  exactly as before.
- **FR-003**: Floating chrome MUST use the translucent glass styling over the brand
  background, while primary work surfaces (columns, task cards, board cards, form
  inputs) MUST remain solid and readable.
- **FR-004**: The system MUST provide a Light theme and a Dark theme and a visible
  control to switch between them, available in the top bar and on the authentication
  screens.
- **FR-005**: Switching theme MUST update the entire interface immediately, including
  the glass surface tints.
- **FR-006**: The chosen theme MUST persist across reloads and visits and MUST be
  applied before first paint (no flash of the unselected theme). New users with no
  saved preference MUST default to Dark.
- **FR-007**: Text and interactive controls MUST remain legible (meet contrast
  expectations) over glass surfaces in both themes.
- **FR-008**: The redesign MUST honor the user's system preferences for reduced
  transparency (glass becomes solid) and reduced motion (animations/reflections
  disabled).
- **FR-009**: All redesigned screens MUST remain fully bilingual (Arabic/English) with
  correct RTL/LTR layout, and all new on-screen text MUST be provided in both
  languages. No existing translated text may be lost.
- **FR-010**: The login screen MUST present a "Forgot password?" entry that leads to a
  dedicated, redesigned forgot-password screen which validates the entered email and
  shows a confirmation state.
- **FR-011**: The redesign MUST become the live, linked design of the project (not a
  separate preview) — i.e., the running application reflects it — replacing the prior
  look.

### Key Entities *(include if feature involves data)*

- **Theme preference**: The user's chosen appearance (Dark or Light), remembered
  locally per browser/device, defaulting to Dark. It affects only presentation and is
  not part of the user's account data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the app's existing screens present the new design after
  adoption — there are zero screens still showing the previous look.
- **SC-002**: 100% of existing user actions behave identically before and after the
  redesign (no functional regressions across auth, boards, columns, tasks,
  drag-and-drop, labels, members, real-time, presence, activity).
- **SC-003**: A user can switch between Dark and Light themes and see the whole UI
  update in under 1 second, with the choice persisting across reloads and no
  theme-flash on load.
- **SC-004**: All four theme × language combinations (Dark/Light × Arabic/English)
  render correctly with legible text and correct layout direction.
- **SC-005**: With reduced-transparency or reduced-motion system settings enabled, the
  UI remains fully legible and usable (glass becomes solid; motion is removed).
- **SC-006**: No existing localized string is lost; every new on-screen string is
  available in both Arabic and English.
- **SC-007**: A user can reach the forgot-password screen from login, submit a valid
  email, and receive a clear confirmation; an invalid email is blocked with a message.

## Assumptions

- **Presentation-only adoption**: The redesign in `NewDesign/` changes only the
  presentation layer. The application's logic, data handling, API usage, types, hooks,
  stores, and board logic are unchanged and identical to the current app (verified:
  these files match the current frontend byte-for-byte). This feature carries no
  back-end changes and no data-model changes.
- **Net-new presentational pieces**: The redesign adds a background "aurora" layer, a
  light/dark theme switcher, and a forgot-password screen; everything else is a
  restyle of an existing screen/component.
- **Theme default & storage**: Dark is the default; the preference is stored locally
  on the device (not synced to the account), matching the design package's behavior.
- **Token-driven theming**: A single set of design tokens drives both themes and all
  glass surfaces, so the two themes stay visually consistent by construction.
- **Bilingual parity preserved**: The only translation changes are additions for the
  new forgot-password screen and its login link; no existing keys are removed.
- **Forgot password is UI-only for now**: There is no back-end password-reset endpoint
  today, so the forgot-password screen shows its confirmation without actually sending
  an email. Hooking it to a real reset flow is out of scope for this feature and
  depends on a future back-end capability (see open question).
- **Labels and recent features preserved**: The redesign already includes the existing
  label-management UI and all current features, so adopting it does not regress any
  recently shipped functionality.

## Dependencies

- The `NewDesign/` package (components, styling tokens, theme switcher, backdrop, and
  the forgot-password screen) is the source material being adopted.
- A future back-end password-reset capability is required before the forgot-password
  screen can actually send reset emails; until then it remains a visual confirmation
  only.

## Resolved Decisions

- **Forgot-password ships as a UI-only placeholder** (decided 2026-05-30): The
  forgot-password screen is adopted exactly as designed — it validates the email and
  shows a "check your inbox" confirmation, but sends no actual email, since there is no
  back-end reset endpoint yet. This keeps the feature presentation-only and zero-risk.
  Wiring a real password-reset flow (token generation, validation, reset endpoints) is
  explicitly out of scope and will be a separate future feature. US3 and FR-010 are to
  be implemented as this visual placeholder.
