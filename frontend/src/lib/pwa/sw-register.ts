// Pure, framework-free decision helpers for service-worker registration.
// Isolated from the React registrar so they can be unit-tested without a browser.

export interface SwEnv {
  /** typeof window !== "undefined" */
  hasWindow: boolean;
  /** "serviceWorker" in navigator */
  hasServiceWorker: boolean;
  /** process.env.NODE_ENV */
  nodeEnv: string | undefined;
}

/**
 * Whether it's safe and appropriate to register the service worker.
 * Only in the browser, only when the API exists, and only in production
 * (so `next dev` HMR is never disturbed by SW caching). Never throws.
 */
export function canRegisterServiceWorker(env: SwEnv): boolean {
  return (
    env.hasWindow === true &&
    env.hasServiceWorker === true &&
    env.nodeEnv === "production"
  );
}

/**
 * Whether a `controllerchange` event should trigger a one-time reload.
 * The very first controller (no previous controller) is the initial load and
 * must NOT reload; a change when a controller already existed means a new SW
 * took over (new deploy) → reload once to get the fresh shell.
 */
export function shouldReloadOnControllerChange(state: {
  hadController: boolean;
  alreadyReloaded: boolean;
}): boolean {
  return state.hadController === true && state.alreadyReloaded === false;
}

/** Read the current environment into an SwEnv (impure edge; kept tiny). */
export function readSwEnv(): SwEnv {
  const hasWindow = typeof window !== "undefined";
  return {
    hasWindow,
    hasServiceWorker: hasWindow && "serviceWorker" in navigator,
    nodeEnv: process.env.NODE_ENV,
  };
}
