import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/core/categories";
import type { NewExpense } from "@/core/records";
import type { ReportInput } from "@/core/report";
import { trendPeriod } from "@/core/trend";
import { loadBudgetHistory, loadIncomePlanHistory } from "./budgets";
import { loadCategories } from "./categories";
import { loadExpensesBetween, loadExpensesOfMonth } from "./expenses";
import { loadIncomesOfMonth } from "./incomes";

/** 月次レポートに渡すものを読む。記録はその月の分だけを読む。 */
export async function loadReportInput(
  supabase: SupabaseClient,
  month: string,
): Promise<ReportInput> {
  const [categories, expenses, incomes, budgetHistory, incomePlanHistory] = await Promise.all([
    loadCategories(supabase),
    loadExpensesOfMonth(supabase, month),
    loadIncomesOfMonth(supabase, month),
    loadBudgetHistory(supabase),
    loadIncomePlanHistory(supabase),
  ]);
  return { month, categories, expenses, incomes, budgetHistory, incomePlanHistory };
}

/** 年間推移に渡すもの。費目と、開始月から12か月分の支出・振替。 */
export async function loadTrendInput(
  supabase: SupabaseClient,
  startMonth: string,
): Promise<{
  categories: Category[];
  records: Pick<NewExpense, "date" | "categoryId" | "amount">[];
}> {
  const { from, before } = trendPeriod(startMonth);
  const [categories, records] = await Promise.all([
    loadCategories(supabase),
    loadExpensesBetween(supabase, from, before),
  ]);
  return { categories, records };
}
