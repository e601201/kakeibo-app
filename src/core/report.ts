import { sum } from "./amount";
import { type PlanEntry, planForMonth } from "./budgets";
import { type Category, sortCategories } from "./categories";
import { type ExpenseRecord, INCOME_KINDS, type IncomeKind, type IncomeRecord } from "./records";

/** 月次レポートに渡すもの。記録はその月（利用日・入金日の年月）の分だけ。 */
export type ReportInput = {
  month: string;
  categories: readonly Category[];
  expenses: readonly ExpenseRecord[];
  incomes: readonly IncomeRecord[];
  budgetHistory: readonly PlanEntry[];
  incomePlanHistory: readonly PlanEntry<IncomeKind>[];
};

/** 費目ごとの行。 */
export type CategoryRow = {
  category: Category;
  /** その月に適用されていた予算 */
  budget: number;
  /** 実績。返金（マイナスの支出）を差し引いた合計 */
  actual: number;
  /** 残り（予算−実績） */
  remaining: number;
  /** 消化率（実績÷予算）。予算0の費目は出さない（null） */
  usageRate: number | null;
  /** 予算オーバーか */
  over: boolean;
  /** 予算を超えた額。超えていなければ0 */
  overBy: number;
};

/** 収入の種類ごとの実績と予定額。 */
export type IncomeRow = { kind: IncomeKind; actual: number; planned: number };

export type ReportSummary = {
  /** 支出の費目の実績の合計（返金を差し引く）。振替は含めない */
  expenseTotal: number;
  /** 振替の費目の実績の合計 */
  transferTotal: number;
  /** 収入の実績の合計 */
  incomeTotal: number;
  /** 未使用（収入の実績−支出合計−振替合計） */
  unused: number;
  /** 貯蓄率（振替合計÷収入の実績）。収入の実績が0以下なら出さない（null） */
  savingsRate: number | null;
  /** 要確認の支出・振替の件数 */
  needsReviewCount: number;
};

export type MonthlyReport = { rows: CategoryRow[]; incomes: IncomeRow[]; summary: ReportSummary };

/** 月次レポート。その月の予算を当てはめ、費目ごとの実績と比べる。 */
export function monthlyReport(input: ReportInput): MonthlyReport {
  const budgets = planForMonth(
    input.budgetHistory,
    input.month,
    input.categories.map((c) => c.id),
  );
  const rows = sortCategories(input.categories).flatMap((category): CategoryRow[] => {
    const budget = budgets[category.id];
    const records = input.expenses.filter((e) => e.categoryId === category.id);
    // 非表示の費目は、その月に実績か予算があるときだけ行を出す
    if (category.hidden && records.length === 0 && budget === 0) return [];

    const actual = sum(records.map((e) => e.amount));
    return [
      {
        category,
        budget,
        actual,
        remaining: budget - actual,
        usageRate: budget > 0 ? actual / budget : null,
        // 予算0の費目は、実績が0より大きければ予算オーバー
        over: actual > budget,
        overBy: Math.max(0, actual - budget),
      },
    ];
  });

  const planned = planForMonth(input.incomePlanHistory, input.month, INCOME_KINDS);
  const incomes = INCOME_KINDS.map((kind) => ({
    kind,
    actual: sum(input.incomes.filter((i) => i.kind === kind).map((i) => i.amount)),
    planned: planned[kind],
  }));

  const totalOf = (kind: Category["kind"]) =>
    sum(rows.filter((r) => r.category.kind === kind).map((r) => r.actual));
  const expenseTotal = totalOf("expense");
  const transferTotal = totalOf("transfer");
  const incomeTotal = sum(incomes.map((i) => i.actual));
  return {
    rows,
    incomes,
    summary: {
      expenseTotal,
      transferTotal,
      incomeTotal,
      unused: incomeTotal - expenseTotal - transferTotal,
      savingsRate: incomeTotal > 0 ? transferTotal / incomeTotal : null,
      needsReviewCount: input.expenses.filter((e) => e.needsReview).length,
    },
  };
}

/**
 * ホームに出す今月の状況。月次レポートから作る。
 * 残り予算は支出の費目の予算合計−支出合計。予算オーバーは支出の費目だけを出す
 * （振替の費目を予算より多く移しても、使いすぎではないため）。
 */
export function homeSummary(report: MonthlyReport): {
  expenseTotal: number;
  remainingBudget: number;
  overCategories: CategoryRow[];
  needsReviewCount: number;
} {
  const expenseRows = report.rows.filter((r) => r.category.kind === "expense");
  const { expenseTotal, needsReviewCount } = report.summary;
  return {
    expenseTotal,
    remainingBudget: sum(expenseRows.map((r) => r.budget)) - expenseTotal,
    overCategories: expenseRows.filter((r) => r.over),
    needsReviewCount,
  };
}
