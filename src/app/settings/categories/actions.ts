"use server";

import { refresh } from "next/cache";
import {
  type CategoryInput,
  DUPLICATE_NAME_ERROR,
  addCategory,
  editCategory,
  moveCategory,
} from "@/core/categories";
import {
  insertCategory,
  loadCategories,
  updateCategoryNameAndMemo,
  updateCategoryHidden,
  updateSortOrders,
} from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";

/**
 * フォームに返す結果。間違いがあれば欄ごとの理由と、入れ直さずに済むよう送った値を持つ
 * （React はアクションのあとにフォームを初期値へ戻すため）。
 */
export type FormState = {
  errors?: Partial<Record<"name" | "kind", string>>;
  values?: Partial<CategoryInput>;
  saved?: boolean;
};

// 本人かどうかは proxy が確かめ、データは Row Level Security が守る。ここではログインしていることだけ確かめる。
async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("ログインしていません");
  return supabase;
}

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function addCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await signedInClient();
  const values = {
    name: formText(formData, "name"),
    kind: formText(formData, "kind"),
    memo: formText(formData, "memo"),
  };
  const result = addCategory(values, await loadCategories(supabase));
  if (!result.ok) return { errors: result.errors, values };

  if (!(await insertCategory(supabase, result.value))) return duplicateName(values);
  refresh();
  return { saved: true };
}

export async function editCategoryAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await signedInClient();
  const values = { name: formText(formData, "name"), memo: formText(formData, "memo") };
  const result = editCategory(id, values, await loadCategories(supabase));
  if (!result.ok) return { errors: result.errors, values };

  if (!(await updateCategoryNameAndMemo(supabase, id, result.value))) return duplicateName(values);
  refresh();
  return { saved: true };
}

// 確かめてから保存するまでの間に、同じ名前の費目が先に保存されていたとき
function duplicateName(values: Partial<CategoryInput>): FormState {
  return { errors: { name: DUPLICATE_NAME_ERROR }, values };
}

export async function moveCategoryAction(id: string, direction: "up" | "down") {
  const supabase = await signedInClient();
  await updateSortOrders(supabase, moveCategory(await loadCategories(supabase), id, direction));
  refresh();
}

export async function setCategoryHiddenAction(id: string, hidden: boolean) {
  const supabase = await signedInClient();
  await updateCategoryHidden(supabase, id, hidden);
  refresh();
}
