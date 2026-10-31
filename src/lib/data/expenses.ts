import type { SupabaseClient } from "@supabase/supabase-js";
import { datesOfMonth } from "@/core/month";
import type { ExpenseRecord, NewExpense } from "@/core/records";

// 支出・振替のテーブル（supabase/migrations/20261030000000_expenses.sql）の読み書き。
// 登録元・取込元の明細IDは書かず、テーブルの初期値（手入力・明細IDなし）にする。

const COLUMNS =
  "id, date, category_id, description, amount, payment_method_id, memo, needs_review, created_at";

type ExpenseRow = {
  id: string;
  date: string;
  category_id: string;
  description: string;
  amount: number;
  payment_method_id: string | null;
  memo: string;
  needs_review: boolean;
  created_at: string;
};

function fromRow(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    date: row.date,
    categoryId: row.category_id,
    description: row.description,
    amount: row.amount,
    paymentMethodId: row.payment_method_id,
    memo: row.memo,
    needsReview: row.needs_review,
    createdAt: row.created_at,
  };
}

function toRow(expense: NewExpense) {
  return {
    date: expense.date,
    category_id: expense.categoryId,
    description: expense.description,
    amount: expense.amount,
    payment_method_id: expense.paymentMethodId,
    memo: expense.memo,
  };
}

export async function insertExpense(supabase: SupabaseClient, expense: NewExpense) {
  const { error } = await supabase.from("expenses").insert(toRow(expense));
  if (error) throw error;
}

/** その月（利用日の年月）の支出・振替。 */
export async function loadExpensesOfMonth(
  supabase: SupabaseClient,
  month: string,
): Promise<ExpenseRecord[]> {
  const { from, before } = datesOfMonth(month);
  const { data, error } = await supabase
    .from("expenses")
    .select(COLUMNS)
    .gte("date", from)
    .lt("date", before);
  if (error) throw error;
  return (data as ExpenseRow[]).map(fromRow);
}

/** 1件の支出・振替。見つからなければ undefined。 */
export async function loadExpense(
  supabase: SupabaseClient,
  id: string,
): Promise<ExpenseRecord | undefined> {
  const { data, error } = await supabase.from("expenses").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ExpenseRow) : undefined;
}

export async function updateExpense(supabase: SupabaseClient, id: string, expense: NewExpense) {
  const { error } = await supabase.from("expenses").update(toRow(expense)).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/** 選んだ支出・振替の費目をまとめて変え、要確認の印を外す。 */
export async function updateExpensesCategory(
  supabase: SupabaseClient,
  expenseIds: string[],
  change: { categoryId: string; needsReview: boolean },
) {
  const { error } = await supabase
    .from("expenses")
    .update({ category_id: change.categoryId, needs_review: change.needsReview })
    .in("id", expenseIds);
  if (error) throw error;
}

// Supabase の API は1回に1000行までしか返さないので、分けて読む
const PAGE_SIZE = 1000;

type ExpenseAmount = Pick<NewExpense, "date" | "categoryId" | "amount">;

/** 支出・振替の日付・費目・金額を、条件に合うものすべて読む。 */
async function loadExpenseAmounts(
  supabase: SupabaseClient,
  where: { categoryIds?: string[]; from?: string; before: string },
): Promise<ExpenseAmount[]> {
  const records: ExpenseAmount[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase.from("expenses").select("date, category_id, amount").lt("date", where.before);
    if (where.from) query = query.gte("date", where.from);
    if (where.categoryIds) query = query.in("category_id", where.categoryIds);
    const { data, error } = await query
      // 分けて読むときに抜けや重なりが出ないよう、並びを決める
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data as { date: string; category_id: string; amount: number }[]) {
      records.push({ date: row.date, categoryId: row.category_id, amount: row.amount });
    }
    if (data.length < PAGE_SIZE) return records;
  }
}

/** 指定した費目の支出・振替のうち、日付が before より前のもの（日付・費目・金額だけ）。 */
export async function loadExpensesBefore(
  supabase: SupabaseClient,
  categoryIds: string[],
  before: string,
): Promise<ExpenseAmount[]> {
  if (categoryIds.length === 0) return [];
  return loadExpenseAmounts(supabase, { categoryIds, before });
}

/** 日付が from 以上 before より前の支出・振替（日付・費目・金額だけ）。 */
export async function loadExpensesBetween(
  supabase: SupabaseClient,
  from: string,
  before: string,
): Promise<ExpenseAmount[]> {
  return loadExpenseAmounts(supabase, { from, before });
}
