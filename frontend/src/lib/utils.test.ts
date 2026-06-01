import { describe, expect, it } from "vitest";
import { cn, colorFromString, initials } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});

describe("initials", () => {
  it("takes first two words", () => {
    expect(initials("Jane Doe")).toBe("JD");
  });
  it("handles single name", () => {
    expect(initials("Jane")).toBe("J");
  });
  it("trims and collapses whitespace", () => {
    expect(initials("  ada  lovelace ")).toBe("AL");
  });
});

describe("colorFromString", () => {
  it("is deterministic", () => {
    expect(colorFromString("board-1")).toBe(colorFromString("board-1"));
  });
  it("returns a hex color from the palette", () => {
    expect(colorFromString("anything")).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
