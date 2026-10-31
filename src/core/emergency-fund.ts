import { type ParsedYen, parseYen, sum } from "./amount";
import type { Category } from "./categories";
import { datesOfMonth } from "./month";
import type { NewExpense } from "./records";
import type { Validated } from "./validated";

/** 生活防衛資金の設定（1件だけ）。 */
export type EmergencyFund = {
  /** 開始時の貯蓄額 */
  startingSavings: number;
  /** 目標額 */
  target: number;
};

export type EmergencyFundStatus = {
  /** 現在額（開始時の貯蓄額＋その月末までの振替の累計） */
  current: number;
  /** 達成率（現在額÷目標額）。0%から100%の間に収める */
  achievementRate: number;
  /** 目標までの残り。0未満にしない */
  remaining: number;
};

/** 振替の費目（非表示も含む）。生活防衛資金の累計に数える記録を読むときに使う。 */
export function transferCategoryIds(categories: readonly Category[]): string[] {
  return categories.filter((c) => c.kind === "transfer").map((c) => c.id);
}

/**
 * その月の月末時点の生活防衛資金。振替の累計は、アプリで記録したすべての振替
 * （非表示の振替の費目も含む）のうち、その月末までのものを数える。
 */
export function emergencyFundStatus(
  fund: EmergencyFund,
  records: readonly Pick<NewExpense, "categoryId" | "date" | "amount">[],
  categories: readonly Category[],
  month: string,
): EmergencyFundStatus {
  const transferIds = new Set(transferCategoryIds(categories));
  const { before } = datesOfMonth(month);
  const transferred = sum(
    records.filter((r) => transferIds.has(r.categoryId) && r.date < before).map((r) => r.amount),
  );
  const current = fund.startingSavings + transferred;
  return {
    current,
    achievementRate: Math.min(1, Math.max(0, current / fund.target)),
    remaining: Math.max(0, fund.target - current),
  };
}

/** 設定画面で入れた開始時の貯蓄額と目標額を確かめる。 */
export function validateEmergencyFund(input: {
  startingSavings: string;
  target: string;
}): Validated<EmergencyFund, "startingSavings" | "target"> {
  const startingSavings = atLeast(parseYen(input.startingSavings), 0);
  const target = atLeast(parseYen(input.target), 1);
  if ("error" in startingSavings || "error" in target) {
    const errors: Partial<Record<"startingSavings" | "target", string>> = {};
    if ("error" in startingSavings) errors.startingSavings = startingSavings.error;
    if ("error" in target) errors.target = target.error;
    return { ok: false, errors };
  }
  return { ok: true, value: { startingSavings: startingSavings.value, target: target.value } };
}

function atLeast(parsed: ParsedYen, min: number): ParsedYen {
  if ("value" in parsed && parsed.value < min) return { error: `${min}円以上で入れてください` };
  return parsed;
}
