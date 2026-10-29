-- 費目（F-02）。支出と振替を分ける分類。
--
-- 初期の費目は本人の行なので、マイグレーションでは入れず、初めて費目を読むときに入れる
-- （src/lib/data/categories.ts）。費目は消さずに非表示にするので、過去の記録とレポートから消えない。

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  kind text not null check (kind in ('expense', 'transfer')),
  sort_order integer not null,
  memo text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  -- 非表示の費目とも名前を重ねない。初期の費目を二重に入れないための守りも兼ねる
  unique (owner_id, name)
);

select private.protect_by_owner('public.categories');

-- 費目の種類は作った後には変えられない（過去の記録が支出から振替に変わってしまうのを防ぐため）。
create function private.keep_category_kind()
returns trigger
language plpgsql
as $$
begin
  if new.kind <> old.kind then
    raise exception '費目の種類は作った後には変えられません';
  end if;
  return new;
end;
$$;

create trigger keep_category_kind
before update of kind on public.categories
for each row execute function private.keep_category_kind();
