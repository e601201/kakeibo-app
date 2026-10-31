import Link from "next/link";
import { Suspense } from "react";
import { loadEmergencyFund } from "@/lib/data/emergency-fund";
import { createClient } from "@/lib/supabase/server";
import { EmergencyFundForm } from "./emergency-fund-form";

export default function EmergencyFundPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">生活防衛資金</h1>
        <Link href="/settings" className="text-sm text-zinc-500 underline">
          設定へ
        </Link>
      </header>
      <p className="text-sm text-zinc-500">
        現在額は、開始時の貯蓄額に、アプリで記録した振替（貯蓄・投資など）の累計を足して求めます。
      </p>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <EmergencyFundSettings />
      </Suspense>
    </main>
  );
}

async function EmergencyFundSettings() {
  return <EmergencyFundForm fund={await loadEmergencyFund(await createClient())} />;
}
