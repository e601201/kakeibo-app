import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewIncome } from "@/core/records";

// 収入のテーブル（supabase/migrations/20261030010000_incomes.sql）の読み書き。

export async function insertIncome(supabase: SupabaseClient, income: NewIncome) {
  const { error } = await supabase.from("incomes").insert({
    date: income.date,
    kind: income.kind,
    amount: income.amount,
    memo: income.memo,
  });
  if (error) throw error;
}
