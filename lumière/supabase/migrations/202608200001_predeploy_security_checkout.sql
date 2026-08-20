create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'developer', 'staff'),
    false
  );
$$;

alter table if exists public.profiles enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_variants enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.delivery_zones enable row level security;
alter table if exists public.promo_codes enable row level security;
alter table if exists public.routines enable row level security;

alter table if exists public.orders
  add column if not exists payment_reference text unique;

alter table if exists public.orders
  add column if not exists payment_status text not null default 'pending';

alter table if exists public.orders
  add column if not exists promo_code_id uuid references public.promo_codes(id);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create unique index if not exists idx_promo_codes_code_upper on public.promo_codes(upper(code));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_user_id_profiles_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_user_id_profiles_id_fkey
      foreign key (user_id) references public.profiles(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_product_id_products_id_fkey'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_product_id_products_id_fkey
      foreign key (product_id) references public.products(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_variant_id_product_variants_id_fkey'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_variant_id_product_variants_id_fkey
      foreign key (variant_id) references public.product_variants(id);
  end if;
end $$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.decrement_stock(product_id uuid, qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if qty is null or qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  update public.products
  set stock = stock - qty
  where id = product_id
    and stock >= qty;

  if not found then
    raise exception 'Insufficient stock for product %', product_id;
  end if;
end;
$$;

create or replace function public.decrement_variant_stock(variant_id uuid, qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if qty is null or qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  update public.product_variants
  set stock = stock - qty
  where id = variant_id
    and stock >= qty;

  if not found then
    raise exception 'Insufficient stock for variant %', variant_id;
  end if;
end;
$$;

create or replace function public.finalize_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_items jsonb := payload -> 'items';
  v_shipping jsonb := payload -> 'shipping';
  v_promo_id uuid := nullif(payload ->> 'promo_code_id', '')::uuid;
  v_reference text := nullif(payload ->> 'payment_reference', '');
  v_total numeric := coalesce((payload ->> 'total')::numeric, 0);
  v_delivery_fee numeric := coalesce((payload ->> 'delivery_fee')::numeric, 0);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_reference is null then
    raise exception 'Missing payment reference';
  end if;

  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if v_promo_id is not null then
    update public.promo_codes
    set uses = uses + 1
    where id = v_promo_id
      and active = true
      and (expires_at is null or expires_at > now())
      and (max_uses is null or uses < max_uses)
      and v_total >= min_order;

    if not found then
      raise exception 'Promo code is no longer valid';
    end if;
  end if;

  insert into public.orders (
    user_id, total, delivery_fee, payment_method, payment_status, payment_reference,
    status, promo_code_id, shipping_name, shipping_email, shipping_phone,
    shipping_address, shipping_city, shipping_state, whatsapp_number, order_note
  )
  values (
    v_user_id, v_total, v_delivery_fee, 'paystack', 'paid', v_reference,
    'confirmed', v_promo_id, v_shipping ->> 'name', v_shipping ->> 'email',
    v_shipping ->> 'phone', v_shipping ->> 'address', v_shipping ->> 'city',
    v_shipping ->> 'state', v_shipping ->> 'whatsapp_number', v_shipping ->> 'note'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(v_items)
  loop
    if coalesce((v_item ->> 'quantity')::integer, 0) <= 0 then
      raise exception 'Invalid item quantity';
    end if;

    if nullif(v_item ->> 'variant_id', '') is not null then
      perform public.decrement_variant_stock((v_item ->> 'variant_id')::uuid, (v_item ->> 'quantity')::integer);
    else
      perform public.decrement_stock((v_item ->> 'product_id')::uuid, (v_item ->> 'quantity')::integer);
    end if;

    insert into public.order_items (order_id, product_id, variant_id, quantity, unit_price)
    values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      nullif(v_item ->> 'variant_id', '')::uuid,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'unit_price')::numeric
    );
  end loop;

  return (
    select to_jsonb(o)
    from public.orders o
    where o.id = v_order_id
  );
end;
$$;

revoke execute on function public.decrement_stock(uuid, integer) from public;
revoke execute on function public.decrement_variant_stock(uuid, integer) from public;
revoke execute on function public.finalize_order(jsonb) from public;
grant execute on function public.finalize_order(jsonb) to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check ((select auth.uid()) = id or public.is_admin());

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.user_id = (select auth.uid())
  )
);

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select" on public.products
for select to anon, authenticated
using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "product_variants_public_select" on public.product_variants;
create policy "product_variants_public_select" on public.product_variants
for select to anon, authenticated
using (true);

drop policy if exists "product_variants_admin_write" on public.product_variants;
create policy "product_variants_admin_write" on public.product_variants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select" on public.categories
for select to anon, authenticated
using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "delivery_zones_public_select" on public.delivery_zones;
create policy "delivery_zones_public_select" on public.delivery_zones
for select to anon, authenticated
using (true);

drop policy if exists "delivery_zones_admin_write" on public.delivery_zones;
create policy "delivery_zones_admin_write" on public.delivery_zones
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "promo_codes_select_active_or_admin" on public.promo_codes;
create policy "promo_codes_select_active_or_admin" on public.promo_codes
for select to authenticated
using (active = true or public.is_admin());

drop policy if exists "promo_codes_admin_write" on public.promo_codes;
create policy "promo_codes_admin_write" on public.promo_codes
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "routines_owner_all" on public.routines;
create policy "routines_owner_all" on public.routines
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
