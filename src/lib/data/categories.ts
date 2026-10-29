import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  type Category,
  type CategoryKind,
  type NewCategory,
  initialCategories,
  sortCategories,
} from "@/core/categories";

// 費目のテーブル（supabase/migrations/20261029000000_categories.sql）の読み書き。
// 決まりは家計簿コアにあり、ここは保存と読み出しの中継ぎだけをする。

const COLUMNS = "id, name, kind, sort_order, memo, hidden";

type CategoryRow = {
  id: string;
  name: string;
  kind: CategoryKind;
  sort_order: number;
  memo: string;
  hidden: boolean;
};

function fromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    sortOrder: row.sort_order,
    memo: row.memo,
    hidden: row.hidden,
  };
}

function toRow(category: NewCategory) {
  return {
    name: category.name,
    kind: category.kind,
    sort_order: category.sortOrder,
    memo: category.memo,
    hidden: category.hidden,
  };
}

/**
 * 本人の費目を表示順に読む（非表示の費目も含む）。
 * 費目が一つもなければ初めて使うときなので、初期の費目を入れてから読む。
 */
export async function loadCategories(supabase: SupabaseClient): Promise<Category[]> {
  const categories = await selectCategories(supabase);
  if (categories.length > 0) return categories;

  // 同時に開いて二重に入れても、同じ名前の費目は (owner_id, name) の一意制約で一つになる
  const { error } = await supabase
    .from("categories")
    .upsert(initialCategories().map(toRow), { onConflict: "owner_id,name", ignoreDuplicates: true });
  if (error) throw error;
  return selectCategories(supabase);
}

async function selectCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select(COLUMNS);
  if (error) throw error;
  return sortCategories((data as CategoryRow[]).map(fromRow));
}

/** 同じ名前の費目が先に保存されていたら false を返す（確かめてから保存するまでの間に重なったとき）。 */
export async function insertCategory(
  supabase: SupabaseClient,
  category: NewCategory,
): Promise<boolean> {
  const { error } = await supabase.from("categories").insert(toRow(category));
  return savedUnlessDuplicateName(error);
}

/**
 * 名前とメモを保存する。種類は作った後には変えないので、ここでは書かない。
 * 同じ名前の費目が先に保存されていたら false を返す。
 */
export async function updateCategoryNameAndMemo(
  supabase: SupabaseClient,
  id: string,
  values: { name: string; memo: string },
): Promise<boolean> {
  const { error } = await supabase.from("categories").update(values).eq("id", id);
  return savedUnlessDuplicateName(error);
}

// 23505 は一意制約 (owner_id, name) の違反
function savedUnlessDuplicateName(error: PostgrestError | null): boolean {
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

export async function updateSortOrders(
  supabase: SupabaseClient,
  changes: { id: string; sortOrder: number }[],
) {
  const results = await Promise.all(
    changes.map(({ id, sortOrder }) =>
      supabase.from("categories").update({ sort_order: sortOrder }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function updateCategoryHidden(supabase: SupabaseClient, id: string, hidden: boolean) {
  const { error } = await supabase.from("categories").update({ hidden }).eq("id", id);
  if (error) throw error;
}
