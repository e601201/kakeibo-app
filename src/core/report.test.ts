import { describe, expect, it } from "vitest";
import type { PlanEntry } from "./budgets";
import type { Category } from "./categories";
import type { ExpenseRecord, IncomeKind, IncomeRecord } from "./records";
import { type ReportInput, homeSummary, monthlyReport } from "./report";

// 金額は作り物の値
function category(overrides: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { kind: "expense", sortOrder: 0, memo: "", hidden: false, ...overrides };
}

const categories = [
  category({ id: "food", name: "食費（食材）", sortOrder: 0 }),
  category({ id: "eatout", name: "外食", sortOrder: 1 }),
  category({ id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 2 }),
];

let seq = 0;
function expense(categoryId: string, amount: number, date = "2026-11-10"): ExpenseRecord {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    categoryId,
    amount,
    description: "",
    paymentMethodId: null,
    memo: "",
    needsReview: false,
    createdAt: `${date}T10:00:00Z`,
  };
}

function income(kind: IncomeKind, amount: number, date = "2026-11-25"): IncomeRecord {
  seq += 1;
  return { id: `i${seq}`, date, kind, amount, memo: "", createdAt: `${date}T10:00:00Z` };
}

function input(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    month: "2026-11",
    categories,
    expenses: [],
    incomes: [],
    budgetHistory: [
      { key: "food", startMonth: "2026-11", amount: 30000 },
      { key: "eatout", startMonth: "2026-11", amount: 10000 },
      { key: "save", startMonth: "2026-11", amount: 50000 },
    ],
    incomePlanHistory: [],
    ...overrides,
  };
}

const rowOf = (report: ReturnType<typeof monthlyReport>, id: string) =>
  report.rows.find((r) => r.category.id === id);

describe("月次レポートの費目ごとの行", () => {
  it("費目ごとに予算・実績・残り・消化率が出る", () => {
    const report = monthlyReport(
      input({ expenses: [expense("food", 12000), expense("food", 3000)] }),
    );
    expect(rowOf(report, "food")).toMatchObject({
      budget: 30000,
      actual: 15000,
      remaining: 15000,
      usageRate: 0.5,
      over: false,
    });
  });

  it("費目は表示順に並ぶ", () => {
    expect(monthlyReport(input()).rows.map((r) => r.category.id)).toEqual([
      "food",
      "eatout",
      "save",
    ]);
  });

  it("返金は同じ費目の実績から差し引かれる", () => {
    const report = monthlyReport(input({ expenses: [expense("eatout", 5000), expense("eatout", -2000)] }));
    expect(rowOf(report, "eatout")).toMatchObject({ actual: 3000, remaining: 7000 });
  });

  it("実績が予算を超えた費目は予算オーバー", () => {
    const report = monthlyReport(input({ expenses: [expense("eatout", 12000)] }));
    expect(rowOf(report, "eatout")).toMatchObject({
      remaining: -2000,
      usageRate: 1.2,
      over: true,
      overBy: 2000,
    });
  });

  it("予算ちょうどまでは予算オーバーではない", () => {
    const report = monthlyReport(input({ expenses: [expense("eatout", 10000)] }));
    expect(rowOf(report, "eatout")).toMatchObject({ usageRate: 1, over: false, overBy: 0 });
  });

  it("予算0の費目は消化率を出さず、実績が0より大きければ予算オーバー", () => {
    const noBudget = input({ budgetHistory: [] });
    expect(rowOf(monthlyReport(noBudget), "food")).toMatchObject({
      budget: 0,
      usageRate: null,
      over: false,
    });
    const spent = monthlyReport({ ...noBudget, expenses: [expense("food", 500)] });
    expect(rowOf(spent, "food")).toMatchObject({ usageRate: null, over: true });
  });

  it("過去の月のレポートは、その月に適用されていた予算で比べる", () => {
    const history: PlanEntry[] = [
      { key: "food", startMonth: "2026-11", amount: 30000 },
      { key: "food", startMonth: "2026-12", amount: 40000 },
    ];
    const report = monthlyReport(
      input({ budgetHistory: history, expenses: [expense("food", 35000)] }),
    );
    expect(rowOf(report, "food")).toMatchObject({ budget: 30000, over: true });
  });

  it("非表示の費目は、その月に実績か予算があるときだけ行が出る", () => {
    const withHidden = [
      ...categories,
      category({ id: "books", name: "書籍", sortOrder: 3, hidden: true }),
      category({ id: "pet", name: "ペット", sortOrder: 4, hidden: true }),
      category({ id: "old", name: "昔の費目", sortOrder: 5, hidden: true }),
    ];
    const report = monthlyReport(
      input({
        categories: withHidden,
        expenses: [expense("books", 800)],
        budgetHistory: [{ key: "pet", startMonth: "2026-10", amount: 3000 }],
      }),
    );
    const ids = report.rows.map((r) => r.category.id);
    expect(ids).toContain("books");
    expect(ids).toContain("pet");
    expect(ids).not.toContain("old");
  });
});

describe("月次レポートの収入", () => {
  it("収入は種類ごとに実績と予定額が並ぶ", () => {
    const report = monthlyReport(
      input({
        incomes: [income("salary", 150000), income("salary", 50000), income("from_wife", 30000)],
        incomePlanHistory: [{ key: "salary", startMonth: "2026-11", amount: 200000 }],
      }),
    );
    expect(report.incomes).toEqual([
      { kind: "salary", actual: 200000, planned: 200000 },
      { kind: "from_wife", actual: 30000, planned: 0 },
    ]);
  });

  it("収入の記録がない月は、収入の実績が0円", () => {
    const report = monthlyReport(
      input({ incomePlanHistory: [{ key: "salary", startMonth: "2026-11", amount: 200000 }] }),
    );
    expect(report.incomes).toEqual([
      { kind: "salary", actual: 0, planned: 200000 },
      { kind: "from_wife", actual: 0, planned: 0 },
    ]);
  });
});

describe("月次レポートのサマリー", () => {
  it("振替は支出合計に入らず、貯蓄率の分子になる", () => {
    const report = monthlyReport(
      input({
        expenses: [expense("food", 20000), expense("eatout", 10000), expense("save", 50000)],
        incomes: [income("salary", 200000)],
      }),
    );
    expect(report.summary).toEqual({
      expenseTotal: 30000,
      transferTotal: 50000,
      incomeTotal: 200000,
      unused: 120000,
      savingsRate: 0.25,
      needsReviewCount: 0,
    });
  });

  it("返金は支出合計からも差し引かれる", () => {
    const report = monthlyReport(
      input({ expenses: [expense("food", 20000), expense("food", -5000)] }),
    );
    expect(report.summary.expenseTotal).toBe(15000);
  });

  it("収入の記録がない月は貯蓄率を出さず、未使用はマイナスになりうる", () => {
    const report = monthlyReport(
      input({ expenses: [expense("food", 20000), expense("save", 10000)] }),
    );
    expect(report.summary).toMatchObject({ incomeTotal: 0, unused: -30000, savingsRate: null });
  });
});

describe("ホームの表示", () => {
  it("今月の支出合計と、残り予算（支出の費目の予算合計−支出合計）が出る。振替は含めない", () => {
    const report = monthlyReport(
      input({ expenses: [expense("food", 20000), expense("eatout", 4000), expense("save", 50000)] }),
    );
    expect(homeSummary(report)).toMatchObject({ expenseTotal: 24000, remainingBudget: 16000 });
  });

  it("予算オーバーの支出の費目が出る", () => {
    const report = monthlyReport(
      input({ expenses: [expense("eatout", 12000), expense("food", 1000)] }),
    );
    expect(homeSummary(report).overCategories.map((r) => r.category.id)).toEqual(["eatout"]);
  });

  it("振替の費目は予算より多く移しても、使いすぎではないのでホームには出さない", () => {
    const report = monthlyReport(input({ expenses: [expense("save", 60000)] }));
    expect(homeSummary(report).overCategories).toEqual([]);
  });

  it("その月の要確認の件数が出る", () => {
    const report = monthlyReport(
      input({ expenses: [{ ...expense("food", 1000), needsReview: true }, expense("food", 500)] }),
    );
    expect(homeSummary(report).needsReviewCount).toBe(1);
  });
});
