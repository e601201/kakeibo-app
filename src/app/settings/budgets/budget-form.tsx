"use client";

import { type ReactNode, useActionState } from "react";
import { FieldError, inputClass } from "@/app/_components/form";
import { type Category, CATEGORY_KIND_LABELS } from "@/core/categories";
import { INCOME_KINDS, INCOME_KIND_LABELS, type IncomeKind } from "@/core/records";
import { type BudgetFormState, saveBudgetsAction } from "./actions";
import { budgetField, incomePlanField } from "./fields";

export function BudgetForm({
  month,
  monthLabel,
  categories,
  budgets,
  incomePlans,
}: {
  month: string;
  monthLabel: string;
  categories: Category[];
  budgets: Record<string, number>;
  incomePlans: Record<IncomeKind, number>;
}) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(
    saveBudgetsAction.bind(null, month),
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">収入の予定</h2>
        <ul className="divide-y divide-zinc-200">
          {INCOME_KINDS.map((kind) => (
            <AmountRow
              state={state}
              key={kind}
              name={incomePlanField(kind)}
              label={INCOME_KIND_LABELS[kind]}
              current={incomePlans[kind]}
            />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">費目ごとの予算</h2>
        <ul className="divide-y divide-zinc-200">
          {categories.map((category) => (
            <AmountRow
              state={state}
              key={category.id}
              name={budgetField(category.id)}
              current={budgets[category.id]}
              label={
                <span className={category.hidden ? "text-zinc-400" : ""}>
                  {category.name}
                  {category.kind === "transfer" && (
                    <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                      {CATEGORY_KIND_LABELS.transfer}
                    </span>
                  )}
                  {category.hidden && <span className="ml-2 text-xs">（非表示）</span>}
                </span>
              }
            />
          ))}
        </ul>
      </section>

      {state.savedMessage && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.savedMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="sticky bottom-4 rounded-lg bg-emerald-600 px-4 py-4 text-lg font-bold text-white shadow disabled:opacity-50"
      >
        {monthLabel}から適用して保存
      </button>
    </form>
  );
}

function AmountRow({
  state,
  name,
  label,
  current,
}: {
  state: BudgetFormState;
  name: string;
  label: ReactNode;
  current: number;
}) {
  return (
    <li className="flex flex-col gap-1 py-2">
      <label className="flex items-center gap-3">
        <span className="flex-1">{label}</span>
        <input
          name={name}
          inputMode="numeric"
          autoComplete="off"
          defaultValue={state.values?.[name] ?? String(current)}
          className={`${inputClass} w-36 text-right`}
        />
        <span className="text-sm text-zinc-500">円</span>
      </label>
      <FieldError message={state.errors?.[name]} />
    </li>
  );
}
