import Link from "next/link";
import { Suspense } from "react";
import { percent, yen } from "@/app/_components/format";
import { MonthNav } from "@/app/_components/month-nav";
import { isMonth, monthOf, todayInJapan } from "@/core/month";
import { INCOME_KIND_LABELS } from "@/core/records";
import { type CategoryRow, monthlyReport } from "@/core/report";
import { loadReportInput } from "@/lib/data/report";
import { createClient } from "@/lib/supabase/server";

export default function ReportPage({ searchParams }: PageProps<"/report">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">月次レポート</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <Report searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Report({ searchParams }: Pick<PageProps<"/report">, "searchParams">) {
  const { month: requested } = await searchParams;
  const month =
    typeof requested === "string" && isMonth(requested)
      ? requested
      : monthOf(todayInJapan(new Date()));
  const { rows, incomes, summary } = monthlyReport(
    await loadReportInput(await createClient(), month),
  );

  return (
    <div className="flex flex-col gap-6">
      <MonthNav month={month} />

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <SummaryItem label="支出合計" value={yen(summary.expenseTotal)} />
        <SummaryItem label="振替合計" value={yen(summary.transferTotal)} />
        <SummaryItem label="収入" value={yen(summary.incomeTotal)} />
        <SummaryItem
          label="未使用"
          value={yen(summary.unused)}
          alert={summary.unused < 0}
        />
        <SummaryItem label="貯蓄率" value={percent(summary.savingsRate)} />
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">収入</h2>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm">
          {incomes.map((income) => (
            <li key={income.kind} className="flex items-center justify-between p-3">
              <span>{INCOME_KIND_LABELS[income.kind]}</span>
              <span>
                <span className="font-medium">{yen(income.actual)}</span>
                <span className="ml-2 text-zinc-500">／ 予定 {yen(income.planned)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <CategorySection title="支出" rows={rows.filter((r) => r.category.kind === "expense")} />
      <CategorySection title="振替" rows={rows.filter((r) => r.category.kind === "transfer")} />
    </div>
  );
}

function SummaryItem({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`text-lg font-bold ${alert ? "text-red-600" : ""}`}>{value}</dd>
    </div>
  );
}

function CategorySection({ title, rows }: { title: string; rows: CategoryRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm">
        {rows.map((row) => (
          <li key={row.category.id} className={`flex flex-col gap-1 p-3 ${row.over ? "text-red-600" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {row.category.name}
                {row.category.hidden && <span className="ml-1 text-xs text-zinc-400">（非表示）</span>}
                {row.over && <span className="ml-2 text-xs font-bold">予算オーバー</span>}
              </span>
              <span>{percent(row.usageRate)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-zinc-100">
              <div
                className={`h-full ${row.over ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, (row.usageRate ?? (row.over ? 1 : 0)) * 100))}%` }}
              />
            </div>
            <div className={`flex justify-between text-xs ${row.over ? "" : "text-zinc-500"}`}>
              <span>
                実績 {yen(row.actual)} ／ 予算 {yen(row.budget)}
              </span>
              <span>残り {yen(row.remaining)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
