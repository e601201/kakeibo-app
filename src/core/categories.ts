import type { Validated } from "./validated";

/** 費目の種類。記録が支出か振替かは、選んだ費目の種類で決まる。 */
export type CategoryKind = "expense" | "transfer";

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  expense: "支出",
  transfer: "振替",
};

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  sortOrder: number;
  memo: string;
  hidden: boolean;
};

/** 保存する前の費目（id はデータベースが付ける）。 */
export type NewCategory = Omit<Category, "id">;

const INITIAL_CATEGORIES: readonly { name: string; kind: CategoryKind }[] = [
  { name: "家賃", kind: "expense" },
  { name: "食費（食材）", kind: "expense" },
  { name: "外食", kind: "expense" },
  { name: "水道光熱費", kind: "expense" },
  { name: "通信費", kind: "expense" },
  { name: "日用品", kind: "expense" },
  { name: "交通費", kind: "expense" },
  { name: "保険", kind: "expense" },
  { name: "医療費", kind: "expense" },
  { name: "被服", kind: "expense" },
  { name: "美容", kind: "expense" },
  { name: "交際費", kind: "expense" },
  { name: "趣味・娯楽", kind: "expense" },
  { name: "妻へのお小遣い", kind: "expense" },
  { name: "特別費", kind: "expense" },
  { name: "貯蓄・投資", kind: "transfer" },
];

/** 初めて使うときに入れておく費目。 */
export function initialCategories(): NewCategory[] {
  return INITIAL_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i, memo: "", hidden: false }));
}

/** 画面から受け取る、費目を追加する入力。 */
export type CategoryInput = { name: string; kind: string; memo: string };

/** 費目を追加する。入力を確かめ、いちばん下に表示中の費目として置く。 */
export function addCategory(
  input: CategoryInput,
  existing: readonly Category[],
): Validated<NewCategory, "name" | "kind"> {
  const errors: Partial<Record<"name" | "kind", string>> = {};
  const name = input.name.trim();
  const nameError = nameErrorOf(name, existing);
  if (nameError) errors.name = nameError;
  if (!isCategoryKind(input.kind)) errors.kind = "支出か振替を選んでください";
  if (nameError || !isCategoryKind(input.kind)) return { ok: false, errors };

  const sortOrder = Math.max(-1, ...existing.map((c) => c.sortOrder)) + 1;
  return {
    ok: true,
    value: { name, kind: input.kind, sortOrder, memo: input.memo.trim(), hidden: false },
  };
}

/** 費目の名前とメモを変える。種類は作った後には変えられないので、ここでは受け取らない。 */
export function editCategory(
  id: string,
  input: { name: string; memo: string },
  existing: readonly Category[],
): Validated<{ name: string; memo: string }, "name"> {
  const name = input.name.trim();
  const nameError = nameErrorOf(
    name,
    existing.filter((c) => c.id !== id),
  );
  if (nameError) return { ok: false, errors: { name: nameError } };
  return { ok: true, value: { name, memo: input.memo.trim() } };
}

/** 費目を表示順に並べる。非表示の費目もその場所に並ぶ。 */
export function sortCategories(categories: readonly Category[]): Category[] {
  // 表示順が重なっていても毎回同じ並びになるよう、id で決める
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1));
}

/** 入力画面で選べる費目。非表示の費目は出さず、表示順に並べる。 */
export function categoriesForInput(categories: readonly Category[]): Category[] {
  return sortCategories(categories.filter((c) => !c.hidden));
}

/**
 * 費目を一つ上か下に動かす。表示順を振り直し、変わった費目の新しい表示順だけを返す。
 * 端の費目をその向きに動かそうとしたときは何も変えない。
 */
export function moveCategory(
  categories: readonly Category[],
  id: string,
  direction: "up" | "down",
): { id: string; sortOrder: number }[] {
  const ordered = sortCategories(categories);
  const from = ordered.findIndex((c) => c.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ordered.length) return [];

  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  const newOrder = new Map(ordered.map((c, i) => [c.id, i]));
  return categories
    .map((c) => ({ id: c.id, sortOrder: newOrder.get(c.id)! }))
    .filter((c, i) => c.sortOrder !== categories[i].sortOrder);
}

function isCategoryKind(kind: string): kind is CategoryKind {
  return kind === "expense" || kind === "transfer";
}

/** 同じ名前の費目がすでにあるときの理由。 */
export const DUPLICATE_NAME_ERROR = "同じ名前の費目があります";

// 非表示の費目とも名前を重ねない（入力やレポートで見分けがつかなくなるため）。
function nameErrorOf(name: string, others: readonly Category[]): string | undefined {
  if (name === "") return "名前を入れてください";
  if (others.some((c) => c.name === name)) return DUPLICATE_NAME_ERROR;
  return undefined;
}
