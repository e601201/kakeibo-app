import type { ExpenseRecord, IncomeRecord } from "./records";

/** 一覧に並べる記録。支出・振替と収入をまとめて並べる。 */
export type ListedRecord = ({ type: "expense" } & ExpenseRecord) | ({ type: "income" } & IncomeRecord);

/**
 * 一覧の絞り込みの条件。指定しない条件は使わない。
 * 収入は費目・支払方法・要確認・内容を持たないので、どれかの条件を指定すると出ない。
 */
export type ListFilter = {
  categoryId?: string;
  paymentMethodId?: string;
  /** true なら要確認の記録だけ */
  needsReview?: boolean;
  /** 内容の検索語（部分一致） */
  query?: string;
};

/**
 * 1か月分の記録を条件で絞り込み、日付の新しい順に並べる（同じ日付なら、あとで登録した記録が上）。
 * 検索は内容の部分一致で、全角・半角と大文字・小文字の違いは同じものとして扱う。
 */
export function filterRecords(records: readonly ListedRecord[], filter: ListFilter): ListedRecord[] {
  const query = normalizeForSearch(filter.query ?? "");
  const hasCondition =
    !!filter.categoryId || !!filter.paymentMethodId || !!filter.needsReview || query !== "";

  const matches = (record: ListedRecord): boolean => {
    if (record.type === "income") return !hasCondition;
    if (filter.categoryId && record.categoryId !== filter.categoryId) return false;
    if (filter.paymentMethodId && record.paymentMethodId !== filter.paymentMethodId) return false;
    if (filter.needsReview && !record.needsReview) return false;
    if (query && !normalizeForSearch(record.description).includes(query)) return false;
    return true;
  };

  return records.filter(matches).sort(
    (a, b) => compareDesc(a.date, b.date) || compareDesc(a.createdAt, b.createdAt),
  );
}

function compareDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

// 全角の英数字と半角のカタカナを揃え（NFKC）、大文字を小文字にする
function normalizeForSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase().trim();
}
