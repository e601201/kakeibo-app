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

// 家計では起きない大きさを上限にして、桁の打ち間違いに気づけるようにする
const MAX_AMOUNT = 999_999_999;

// 金額は円の整数。全角の数字・マイナスと、桁区切りのカンマも読む
function parseAmount(text: string): Parsed<number> {
  const amount = text.normalize("NFKC").replace(/[−‐]/g, "-").replace(/,/g, "").trim();
  if (amount === "") return { error: "金額を入れてください" };
  if (/^-?\d+\.\d+$/.test(amount)) return { error: "円の整数で入れてください" };
  if (!/^-?\d+$/.test(amount)) return { error: "数字で入れてください" };

  const value = Number(amount);
  if (value === 0) return { error: "0円は記録できません" };
  if (Math.abs(value) > MAX_AMOUNT) return { error: "金額が大きすぎます" };
  return { value };
}
