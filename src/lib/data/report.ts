import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportInput } from "@/core/report";
import { loadBudgetHistory, loadIncomePlanHistory } from "./budgets";
import { loadCategories } from "./categories";
import { loadExpensesOfMonth } from "./expenses";
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
