import type { SupabaseClient } from "@supabase/supabase-js";
import { type PaymentMethod, initialPaymentMethods } from "@/core/payment-methods";

// 支払方法のテーブル（supabase/migrations/20261030000000_expenses.sql）の読み書き。

type PaymentMethodRow = { id: string; name: string; detail: string; sort_order: number };

/**
 * 本人の支払方法を表示順に読む。
 * 一つもなければ初めて使うときなので、初期の支払方法を入れてから読む。
 */
export async function loadPaymentMethods(supabase: SupabaseClient): Promise<PaymentMethod[]> {
  const methods = await selectPaymentMethods(supabase);
  if (methods.length > 0) return methods;

  // 同時に開いて二重に入れても、(owner_id, name, detail) の一意制約で一つになる
  const { error } = await supabase.from("payment_methods").upsert(
    initialPaymentMethods().map((m) => ({ name: m.name, detail: m.detail, sort_order: m.sortOrder })),
    { onConflict: "owner_id,name,detail", ignoreDuplicates: true },
  );
  if (error) throw error;
  return selectPaymentMethods(supabase);
}

async function selectPaymentMethods(supabase: SupabaseClient): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, name, detail, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data as PaymentMethodRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    detail: row.detail,
    sortOrder: row.sort_order,
  }));
}
