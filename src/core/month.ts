// 日付は日本時間の暦の日付として扱い、時刻は持たない。
const japanDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 日本時間の今日の日付（YYYY-MM-DD）。 */
export function todayInJapan(now: Date): string {
  return japanDate.format(now);
}

/** 日付（YYYY-MM-DD）が数えられる月（YYYY-MM）。月は1日から月末まで。 */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** 年月（YYYY-MM）として正しいか。 */
export function isMonth(text: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(text);
}

/** 月（YYYY-MM）から n か月先（マイナスなら前）の月。 */
export function addMonths(month: string, n: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** その月の記録を読むための日付の範囲。from 以上、before より前。 */
export function datesOfMonth(month: string): { from: string; before: string } {
  return { from: `${month}-01`, before: `${addMonths(month, 1)}-01` };
}
