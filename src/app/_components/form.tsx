/** 入力欄の見た目。iPhone で拡大されないよう文字は16px（text-base）にする。 */
export const inputClass = "w-full rounded border border-zinc-300 px-3 py-2 text-base";

/** 欄の下に出す、間違いの理由。 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-sm text-red-600">{message}</span>;
}
