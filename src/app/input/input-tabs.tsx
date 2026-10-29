"use client";

import { type ReactNode, useState } from "react";

const TABS = [
  { key: "expense", label: "支出・振替" },
  { key: "income", label: "収入" },
] as const;

/** 支出・振替と収入を同じ入力画面で切り替える。切り替えても入れかけた値は消さない。 */
export function InputTabs({
  expenseForm,
  incomeForm,
}: {
  expenseForm: ReactNode;
  incomeForm: ReactNode;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("expense");
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className="rounded-md py-2 font-bold text-zinc-500 aria-selected:bg-white aria-selected:text-zinc-900 aria-selected:shadow"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div hidden={active !== "expense"}>{expenseForm}</div>
      <div hidden={active !== "income"}>{incomeForm}</div>
    </div>
  );
}
