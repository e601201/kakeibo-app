import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IncomeForm } from "@/app/input/income-form";
import { monthOf } from "@/core/month";
import { loadIncome } from "@/lib/data/incomes";
import { createClient } from "@/lib/supabase/server";
import { deleteIncomeAction, updateIncomeAction } from "../../actions";
import { DeleteButton } from "../../delete-button";
import { isRecordId } from "../../record-id";

export default function EditIncomePage({ params }: PageProps<"/list/income/[id]">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">収入を直す</h1>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <EditIncome params={params} />
      </Suspense>
    </main>
  );
}

async function EditIncome({ params }: Pick<PageProps<"/list/income/[id]">, "params">) {
  const { id } = await params;
  if (!isRecordId(id)) notFound();
  const income = await loadIncome(await createClient(), id);
  if (!income) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/list?month=${monthOf(income.date)}`} className="text-sm text-zinc-500 underline">
        ← 一覧へ戻る
      </Link>
      <IncomeForm
        initial={{
          date: income.date,
          kind: income.kind,
          amount: String(income.amount),
          memo: income.memo,
        }}
        saveAction={updateIncomeAction.bind(null, id)}
        submitLabel="保存する"
      />
      <DeleteButton deleteAction={deleteIncomeAction.bind(null, id)} />
    </div>
  );
}
