import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">設定</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <nav className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200">
        <Link href="/settings/budgets" className="p-4">
          予算と収入の予定
        </Link>
        <Link href="/settings/categories" className="p-4">
          費目
        </Link>
        <Link href="/settings/emergency-fund" className="p-4">
          生活防衛資金
        </Link>
      </nav>
    </main>
  );
}
