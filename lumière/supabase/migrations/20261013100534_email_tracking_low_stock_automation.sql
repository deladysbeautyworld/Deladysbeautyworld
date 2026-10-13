alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url text;
alter table public.orders
  add constraint orders_tracking_url_https
  check (tracking_url is null or tracking_url ~* '^https://[^[:space:]]+$');

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  event_key text not null,
  recipient text,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index email_outbox_order_event_unique
  on public.email_outbox (order_id, event_key)
  where order_id is not null;
create index email_outbox_pending_idx
  on public.email_outbox (next_attempt_at, created_at)
  where status = 'pending';

create table public.low_stock_alert_state (
  inventory_source text not null check (inventory_source in ('product', 'variant')),
  inventory_id uuid not null,
  primary key (inventory_source, inventory_id)
);

alter table public.email_outbox enable row level security;
alter table public.low_stock_alert_state enable row level security;
revoke all on public.email_outbox from public, anon, authenticated;
revoke all on public.low_stock_alert_state from public, anon, authenticated;
grant select, update on public.email_outbox to service_role;

create or replace function public.enqueue_order_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_key text;
begin
  if new.payment_status = 'paid'
     and nullif(btrim(new.shipping_email), '') is not null
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    insert into public.email_outbox (order_id, event_key, recipient, payload)
    values (
      new.id,
      'order-paid',
      new.shipping_email,
      jsonb_build_object(
        'order_id', new.id,
        'name', new.shipping_name,
        'status', new.status,
        'tracking_number', new.tracking_number,
        'tracking_url', new.tracking_url
      )
    )
    on conflict (order_id, event_key) where order_id is not null do nothing;
  elsif tg_op = 'UPDATE'
        and old.status is distinct from new.status
        and new.payment_status = 'paid'
        and nullif(btrim(new.shipping_email), '') is not null
        and new.status in ('confirmed', 'shipped', 'delivered', 'cancelled') then
    v_event_key := 'status-' || new.status;
    insert into public.email_outbox (order_id, event_key, recipient, payload)
    values (
      new.id,
      v_event_key,
      new.shipping_email,
      jsonb_build_object(
        'order_id', new.id,
        'name', new.shipping_name,
        'status', new.status,
        'tracking_number', new.tracking_number,
        'tracking_url', new.tracking_url
      )
    )
    on conflict (order_id, event_key) where order_id is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.enqueue_order_email() from public, anon, authenticated;
create trigger orders_enqueue_transactional_email
  after insert or update of payment_status, status on public.orders
  for each row execute function public.enqueue_order_email();

create or replace function public.queue_low_stock_email(
  p_source text,
  p_inventory_id uuid,
  p_product_name text,
  p_stock integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_stock is not null and p_stock <= 5 then
    insert into public.low_stock_alert_state (inventory_source, inventory_id)
    values (p_source, p_inventory_id)
    on conflict (inventory_source, inventory_id) do nothing;

    if found then
      insert into public.email_outbox (event_key, payload)
      values (
        'low-stock',
        jsonb_build_object('product_name', p_product_name, 'stock', p_stock)
      );
    end if;
  else
    delete from public.low_stock_alert_state
    where inventory_source = p_source and inventory_id = p_inventory_id;
  end if;
end;
$$;

revoke all on function public.queue_low_stock_email(text, uuid, text, integer)
  from public, anon, authenticated;

create or replace function public.enqueue_product_low_stock_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.product_variants where product_id = new.id
  ) then
    perform public.queue_low_stock_email('product', new.id, new.name, null);
  else
    perform public.queue_low_stock_email('product', new.id, new.name, new.stock);
  end if;
  return new;
end;
$$;

revoke all on function public.enqueue_product_low_stock_email()
  from public, anon, authenticated;
create trigger products_enqueue_low_stock_email
  after insert or update of stock on public.products
  for each row execute function public.enqueue_product_low_stock_email();

create or replace function public.enqueue_variant_low_stock_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_name text;
begin
  if tg_op = 'DELETE' then
    perform public.queue_low_stock_email('variant', old.id, '', null);
    return old;
  end if;

  select name into v_product_name
  from public.products
  where id = new.product_id;

  perform public.queue_low_stock_email(
    'variant',
    new.id,
    concat_ws(' - ', v_product_name, coalesce(nullif(btrim(new.name), ''), new.type, 'Variant')),
    new.stock
  );
  return new;
end;
$$;

revoke all on function public.enqueue_variant_low_stock_email()
  from public, anon, authenticated;
create trigger product_variants_enqueue_low_stock_email
  after insert or update of stock or delete on public.product_variants
  for each row execute function public.enqueue_variant_low_stock_email();

create or replace function public.dispatch_email_outbox()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_webhook_url text;
  v_webhook_secret text;
begin
  select decrypted_secret into v_webhook_url
  from vault.decrypted_secrets
  where name = 'email_outbox_webhook_url'
  order by created_at desc
  limit 1;

  select decrypted_secret into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'email_outbox_webhook_secret'
  order by created_at desc
  limit 1;

  if v_webhook_url is null or v_webhook_secret is null then
    raise warning 'Email outbox Vault secrets are missing; queued email will wait for the scheduled worker.';
    return new;
  end if;

  perform net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_webhook_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

revoke all on function public.dispatch_email_outbox() from public, anon, authenticated;
create trigger email_outbox_dispatch_after_insert
  after insert on public.email_outbox
  for each row execute function public.dispatch_email_outbox();