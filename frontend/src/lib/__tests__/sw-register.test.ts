import { describe, expect, it } from "vitest";
import {
  canRegisterServiceWorker,
  shouldReloadOnControllerChange,
} from "../pwa/sw-register";

describe("canRegisterServiceWorker", () => {
  it("registers only in the browser, with SW support, in production", () => {
    expect(
      canRegisterServiceWorker({
        hasWindow: true,
        hasServiceWorker: true,
        nodeEnv: "production",
      }),
    ).toBe(true);
  });

  it("does not register on the server (no window)", () => {
    expect(
      canRegisterServiceWorker({
        hasWindow: false,
        hasServiceWorker: false,
        nodeEnv: "production",
      }),
    ).toBe(false);
  });

  it("does not register when the API is unsupported", () => {
    expect(
      canRegisterServiceWorker({
        hasWindow: true,
        hasServiceWorker: false,
        nodeEnv: "production",
      }),
    ).toBe(false);
  });

  it("does not register outside production (dev/test)", () => {
    expect(
      canRegisterServiceWorker({
        hasWindow: true,
        hasServiceWorker: true,
        nodeEnv: "development",
      }),
    ).toBe(false);
    expect(
      canRegisterServiceWorker({
        hasWindow: true,
        hasServiceWorker: true,
        nodeEnv: undefined,
      }),
    ).toBe(false);
  });
});

describe("shouldReloadOnControllerChange", () => {
  it("reloads when a new SW takes over an existing controller", () => {
    expect(
      shouldReloadOnControllerChange({ hadController: true, alreadyReloaded: false }),
    ).toBe(true);
  });

  it("does not reload on the initial controller (first load)", () => {
    expect(
      shouldReloadOnControllerChange({ hadController: false, alreadyReloaded: false }),
    ).toBe(false);
  });

  it("does not reload twice", () => {
    expect(
      shouldReloadOnControllerChange({ hadController: true, alreadyReloaded: true }),
    ).toBe(false);
  });
});
