"use server";

import { CATEGORY_KIND_LABELS } from "@/core/categories";
import { type ExpenseInput, expenseKind, validateExpense } from "@/core/records";
import { loadCategories } from "@/lib/data/categories";
import { insertExpense } from "@/lib/data/expenses";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { formText } from "@/lib/form-data";
import { createSignedInClient } from "@/lib/supabase/server";

/**
 * フォームに返す結果。間違いがあれば欄ごとの理由と、入れ直さずに済むよう送った値を持つ
 * （React はアクションのあとにフォームを初期値へ戻すため）。
 * 保存できたら、続けて入力できるよう日付だけを残す。
 */
export type ExpenseFormState = {
  errors?: Partial<Record<keyof ExpenseInput, string>>;
  values?: Partial<ExpenseInput>;
  savedMessage?: string;
};

export async function addExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const supabase = await createSignedInClient();
  const values: ExpenseInput = {
    date: formText(formData, "date"),
    categoryId: formText(formData, "categoryId"),
    amount: formText(formData, "amount"),
    description: formText(formData, "description"),
    paymentMethodId: formText(formData, "paymentMethodId"),
    memo: formText(formData, "memo"),
  };
  const [categories, paymentMethods] = await Promise.all([
    loadCategories(supabase),
    loadPaymentMethods(supabase),
  ]);
  const result = validateExpense(values, categories, paymentMethods);
  if (!result.ok) return { errors: result.errors, values };

  await insertExpense(supabase, result.value);
  const expense = result.value;
  const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? "";
  const kind = CATEGORY_KIND_LABELS[expenseKind(expense, categories)];
  return {
    values: { date: expense.date },
    savedMessage: `${categoryName} ${expense.amount.toLocaleString("ja-JP")}円を${kind}として記録しました`,
  };
}
