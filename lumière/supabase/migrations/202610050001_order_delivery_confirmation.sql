alter table public.orders
  add column if not exists delivered_at timestamptz,
  add column if not exists payment_status text;

update public.orders
set payment_status = case
  when status in ('confirmed', 'shipped', 'delivered') then 'paid'
  else 'pending'
end
where payment_status is null;

alter table public.orders
  alter column payment_status set default 'pending',
  alter column payment_status set not null;

create or replace function public.sync_order_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_status = 'paid'
    and old.payment_status is distinct from 'paid'
    and old.status = 'pending' then
    new.status := 'confirmed';
  end if;

  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at := coalesce(new.delivered_at, now());
  elsif new.status is distinct from 'delivered' then
    new.delivered_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_sync_status on public.orders;
create trigger orders_sync_status
before update of status, payment_status on public.orders
for each row
execute function public.sync_order_status();

update public.orders
set status = 'confirmed'
where status = 'pending'
  and payment_status = 'paid';

create or replace function public.confirm_order_delivery(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.orders
  set status = 'delivered'
  where id = p_order_id
    and user_id = auth.uid()
    and status = 'shipped'
    and payment_status = 'paid'
  returning * into v_order;

  if not found then
    raise exception 'This order is not awaiting delivery confirmation';
  end if;

  return jsonb_build_object(
    'id', v_order.id,
    'status', v_order.status,
    'delivered_at', v_order.delivered_at
  );
end;
$$;

revoke all on function public.confirm_order_delivery(uuid) from public, anon;
grant execute on function public.confirm_order_delivery(uuid) to authenticated;
