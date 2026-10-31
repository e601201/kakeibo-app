"use server";

import { yen } from "@/app/_components/format";
import { CATEGORY_KIND_LABELS } from "@/core/categories";
import {
  type ExpenseInput,
  INCOME_KIND_LABELS,
  type IncomeInput,
  expenseKind,
  validateExpense,
  validateIncome,
} from "@/core/records";
import { loadCategories } from "@/lib/data/categories";
import { insertExpense } from "@/lib/data/expenses";
import { insertIncome } from "@/lib/data/incomes";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { createSignedInClient } from "@/lib/supabase/server";
import { expenseInputOf, incomeInputOf } from "./form-values";

/**
 * フォームに返す結果。間違いがあれば欄ごとの理由と、入れ直さずに済むよう送った値を持つ
 * （React はアクションのあとにフォームを初期値へ戻すため）。
 * 入力画面では、保存できたら続けて入力できるよう日付だけを残す。
 */
type RecordFormState<Input> = {
  errors?: Partial<Record<keyof Input, string>>;
  values?: Partial<Input>;
  savedMessage?: string;
};

export type ExpenseFormState = RecordFormState<ExpenseInput>;
export type IncomeFormState = RecordFormState<IncomeInput>;

export async function addExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const supabase = await createSignedInClient();
  const values = expenseInputOf(formData);
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
    savedMessage: `${categoryName} ${yen(expense.amount)}を${kind}として記録しました`,
  };
}

export async function addIncomeAction(
  _prev: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const supabase = await createSignedInClient();
  const values = incomeInputOf(formData);
  const result = validateIncome(values);
  if (!result.ok) return { errors: result.errors, values };

  await insertIncome(supabase, result.value);
  const income = result.value;
  return {
    values: { date: income.date },
    savedMessage: `${INCOME_KIND_LABELS[income.kind]} ${yen(income.amount)}を収入として記録しました`,
  };
}
