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

/**
 * 画面に出す割合。出さないとき（null）は「—」。例：25%
 * 届いていないのに100%と見えないよう、切り捨てる。
 */
export function percent(rate: number | null): string {
  return rate === null ? "—" : `${Math.floor(rate * 100)}%`;
}

/** 出さないとき（null）は「—」にする金額。 */
export function yenOrDash(amount: number | null): string {
  return amount === null ? "—" : yen(amount);
}

/** 表やグラフの見出しの月。例：11月。withYear なら 2027年1月 */
export function shortMonthLabel(month: string, withYear = false): string {
  return withYear ? monthLabel(month) : `${Number(month.slice(5))}月`;
}

/** グラフの目盛りの短い金額。例：0 / 5千 / 1万 */
export function compactYen(amount: number): string {
  if (Math.abs(amount) >= 10000) return `${amount / 10000}万`;
  if (Math.abs(amount) >= 1000) return `${amount / 1000}千`;
  return String(amount);
}
