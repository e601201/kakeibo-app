-- 生活防衛資金（F-06）。開始時の貯蓄額と目標額を本人ごとに1件だけ持つ。
-- 現在額は、開始時の貯蓄額に振替の累計を足して求める（src/core/emergency-fund.ts）。
--
-- 金額は個人情報なので、マイグレーションでは入れず、本人が設定画面から入力する。

create table public.emergency_funds (
  id uuid primary key default gen_random_uuid(),
  -- 1件だけ持つので、持ち主を一意にする
  owner_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  -- 開始時の貯蓄額。円の整数
  starting_savings integer not null check (starting_savings >= 0),
  -- 目標額。円の整数
  target integer not null check (target > 0),
  created_at timestamptz not null default now()
);

select private.protect_by_owner('public.emergency_funds');
