"use client";

import { useState } from "react";

/** 削除のボタン。一度押すと確認が出て、もう一度押すと消す。 */
export function DeleteButton({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-3 text-red-700"
      >
        削除する
      </button>
    );
  }
  return (
    <form action={deleteAction} className="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
      <span className="text-sm text-red-800">この記録を削除します。元に戻せません。</span>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white">
          削除する
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-3"
        >
          やめる
        </button>
      </div>
    </form>
  );
}
