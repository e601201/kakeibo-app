import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanEntry } from "@/core/budgets";
import type { IncomeKind } from "@/core/records";

// 予算と収入の予定のテーブル（supabase/migrations/20261031000000_budgets.sql）の読み書き。
// 保存は、同じキー・同じ適用開始月なら上書きする（upsert）。同じ月に複数の値を持たない。

/** 予算の履歴。キーは費目の id。 */
export async function loadBudgetHistory(supabase: SupabaseClient): Promise<PlanEntry[]> {
  const { data, error } = await supabase.from("budgets").select("category_id, start_month, amount");
  if (error) throw error;
  return (data as { category_id: string; start_month: string; amount: number }[]).map((row) => ({
    key: row.category_id,
    startMonth: row.start_month,
    amount: row.amount,
  }));
}

/** 収入の予定の履歴。キーは収入の種類。 */
export async function loadIncomePlanHistory(
  supabase: SupabaseClient,
): Promise<PlanEntry<IncomeKind>[]> {
  const { data, error } = await supabase.from("income_plans").select("kind, start_month, amount");
  if (error) throw error;
  return (data as { kind: IncomeKind; start_month: string; amount: number }[]).map((row) => ({
    key: row.kind,
    startMonth: row.start_month,
    amount: row.amount,
  }));
}

export async function saveBudgetChanges(supabase: SupabaseClient, changes: PlanEntry[]) {
  if (changes.length === 0) return;
  const { error } = await supabase.from("budgets").upsert(
    changes.map((c) => ({ category_id: c.key, start_month: c.startMonth, amount: c.amount })),
    { onConflict: "owner_id,category_id,start_month" },
  );
  if (error) throw error;
}

export async function saveIncomePlanChanges(
  supabase: SupabaseClient,
  changes: PlanEntry<IncomeKind>[],
) {
  if (changes.length === 0) return;
  const { error } = await supabase.from("income_plans").upsert(
    changes.map((c) => ({ kind: c.key, start_month: c.startMonth, amount: c.amount })),
    { onConflict: "owner_id,kind,start_month" },
  );
  if (error) throw error;
}
