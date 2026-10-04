create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_announcements enable row level security;

revoke all on public.site_announcements from anon, authenticated;
grant select on public.site_announcements to anon, authenticated;
grant insert, update, delete on public.site_announcements to authenticated;

create policy "site_announcements_public_read_active"
  on public.site_announcements
  for select
  to anon, authenticated
  using (active = true or (select public.is_admin()));

create policy "site_announcements_admin_insert"
  on public.site_announcements
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "site_announcements_admin_update"
  on public.site_announcements
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "site_announcements_admin_delete"
  on public.site_announcements
  for delete
  to authenticated
  using ((select public.is_admin()));

create or replace function public.set_site_announcement_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger site_announcements_set_updated_at
  before update on public.site_announcements
  for each row
  execute function public.set_site_announcement_updated_at();
