# Feature Specification: PWA & Edge-to-Edge

**Feature Branch**: `010-pwa-edge-to-edge`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: Turn the TaskFlow frontend into an installable Progressive Web App that opens standalone from the home screen, extends its background edge-to-edge behind the mobile status bar (instead of a separate black strip), works with basic offline support, and gracefully handles errors/not-found — all frontend-only, additive, bilingual (AR فصحى/EN), RTL/LTR- and theme-correct, reduced-motion/transparency safe, and without changing the settled desktop (≥1280px) appearance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Status bar blends with the app on mobile (Priority: P1)

A visitor opens TaskFlow on a phone browser. The area behind the system status bar (clock, signal, battery) takes on the app's own background color instead of showing a disconnected black strip, so the page feels like one continuous surface. This holds in both light and dark themes.

**Why this priority**: This is the exact problem the user raised, it is the highest-visibility fix, and it needs none of the heavier PWA machinery (no install, no service worker) — just correct color + viewport handling. It delivers value on its own.

**Independent Test**: Open the site on a mobile browser in dark mode → the status-bar area matches the dark page background (no black strip); switch to light mode → it matches the light background. Verified on a phone (or device emulation) without installing anything.

**Acceptance Scenarios**:

1. **Given** the site open on a phone in dark theme, **When** the page renders, **Then** the status-bar/top area is the dark app background color, not an unrelated black bar.
2. **Given** the user switches to light theme, **When** the theme changes, **Then** the status-bar color updates to the light app background color.
3. **Given** a notched device, **When** the page renders, **Then** the app background extends fully to the top edge while the interactive top bar and content stay clear of the clock/notch (not clipped or hidden under it).
4. **Given** desktop at ≥1280px, **When** the page renders, **Then** nothing about the settled desktop appearance changes.

---

### User Story 2 - Install TaskFlow to the home screen (Priority: P2)

A user chooses "Add to Home Screen" (or an install prompt) and launches TaskFlow as a standalone app: it opens without browser chrome, shows the correct app name and icon, and uses the brand colors for its splash/background.

**Why this priority**: Installability is the core PWA promise and what makes the edge-to-edge experience fully native-feeling, but it depends on the foundational metadata being correct, so it follows the status-bar fix.

**Independent Test**: From a supported browser, install the app; confirm the home-screen icon and name are correct, and launching it opens a standalone window (no address bar) with the brand background — no console manifest/icon errors.

**Acceptance Scenarios**:

1. **Given** a supported browser, **When** the user opens the browser menu, **Then** an install / "Add to Home Screen" option is available for TaskFlow.
2. **Given** the app is installed, **When** the user taps its home-screen icon, **Then** it launches standalone (no browser address bar) with the correct name and icon.
3. **Given** the installed app launches, **When** it first paints, **Then** the background/splash uses the app's brand background color (matching the active theme baseline) with no flash of an unrelated color.
4. **Given** the manifest and icons load, **When** the page is audited, **Then** there are no missing-icon or invalid-manifest errors.

---

### User Story 3 - Graceful offline & error states (Priority: P3)

When the network drops or a page fails to load, the user sees a clear, on-brand screen (not a raw browser error) that explains the situation and offers a way forward (retry / go to boards). Previously visited app shell still opens rather than a dead page.

**Why this priority**: Robustness and the "P" in PWA (works offline-ish). Valuable but secondary to the visible status-bar fix and installability; also the riskiest piece (service worker), so it is sequenced last and kept minimal.

**Independent Test**: Load the app once online, then go offline and reopen / navigate → an on-brand offline screen appears (not the browser's default). Trigger a render error → an on-brand error boundary appears with a retry. Visit an unknown URL → an on-brand not-found screen.

**Acceptance Scenarios**:

1. **Given** the app shell has been loaded once, **When** the device goes offline and the user reopens the app, **Then** a styled offline screen is shown (bilingual, glass style) rather than the browser's default error page.
2. **Given** a route or component fails to render, **When** the failure occurs, **Then** an on-brand error screen with a retry/back action is shown and the failure is announced to assistive tech.
3. **Given** the user navigates to a non-existent path, **When** the page resolves, **Then** an on-brand not-found screen with a link back to the boards is shown.
4. **Given** the network returns, **When** the user retries, **Then** live data is fetched fresh (no stale/misleading cached app data is shown as if current).
5. **Given** a new version of the app is deployed, **When** the user reopens it, **Then** they are not locked on a stale cached version (the app updates rather than serving an old shell forever).

---

### Edge Cases

- **Theme at first paint**: status-bar color must match whatever theme the no-flash script applies (dark default, or saved light) — no mismatch flash.
- **Notch / safe areas**: content must never sit under the clock/notch or the home indicator; background must still fill those areas.
- **Dynamic browser chrome**: the address bar showing/hiding on mobile must not clip the bottom of the app (use of a dynamic viewport height where it matters).
- **Offline with no prior visit**: if the app was never loaded online, offline behavior degrades to a clear message rather than a confusing blank.
- **Stale service worker**: a returning user must be able to receive an updated app without manually clearing site data.
- **Sensitive data**: nothing that could mislead (auth tokens, mutable board/task API responses presented as current) is served from cache while offline.
- **Reduced motion / transparency & RTL**: the offline/error/not-found screens follow the global reduced-motion/transparency rules and mirror correctly in RTL.
- **Desktop**: none of the above changes the settled desktop view.

## Requirements *(mandatory)*

### Functional Requirements

**Status bar & edge-to-edge (Story 1)**

- **FR-001**: The area behind the mobile system status bar MUST take the app's background color for the active theme (dark and light), so it visually merges with the page.
- **FR-002**: The app background MUST extend to the physical top edge of the screen on mobile, while interactive chrome and content MUST remain within the device safe area (never clipped by the notch/clock or home indicator).
- **FR-003**: The status-bar color MUST update when the user switches theme.
- **FR-004**: On mobile, layout heights MUST account for the dynamic browser chrome so content is not clipped when the address bar shows/hides.
- **FR-005**: The settled desktop (≥1280px) appearance MUST NOT change except by additive means.

**Installability (Story 2)**

- **FR-006**: The app MUST provide installation metadata (name, short name, start location, standalone display, brand background and theme colors, and icons in the sizes needed for home-screen and install UI, including a maskable icon and an Apple touch icon).
- **FR-007**: A supported browser MUST offer an install / "Add to Home Screen" affordance, and the installed app MUST launch standalone with the correct name and icon.
- **FR-008**: The installed app's launch/splash background MUST use the brand background color with no flash of an unrelated color.
- **FR-009**: The manifest and all referenced icons MUST load without errors.

**Offline & resilience (Story 3)**

- **FR-010**: After at least one online load, the app shell and static assets MUST be available offline, and reopening offline MUST show a styled, bilingual offline screen rather than the browser default error.
- **FR-011**: The app MUST NOT serve cached mutable application data (boards/tasks/etc.) in a way that presents stale data as current; when online, live data MUST be fetched.
- **FR-012**: The offline-support layer MUST update cleanly on a new deployment (no permanent lock-in to a stale cached version), with a defined update behavior.
- **FR-013**: The offline-support layer MUST NOT cache authentication tokens or sensitive API responses.
- **FR-014**: The app MUST render an on-brand, bilingual error screen (with retry/back) when a route or component fails, and an on-brand not-found screen for unknown paths.

**Cross-cutting**

- **FR-015**: All new screens/text (offline, error, not-found, any install hint) MUST be available in Arabic (فصحى) and English with full dictionary-key parity, and render correctly in RTL/LTR and both themes.
- **FR-016**: All new UI MUST respect prefers-reduced-motion (effectively instant) and prefers-reduced-transparency (no reliance on translucency), and new error/offline states MUST be announced to assistive technology.
- **FR-017**: The new mobile shell (safe-area handling, status-bar area) MUST NOT break keyboard navigation or focus order, and top-bar controls MUST retain accessible labels.

### Key Entities *(include if feature involves data)*

- **App install metadata** (static, not user data): the identity used when installing — name, short name, start location, display mode, theme/background colors, and the icon set (including maskable + Apple touch). Derived from existing brand assets/colors.
- **Cached app shell** (client-only, derived): the minimal set of static assets needed to open the app offline; explicitly excludes mutable API data, auth tokens, and sensitive responses.
- **Offline / Error / Not-found screens** (presentational, derived): on-brand bilingual fallback views reusing the existing empty-state and glass styles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mobile browser, the status-bar area matches the app background in both themes 100% of the time (no black strip), verified in dark and light.
- **SC-002**: On a notched device, 0 interactive elements are clipped by the notch/clock or home indicator, while the background still fills to the edges.
- **SC-003**: A user can install TaskFlow and launch it standalone with the correct name and icon, with 0 manifest/icon errors reported by a standard PWA audit.
- **SC-004**: After one online visit, reopening the app offline shows the branded offline screen (not the browser default) in ≥ the supported browsers tested.
- **SC-005**: Deploying a new version and reopening results in the updated app (the user is never stuck on a stale shell).
- **SC-006**: No auth token or mutable API response is present in the offline cache (verified by inspection).
- **SC-007**: Offline, error, and not-found screens are fully usable in Arabic (RTL) and English (LTR) and in both themes, with no missing strings.
- **SC-008**: The settled desktop (≥1280px) view is visually unchanged (before/after comparison shows no static-state differences).

## Assumptions

- **Brand colors**: the PWA theme/background colors reuse the existing `--bg` tokens (dark and light) and the existing brand accent; no new palette is introduced.
- **Theme color choice**: because a single static theme-color must be chosen for some surfaces, the dark background is treated as the baseline brand color, with the per-theme value applied where the platform supports switching; this matches the app's dark-default behavior.
- **Native-first implementation**: installation metadata and icons are produced with the framework's built-in capabilities rather than adding a heavy PWA dependency, unless a gap forces otherwise (which would be documented).
- **Offline scope**: offline support covers the app shell and static assets plus a friendly offline screen — NOT full offline editing of boards/tasks. The REST API remains the source of truth; offline is a graceful fallback, not a sync engine.
- **Service worker minimalism**: the offline layer is kept as small as possible with a clear update strategy; if a maintained helper library is justified for correctness/safety, that will be noted in planning rather than assumed.
- **Accessibility scope**: this feature ensures the new shell/screens don't regress a11y and adds labels/announcements where the new UI needs them; full keyboard drag-and-drop and a broader a11y audit are explicitly out of scope (future work).
- **Out of scope**: push notifications, background sync, offline mutations/queueing, and any backend change.
- **Reused foundations**: the existing no-flash theme script, `--bg` tokens, Liquid Glass styles, `EmptyState` component, i18n dictionary + parity test, and the existing top-bar/safe layout are reused rather than re-created.
