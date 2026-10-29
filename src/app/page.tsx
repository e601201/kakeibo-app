import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ホーム</h1>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-zinc-500 underline">
            ログアウト
          </button>
        </form>
      </header>
      <p className="text-zinc-500">まだ記録はありません。</p>
      <Link
        href="/input"
        className="rounded-lg bg-emerald-600 px-4 py-4 text-center text-lg font-bold text-white"
      >
        入力する
      </Link>
      <nav>
        <Link href="/settings/categories" className="text-emerald-700 underline">
          費目の設定
        </Link>
      </nav>
    </main>
  );
}
