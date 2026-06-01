"use client";

import { useEffect } from "react";
import {
  canRegisterServiceWorker,
  readSwEnv,
  shouldReloadOnControllerChange,
} from "@/lib/pwa/sw-register";

/**
 * Registers the service worker (production only) and reloads once when a new
 * worker takes control, so users get the fresh shell after a deploy without
 * clearing site data. Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!canRegisterServiceWorker(readSwEnv())) return;

    let alreadyReloaded = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (
        shouldReloadOnControllerChange({ hadController, alreadyReloaded })
      ) {
        alreadyReloaded = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort; the app works without it */
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
