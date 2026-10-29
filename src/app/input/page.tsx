import Link from "next/link";
import { Suspense } from "react";
import { categoriesForInput } from "@/core/categories";
import { todayInJapan } from "@/core/month";
import { loadCategories } from "@/lib/data/categories";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "./expense-form";

export default function InputPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">入力</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <ExpenseFormWithData />
      </Suspense>
    </main>
  );
}

async function ExpenseFormWithData() {
  const supabase = await createClient();
  const [categories, paymentMethods] = await Promise.all([
    loadCategories(supabase),
    loadPaymentMethods(supabase),
  ]);
  return (
    <ExpenseForm
      categories={categoriesForInput(categories)}
      paymentMethods={paymentMethods}
      today={todayInJapan(new Date())}
    />
  );
}
