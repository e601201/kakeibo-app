"use client";

import { type ReactNode, useActionState } from "react";
import { inputClass } from "@/app/_components/form";
import type { Category } from "@/core/categories";
import { type BulkChangeState, bulkChangeCategoryAction } from "./actions";

/** 一覧で選んだ支出・振替の費目をまとめて変えるフォーム。一覧の行（チェックボックス）を中に持つ。 */
export function BulkCategoryForm({
  categories,
  children,
}: {
  categories: Category[];
  children: ReactNode;
}) {
  const [state, action, pending] = useActionState<BulkChangeState, FormData>(
    bulkChangeCategoryAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      {children}
      <div className="sticky bottom-4 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow">
        <span className="text-sm text-zinc-500">選んだ支出・振替の費目をまとめて変える</span>
        <div className="flex gap-2">
          <select name="categoryId" defaultValue="" className={inputClass}>
            <option value="">費目を選ぶ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded bg-emerald-600 px-4 font-bold text-white disabled:opacity-50"
          >
            変える
          </button>
        </div>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.savedMessage && !pending && (
          <span role="status" className="text-sm text-emerald-700">
            {state.savedMessage}
          </span>
        )}
      </div>
    </form>
  );
}
