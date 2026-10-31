import { plansCsv } from "@/core/csv";
import { todayInJapan } from "@/core/month";
import { loadBudgetHistory, loadIncomePlanHistory } from "@/lib/data/budgets";
import { loadCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "../csv-response";

/** 予算・収入の予定の履歴のCSV。本人かどうかは proxy が確かめ、データは Row Level Security が守る。 */
export async function GET() {
  const supabase = await createClient();
  const [budgetHistory, incomePlanHistory, categories] = await Promise.all([
    loadBudgetHistory(supabase),
    loadIncomePlanHistory(supabase),
    loadCategories(supabase),
  ]);
  return csvResponse(
    plansCsv({ budgetHistory, incomePlanHistory, categories }),
    `kakeibo-budgets-${todayInJapan(new Date())}.csv`,
  );
}
