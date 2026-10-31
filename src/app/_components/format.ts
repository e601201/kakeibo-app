/** 画面に出す年月。例：2026年11月 */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

/** 画面に出す金額。例：1,200円 */
export function yen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/** 一覧に出す日付（月/日）。例：11/3 */
export function dayLabel(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 画面に出す割合。出さないとき（null）は「—」。例：25% */
export function percent(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}
