"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { monthOf } from "@/core/month";
import { bulkChangeCategory, validateExpense, validateIncome } from "@/core/records";
import type { ExpenseFormState, IncomeFormState } from "@/app/input/actions";
import { expenseInputOf, incomeInputOf } from "@/app/input/form-values";
import { loadCategories } from "@/lib/data/categories";
import {
  deleteExpense,
  loadExpense,
  updateExpense,
  updateExpensesCategory,
} from "@/lib/data/expenses";
import { deleteIncome, loadIncome, updateIncome } from "@/lib/data/incomes";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { formText } from "@/lib/form-data";
import { createSignedInClient } from "@/lib/supabase/server";
import { isRecordId } from "./record-id";

// 保存・削除のあとは、その記録の月の一覧へ戻る（日付を別の月に直したら、その月の一覧に移る）
const listOf = (date: string) => `/list?month=${monthOf(date)}`;

export async function updateExpenseAction(
  id: string,
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const supabase = await createSignedInClient();
  const [original, categories, paymentMethods] = await Promise.all([
    loadExpense(supabase, id),
    loadCategories(supabase),
    loadPaymentMethods(supabase),
  ]);
  if (!original) throw new Error("記録が見つかりません");

  const values = expenseInputOf(formData);
  // 元の費目は保存されている記録から決める（画面から送られた値は信じない）
  const result = validateExpense(values, categories, paymentMethods, {
    originalCategoryId: original.categoryId,
  });
  if (!result.ok) return { errors: result.errors, values };

  await updateExpense(supabase, id, result.value);
  redirect(listOf(result.value.date));
}

export async function deleteExpenseAction(id: string) {
  const supabase = await createSignedInClient();
  const original = await loadExpense(supabase, id);
  if (!original) throw new Error("記録が見つかりません");
  await deleteExpense(supabase, id);
  redirect(listOf(original.date));
}

export async function updateIncomeAction(
  id: string,
  _prev: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const supabase = await createSignedInClient();
  if (!(await loadIncome(supabase, id))) throw new Error("記録が見つかりません");
  const values = incomeInputOf(formData);
  const result = validateIncome(values);
  if (!result.ok) return { errors: result.errors, values };

  await updateIncome(supabase, id, result.value);
  redirect(listOf(result.value.date));
}

export async function deleteIncomeAction(id: string) {
  const supabase = await createSignedInClient();
  const original = await loadIncome(supabase, id);
  if (!original) throw new Error("記録が見つかりません");
  await deleteIncome(supabase, id);
  redirect(listOf(original.date));
}

/** まとめて費目を変えるフォームに返す結果。 */
export type BulkChangeState = { error?: string; savedMessage?: string };

export async function bulkChangeCategoryAction(
  _prev: BulkChangeState,
  formData: FormData,
): Promise<BulkChangeState> {
  const supabase = await createSignedInClient();
  const expenseIds = formData
    .getAll("expenseIds")
    .filter((v): v is string => typeof v === "string" && isRecordId(v));
  const result = bulkChangeCategory(
    expenseIds,
    formText(formData, "categoryId"),
    await loadCategories(supabase),
  );
  if (!result.ok) return { error: result.errors.expenseIds ?? result.errors.categoryId };

  await updateExpensesCategory(supabase, result.value.expenseIds, result.value.change);
  refresh();
  return { savedMessage: `${result.value.expenseIds.length}件の費目を変えました` };
}
