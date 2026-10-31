import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExpenseForm } from "@/app/input/expense-form";
import { categoriesForInput } from "@/core/categories";
import { monthOf } from "@/core/month";
import { loadCategories } from "@/lib/data/categories";
import { loadExpense } from "@/lib/data/expenses";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { deleteExpenseAction, updateExpenseAction } from "../../actions";
import { DeleteButton } from "../../delete-button";
import { isRecordId } from "../../record-id";

export default function EditExpensePage({ params }: PageProps<"/list/expense/[id]">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">支出・振替を直す</h1>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <EditExpense params={params} />
      </Suspense>
    </main>
  );
}

async function EditExpense({ params }: Pick<PageProps<"/list/expense/[id]">, "params">) {
  const { id } = await params;
  if (!isRecordId(id)) notFound();
  const supabase = await createClient();
  const [expense, categories, paymentMethods] = await Promise.all([
    loadExpense(supabase, id),
    loadCategories(supabase),
    loadPaymentMethods(supabase),
  ]);
  if (!expense) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/list?month=${monthOf(expense.date)}`} className="text-sm text-zinc-500 underline">
        ← 一覧へ戻る
      </Link>
      <ExpenseForm
        categories={categoriesForInput(categories, expense.categoryId)}
        paymentMethods={paymentMethods}
        initial={{
          date: expense.date,
          categoryId: expense.categoryId,
          amount: String(expense.amount),
          description: expense.description,
          paymentMethodId: expense.paymentMethodId ?? "",
          memo: expense.memo,
        }}
        saveAction={updateExpenseAction.bind(null, id)}
        submitLabel="保存する"
      />
      <DeleteButton deleteAction={deleteExpenseAction.bind(null, id)} />
    </div>
  );
}
