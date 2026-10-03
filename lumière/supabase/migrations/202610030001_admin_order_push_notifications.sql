create extension if not exists pg_net with schema net;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_push_subscriptions enable row level security;
revoke all on public.admin_push_subscriptions from anon, authenticated;
grant all on public.admin_push_subscriptions to service_role;

create index if not exists admin_push_subscriptions_user_id_idx
  on public.admin_push_subscriptions(user_id);

create or replace function public.notify_admins_of_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_webhook_url text;
  v_webhook_secret text;
begin
  select decrypted_secret
  into v_webhook_url
  from vault.decrypted_secrets
  where name = 'admin_push_webhook_url'
  order by created_at desc
  limit 1;

  select decrypted_secret
  into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'admin_push_webhook_secret'
  order by created_at desc
  limit 1;

  if v_webhook_url is null or v_webhook_secret is null then
    raise warning 'Admin push webhook Vault secrets are not configured; order notification skipped.';
    return new;
  end if;

  perform net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-push-secret', v_webhook_secret
    ),
    body := jsonb_build_object('order_id', new.id),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists orders_notify_admins_after_insert on public.orders;
create trigger orders_notify_admins_after_insert
  after insert on public.orders
  for each row
  execute function public.notify_admins_of_new_order();
