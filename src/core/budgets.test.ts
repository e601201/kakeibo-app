import { describe, expect, it } from "vitest";
import {
  type PlanEntry,
  changesForMonth,
  planDifference,
  planForMonth,
} from "./budgets";

// 金額は作り物の値
const budgets: PlanEntry[] = [
  { key: "food", startMonth: "2026-11", amount: 30000 },
  { key: "food", startMonth: "2027-01", amount: 35000 },
  { key: "eatout", startMonth: "2026-12", amount: 10000 },
];

describe("予算の適用", () => {
  it("その月以前で最も新しい適用開始月の予算を使う", () => {
    expect(planForMonth(budgets, "2026-12", ["food"])).toEqual({ food: 30000 });
    expect(planForMonth(budgets, "2027-03", ["food"])).toEqual({ food: 35000 });
  });

  it("1月に予算を変えても、12月の予算は12月の予算のまま", () => {
    expect(planForMonth(budgets, "2026-12", ["food"]).food).toBe(30000);
    expect(planForMonth(budgets, "2027-01", ["food"]).food).toBe(35000);
  });

  it("適用開始月がまだ来ていない費目の予算は0円", () => {
    expect(planForMonth(budgets, "2026-11", ["food", "eatout"])).toEqual({
      food: 30000,
      eatout: 0,
    });
  });

  it("予算の履歴がない費目も0円", () => {
    expect(planForMonth(budgets, "2026-11", ["rent"])).toEqual({ rent: 0 });
  });

  it("収入の予定も同じ決まりで決まる", () => {
    const incomePlans: PlanEntry<"salary" | "from_wife">[] = [
      { key: "salary", startMonth: "2026-11", amount: 200000 },
    ];
    expect(planForMonth(incomePlans, "2026-11", ["salary", "from_wife"])).toEqual({
      salary: 200000,
      from_wife: 0,
    });
  });
});

describe("予算の差額", () => {
  it("収入の予定額の合計から、予算合計（支出と振替の費目の両方）を引いた額", () => {
    expect(
      planDifference({ food: 30000, save: 50000 }, { salary: 70000, from_wife: 20000 }),
    ).toEqual({ budgetTotal: 80000, incomeTotal: 90000, difference: 10000 });
  });

  it("予算を配分しきると差額は0、配りすぎるとマイナス", () => {
    expect(planDifference({ food: 90000 }, { salary: 90000 }).difference).toBe(0);
    expect(planDifference({ food: 100000 }, { salary: 90000 }).difference).toBe(-10000);
  });
});

describe("予算の変更", () => {
  it("額を変えた費目だけが、選んだ月を適用開始月とする変更になる", () => {
    expect(changesForMonth(budgets, "2026-12", { food: "30000", eatout: "12,000" })).toEqual({
      ok: true,
      value: [{ key: "eatout", startMonth: "2026-12", amount: 12000 }],
    });
  });

  it("空にした欄は0円にする", () => {
    expect(changesForMonth(budgets, "2026-12", { food: "" })).toEqual({
      ok: true,
      value: [{ key: "food", startMonth: "2026-12", amount: 0 }],
    });
  });

  it("マイナス・小数・数字でない予算は保存できず、どの欄が間違っているかを返す", () => {
    expect(
      changesForMonth(budgets, "2026-12", { food: "-1", eatout: "10.5", rent: "abc" }),
    ).toEqual({
      ok: false,
      errors: {
        food: "0円以上で入れてください",
        eatout: "円の整数で入れてください",
        rent: "数字で入れてください",
      },
    });
  });

  it("変えた月より前の月の予算は変わらない", () => {
    const result = changesForMonth(budgets, "2027-02", { eatout: "8000" });
    expect(result).toEqual({
      ok: true,
      value: [{ key: "eatout", startMonth: "2027-02", amount: 8000 }],
    });
  });

  it("同じ月にもう一度直すと、その月の履歴の上書きになる（前の月の額に戻すときも）", () => {
    // 2027-01 の食費は 35000。前の月（2026-12）の 30000 に戻す
    expect(changesForMonth(budgets, "2027-01", { food: "30000" })).toEqual({
      ok: true,
      value: [{ key: "food", startMonth: "2027-01", amount: 30000 }],
    });
  });
});
