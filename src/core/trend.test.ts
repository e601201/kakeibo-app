import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import { trendPeriod, yearlyTrend } from "./trend";

// 金額は作り物の値
function category(overrides: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { kind: "expense", sortOrder: 0, memo: "", hidden: false, ...overrides };
}

const categories = [
  category({ id: "food", name: "食費（食材）", sortOrder: 0 }),
  category({ id: "eatout", name: "外食", sortOrder: 1 }),
  category({ id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 2 }),
];

const record = (categoryId: string, date: string, amount: number) => ({ categoryId, date, amount });

const rowOf = (trend: ReturnType<typeof yearlyTrend>, id: string) =>
  trend.rows.find((r) => r.category.id === id);

describe("年間推移", () => {
  it("開始月から12か月が並ぶ（年をまたいでも）", () => {
    expect(yearlyTrend("2026-11", categories, []).months).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
      "2027-07",
      "2027-08",
      "2027-09",
      "2027-10",
    ]);
  });

  it("費目×月の実績が出て、12か月の範囲の外の記録は数えない", () => {
    const trend = yearlyTrend("2026-11", categories, [
      record("food", "2026-10-31", 9999),
      record("food", "2026-11-01", 1000),
      record("food", "2026-11-30", 2000),
      record("food", "2027-10-31", 500),
      record("food", "2027-11-01", 9999),
    ]);
    const amounts = rowOf(trend, "food")?.amounts;
    expect(amounts?.[0]).toBe(3000);
    expect(amounts?.[11]).toBe(500);
    expect(rowOf(trend, "food")?.total).toBe(3500);
  });

  it("返金は同じ費目のその月の実績から差し引かれる", () => {
    const trend = yearlyTrend("2026-11", categories, [
      record("eatout", "2026-11-05", 3000),
      record("eatout", "2026-11-20", -1000),
    ]);
    expect(rowOf(trend, "eatout")?.amounts[0]).toBe(2000);
  });

  it("月平均の分母は、どれかの費目に記録がある月の数（費目ごとではなく全体で数える）", () => {
    const trend = yearlyTrend("2026-11", categories, [
      record("food", "2026-11-10", 3000),
      record("food", "2026-12-10", 3000),
      record("eatout", "2027-01-10", 6000),
    ]);
    // 記録のある月は 11月・12月・1月 の3か月
    expect(trend.monthsWithRecords).toBe(3);
    expect(rowOf(trend, "food")).toMatchObject({ total: 6000, average: 2000 });
    expect(rowOf(trend, "eatout")).toMatchObject({ total: 6000, average: 2000 });
    expect(rowOf(trend, "save")).toMatchObject({ total: 0, average: 0 });
  });

  it("振替だけの月も、記録のある月に数える", () => {
    const trend = yearlyTrend("2026-11", categories, [
      record("food", "2026-11-10", 3000),
      record("save", "2026-12-25", 50000),
    ]);
    expect(trend.monthsWithRecords).toBe(2);
    expect(rowOf(trend, "food")?.average).toBe(1500);
  });

  it("記録のある月が0なら、月平均は出さない", () => {
    const trend = yearlyTrend("2026-11", categories, []);
    expect(trend.monthsWithRecords).toBe(0);
    expect(rowOf(trend, "food")).toMatchObject({ total: 0, average: null });
  });

  it("非表示の費目は、12か月の間に記録があるときだけ行が出る", () => {
    const withHidden = [
      ...categories,
      category({ id: "books", name: "書籍", sortOrder: 3, hidden: true }),
      category({ id: "old", name: "昔の費目", sortOrder: 4, hidden: true }),
    ];
    const trend = yearlyTrend("2026-11", withHidden, [record("books", "2027-02-01", 800)]);
    const ids = trend.rows.map((r) => r.category.id);
    expect(ids).toContain("books");
    expect(ids).not.toContain("old");
  });
});

describe("年間推移の期間", () => {
  it("開始月の1日から、12か月目の次の月の1日の手前まで読む", () => {
    expect(trendPeriod("2026-11")).toMatchObject({ from: "2026-11-01", before: "2027-11-01" });
  });
});
