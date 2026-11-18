alter table public.orders
	add column if not exists payment_reference text,
	add column if not exists payment_status text,
	add column if not exists promo_code_id integer references public.promo_codes(id);

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
set search_path = ''
as $$
declare
	v_user_id uuid := nullif(payload ->> 'user_id', '')::uuid;
	v_order_id uuid;
	v_existing_order jsonb;
	v_item jsonb;
	v_items jsonb := payload -> 'items';
	v_verified_items jsonb := '[]'::jsonb;
	v_shipping jsonb := payload -> 'shipping';
	v_promo_id integer := nullif(payload ->> 'promo_code_id', '')::integer;
	v_reference text := nullif(payload ->> 'payment_reference', '');
	v_verified_amount numeric := nullif(payload ->> 'verified_amount', '')::numeric;
	v_product_id uuid;
	v_variant_id uuid;
	v_quantity integer;
	v_product_price numeric;
	v_unit_price numeric;
	v_subtotal numeric := 0;
	v_discount numeric := 0;
	v_total numeric;
	v_delivery_fee numeric;
	v_zone_count integer;
	v_promo_type text;
	v_promo_value numeric;
begin
	if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
		raise exception 'Order finalization is restricted to the verified payment service';
	end if;

	if v_user_id is null then
		raise exception 'Missing authenticated customer';
	end if;

	if v_reference is null then
		raise exception 'Missing payment reference';
	end if;

	if jsonb_typeof(v_items) <> 'array'
		or jsonb_array_length(v_items) = 0
		or jsonb_array_length(v_items) > 100 then
		raise exception 'Order must contain at least one item';
	end if;

	if jsonb_typeof(v_shipping) <> 'object' or nullif(v_shipping ->> 'state', '') is null then
		raise exception 'Missing shipping details';
	end if;

	select to_jsonb(o) into v_existing_order
	from public.orders o
	where o.payment_reference = v_reference
		and o.user_id = v_user_id;

	if found then
		return v_existing_order;
	end if;

	if exists (
		select 1 from public.orders where payment_reference = v_reference
	) then
		raise exception 'Payment reference has already been used';
	end if;

	for v_item in select * from jsonb_array_elements(v_items)
	loop
		v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
		v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
		v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);

		if v_product_id is null or v_quantity <= 0 then
			raise exception 'Invalid order item';
		end if;

		select p.price into v_product_price
		from public.products p
		where p.id = v_product_id;

		if not found then
			raise exception 'Product is no longer available';
		end if;

		if v_variant_id is null then
			v_unit_price := v_product_price;
		else
			select coalesce(nullif(pv.price, 0), p.price) into v_unit_price
			from public.product_variants pv
			join public.products p on p.id = pv.product_id
			where pv.id = v_variant_id
				and pv.product_id = v_product_id;

			if not found then
				raise exception 'Product variant is no longer available';
			end if;
		end if;

		if v_unit_price is null or v_unit_price <= 0 then
			raise exception 'Product price is invalid';
		end if;

		v_subtotal := v_subtotal + v_unit_price * v_quantity;
		v_verified_items := v_verified_items || jsonb_build_array(
			jsonb_set(v_item, '{unit_price}', to_jsonb(v_unit_price), true)
		);
	end loop;

	select count(*)::integer, min(dz.fee)
	into v_zone_count, v_delivery_fee
	from public.delivery_zones dz
	where v_shipping ->> 'state' = any(dz.states);

	if v_zone_count <> 1 then
		raise exception 'Shipping state does not have exactly one delivery zone';
	end if;

	if v_promo_id is not null then
		update public.promo_codes
		set uses = uses + 1
		where id = v_promo_id
			and active = true
			and (expires_at is null or expires_at > now())
			and (max_uses is null or uses < max_uses)
			and v_subtotal >= min_order
		returning type, value into v_promo_type, v_promo_value;

		if not found then
			raise exception 'Promo code is no longer valid';
		end if;

		if v_promo_type = 'percent' then
			v_discount := round(v_subtotal * v_promo_value / 100);
		else
			v_discount := least(v_promo_value, v_subtotal);
		end if;
	end if;

	v_total := v_subtotal - v_discount + v_delivery_fee;
	if v_verified_amount is null
		or v_verified_amount <= 0
		or v_verified_amount <> round(v_total) then
		raise exception 'Verified payment amount does not match the current order total';
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

	for v_item in select * from jsonb_array_elements(v_verified_items)
	loop
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
revoke execute on function public.finalize_order(jsonb) from anon, authenticated;
grant execute on function public.finalize_order(jsonb) to service_role;
