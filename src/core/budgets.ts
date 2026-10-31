import { parseYen, sum } from "./amount";
import type { Validated } from "./validated";

// 予算と収入の予定は、どちらも「適用開始月からの月の額」の履歴として持つ。
// 予算のキーは費目、収入の予定のキーは収入の種類。

/** 予算（または収入の予定）の履歴の1件。適用開始月（YYYY-MM）から、次の変更までの月に使う。 */
export type PlanEntry<Key extends string = string> = {
  key: Key;
  startMonth: string;
  amount: number;
};

/**
 * その月に使う予算（または収入の予定）。その月以前で最も新しい適用開始月の額を使い、
 * 適用開始月がまだ来ていないキーは0円とする。
 */
export function planForMonth<Key extends string>(
  history: readonly PlanEntry<Key>[],
  month: string,
  keys: readonly Key[],
): Record<Key, number> {
  const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>;
  const latestStart = new Map<Key, string>();
  for (const entry of history) {
    if (entry.startMonth > month || !Object.hasOwn(result, entry.key)) continue;
    const seen = latestStart.get(entry.key);
    if (seen !== undefined && seen >= entry.startMonth) continue;
    latestStart.set(entry.key, entry.startMonth);
    result[entry.key] = entry.amount;
  }
  return result;
}

/**
 * 予算の差額。収入の予定額の合計から、予算合計（支出と振替の費目の両方）を引いた額。
 * 0になるように予算を配分する。マイナスなら予算を配りすぎている。
 */
export function planDifference(
  budgets: Readonly<Record<string, number>>,
  incomePlans: Readonly<Record<string, number>>,
): { budgetTotal: number; incomeTotal: number; difference: number } {
  const budgetTotal = sum(Object.values(budgets));
  const incomeTotal = sum(Object.values(incomePlans));
  return { budgetTotal, incomeTotal, difference: incomeTotal - budgetTotal };
}

/**
 * 予算（または収入の予定）の変更。設定画面で入れた額を確かめ、その月に使う額から変わったキーだけを、
 * その月を適用開始月とする履歴にする。空の欄は0円とする。
 * 同じキー・同じ適用開始月の履歴がすでにあれば、保存のときに上書きする（同じ月に複数の値を持たない）。
 * 上書きはテーブルの一意制約と upsert で守る（src/lib/data/budgets.ts）。
 */
export function changesForMonth<Key extends string>(
  history: readonly PlanEntry<Key>[],
  month: string,
  inputs: Readonly<Record<Key, string>>,
): Validated<PlanEntry<Key>[], Key> {
  const keys = Object.keys(inputs) as Key[];
  const current = planForMonth(history, month, keys);
  const errors: Partial<Record<Key, string>> = {};
  const changes: PlanEntry<Key>[] = [];

  for (const key of keys) {
    const text = inputs[key];
    const parsed = text.trim() === "" ? { value: 0 } : parseYen(text);
    if ("error" in parsed) errors[key] = parsed.error;
    else if (parsed.value < 0) errors[key] = "0円以上で入れてください";
    else if (parsed.value !== current[key]) {
      changes.push({ key, startMonth: month, amount: parsed.value });
    }
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: changes };
}
