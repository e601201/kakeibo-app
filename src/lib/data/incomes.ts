import type { SupabaseClient } from "@supabase/supabase-js";
import { datesOfMonth } from "@/core/month";
import type { IncomeKind, IncomeRecord, NewIncome } from "@/core/records";
import { selectAllPages } from "./pages";

// 収入のテーブル（supabase/migrations/20261030010000_incomes.sql）の読み書き。

const COLUMNS = "id, date, kind, amount, memo, created_at";

type IncomeRow = {
  id: string;
  date: string;
  kind: IncomeKind;
  amount: number;
  memo: string;
  created_at: string;
};

function fromRow(row: IncomeRow): IncomeRecord {
  return {
    id: row.id,
    date: row.date,
    kind: row.kind,
    amount: row.amount,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

function toRow(income: NewIncome) {
  return { date: income.date, kind: income.kind, amount: income.amount, memo: income.memo };
}

export async function insertIncome(supabase: SupabaseClient, income: NewIncome) {
  const { error } = await supabase.from("incomes").insert(toRow(income));
  if (error) throw error;
}

/** その月（入金日の年月）の収入。 */
export async function loadIncomesOfMonth(
  supabase: SupabaseClient,
  month: string,
): Promise<IncomeRecord[]> {
  const { from, before } = datesOfMonth(month);
  const { data, error } = await supabase
    .from("incomes")
    .select(COLUMNS)
    .gte("date", from)
    .lt("date", before);
  if (error) throw error;
  return (data as IncomeRow[]).map(fromRow);
}

/** 1件の収入。見つからなければ undefined。 */
export async function loadIncome(
  supabase: SupabaseClient,
  id: string,
): Promise<IncomeRecord | undefined> {
  const { data, error } = await supabase.from("incomes").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as IncomeRow) : undefined;
}

export async function updateIncome(supabase: SupabaseClient, id: string, income: NewIncome) {
  const { error } = await supabase.from("incomes").update(toRow(income)).eq("id", id);
  if (error) throw error;
}

export async function deleteIncome(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw error;
}

/** すべての収入（書き出し用）。 */
export async function loadAllIncomes(supabase: SupabaseClient): Promise<IncomeRecord[]> {
  const rows = await selectAllPages<IncomeRow>((from, to) =>
    supabase.from("incomes").select(COLUMNS).order("id").range(from, to),
  );
  return rows.map(fromRow);
}
