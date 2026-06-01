import { describe, expect, it } from "vitest";
import { humanizeActivity } from "../humanize-activity";
import { createT } from "../translate";

const tEn = createT("en");
const tAr = createT("ar");

describe("humanizeActivity", () => {
  it("builds task.created in both locales", () => {
    expect(humanizeActivity("task.created", "Jane", { title: "Fix bug" }, tEn)).toBe(
      "Jane created task 'Fix bug'",
    );
    expect(humanizeActivity("task.created", "سارة", { title: "إصلاح" }, tAr)).toBe(
      "أنشأ سارة المهمة 'إصلاح'",
    );
  });

  it("builds task.moved using to_column payload", () => {
    expect(
      humanizeActivity("task.moved", "Sara", { title: "Onboarding", to_column: "Done" }, tEn),
    ).toBe("Sara moved 'Onboarding' to Done");
  });

  it("builds member.added using member_name payload", () => {
    expect(
      humanizeActivity("member.added", "Owner", { member_name: "Lina" }, tEn),
    ).toBe("Owner added Lina");
  });

  it("builds member.role_changed with a localized role word", () => {
    expect(
      humanizeActivity(
        "member.role_changed",
        "Owner",
        { member_name: "Lina", role: "viewer" },
        tEn,
      ),
    ).toBe("Owner changed Lina's role to viewer");
  });

  it("builds member.removed", () => {
    expect(
      humanizeActivity("member.removed", "Owner", { member_name: "Lina" }, tEn),
    ).toBe("Owner removed Lina");
  });

  it("covers every known action type without leaving raw tokens", () => {
    const actions = [
      "task.created",
      "task.updated",
      "task.deleted",
      "task.moved",
      "column.created",
      "column.renamed",
      "column.deleted",
      "column.reordered",
      "board.created",
      "board.updated",
      "member.added",
      "member.role_changed",
      "member.removed",
    ];
    for (const a of actions) {
      const out = humanizeActivity(
        a,
        "User",
        { title: "T", name: "N", to_column: "C", member_name: "M" },
        tEn,
      );
      expect(out, a).not.toContain("{");
      expect(out, a).toContain("User");
    }
  });

  it("falls back to the server message for unknown action types", () => {
    expect(
      humanizeActivity("task.archived", "X", {}, tEn, "X archived a task"),
    ).toBe("X archived a task");
  });

  it("falls back to action type if no server message provided", () => {
    expect(humanizeActivity("weird.event", "X", {}, tEn)).toBe("weird.event");
  });
});
