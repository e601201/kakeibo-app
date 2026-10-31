import type { SupabaseClient } from "@supabase/supabase-js";
import { type EmergencyFund, transferCategoryIds } from "@/core/emergency-fund";
import type { Category } from "@/core/categories";
import { datesOfMonth } from "@/core/month";
import type { NewExpense } from "@/core/records";
import { loadExpensesBefore } from "./expenses";

// 生活防衛資金のテーブル（supabase/migrations/20261031010000_emergency_fund.sql）の読み書き。

/** 生活防衛資金の設定。まだ登録していなければ undefined。 */
export async function loadEmergencyFund(
  supabase: SupabaseClient,
): Promise<EmergencyFund | undefined> {
  const { data, error } = await supabase
    .from("emergency_funds")
    .select("starting_savings, target")
    .maybeSingle();
  if (error) throw error;
  return data ? { startingSavings: data.starting_savings, target: data.target } : undefined;
}

/** 生活防衛資金の設定を保存する（1件だけなので、あれば上書きする）。 */
export async function saveEmergencyFund(supabase: SupabaseClient, fund: EmergencyFund) {
  const { error } = await supabase
    .from("emergency_funds")
    .upsert(
      { starting_savings: fund.startingSavings, target: fund.target },
      { onConflict: "owner_id" },
    );
  if (error) throw error;
}

/**
 * その月の生活防衛資金を求めるのに要るもの。設定と、その月末までの振替の費目の記録。
 * まだ登録していなければ undefined。
 */
export async function loadEmergencyFundInput(
  supabase: SupabaseClient,
  categories: readonly Category[],
  month: string,
): Promise<
  | { fund: EmergencyFund; records: Pick<NewExpense, "date" | "categoryId" | "amount">[] }
  | undefined
> {
  const fund = await loadEmergencyFund(supabase);
  if (!fund) return undefined;
  const records = await loadExpensesBefore(
    supabase,
    transferCategoryIds(categories),
    datesOfMonth(month).before,
  );
  return { fund, records };
}
