-- 全テーブル共通の「持ち主」と Row Level Security の型。
--
-- 家計のデータを持つテーブルは、どれも次の形で作る。
--
--   create table public.<テーブル> (
--     id uuid primary key default gen_random_uuid(),
--     owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
--     ...
--   );
--   select private.protect_by_owner('public.<テーブル>');
--
-- protect_by_owner は Row Level Security を有効にし、持ち主本人の行だけを
-- 読み書きできるポリシーを付ける。画面側の制限だけに頼らないための守り。
--
-- マイグレーションの実行中は auth.uid() が null なので、本人の行（費目の初期値など）は
-- マイグレーションでは入れられない。初回ログイン時の準備で入れる。

create schema if not exists private;

create or replace function private.protect_by_owner(target regclass)
returns void
language plpgsql
as $$
begin
  execute format('alter table %s enable row level security', target);
  execute format('alter table %s force row level security', target);
  execute format(
    'create policy "持ち主本人だけが読み書きできる" on %s for all to authenticated '
    'using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
    target
  );
  execute format('create index on %s (owner_id)', target);
end;
$$;

revoke all on function private.protect_by_owner(regclass) from public, anon, authenticated;
