import { describe, expect, it } from "vitest";
import { translate, createT } from "../translate";
import { dirFor, normalizeLocale, DEFAULT_LOCALE } from "../locale";

describe("dirFor", () => {
  it("maps ar to rtl and en to ltr", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });
});

describe("normalizeLocale", () => {
  it("passes through valid locales", () => {
    expect(normalizeLocale("ar")).toBe("ar");
    expect(normalizeLocale("en")).toBe("en");
  });
  it("falls back to default for invalid/empty values", () => {
    expect(normalizeLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("")).toBe(DEFAULT_LOCALE);
  });
});

describe("translate", () => {
  it("returns the active-locale string", () => {
    expect(translate("en", "common.cancel")).toBe("Cancel");
    expect(translate("ar", "common.cancel")).toBe("إلغاء");
  });

  it("interpolates {params}", () => {
    expect(translate("en", "boards.count", { count: 3 })).toBe("3 boards");
    expect(translate("en", "activity.task.moved", { user: "Jane", title: "X", column: "Done" })).toBe(
      "Jane moved 'X' to Done",
    );
  });

  it("leaves unknown params untouched", () => {
    // 'name' not provided -> token stays
    const out = translate("en", "activity.board.created", { user: "A" });
    expect(out).toContain("A created board");
  });

  it("never returns blank for a known key", () => {
    expect(translate("ar", "landing.hero.title").length).toBeGreaterThan(0);
  });
});

describe("createT", () => {
  it("binds to a locale", () => {
    const t = createT("ar");
    expect(t("common.delete")).toBe("حذف");
  });
});
