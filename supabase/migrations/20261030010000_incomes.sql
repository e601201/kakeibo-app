-- 収入の記録（F-12）。入金のたびに記録するので、同じ月に同じ種類の収入を何件でも持てる。

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 入金日（日本時間の暦の日付）
  date date not null,
  -- 給与・妻からの入金
  kind text not null check (kind in ('salary', 'from_wife')),
  -- 入ってきた額（給与は手取り）。円の正の整数
  amount integer not null check (amount > 0),
  memo text not null default '',
  created_at timestamptz not null default now()
);

select private.protect_by_owner('public.incomes');

-- 月ごとの一覧とレポートで、入金日の範囲で読むため
create index on public.incomes (owner_id, date);
