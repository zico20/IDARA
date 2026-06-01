// Brand colors for the PWA surfaces (manifest, theme-color, generated icons),
// kept in one place so they stay in sync with the --bg CSS tokens in globals.css.
// Pure module — no framework deps.

/** App background, dark theme (matches --bg: 13 17 23 → #0D1117). */
export const BG_DARK = "#0D1117";

/** App background, light theme (matches --bg: 234 238 244 → #EAEEF4). */
export const BG_LIGHT = "#EAEEF4";

/** Brand accent (matches --accent dark #58A6FF → used in generated icons). */
export const ACCENT = "#58A6FF";
export const ACCENT_SUBTLE = "#1F6FEB";

/** Baseline brand color used where a single static value is required
 *  (manifest background/theme, splash). The app is dark-default. */
export const BRAND_BASELINE = BG_DARK;
