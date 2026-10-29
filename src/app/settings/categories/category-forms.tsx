"use client";

import { useActionState } from "react";
import { type Category, CATEGORY_KIND_LABELS } from "@/core/categories";
import { type FormState, addCategoryAction, editCategoryAction } from "./actions";

const inputClass = "w-full rounded border border-zinc-300 px-3 py-2 text-base";

export function AddCategoryForm() {
  const [state, action, pending] = useActionState(addCategoryAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm">名前</span>
        <input name="name" defaultValue={state.values?.name} required className={inputClass} />
        <FieldError message={state.errors?.name} />
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm">種類（作った後は変えられません）</legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="expense"
              defaultChecked={state.values?.kind === "expense"}
              required
            />
            {CATEGORY_KIND_LABELS.expense}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="transfer"
              defaultChecked={state.values?.kind === "transfer"}
            />
            {CATEGORY_KIND_LABELS.transfer}（貯蓄・投資への移動）
          </label>
        </div>
        <FieldError message={state.errors?.kind} />
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="text-sm">メモ</span>
        <textarea name="memo" defaultValue={state.values?.memo} rows={2} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50"
      >
        追加する
      </button>
    </form>
  );
}

export function EditCategoryForm({ category }: { category: Category }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    editCategoryAction.bind(null, category.id),
    {},
  );
  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-zinc-500">名前</span>
        <input
          name="name"
          defaultValue={state.values?.name ?? category.name}
          required
          className={inputClass}
        />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-zinc-500">メモ</span>
        <textarea
          name="memo"
          defaultValue={state.values?.memo ?? category.memo}
          rows={2}
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          保存
        </button>
        {state.saved && !pending && <span className="text-emerald-700">保存しました</span>}
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-sm text-red-600">{message}</span>;
}
