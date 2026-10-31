import Link from "next/link";
import { Suspense } from "react";
import { inputClass } from "@/app/_components/form";
import { monthLabel, shortMonthLabel, yen, yenOrDash } from "@/app/_components/format";
import { MonthNav } from "@/app/_components/month-nav";
import { isMonth } from "@/core/month";
import { type TrendRow, yearlyTrend } from "@/core/trend";
import { loadTrendInput } from "@/lib/data/report";
import { createClient } from "@/lib/supabase/server";
import { type TrendChartItem, TrendCharts } from "./trend-charts";

// 使い始めた月。開始月を選ばなければ、ここから12か月を出す
const FIRST_MONTH = "2026-11";

export default function TrendPage({ searchParams }: PageProps<"/trend">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">年間推移</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <Trend searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Trend({ searchParams }: Pick<PageProps<"/trend">, "searchParams">) {
  const { month: requested } = await searchParams;
  const start = typeof requested === "string" && isMonth(requested) ? requested : FIRST_MONTH;
  const { categories, records } = await loadTrendInput(await createClient(), start);
  const { months, rows, monthsWithRecords } = yearlyTrend(start, categories, records);
  const end = months[months.length - 1];
  const expenseRows = rows.filter((r) => r.category.kind === "expense");
  const transferRows = rows.filter((r) => r.category.kind === "transfer");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <MonthNav month={start} />
        <p className="text-center text-sm text-zinc-500">
          {monthLabel(start)}〜{monthLabel(end)}（記録のある月 {monthsWithRecords}か月）
        </p>
        {/* 離れた月から見るときは、開始月を直接選ぶ */}
        <form className="flex items-center justify-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            開始月
            <input type="month" name="month" defaultValue={start} className={`${inputClass} w-44`} />
          </label>
          <button type="submit" className="rounded bg-zinc-700 px-3 py-2 font-bold text-white">
            表示
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">支出</h2>
        <TrendCharts items={chartItems(expenseRows, months)} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">振替</h2>
        <TrendCharts items={chartItems(transferRows, months)} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">表</h2>
        <p className="text-xs text-zinc-500">
          月平均は、12か月の合計を記録のある月の数で割った額です。
        </p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-right text-xs tabular-nums">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="sticky left-0 bg-zinc-50 p-2 text-left font-medium">費目</th>
                {months.map((m, i) => (
                  <th key={m} className="p-2 font-medium whitespace-nowrap">
                    {/* 年をまたいでも分かるよう、最初の月と1月には年を付ける */}
                    {shortMonthLabel(m, i === 0 || m.endsWith("-01"))}
                  </th>
                ))}
                <th className="p-2 font-medium">合計</th>
                <th className="p-2 font-medium whitespace-nowrap">月平均</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <TableGroup title="支出" rows={expenseRows} columns={months.length + 3} />
              <TableGroup title="振替" rows={transferRows} columns={months.length + 3} />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function chartItems(rows: TrendRow[], months: string[]): TrendChartItem[] {
  return rows.map((row) => ({
    id: row.category.id,
    name: row.category.name,
    kind: row.category.kind,
    total: row.total,
    average: row.average,
    points: months.map((m, i) => ({ month: shortMonthLabel(m), amount: row.amounts[i] })),
  }));
}

// 費目の種類ごとの見出しと行。columns は表の列の数（費目・12か月・合計・月平均）
function TableGroup({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: TrendRow[];
  columns: number;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <tr>
        <th colSpan={columns} className="sticky left-0 bg-white p-2 text-left text-sm font-bold">
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.category.id}>
          <th className="sticky left-0 bg-white p-2 text-left font-normal whitespace-nowrap">
            {row.category.name}
          </th>
          {row.amounts.map((amount, i) => (
            <td key={i} className="p-2 whitespace-nowrap">
              {amount === 0 ? "" : yen(amount)}
            </td>
          ))}
          <td className="p-2 font-medium whitespace-nowrap">{yen(row.total)}</td>
          <td className="p-2 whitespace-nowrap">
            {yenOrDash(row.average)}
          </td>
        </tr>
      ))}
    </>
  );
}
