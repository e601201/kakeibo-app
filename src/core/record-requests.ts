import { CATEGORY_KIND_LABELS, type Category, categoriesForInput } from "./categories";
import { type PaymentMethod, paymentMethodLabel } from "./payment-methods";
import {
  INCOME_KINDS,
  INCOME_KIND_LABELS,
  type NewExpense,
  type NewIncome,
  validateExpense,
  validateIncome,
} from "./records";
import type { Validated } from "./validated";

// 画面を開かずに記録するAPIで受け取る依頼（docs/api.md）。
// 費目・支払方法・収入の種類は名前で受け取り、読み替えたうえで画面と同じ決まりで確かめる。

type ExpenseRequestField = "date" | "category" | "amount" | "paymentMethod";

/**
 * APIで受け取った支出・振替の記録を確かめる。日付を省くと今日（today）にする。
 * 支払方法は「クレジットカード（三井住友カード）」のように画面と同じ書き方で、カード名のない支払方法は名前だけでよい。
 */
export function expenseFromRequest(
  body: unknown,
  categories: readonly Category[],
  paymentMethods: readonly PaymentMethod[],
  today: string,
): Validated<NewExpense, ExpenseRequestField> {
  const request = fieldsOf(body);
  const category = findCategory(textOf(request.category).trim(), categories);
  const paymentMethod = findPaymentMethod(textOf(request.paymentMethod).trim(), paymentMethods);

  const result = validateExpense(
    {
      date: textOf(request.date).trim() || today,
      categoryId: "id" in category ? category.id : "",
      amount: textOf(request.amount),
      description: textOf(request.description),
      paymentMethodId: "id" in paymentMethod ? paymentMethod.id : "",
      memo: textOf(request.memo),
    },
    categories,
    paymentMethods,
  );

  if (result.ok && !("error" in category) && !("error" in paymentMethod)) return result;

  const errors: Partial<Record<ExpenseRequestField, string>> = {};
  if (!result.ok) {
    errors.date = result.errors.date;
    errors.category = result.errors.categoryId;
    errors.amount = result.errors.amount;
    errors.paymentMethod = result.errors.paymentMethodId;
  }
  // 名前を読み替えられなかった理由を、画面向けの「選んでください」より優先する
  if ("error" in category) errors.category = category.error;
  if ("error" in paymentMethod) errors.paymentMethod = paymentMethod.error;
  return { ok: false, errors: withoutEmpty(errors) };
}

/** APIで受け取った収入の記録を確かめる。収入の種類は名前（給与など）で受け取る。日付を省くと今日（today）にする。 */
export function incomeFromRequest(
  body: unknown,
  today: string,
): Validated<NewIncome, "date" | "kind" | "amount"> {
  const request = fieldsOf(body);
  const kindName = textOf(request.kind).trim();
  const kind = INCOME_KINDS.find((k) => INCOME_KIND_LABELS[k] === kindName);

  const result = validateIncome({
    date: textOf(request.date).trim() || today,
    kind: kind ?? "",
    amount: textOf(request.amount),
    memo: textOf(request.memo),
  });
  if (result.ok || !result.errors.kind) return result;
  return {
    ok: false,
    errors: {
      ...result.errors,
      kind: `収入の種類は ${INCOME_KINDS.map((k) => INCOME_KIND_LABELS[k]).join("・")} のどれかにしてください`,
    },
  };
}

/** APIで選べる名前の一覧。費目は入力画面と同じく、非表示を除いて表示順に並べる。 */
export function recordOptions(
  categories: readonly Category[],
  paymentMethods: readonly PaymentMethod[],
) {
  return {
    categories: categoriesForInput(categories).map((c) => ({
      name: c.name,
      kind: CATEGORY_KIND_LABELS[c.kind],
    })),
    paymentMethods: paymentMethods.map(paymentMethodLabel),
    incomeKinds: INCOME_KINDS.map((k) => INCOME_KIND_LABELS[k]),
  };
}

type Found = { id: string } | { error: string };

// 非表示かどうかは validateExpense が確かめる
function findCategory(name: string, categories: readonly Category[]): Found {
  if (name === "") return { error: "費目を指定してください" };
  return categories.find((c) => c.name === name) ?? { error: `費目「${name}」が見つかりません` };
}

// 支払方法は任意なので、指定がなければ空の id を返す
function findPaymentMethod(name: string, paymentMethods: readonly PaymentMethod[]): Found {
  if (name === "") return { id: "" };
  const byLabel = paymentMethods.find((m) => paymentMethodLabel(m) === name);
  if (byLabel) return byLabel;
  const byName = paymentMethods.filter((m) => m.name === name);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    return {
      error: `支払方法はカード名まで指定してください（例：${paymentMethodLabel(byName[0])}）`,
    };
  }
  return { error: `支払方法「${name}」が見つかりません` };
}

function withoutEmpty<Field extends string>(
  errors: Partial<Record<Field, string>>,
): Partial<Record<Field, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([, e]) => e)) as Partial<
    Record<Field, string>
  >;
}

function fieldsOf(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
}

// 金額は数で送られてもよい
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}
