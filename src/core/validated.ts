/** 検証の結果。間違いがあれば欄ごとの理由を返す。 */
export type Validated<T, Field extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: Partial<Record<Field, string>> };
