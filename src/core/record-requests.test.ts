import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import type { PaymentMethod } from "./payment-methods";
import { expenseFromRequest, incomeFromRequest, recordOptions } from "./record-requests";

function category(overrides: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { kind: "expense", sortOrder: 0, memo: "", hidden: false, ...overrides };
}

const categories = [
  category({ id: "eatout", name: "外食", sortOrder: 1 }),
  category({ id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 2 }),
  category({ id: "books", name: "書籍", hidden: true, sortOrder: 0 }),
];

const paymentMethods: PaymentMethod[] = [
  { id: "cash", name: "現金", detail: "", sortOrder: 0 },
  { id: "smbc", name: "クレジットカード", detail: "三井住友カード", sortOrder: 1 },
  { id: "epos", name: "クレジットカード", detail: "エポスカード", sortOrder: 2 },
];

const today = "2026-11-01";

describe("APIで受け取った支出・振替の記録", () => {
  it("費目を名前で指定でき、日付を省くと今日になる。金額は数でも文字でもよい", () => {
    expect(
      expenseFromRequest({ category: "外食", amount: 1200 }, categories, paymentMethods, today),
    ).toEqual({
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
    expect(
      expenseFromRequest(
        {
          date: "2026-10-31",
          category: " 貯蓄・投資 ",
          amount: "30,000",
          description: "NISA",
          memo: "積立",
        },
        categories,
        paymentMethods,
        today,
      ),
    ).toEqual({
      ok: true,
      value: {
        date: "2026-10-31",
        categoryId: "save",
        amount: 30000,
        description: "NISA",
        paymentMethodId: null,
        memo: "積立",
      },
    });
  });

  it("支払方法は「名前（カード名）」で指定でき、カード名のない支払方法は名前だけでよい", () => {
    const paid = (paymentMethod: string) =>
      expenseFromRequest(
        { category: "外食", amount: 1200, paymentMethod },
        categories,
        paymentMethods,
        today,
      );
    expect(paid("クレジットカード（エポスカード）")).toMatchObject({
      ok: true,
      value: { paymentMethodId: "epos" },
    });
    expect(paid("現金")).toMatchObject({ ok: true, value: { paymentMethodId: "cash" } });
  });

  it("同じ名前の支払方法がいくつかあるときは、カード名まで指定しないと記録できない", () => {
    expect(
      expenseFromRequest(
        { category: "外食", amount: 1200, paymentMethod: "クレジットカード" },
        categories,
        paymentMethods,
        today,
      ),
    ).toEqual({
      ok: false,
      errors: {
        paymentMethod:
          "支払方法はカード名まで指定してください（例：クレジットカード（三井住友カード））",
      },
    });
  });

  it("見つからない費目・支払方法は記録できない", () => {
    expect(
      expenseFromRequest(
        { category: "食費", amount: 1200, paymentMethod: "ビットコイン" },
        categories,
        paymentMethods,
        today,
      ),
    ).toEqual({
      ok: false,
      errors: {
        category: "費目「食費」が見つかりません",
        paymentMethod: "支払方法「ビットコイン」が見つかりません",
      },
    });
  });

  it("非表示の費目は記録できない", () => {
    expect(
      expenseFromRequest({ category: "書籍", amount: 1200 }, categories, paymentMethods, today),
    ).toEqual({ ok: false, errors: { category: "非表示の費目は使えません" } });
  });

  it("費目・金額がないと記録できず、画面と同じ決まりで確かめる", () => {
    expect(expenseFromRequest({ date: "2026-02-30" }, categories, paymentMethods, today)).toEqual({
      ok: false,
      errors: {
        date: "日付が正しくありません",
        category: "費目を指定してください",
        amount: "金額を入れてください",
      },
    });
    expect(
      expenseFromRequest({ category: "外食", amount: 0 }, categories, paymentMethods, today),
    ).toEqual({ ok: false, errors: { amount: "0円は記録できません" } });
  });

  it("JSONのオブジェクトでないものは、何も指定していないものとして扱う", () => {
    expect(expenseFromRequest(null, categories, paymentMethods, today)).toEqual({
      ok: false,
      errors: { category: "費目を指定してください", amount: "金額を入れてください" },
    });
  });
});

describe("APIで受け取った収入の記録", () => {
  it("収入の種類を名前で指定でき、日付を省くと今日になる", () => {
    expect(incomeFromRequest({ kind: "給与", amount: 250000 }, today)).toEqual({
      ok: true,
      value: { date: "2026-11-01", kind: "salary", amount: 250000, memo: "" },
    });
    expect(
      incomeFromRequest(
        { date: "2026-10-25", kind: "妻からの入金", amount: "50000", memo: "11月分" },
        today,
      ),
    ).toEqual({
      ok: true,
      value: { date: "2026-10-25", kind: "from_wife", amount: 50000, memo: "11月分" },
    });
  });

  it("知らない種類やマイナスの金額は記録できない", () => {
    expect(incomeFromRequest({ kind: "ボーナス", amount: -1 }, today)).toEqual({
      ok: false,
      errors: {
        kind: "収入の種類は 給与・妻からの入金 のどれかにしてください",
        amount: "収入は1円以上で入れてください",
      },
    });
  });
});

describe("APIで選べる名前の一覧", () => {
  it("非表示を除いた費目を表示順に、支払方法と収入の種類を名前で返す", () => {
    expect(recordOptions(categories, paymentMethods)).toEqual({
      categories: [
        { name: "外食", kind: "支出" },
        { name: "貯蓄・投資", kind: "振替" },
      ],
      paymentMethods: [
        "現金",
        "クレジットカード（三井住友カード）",
        "クレジットカード（エポスカード）",
      ],
      incomeKinds: ["給与", "妻からの入金"],
    });
  });
});
