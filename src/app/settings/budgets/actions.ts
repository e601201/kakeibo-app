"use server";

import { refresh } from "next/cache";
import { changesForMonth } from "@/core/budgets";
import { isMonth } from "@/core/month";
import { INCOME_KINDS } from "@/core/records";
import {
  loadBudgetHistory,
  loadIncomePlanHistory,
  saveBudgetChanges,
  saveIncomePlanChanges,
} from "@/lib/data/budgets";
import { loadCategories } from "@/lib/data/categories";
import { formText } from "@/lib/form-data";
import { createSignedInClient } from "@/lib/supabase/server";
import { budgetField, incomePlanField } from "./fields";

/**
 * フォームに返す結果。間違いがあれば欄ごとの理由と、入れ直さずに済むよう送った値を持つ
 * （React はアクションのあとにフォームを初期値へ戻すため）。
 */
export type BudgetFormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  savedMessage?: string;
};

export async function saveBudgetsAction(
  month: string,
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  if (!isMonth(month)) throw new Error(`月 ${month} が正しくありません`);
  const supabase = await createSignedInClient();
  const [categories, budgetHistory, incomePlanHistory] = await Promise.all([
    loadCategories(supabase),
    loadBudgetHistory(supabase),
    loadIncomePlanHistory(supabase),
  ]);

  const budgetInputs = Object.fromEntries(
    categories.map((c) => [c.id, formText(formData, budgetField(c.id))]),
  );
  const incomeInputs = Object.fromEntries(
    INCOME_KINDS.map((kind) => [kind, formText(formData, incomePlanField(kind))]),
  ) as Record<(typeof INCOME_KINDS)[number], string>;
  const budgetChanges = changesForMonth(budgetHistory, month, budgetInputs);
  const incomeChanges = changesForMonth(incomePlanHistory, month, incomeInputs);

  if (!budgetChanges.ok || !incomeChanges.ok) {
    return {
      errors: {
        ...(budgetChanges.ok ? {} : fieldErrors(budgetChanges.errors, budgetField)),
        ...(incomeChanges.ok ? {} : fieldErrors(incomeChanges.errors, incomePlanField)),
      },
      values: Object.fromEntries(
        [...formData.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
      ),
    };
  }

  await Promise.all([
    saveBudgetChanges(supabase, budgetChanges.value),
    saveIncomePlanChanges(supabase, incomeChanges.value),
  ]);
  refresh();
  const count = budgetChanges.value.length + incomeChanges.value.length;
  return {
    savedMessage:
      count === 0 ? "変わった額はありませんでした" : `${count}件を保存しました（この月から適用）`,
  };
}

// 家計簿コアが返したキーごとの理由を、フォームの欄の名前ごとの理由にする
function fieldErrors<Key extends string>(
  errors: Partial<Record<Key, string>>,
  field: (key: Key) => string,
): Record<string, string> {
  return Object.fromEntries(
    (Object.entries(errors) as [Key, string | undefined][]).flatMap(([key, message]) =>
      message ? [[field(key), message]] : [],
    ),
  );
}
