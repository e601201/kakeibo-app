import { describe, expect, it } from "vitest";
import { type ListedRecord, filterRecords } from "./list";

// 内容・金額は作り物の値
function expense(
  id: string,
  overrides: Partial<Extract<ListedRecord, { type: "expense" }>> = {},
): ListedRecord {
  return {
    type: "expense",
    id,
    date: "2026-11-10",
    categoryId: "food",
    amount: 1000,
    description: "",
    paymentMethodId: null,
    memo: "",
    needsReview: false,
    createdAt: "2026-11-10T10:00:00Z",
    ...overrides,
  };
}

function income(id: string, date: string): ListedRecord {
  return {
    type: "income",
    id,
    date,
    kind: "salary",
    amount: 5000,
    memo: "",
    createdAt: `${date}T09:00:00Z`,
  };
}

const ids = (records: ListedRecord[]) => records.map((r) => r.id);

describe("一覧の絞り込み", () => {
  it("条件がなければ、支出・振替と収入がすべて日付の新しい順に並ぶ", () => {
    const records = [
      expense("a", { date: "2026-11-03" }),
      income("b", "2026-11-25"),
      expense("c", { date: "2026-11-15" }),
    ];
    expect(ids(filterRecords(records, {}))).toEqual(["b", "c", "a"]);
  });

  it("同じ日付の記録は、あとで登録した記録が上に来る", () => {
    const records = [
      expense("first", { createdAt: "2026-11-10T08:00:00Z" }),
      expense("second", { createdAt: "2026-11-10T12:00:00Z" }),
    ];
    expect(ids(filterRecords(records, {}))).toEqual(["second", "first"]);
  });

  const month = [
    expense("lunch", { categoryId: "eatout", description: "ランチ　Cafe", paymentMethodId: "cash" }),
    expense("card", { categoryId: "eatout", description: "ディナー", paymentMethodId: "card" }),
    expense("super", { categoryId: "food", description: "ｽｰﾊﾟｰABC", paymentMethodId: "card" }),
    expense("review", { categoryId: "food", description: "不明な店", needsReview: true }),
    income("salary", "2026-11-25"),
  ];

  it("費目で絞り込める（収入は費目を持たないので出ない）", () => {
    expect(ids(filterRecords(month, { categoryId: "eatout" })).sort()).toEqual(["card", "lunch"]);
  });

  it("支払方法で絞り込める", () => {
    expect(ids(filterRecords(month, { paymentMethodId: "card" })).sort()).toEqual([
      "card",
      "super",
    ]);
  });

  it("要確認の記録だけに絞り込める", () => {
    expect(ids(filterRecords(month, { needsReview: true }))).toEqual(["review"]);
  });

  it("内容の言葉の一部で検索できる", () => {
    expect(ids(filterRecords(month, { query: "ディナ" }))).toEqual(["card"]);
  });

  it("全角・半角と大文字・小文字の違いは同じものとして検索する", () => {
    expect(ids(filterRecords(month, { query: "スーパー" }))).toEqual(["super"]);
    expect(ids(filterRecords(month, { query: "ａｂｃ" }))).toEqual(["super"]);
    expect(ids(filterRecords(month, { query: "cafe" }))).toEqual(["lunch"]);
  });

  it("検索語の前後の空白は無視し、空の検索語は条件にしない", () => {
    expect(ids(filterRecords(month, { query: "  ディナー " }))).toEqual(["card"]);
    expect(filterRecords(month, { query: "  " })).toHaveLength(5);
  });

  it("条件を組み合わせると、すべてに合う記録だけが出る", () => {
    expect(ids(filterRecords(month, { categoryId: "eatout", paymentMethodId: "card" }))).toEqual([
      "card",
    ]);
    expect(ids(filterRecords(month, { categoryId: "food", query: "ABC" }))).toEqual(["super"]);
    expect(filterRecords(month, { categoryId: "food", paymentMethodId: "cash" })).toEqual([]);
    expect(ids(filterRecords(month, { needsReview: true, categoryId: "food" }))).toEqual(["review"]);
    expect(filterRecords(month, { needsReview: true, categoryId: "eatout" })).toEqual([]);
    expect(ids(filterRecords(month, { paymentMethodId: "card", query: "スーパー" }))).toEqual([
      "super",
    ]);
  });
});
