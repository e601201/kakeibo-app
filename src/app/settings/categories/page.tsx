import Link from "next/link";
import { Suspense } from "react";
import { type Category, CATEGORY_KIND_LABELS } from "@/core/categories";
import { loadCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import { moveCategoryAction, setCategoryHiddenAction } from "./actions";
import { AddCategoryForm, EditCategoryForm } from "./category-forms";

export default function CategoriesPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">費目</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          ホームへ
        </Link>
      </header>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <CategoryList />
      </Suspense>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">費目を追加</h2>
        <AddCategoryForm />
      </section>
    </main>
  );
}

async function CategoryList() {
  const categories = await loadCategories(await createClient());
  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200">
      {categories.map((category, i) => (
        <CategoryItem
          key={category.id}
          category={category}
          isFirst={i === 0}
          isLast={i === categories.length - 1}
        />
      ))}
    </ul>
  );
}

function CategoryItem({
  category,
  isFirst,
  isLast,
}: {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className={`flex flex-col gap-2 p-3 ${category.hidden ? "bg-zinc-50 text-zinc-400" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-medium">
          {category.name}
          {category.hidden && <span className="ml-2 text-xs">（非表示）</span>}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            category.kind === "transfer" ? "bg-sky-100 text-sky-700" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {CATEGORY_KIND_LABELS[category.kind]}
        </span>
        <form action={moveCategoryAction.bind(null, category.id, "up")}>
          <IconButton label={`${category.name}を上へ`} disabled={isFirst}>
            ↑
          </IconButton>
        </form>
        <form action={moveCategoryAction.bind(null, category.id, "down")}>
          <IconButton label={`${category.name}を下へ`} disabled={isLast}>
            ↓
          </IconButton>
        </form>
      </div>
      {category.memo && <p className="text-sm whitespace-pre-wrap text-zinc-500">{category.memo}</p>}
      <div className="flex items-start gap-4 text-sm">
        <details className="flex-1">
          <summary className="cursor-pointer text-emerald-700">名前・メモを変える</summary>
          <EditCategoryForm category={category} />
        </details>
        <form action={setCategoryHiddenAction.bind(null, category.id, !category.hidden)}>
          <button type="submit" className="text-zinc-500 underline">
            {category.hidden ? "表示に戻す" : "非表示にする"}
          </button>
        </form>
      </div>
    </li>
  );
}

function IconButton({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      disabled={disabled}
      className="h-9 w-9 rounded border border-zinc-300 text-zinc-600 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
