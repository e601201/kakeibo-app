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

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">書き出し</h2>
        <p className="text-sm text-zinc-500">
          すべてのデータをCSV（UTF-8・BOM付き）で書き出します。Excel・Numbersで開けます。
        </p>
        <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {/*
            ファイルのダウンロードなので、画面の移動（Link）ではなく普通のリンクにする。
            ファイルとして保存するのは応答のヘッダーに任せ、download は付けない
            （ログインが切れていたとき、ログイン画面が CSV として保存されないように）
          */}
          <a href="/export/records" className="p-4">
            記録（支出・振替・収入）のCSV
          </a>
          <a href="/export/plans" className="p-4">
            予算・収入の予定の履歴のCSV
          </a>
        </div>
      </section>
    </main>
  );
}
