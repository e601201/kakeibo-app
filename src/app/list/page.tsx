import Link from "next/link";
import { Suspense } from "react";
import { inputClass } from "@/app/_components/form";
import { dayLabel, yen } from "@/app/_components/format";
import { MonthNav } from "@/app/_components/month-nav";
import { type Category, CATEGORY_KIND_LABELS, categoriesForInput } from "@/core/categories";
import { type ListFilter, type ListedRecord, filterRecords } from "@/core/list";
import { isMonth, monthOf, todayInJapan } from "@/core/month";
import { type PaymentMethod, paymentMethodLabel } from "@/core/payment-methods";
import { INCOME_KIND_LABELS } from "@/core/records";
import { loadCategories } from "@/lib/data/categories";
import { loadExpensesOfMonth } from "@/lib/data/expenses";
import { loadIncomesOfMonth } from "@/lib/data/incomes";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { BulkCategoryForm } from "./bulk-category-form";

export default function ListPage({ searchParams }: PageProps<"/list">) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">一覧</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <RecordList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

async function RecordList({ searchParams }: Pick<PageProps<"/list">, "searchParams">) {
  const params = await searchParams;
  const requested = param(params.month);
  const month = isMonth(requested) ? requested : monthOf(todayInJapan(new Date()));
  const filter: ListFilter = {
    categoryId: param(params.category) || undefined,
    paymentMethodId: param(params.payment) || undefined,
    needsReview: param(params.review) === "1" || undefined,
    query: param(params.q) || undefined,
  };

  const supabase = await createClient();
  const [categories, paymentMethods, expenses, incomes] = await Promise.all([
    loadCategories(supabase),
    loadPaymentMethods(supabase),
    loadExpensesOfMonth(supabase, month),
    loadIncomesOfMonth(supabase, month),
  ]);
  const records = filterRecords(
    [
      ...expenses.map((e) => ({ type: "expense" as const, ...e })),
      ...incomes.map((i) => ({ type: "income" as const, ...i })),
    ],
    filter,
  );

  return (
    <div className="flex flex-col gap-4">
      <MonthNav month={month} />

      <FilterForm
        month={month}
        filter={filter}
        categories={categories}
        paymentMethods={paymentMethods}
      />

      {records.length === 0 ? (
        <p className="text-zinc-500">この条件の記録はありません。</p>
      ) : (
        <BulkCategoryForm categories={categoriesForInput(categories)}>
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {records.map((record) => (
              <RecordRow
                key={`${record.type}-${record.id}`}
                record={record}
                categories={categories}
                paymentMethods={paymentMethods}
              />
            ))}
          </ul>
        </BulkCategoryForm>
      )}
    </div>
  );
}

function FilterForm({
  month,
  filter,
  categories,
  paymentMethods,
}: {
  month: string;
  filter: ListFilter;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  return (
    // 条件を変えるたびに URL が変わるので、再読み込みや戻るでも同じ一覧になる
    <form className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3 text-sm">
      <input type="hidden" name="month" value={month} />
      <input
        name="q"
        type="search"
        placeholder="内容で検索"
        defaultValue={filter.query ?? ""}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <select name="category" defaultValue={filter.categoryId ?? ""} className={inputClass}>
          <option value="">すべての費目</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={filter.paymentMethodId ?? ""} className={inputClass}>
          <option value="">すべての支払方法</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {paymentMethodLabel(m)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="review" value="1" defaultChecked={!!filter.needsReview} />
          要確認だけ
        </label>
        <div className="flex items-center gap-3">
          <Link href={`?month=${month}`} className="text-zinc-500 underline">
            条件を消す
          </Link>
          <button type="submit" className="rounded bg-zinc-700 px-4 py-2 font-bold text-white">
            絞り込む
          </button>
        </div>
      </div>
    </form>
  );
}

function RecordRow({
  record,
  categories,
  paymentMethods,
}: {
  record: ListedRecord;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const date = dayLabel(record.date);

  if (record.type === "income") {
    return (
      <li className="flex items-center gap-3 p-3">
        {/* 収入はまとめて費目を変える対象ではない */}
        <span className="w-5" />
        <Link href={`/list/income/${record.id}`} className="flex flex-1 items-center gap-3">
          <span className="w-10 text-sm text-zinc-500">{date}</span>
          <span className="flex flex-1 flex-col">
            <span>
              {INCOME_KIND_LABELS[record.kind]}
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                収入
              </span>
            </span>
            {record.memo && <span className="text-xs text-zinc-500">{record.memo}</span>}
          </span>
          <span className="font-medium text-emerald-700">+{yen(record.amount)}</span>
        </Link>
      </li>
    );
  }

  const category = categories.find((c) => c.id === record.categoryId);
  const paymentMethod = paymentMethods.find((pm) => pm.id === record.paymentMethodId);
  return (
    <li className="flex items-center gap-3 p-3">
      <input
        type="checkbox"
        name="expenseIds"
        value={record.id}
        aria-label={`${date} ${category?.name ?? ""} を選ぶ`}
        className="h-5 w-5"
      />
      <Link href={`/list/expense/${record.id}`} className="flex flex-1 items-center gap-3">
        <span className="w-10 text-sm text-zinc-500">{date}</span>
        <span className="flex flex-1 flex-col">
          <span>
            {category?.name}
            {category?.kind === "transfer" && (
              <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                {CATEGORY_KIND_LABELS.transfer}
              </span>
            )}
            {record.needsReview && (
              <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">要確認</span>
            )}
          </span>
          <span className="text-xs text-zinc-500">
            {[record.description, paymentMethod && paymentMethodLabel(paymentMethod)]
              .filter(Boolean)
              .join("・")}
          </span>
        </span>
        <span className={`font-medium ${record.amount < 0 ? "text-emerald-700" : ""}`}>
          {yen(record.amount)}
        </span>
      </Link>
    </li>
  );
}
