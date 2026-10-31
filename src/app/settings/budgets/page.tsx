import Link from "next/link";
import { Suspense } from "react";
import { planDifference, planForMonth } from "@/core/budgets";
import { addMonths, isMonth, monthOf, todayInJapan } from "@/core/month";
import { INCOME_KINDS } from "@/core/records";
import { loadBudgetHistory, loadIncomePlanHistory } from "@/lib/data/budgets";
import { loadCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import { BudgetForm } from "./budget-form";

export default function BudgetsPage({ searchParams }: PageProps<"/settings/budgets">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">予算と収入の予定</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <BudgetSettings searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

async function BudgetSettings({
  searchParams,
}: Pick<PageProps<"/settings/budgets">, "searchParams">) {
  const { month: requested } = await searchParams;
  const thisMonth = monthOf(todayInJapan(new Date()));
  const month = typeof requested === "string" && isMonth(requested) ? requested : thisMonth;

  const supabase = await createClient();
  const [categories, budgetHistory, incomePlanHistory] = await Promise.all([
    loadCategories(supabase),
    loadBudgetHistory(supabase),
    loadIncomePlanHistory(supabase),
  ]);
  const budgets = planForMonth(
    budgetHistory,
    month,
    categories.map((c) => c.id),
  );
  const incomePlans = planForMonth(incomePlanHistory, month, INCOME_KINDS);
  const { budgetTotal, incomeTotal, difference } = planDifference(budgets, incomePlans);

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center justify-between">
        <Link href={`?month=${addMonths(month, -1)}`} className="px-2 py-1 text-emerald-700">
          ← 前の月
        </Link>
        <span className="text-lg font-bold">{monthLabel(month)}</span>
        <Link href={`?month=${addMonths(month, 1)}`} className="px-2 py-1 text-emerald-700">
          次の月 →
        </Link>
      </nav>

      {month < thisMonth && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          過去の月です。ここで変えると、{monthLabel(month)}以降のレポートの予算も変わります。
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 p-3 text-center text-sm">
        <div>
          <dt className="text-zinc-500">収入の予定</dt>
          <dd className="font-bold">{yen(incomeTotal)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">予算合計</dt>
          <dd className="font-bold">{yen(budgetTotal)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">差額</dt>
          <dd className={`font-bold ${difference < 0 ? "text-red-600" : ""}`}>
            {yen(difference)}
          </dd>
        </div>
      </dl>

      <BudgetForm
        key={month}
        month={month}
        monthLabel={monthLabel(month)}
        categories={categories}
        budgets={budgets}
        incomePlans={incomePlans}
      />
    </div>
  );
}

function yen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}
