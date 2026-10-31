import type { PlanEntry } from "./budgets";
import { CATEGORY_KIND_LABELS, type Category, sortCategories } from "./categories";
import { type PaymentMethod, paymentMethodLabel } from "./payment-methods";
import {
  INCOME_KINDS,
  INCOME_KIND_LABELS,
  type ExpenseRecord,
  type IncomeKind,
  type IncomeRecord,
} from "./records";

// Excel・Numbers で文字化けしないよう、UTF-8 に BOM を付ける。改行は Excel に合わせて CRLF
const BOM = "﻿";
const NEWLINE = "\r\n";

/** 記録（支出・振替・収入）のCSV。日付の古い順に1行ずつ書き、費目名・支払方法名は名前で書く。 */
export function recordsCsv(input: {
  expenses: readonly ExpenseRecord[];
  incomes: readonly IncomeRecord[];
  categories: readonly Category[];
  paymentMethods: readonly PaymentMethod[];
}): string {
  const categoryById = new Map(input.categories.map((c) => [c.id, c]));
  const methodById = new Map(input.paymentMethods.map((m) => [m.id, m]));

  const rows = [
    ...input.expenses.map((e) => {
      const category = categoryById.get(e.categoryId);
      const method = e.paymentMethodId ? methodById.get(e.paymentMethodId) : undefined;
      return {
        date: e.date,
        createdAt: e.createdAt,
        cells: [
          e.date,
          category ? CATEGORY_KIND_LABELS[category.kind] : "",
          category?.name ?? "",
          e.description,
          String(e.amount),
          method ? paymentMethodLabel(method) : "",
          e.memo,
          e.needsReview ? "要確認" : "",
          e.createdAt,
        ],
      };
    }),
    ...input.incomes.map((i) => ({
      date: i.date,
      createdAt: i.createdAt,
      cells: [i.date, "収入", INCOME_KIND_LABELS[i.kind], "", String(i.amount), "", i.memo, "", i.createdAt],
    })),
  ].sort((a, b) => compare(a.date, b.date) || compare(a.createdAt, b.createdAt));

  return toCsv(
    ["日付", "種類", "費目・収入の種類", "内容", "金額", "支払方法", "メモ", "要確認", "登録日時"],
    rows.map((r) => r.cells),
  );
}

/**
 * 予算・収入の予定の履歴のCSV。適用開始月ごとに1行で、変更の履歴も残す。
 * 予算には費目の種類（支出／振替）も書く（記録のない振替の費目でも、移した先で区別できるように）。
 * 予算は費目の表示順、収入の予定は収入の種類の順に、それぞれ適用開始月の古い順に並べる。
 */
export function plansCsv(input: {
  budgetHistory: readonly PlanEntry[];
  incomePlanHistory: readonly PlanEntry<IncomeKind>[];
  categories: readonly Category[];
}): string {
  const budgetRows = sortCategories(input.categories).flatMap((category) =>
    entriesOf(input.budgetHistory, category.id).map((e) => [
      "予算",
      category.name,
      CATEGORY_KIND_LABELS[category.kind],
      e.startMonth,
      String(e.amount),
    ]),
  );
  const incomePlanRows = INCOME_KINDS.flatMap((kind) =>
    entriesOf(input.incomePlanHistory, kind).map((e) => [
      "収入の予定",
      INCOME_KIND_LABELS[kind],
      "",
      e.startMonth,
      String(e.amount),
    ]),
  );
  return toCsv(
    ["種類", "費目・収入の種類", "費目の種類", "適用開始月", "月の額"],
    [...budgetRows, ...incomePlanRows],
  );
}

function entriesOf<Key extends string>(history: readonly PlanEntry<Key>[], key: Key) {
  return history.filter((e) => e.key === key).sort((a, b) => compare(a.startMonth, b.startMonth));
}

function toCsv(header: string[], rows: string[][]): string {
  return BOM + [header, ...rows].map((cells) => cells.map(escape).join(",") + NEWLINE).join("");
}

// カンマ・改行・ダブルクォートを含む値はダブルクォートで囲み、中のダブルクォートは2つにする
function escape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
