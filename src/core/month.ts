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
