-- 支払方法と、支出・振替の記録（F-03）。
--
-- 初期の支払方法は本人の行なので、マイグレーションでは入れず、初めて支払方法を読むときに入れる
-- （src/lib/data/payment-methods.ts）。

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 現金・クレジットカード・電子マネー・口座振替・その他
  name text not null check (btrim(name) <> ''),
  -- カード・サービス名（三井住友カード・PayPay など）。現金などでは空
  detail text not null default '',
  sort_order integer not null,
  created_at timestamptz not null default now(),
  -- 初期の支払方法を二重に入れないための守り
  unique (owner_id, name, detail),
  -- 記録から持ち主ごと参照するため
  unique (owner_id, id)
);

select private.protect_by_owner('public.payment_methods');

-- 記録から持ち主ごと参照するため
alter table public.categories add unique (owner_id, id);

-- 支出と振替の記録。支出か振替かは費目の種類で決まるので、記録そのものには種類を持たない。
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 利用日（日本時間の暦の日付）
  date date not null,
  category_id uuid not null,
  description text not null default '',
  -- 税込みの円の整数。マイナスは返金
  amount integer not null check (amount <> 0),
  payment_method_id uuid,
  memo text not null default '',
  -- 以下の3つは第2版のカード明細の取り込みで使う。第1版では手入力・要確認なし・明細IDなし
  needs_review boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'statement')),
  statement_id text,
  created_at timestamptz not null default now(),
  -- 本人の費目・支払方法だけを参照できるよう、持ち主ごと参照する
  foreign key (owner_id, category_id) references public.categories (owner_id, id),
  foreign key (owner_id, payment_method_id) references public.payment_methods (owner_id, id)
);

select private.protect_by_owner('public.expenses');

-- 月ごとの一覧とレポートで、利用日の範囲で読むため
create index on public.expenses (owner_id, date);
