# PWA Surface Contract: PWA & Edge-to-Edge

There is **no HTTP API** in this feature. The "contracts" are the static PWA surfaces the browser/OS consume and the service-worker behavior. No backend endpoints change.

## 1. Web app manifest — `/manifest.webmanifest` (from `app/manifest.ts`)

```jsonc
{
  "name": "IDARA",
  "short_name": "IDARA",
  "start_url": "/boards",
  "display": "standalone",
  "background_color": "#0D1117",
  "theme_color": "#0D1117",
  "icons": [
    { "src": "/icon",       "sizes": "512x512", "type": "image/png" },
    { "src": "/icon",       "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/apple-icon", "sizes": "180x180", "type": "image/png" }
  ]
}
```
- Auto-linked by Next (`<link rel="manifest" href="/manifest.webmanifest">`).
- MUST load with HTTP 200 and no console manifest errors (FR-009).

## 2. Document head (root layout `viewport`/`metadata`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#0D1117">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#EAEEF4">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="IDARA">
<link rel="apple-touch-icon" href="/apple-icon">
```

## 3. Service worker route contract (`public/sw.js`)

| Request kind | Strategy | Offline behavior |
|--------------|----------|------------------|
| Navigation (`mode === "navigate"`, GET) | network-first | fall back to cached shell, else `/offline` |
| Static (`/_next/static/*`, `/icon`, `/apple-icon`, fonts) | cache-first | served from cache |
| `/api/*`, non-GET, cross-origin | **pass-through (never cached)** | normal network failure (no SW interference) |

Lifecycle:
- `install` → precache `["/offline", app shell, static essentials]`, `skipWaiting()`.
- `activate` → delete caches whose name ≠ current `idara-shell-v{N}`, `clients.claim()`.
- Cache version constant bumped each release → old shell superseded.

**Guarantees (security/consistency):**
- No `Authorization`/cookie-bearing or `/api/*` response is ever written to cache (FR-013).
- No mutable application data is served from cache as if current (FR-011) — only the static shell + offline page.

## 4. Client registrar contract (`components/pwa/service-worker-registrar.tsx` + `lib/pwa/sw-register.ts`)

- Registers `/sw.js` **only** when `NODE_ENV === "production"` and `navigator.serviceWorker` exists.
- On `controllerchange` (a new SW took control), reload once so the user gets the fresh shell (FR-012).
- Pure helpers (`canRegisterServiceWorker`, `shouldReloadOnControllerChange`) are unit-tested and guard `typeof window === "undefined"` / unsupported browsers (return false, no throw).

## 5. Fallback routes

| Route/file | Contract |
|------------|----------|
| `/offline` (`app/offline/page.tsx`) | Static, cached at SW install; bilingual offline screen with retry/back. |
| `app/error.tsx` | Client boundary; shows bilingual error + `reset()` retry; `role="alert"`. |
| `app/global-error.tsx` | Renders its own `<html><body>`; root-level catch. |
| `app/not-found.tsx` | Bilingual not-found with link back to `/boards`. |
