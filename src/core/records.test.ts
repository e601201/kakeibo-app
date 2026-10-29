import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import type { PaymentMethod } from "./payment-methods";
import {
  type ExpenseInput,
  type IncomeInput,
  expenseKind,
  validateExpense,
  validateIncome,
} from "./records";

function category(overrides: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { kind: "expense", sortOrder: 0, memo: "", hidden: false, ...overrides };
}

const categories = [
  category({ id: "eatout", name: "外食" }),
  category({ id: "save", name: "貯蓄・投資", kind: "transfer" }),
  category({ id: "books", name: "書籍", hidden: true }),
];

const paymentMethods: PaymentMethod[] = [
  { id: "cash", name: "現金", detail: "", sortOrder: 0 },
];

function input(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
  return {
    date: "2026-11-01",
    categoryId: "eatout",
    amount: "1200",
    description: "",
    paymentMethodId: "",
    memo: "",
    ...overrides,
  };
}

describe("支出・振替の記録の検証", () => {
  it("日付・費目・金額だけで記録できる", () => {
    expect(validateExpense(input(), categories, paymentMethods)).toEqual({
      ok: true,
      value: {
        date: "2026-11-01",
        categoryId: "eatout",
        amount: 1200,
        description: "",
        paymentMethodId: null,
        memo: "",
      },
    });
  });

  it("日付・費目・金額がないと記録できず、どれが足りないかを返す", () => {
    expect(
      validateExpense(input({ date: "", categoryId: "", amount: " " }), categories, paymentMethods),
    ).toEqual({
      ok: false,
      errors: {
        date: "日付を入れてください",
        categoryId: "費目を選んでください",
        amount: "金額を入れてください",
      },
    });
  });

  it("ありえない日付は記録できない", () => {
    expect(validateExpense(input({ date: "2026-02-30" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { date: "日付が正しくありません" },
    });
  });

  it("金額0は記録できない", () => {
    expect(validateExpense(input({ amount: "0" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { amount: "0円は記録できません" },
    });
  });

  it("小数の金額は記録できない（円の整数だけ）", () => {
    expect(validateExpense(input({ amount: "120.5" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { amount: "円の整数で入れてください" },
    });
  });

  it("数字でない金額は記録できない", () => {
    for (const amount of ["abc", "12a", "--5", "1-2"]) {
      expect(validateExpense(input({ amount }), categories, paymentMethods)).toEqual({
        ok: false,
        errors: { amount: "数字で入れてください" },
      });
    }
  });

  it("マイナスの金額は返金として記録できる", () => {
    expect(validateExpense(input({ amount: "-1200" }), categories, paymentMethods)).toMatchObject({
      ok: true,
      value: { amount: -1200 },
    });
  });

  it("全角の数字・マイナス・桁区切りのカンマを含む金額も読める", () => {
    const amountOf = (amount: string) =>
      validateExpense(input({ amount }), categories, paymentMethods);
    expect(amountOf("１，２００")).toMatchObject({ ok: true, value: { amount: 1200 } });
    expect(amountOf("−３００")).toMatchObject({ ok: true, value: { amount: -300 } });
    expect(amountOf("12,345")).toMatchObject({ ok: true, value: { amount: 12345 } });
  });

  it("10億円以上の金額は記録できない", () => {
    expect(validateExpense(input({ amount: "1000000000" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { amount: "金額が大きすぎます" },
    });
  });

  it("非表示の費目は新しい記録に使えない", () => {
    expect(validateExpense(input({ categoryId: "books" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { categoryId: "非表示の費目は使えません" },
    });
  });

  it("ない費目は使えない", () => {
    expect(validateExpense(input({ categoryId: "gone" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { categoryId: "費目を選び直してください" },
    });
  });

  it("内容・支払方法・メモは任意で入れられる", () => {
    const result = validateExpense(
      input({ description: " ランチ ", paymentMethodId: "cash", memo: "同僚と" }),
      categories,
      paymentMethods,
    );
    expect(result).toMatchObject({
      ok: true,
      value: { description: "ランチ", paymentMethodId: "cash", memo: "同僚と" },
    });
  });

  it("ない支払方法は使えない", () => {
    expect(validateExpense(input({ paymentMethodId: "gone" }), categories, paymentMethods)).toEqual({
      ok: false,
      errors: { paymentMethodId: "支払方法を選び直してください" },
    });
  });
});

describe("支出か振替か", () => {
  it("振替の費目（貯蓄・投資）を選んだ記録は振替になる", () => {
    expect(expenseKind({ categoryId: "save" }, categories)).toBe("transfer");
  });

  it("支出の費目を選んだ記録は支出になる（返金も支出）", () => {
    expect(expenseKind({ categoryId: "eatout" }, categories)).toBe("expense");
  });
});

function incomeInput(overrides: Partial<IncomeInput> = {}): IncomeInput {
  return { date: "2026-11-25", kind: "salary", amount: "200000", memo: "", ...overrides };
}

describe("収入の記録の検証", () => {
  it("日付・収入の種類・金額で記録できる", () => {
    expect(validateIncome(incomeInput())).toEqual({
      ok: true,
      value: { date: "2026-11-25", kind: "salary", amount: 200000, memo: "" },
    });
  });

  it("妻からの入金として記録でき、メモも残せる", () => {
    expect(validateIncome(incomeInput({ kind: "from_wife", memo: " 立替分 " }))).toMatchObject({
      ok: true,
      value: { kind: "from_wife", memo: "立替分" },
    });
  });

  it("日付・収入の種類・金額がないと記録できず、どれが足りないかを返す", () => {
    expect(validateIncome(incomeInput({ date: "", kind: "", amount: "" }))).toEqual({
      ok: false,
      errors: {
        date: "日付を入れてください",
        kind: "収入の種類を選んでください",
        amount: "金額を入れてください",
      },
    });
  });

  it("ない収入の種類は使えない", () => {
    expect(validateIncome(incomeInput({ kind: "bonus" }))).toEqual({
      ok: false,
      errors: { kind: "収入の種類を選んでください" },
    });
  });

  it("収入の金額はマイナスにできない（正の整数だけ）", () => {
    expect(validateIncome(incomeInput({ amount: "-1000" }))).toEqual({
      ok: false,
      errors: { amount: "収入は1円以上で入れてください" },
    });
  });

  it("収入の金額も0・小数・数字でないものは記録できない", () => {
    expect(validateIncome(incomeInput({ amount: "0" }))).toMatchObject({
      errors: { amount: "0円は記録できません" },
    });
    expect(validateIncome(incomeInput({ amount: "1000.5" }))).toMatchObject({
      errors: { amount: "円の整数で入れてください" },
    });
    expect(validateIncome(incomeInput({ amount: "abc" }))).toMatchObject({
      errors: { amount: "数字で入れてください" },
    });
  });
});
