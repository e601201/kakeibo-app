import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import { plansCsv, recordsCsv } from "./csv";
import type { PaymentMethod } from "./payment-methods";
import type { ExpenseRecord, IncomeRecord } from "./records";

// 内容・金額は作り物の値
const categories: Category[] = [
  { id: "eatout", name: "外食", kind: "expense", sortOrder: 0, memo: "", hidden: false },
  { id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 1, memo: "", hidden: false },
];

const paymentMethods: PaymentMethod[] = [
  { id: "smbc", name: "クレジットカード", detail: "三井住友カード", sortOrder: 0 },
];

function expense(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: "e1",
    date: "2026-11-03",
    categoryId: "eatout",
    amount: 1200,
    description: "ランチ",
    paymentMethodId: "smbc",
    memo: "",
    needsReview: false,
    createdAt: "2026-11-03T03:00:00.000Z",
    ...overrides,
  };
}

function income(overrides: Partial<IncomeRecord> = {}): IncomeRecord {
  return {
    id: "i1",
    date: "2026-11-25",
    kind: "salary",
    amount: 200000,
    memo: "",
    createdAt: "2026-11-25T03:00:00.000Z",
    ...overrides,
  };
}

const BOM = "﻿";
const linesOf = (csv: string) => csv.slice(1).split("\r\n");

describe("記録のCSV", () => {
  it("Excel・Numbersで文字化けしないよう、BOMで始まる", () => {
    expect(recordsCsv({ expenses: [], incomes: [], categories, paymentMethods }).startsWith(BOM)).toBe(true);
  });

  it("支出・振替・収入を日付の古い順に1行ずつ書き、費目名・支払方法名は名前で書く", () => {
    const csv = recordsCsv({
      expenses: [
        expense(),
        expense({ id: "e2", date: "2026-11-25", categoryId: "save", amount: 50000, description: "", paymentMethodId: null }),
      ],
      incomes: [income({ date: "2026-11-10" })],
      categories,
      paymentMethods,
    });
    expect(linesOf(csv)).toEqual([
      "日付,種類,費目・収入の種類,内容,金額,支払方法,メモ,要確認,登録日時",
      "2026-11-03,支出,外食,ランチ,1200,クレジットカード（三井住友カード）,,,2026-11-03T03:00:00.000Z",
      "2026-11-10,収入,給与,,200000,,,,2026-11-25T03:00:00.000Z",
      "2026-11-25,振替,貯蓄・投資,,50000,,,,2026-11-03T03:00:00.000Z",
      "",
    ]);
  });

  it("カンマ・改行・ダブルクォートを含む内容やメモは、ダブルクォートで囲み、中のダブルクォートは2つにする", () => {
    const csv = recordsCsv({
      expenses: [expense({ description: 'カフェ, "A"', memo: "1行目\n2行目" })],
      incomes: [],
      categories,
      paymentMethods,
    });
    expect(csv).toContain(',"カフェ, ""A""",');
    expect(csv).toContain(',"1行目\n2行目",');
  });

  it("同じ日付の記録は、先に登録した記録から書く", () => {
    const csv = recordsCsv({
      expenses: [
        expense({ id: "later", description: "あと", createdAt: "2026-11-03T09:00:00.000Z" }),
        expense({ id: "earlier", description: "さき", createdAt: "2026-11-03T08:00:00.000Z" }),
      ],
      incomes: [],
      categories,
      paymentMethods,
    });
    expect(linesOf(csv)[1]).toContain(",さき,");
    expect(linesOf(csv)[2]).toContain(",あと,");
  });

  it("返金（マイナスの金額）は数字のまま書く", () => {
    const csv = recordsCsv({
      expenses: [expense({ amount: -800 })],
      incomes: [],
      categories,
      paymentMethods,
    });
    expect(linesOf(csv)[1]).toContain(",-800,");
  });
});

describe("予算・収入の予定の履歴のCSV", () => {
  it("BOMで始まり、予算と収入の予定を適用開始月ごとに書く（費目名は名前で、変更の履歴も残す）", () => {
    const csv = plansCsv({
      budgetHistory: [
        { key: "save", startMonth: "2026-11", amount: 50000 },
        { key: "eatout", startMonth: "2026-12", amount: 8000 },
        { key: "eatout", startMonth: "2026-11", amount: 10000 },
      ],
      incomePlanHistory: [{ key: "salary", startMonth: "2026-11", amount: 200000 }],
      categories,
    });
    expect(csv.startsWith(BOM)).toBe(true);
    expect(linesOf(csv)).toEqual([
      "種類,費目・収入の種類,費目の種類,適用開始月,月の額",
      "予算,外食,支出,2026-11,10000",
      "予算,外食,支出,2026-12,8000",
      "予算,貯蓄・投資,振替,2026-11,50000",
      "収入の予定,給与,,2026-11,200000",
      "",
    ]);
  });

  it("カンマを含む費目名はダブルクォートで囲む", () => {
    const csv = plansCsv({
      budgetHistory: [{ key: "eatout", startMonth: "2026-11", amount: 10000 }],
      incomePlanHistory: [],
      categories: [{ ...categories[0], name: "外食, 飲み会" }],
    });
    expect(linesOf(csv)[1]).toBe('予算,"外食, 飲み会",支出,2026-11,10000');
  });
});
