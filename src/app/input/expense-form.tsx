"use client";

import { useActionState, useRef } from "react";
import { FieldError, inputClass } from "@/app/_components/form";
import { type Category, CATEGORY_KIND_LABELS } from "@/core/categories";
import { type PaymentMethod, paymentMethodLabel } from "@/core/payment-methods";
import type { ExpenseInput } from "@/core/records";
import type { ExpenseFormState } from "./actions";

/** 支出・振替のフォーム。入力画面では新しい記録を、修正画面では既存の記録を保存する。 */
export function ExpenseForm({
  categories,
  paymentMethods,
  initial,
  saveAction,
  submitLabel,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  initial: Partial<ExpenseInput>;
  saveAction: (state: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(saveAction, {});
  const values = state.values ?? initial;
  const amountRef = useRef<HTMLInputElement>(null);

  // iPhone の数字のキーボードにはマイナスがないので、返金はボタンで符号を切り替える
  function toggleSign() {
    const input = amountRef.current;
    if (!input) return;
    const unsigned = input.value.replace(/^[-−－]/, "");
    input.value = unsigned === input.value ? `-${input.value}` : unsigned;
    input.focus();
  }

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
          defaultValue={values.date ?? ""}
          required
          className={inputClass}
        />
        <FieldError message={state.errors?.date} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm">費目</legend>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border px-1 py-2 text-center text-sm has-checked:font-bold ${
                category.kind === "transfer"
                  ? "border-sky-300 text-sky-800 has-checked:bg-sky-600 has-checked:text-white"
                  : "border-zinc-300 has-checked:bg-emerald-600 has-checked:text-white"
              }`}
            >
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                defaultChecked={values.categoryId === category.id}
                required
                className="sr-only"
              />
              {category.name}
              {category.kind === "transfer" && (
                <span className="text-xs">{CATEGORY_KIND_LABELS.transfer}</span>
              )}
            </label>
          ))}
        </div>
        <FieldError message={state.errors?.categoryId} />
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm">金額（円）</span>
        <div className="flex gap-2">
          <input
            ref={amountRef}
            name="amount"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={values.amount ?? ""}
            required
            className={`${inputClass} text-right text-xl`}
          />
          <button
            type="button"
            onClick={toggleSign}
            className="shrink-0 rounded border border-zinc-300 px-3 text-sm text-zinc-600"
          >
            返金（−）
          </button>
        </div>
        <FieldError message={state.errors?.amount} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">内容（任意）</span>
        <input
          name="description"
          defaultValue={values.description ?? ""}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">支払方法（任意）</span>
        <select
          name="paymentMethodId"
          defaultValue={values.paymentMethodId ?? ""}
          className={inputClass}
        >
          <option value="">選ばない</option>
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {paymentMethodLabel(method)}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.paymentMethodId} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">メモ（任意）</span>
        <textarea name="memo" defaultValue={values.memo ?? ""} rows={2} className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
