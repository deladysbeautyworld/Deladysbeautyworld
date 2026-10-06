create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'developer', 'staff'),
    false
  );
$$;

alter table public.categories enable row level security;
alter table public.orders enable row level security;

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
