"use client";

import { useActionState } from "react";
import { FieldError, inputClass } from "@/app/_components/form";
import { INCOME_KINDS, INCOME_KIND_LABELS } from "@/core/records";
import { type IncomeFormState, addIncomeAction } from "./actions";

export function IncomeForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<IncomeFormState, FormData>(addIncomeAction, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.savedMessage && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.savedMessage}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm">日付</span>
        <input
          type="date"
          name="date"
          defaultValue={state.values?.date ?? today}
          required
          className={inputClass}
        />
        <FieldError message={state.errors?.date} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm">収入の種類</legend>
        <div className="grid grid-cols-2 gap-2">
          {INCOME_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-1 py-2 text-center text-sm has-checked:bg-emerald-600 has-checked:font-bold has-checked:text-white"
            >
              <input
                type="radio"
                name="kind"
                value={kind}
                defaultChecked={state.values?.kind === kind}
                required
                className="sr-only"
              />
              {INCOME_KIND_LABELS[kind]}
            </label>
          ))}
        </div>
        <FieldError message={state.errors?.kind} />
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm">金額（円）</span>
        <input
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={state.values?.amount ?? ""}
          required
          className={`${inputClass} text-right text-xl`}
        />
        <FieldError message={state.errors?.amount} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">メモ（任意）</span>
        <textarea
          name="memo"
          defaultValue={state.values?.memo ?? ""}
          rows={2}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
      >
        記録する
      </button>
    </form>
  );
}
