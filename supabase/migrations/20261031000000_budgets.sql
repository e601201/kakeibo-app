-- 予算と収入の予定（F-01）。どちらも適用開始月からの月の額の履歴として持ち、
-- 変更はその月以降にだけ使う（src/core/budgets.ts）。
--
-- 予算の金額の初期値は個人情報なので、マイグレーションでは入れず、本人が設定画面から入力する。

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- 適用開始月（YYYY-MM）
  start_month text not null check (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- 月の予算額（振替の費目では移す予定の額）。円の整数
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  -- 同じ費目・同じ適用開始月は1件だけ（同じ月に直したら上書きする）
  unique (owner_id, category_id, start_month),
  -- 本人の費目だけを参照できるよう、持ち主ごと参照する
  foreign key (owner_id, category_id) references public.categories (owner_id, id)
);

select private.protect_by_owner('public.budgets');

create table public.income_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 給与・妻からの入金（incomes.kind と同じ）
  kind text not null check (kind in ('salary', 'from_wife')),
  -- 適用開始月（YYYY-MM）
  start_month text not null check (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- 月の予定額。円の整数
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  -- 同じ種類・同じ適用開始月は1件だけ（同じ月に直したら上書きする）
  unique (owner_id, kind, start_month)
);

select private.protect_by_owner('public.income_plans');
