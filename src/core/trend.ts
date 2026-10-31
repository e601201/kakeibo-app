import { sum } from "./amount";
import { type Category, sortCategories } from "./categories";
import { addMonths, datesOfMonth, monthOf } from "./month";
import type { NewExpense } from "./records";

/** 年間推移の費目ごとの行。 */
export type TrendRow = {
  category: Category;
  /** 開始月から12か月分の実績（返金を差し引いた合計） */
  amounts: number[];
  /** 12か月の合計 */
  total: number;
  /** 月平均（合計÷記録のある月の数、円未満は四捨五入）。記録のある月が0なら出さない（null） */
  average: number | null;
};

export type YearlyTrend = {
  /** 開始月から12か月（YYYY-MM） */
  months: string[];
  rows: TrendRow[];
  /** 支出か振替の記録が1件以上ある月の数（費目ごとではなく全体で数える） */
  monthsWithRecords: number;
};

/** 年間推移に並べる月の数。 */
const TREND_MONTHS = 12;

/** 開始月から12か月の月と、その記録を読むための日付の範囲（from 以上、before より前）。 */
export function trendPeriod(startMonth: string): { months: string[]; from: string; before: string } {
  const months = Array.from({ length: TREND_MONTHS }, (_, i) => addMonths(startMonth, i));
  return {
    months,
    from: datesOfMonth(startMonth).from,
    before: datesOfMonth(months[months.length - 1]).before,
  };
}

/**
 * 開始月から12か月分の、費目×月の実績と、費目ごとの合計・月平均。
 * 非表示の費目は、12か月の間に記録があるときだけ行を出す。
 */
export function yearlyTrend(
  startMonth: string,
  categories: readonly Category[],
  records: readonly Pick<NewExpense, "categoryId" | "date" | "amount">[],
): YearlyTrend {
  const { months } = trendPeriod(startMonth);
  const inRange = records.filter((r) => months.includes(monthOf(r.date)));
  // まだ来ていない月や使い始める前の月で平均が下がらないよう、記録のある月だけで割る
  const monthsWithRecords = new Set(inRange.map((r) => monthOf(r.date))).size;

  const rows = sortCategories(categories).flatMap((category): TrendRow[] => {
    const own = inRange.filter((r) => r.categoryId === category.id);
    if (category.hidden && own.length === 0) return [];

    const amounts = months.map((month) =>
      sum(own.filter((r) => monthOf(r.date) === month).map((r) => r.amount)),
    );
    const total = sum(amounts);
    return [
      {
        category,
        amounts,
        total,
        average: monthsWithRecords > 0 ? Math.round(total / monthsWithRecords) : null,
      },
    ];
  });
  return { months, rows, monthsWithRecords };
}
