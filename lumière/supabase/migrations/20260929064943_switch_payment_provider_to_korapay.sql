alter table public.orders
	add column if not exists payment_reference text,
	add column if not exists payment_status text,
	add column if not exists promo_code_id uuid references public.promo_codes(id);

do $$
begin
	if exists (
		select 1 from information_schema.columns
		where table_schema = 'public'
			and table_name = 'orders'
			and column_name = 'paystack_ref'
	) then
		execute 'update public.orders set payment_reference = paystack_ref where payment_reference is null and paystack_ref is not null';
	end if;
end;
$$;

update public.orders
set payment_status = case
	when status in ('confirmed', 'shipped', 'delivered') then 'paid'
	else 'pending'
end
where payment_status is null;

alter table public.orders
	alter column payment_reference drop not null,
	alter column payment_status set default 'pending',
	alter column payment_status set not null,
	alter column payment_method set default 'korapay';

create unique index if not exists orders_payment_reference_key
	on public.orders(payment_reference)
	where payment_reference is not null;

do $$
declare
	payment_constraint record;
begin
	for payment_constraint in
		select conname
		from pg_constraint
		where conrelid = 'public.orders'::regclass
			and contype = 'c'
			and pg_get_constraintdef(oid) ilike '%payment_method%'
	loop
		execute format('alter table public.orders drop constraint %I', payment_constraint.conname);
	end loop;
end;
$$;

alter table public.orders
	add constraint orders_payment_method_check
	check (payment_method in ('paystack', 'korapay'));

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
		v_user_id, v_total, v_delivery_fee, 'korapay', 'paid', v_reference,
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

revoke execute on function public.finalize_order(jsonb) from public;
grant execute on function public.finalize_order(jsonb) to authenticated;
