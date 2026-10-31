import type { PostgrestError } from "@supabase/supabase-js";

// Supabase の API は1回に1000行までしか返さないので、分けて読む
const PAGE_SIZE = 1000;

/**
 * 条件に合う行をすべて読む。page には from 行目から to 行目までを読む問い合わせを渡す
 * （抜けや重なりが出ないよう、問い合わせは並びを決めておく）。
 */
export async function selectAllPages<Row>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: Row[] | null; error: PostgrestError | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}
