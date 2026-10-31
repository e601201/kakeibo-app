import { describe, expect, it } from "vitest";
import { addMonths, isMonth, monthOf, todayInJapan } from "./month";

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

describe("月の移動", () => {
  it("前の月・次の月に移れる（年をまたいでも）", () => {
    expect(addMonths("2026-11", 1)).toBe("2026-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("年月（YYYY-MM）として正しいかを確かめる", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-1")).toBe(false);
    expect(isMonth("")).toBe(false);
  });
});
