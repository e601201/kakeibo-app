/** 金額の読み取りの結果。読めなければ理由を返す。 */
export type ParsedYen = { value: number } | { error: string };

// 家計では起きない大きさを上限にして、桁の打ち間違いに気づけるようにする
const MAX_AMOUNT = 999_999_999;

/**
 * 画面で入れた金額を円の整数として読む。全角の数字・マイナスと、桁区切りのカンマも読む。
 * 0やマイナスを許すかは、使う側で決める。
 */
export function parseYen(text: string): ParsedYen {
  const amount = text.normalize("NFKC").replace(/[−‐]/g, "-").replace(/,/g, "").trim();
  if (amount === "") return { error: "金額を入れてください" };
  if (/^-?\d+\.\d+$/.test(amount)) return { error: "円の整数で入れてください" };
  if (!/^-?\d+$/.test(amount)) return { error: "数字で入れてください" };

  const value = Number(amount);
  if (Math.abs(value) > MAX_AMOUNT) return { error: "金額が大きすぎます" };
  return { value };
}

/** 金額の合計。 */
export function sum(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}
