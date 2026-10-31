import { parseYen } from "./amount";
import type { Category, CategoryKind } from "./categories";
import type { PaymentMethod } from "./payment-methods";
import type { Validated } from "./validated";

/** 画面から受け取る、支出・振替の入力。 */
export type ExpenseInput = {
  date: string;
  categoryId: string;
  amount: string;
  description: string;
  paymentMethodId: string;
  memo: string;
};

/**
 * 保存してよい支出・振替の記録。支出か振替かは費目の種類で決まるので、記録そのものには種類を持たない。
 * 金額は円の整数で、マイナスは返金。
 */
export type NewExpense = {
  date: string;
  categoryId: string;
  amount: number;
  description: string;
  paymentMethodId: string | null;
  memo: string;
};

type ExpenseField = "date" | "categoryId" | "amount" | "paymentMethodId";

/** 支出・振替の入力を確かめる。間違いがあれば欄ごとの理由を返す。 */
export function validateExpense(
  input: ExpenseInput,
  categories: readonly Category[],
  paymentMethods: readonly PaymentMethod[],
): Validated<NewExpense, ExpenseField> {
  const date = parseDate(input.date);
  const categoryId = parseCategory(input.categoryId, categories);
  const amount = parseAmount(input.amount);
  const paymentMethodId = parsePaymentMethod(input.paymentMethodId, paymentMethods);

  if ("error" in date || "error" in categoryId || "error" in amount || "error" in paymentMethodId) {
    return {
      ok: false,
      errors: errorsOf({ date, categoryId, amount, paymentMethodId }),
    };
  }
  return {
    ok: true,
    value: {
      date: date.value,
      categoryId: categoryId.value,
      amount: amount.value,
      description: input.description.trim(),
      paymentMethodId: paymentMethodId.value,
      memo: input.memo.trim(),
    },
  };
}

/** 記録が支出か振替か。記録には種類を持たせず、選んだ費目の種類で決まる。 */
export function expenseKind(
  expense: Pick<NewExpense, "categoryId">,
  categories: readonly Category[],
): CategoryKind {
  const category = categories.find((c) => c.id === expense.categoryId);
  if (!category) throw new Error(`費目 ${expense.categoryId} が見つかりません`);
  return category.kind;
}

/** 収入の種類。 */
export const INCOME_KINDS = ["salary", "from_wife"] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];

export const INCOME_KIND_LABELS: Record<IncomeKind, string> = {
  salary: "給与",
  from_wife: "妻からの入金",
};

/** 画面から受け取る、収入の入力。 */
export type IncomeInput = { date: string; kind: string; amount: string; memo: string };

/** 保存してよい収入の記録。金額は正の円の整数。 */
export type NewIncome = { date: string; kind: IncomeKind; amount: number; memo: string };

type IncomeField = "date" | "kind" | "amount";

/** 収入の入力を確かめる。間違いがあれば欄ごとの理由を返す。 */
export function validateIncome(input: IncomeInput): Validated<NewIncome, IncomeField> {
  const date = parseDate(input.date);
  const kind = parseIncomeKind(input.kind);
  const amount = parsePositiveAmount(input.amount);

  if ("error" in date || "error" in kind || "error" in amount) {
    return { ok: false, errors: errorsOf({ date, kind, amount }) };
  }
  return {
    ok: true,
    value: { date: date.value, kind: kind.value, amount: amount.value, memo: input.memo.trim() },
  };
}

type Parsed<T> = { value: T } | { error: string };

function errorsOf<Field extends string>(
  parsed: Record<Field, Parsed<unknown>>,
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(parsed) as Field[]) {
    const result = parsed[field];
    if ("error" in result) errors[field] = result.error;
  }
  return errors;
}

// 日付は日本時間の暦の日付（YYYY-MM-DD）
function parseDate(text: string): Parsed<string> {
  const date = text.trim();
  if (date === "") return { error: "日付を入れてください" };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return { error: "日付が正しくありません" };
  const [year, month, day] = match.slice(1).map(Number);
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  if (asUtc.getUTCMonth() !== month - 1 || asUtc.getUTCDate() !== day) {
    return { error: "日付が正しくありません" };
  }
  return { value: date };
}

function parseCategory(id: string, categories: readonly Category[]): Parsed<string> {
  if (id === "") return { error: "費目を選んでください" };
  const category = categories.find((c) => c.id === id);
  if (!category) return { error: "費目を選び直してください" };
  if (category.hidden) return { error: "非表示の費目は使えません" };
  return { value: id };
}

// 支払方法は任意
function parsePaymentMethod(
  id: string,
  paymentMethods: readonly PaymentMethod[],
): Parsed<string | null> {
  if (id === "") return { value: null };
  if (!paymentMethods.some((m) => m.id === id)) return { error: "支払方法を選び直してください" };
  return { value: id };
}

// 金額は円の整数で、0は記録しない
function parseAmount(text: string): Parsed<number> {
  const amount = parseYen(text);
  if ("value" in amount && amount.value === 0) return { error: "0円は記録できません" };
  return amount;
}

function parseIncomeKind(kind: string): Parsed<IncomeKind> {
  const found = INCOME_KINDS.find((k) => k === kind);
  if (!found) return { error: "収入の種類を選んでください" };
  return { value: found };
}

// 収入はマイナスにしない（戻ってきたお金は返金として支出に記録する）
function parsePositiveAmount(text: string): Parsed<number> {
  const amount = parseAmount(text);
  if ("value" in amount && amount.value < 0) return { error: "収入は1円以上で入れてください" };
  return amount;
}
