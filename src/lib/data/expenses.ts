import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewExpense } from "@/core/records";

// 支出・振替のテーブル（supabase/migrations/20261030000000_expenses.sql）の読み書き。
// 要確認・登録元・取込元の明細IDは書かず、テーブルの初期値（要確認なし・手入力・明細IDなし）にする。

export async function insertExpense(supabase: SupabaseClient, expense: NewExpense) {
  const { error } = await supabase.from("expenses").insert({
    date: expense.date,
    category_id: expense.categoryId,
    description: expense.description,
    amount: expense.amount,
    payment_method_id: expense.paymentMethodId,
    memo: expense.memo,
  });
  if (error) throw error;
}
