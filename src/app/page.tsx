import Link from "next/link";
import { Suspense } from "react";
import { monthLabel, yen } from "@/app/_components/format";
import { monthOf, todayInJapan } from "@/core/month";
import { homeSummary, monthlyReport } from "@/core/report";
import { loadReportInput } from "@/lib/data/report";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ホーム</h1>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-zinc-500 underline">
            ログアウト
          </button>
        </form>
      </header>

      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <ThisMonth />
      </Suspense>

      <Link
        href="/input"
        className="rounded-lg bg-emerald-600 px-4 py-4 text-center text-lg font-bold text-white"
      >
        入力する
      </Link>
      <nav className="grid grid-cols-2 gap-2">
        <NavTile href="/list" label="一覧" />
        <NavTile href="/report" label="月次レポート" />
        <span className="rounded-lg border border-zinc-200 p-4 text-center text-zinc-400">
          年間推移
          <span className="block text-xs">準備中</span>
        </span>
        <NavTile href="/settings" label="設定" />
      </nav>
    </main>
  );
}

function NavTile({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-300 p-4 text-center font-medium">
      {label}
    </Link>
  );
}

async function ThisMonth() {
  // cookie を読んでから今日を決める（リクエストのたびの日付にするため）
  const supabase = await createClient();
  const month = monthOf(todayInJapan(new Date()));
  const { expenseTotal, remainingBudget, overCategories, needsReviewCount } = homeSummary(
    monthlyReport(await loadReportInput(supabase, month)),
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-zinc-500">{monthLabel(month)}</h2>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-sm text-zinc-500">支出合計</dt>
          <dd className="text-xl font-bold">{yen(expenseTotal)}</dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-sm text-zinc-500">残り予算</dt>
          <dd className={`text-xl font-bold ${remainingBudget < 0 ? "text-red-600" : ""}`}>
            {yen(remainingBudget)}
          </dd>
        </div>
      </dl>

      {overCategories.length > 0 && (
        <Link href={`/report?month=${month}`} className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <span className="font-bold">予算オーバー</span>
          <ul className="mt-1">
            {overCategories.map((row) => (
              <li key={row.category.id} className="flex justify-between">
                <span>{row.category.name}</span>
                <span>{yen(row.overBy)} 超過</span>
              </li>
            ))}
          </ul>
        </Link>
      )}

      <Link
        href={`/list?month=${month}&review=1`}
        className={`rounded-lg p-3 text-sm ${needsReviewCount > 0 ? "bg-amber-50 text-amber-800" : "bg-zinc-50 text-zinc-500"}`}
      >
        要確認 <span className="font-bold">{needsReviewCount}件</span>
      </Link>
    </section>
  );
}
