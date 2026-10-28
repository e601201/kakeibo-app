import { describe, expect, it } from "vitest";
import { monthOf, todayInJapan } from "./month";

describe("今日の日付", () => {
  it("日本時間の日付を今日とする（UTCではまだ前日でも）", () => {
    expect(todayInJapan(new Date("2026-10-31T15:30:00Z"))).toBe("2026-11-01");
  });
});

describe("月の区切り", () => {
  it("記録は利用日の暦の月に数える（月末も月初も）", () => {
    expect(monthOf("2026-10-31")).toBe("2026-10");
    expect(monthOf("2026-11-01")).toBe("2026-11");
  });
});
