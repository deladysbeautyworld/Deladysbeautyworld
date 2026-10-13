import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("email and fulfillment migration queues idempotent emails and thresholded stock alerts", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema vault;
      create schema net;
      create table vault.decrypted_secrets (
        name text,
        decrypted_secret text,
        created_at timestamptz default now()
      );
      create function net.http_post(
        url text,
        headers jsonb,
        body jsonb,
        timeout_milliseconds integer
      ) returns bigint language sql as $$ select 1::bigint $$;
      create table public.orders (
        id uuid primary key default gen_random_uuid(),
        payment_status text,
        status text,
        shipping_name text,
        shipping_email text,
        tracking_number text,
        tracking_url text
      );
      create table public.products (
        id uuid primary key default gen_random_uuid(),
        name text,
        stock integer
      );
      create table public.product_variants (
        id uuid primary key default gen_random_uuid(),
        product_id uuid references public.products(id),
        name text,
        type text,
        stock integer
      );
    `);

    const migration = await readFile(
      new URL("../supabase/migrations/20261013100534_email_tracking_low_stock_automation.sql", import.meta.url),
      "utf8"
    );
    await db.exec(migration);

    const { rows: insertedOrders } = await db.query(`
      insert into public.orders (payment_status, status, shipping_name, shipping_email)
      values ('paid', 'confirmed', 'Customer', 'customer@example.com')
      returning id
    `);
    const orderId = insertedOrders[0].id;
    let { rows } = await db.query(
      "select event_key, recipient from public.email_outbox where order_id = $1",
      [orderId]
    );
    assert.deepEqual(rows, [{ event_key: "order-paid", recipient: "customer@example.com" }]);

    await db.query(
      `update public.orders set tracking_number = 'TRACK-1',
        tracking_url = 'https://carrier.example/track/1', status = 'shipped'
       where id = $1`,
      [orderId]
    );
    await db.query("update public.orders set status = 'shipped' where id = $1", [orderId]);
    ({ rows } = await db.query(
      "select event_key, payload from public.email_outbox where order_id = $1 order by event_key",
      [orderId]
    ));
    assert.equal(rows.length, 2);
    assert.equal(rows[1].event_key, "status-shipped");
    assert.equal(rows[1].payload.tracking_url, "https://carrier.example/track/1");
    assert.equal(await db.query(
      "select relrowsecurity from pg_class where oid = 'public.email_outbox'::regclass"
    ).then((result) => result.rows[0].relrowsecurity), true);
    assert.equal((await db.query(
      "select has_table_privilege('anon', 'public.email_outbox', 'select') as allowed"
    )).rows[0].allowed, false);
    await assert.rejects(
      db.query("update public.orders set tracking_url = 'javascript:alert(1)' where id = $1", [orderId]),
      /orders_tracking_url_https/
    );

    const { rows: insertedProducts } = await db.query(
      "insert into public.products (name, stock) values ('Serum', 5) returning id"
    );
    const productId = insertedProducts[0].id;
    await db.query("update public.products set stock = 4 where id = $1", [productId]);
    assert.equal((await db.query(
      "select count(*)::integer as count from public.email_outbox where event_key = 'low-stock'"
    )).rows[0].count, 1);

    await db.query("update public.products set stock = 6 where id = $1", [productId]);
    await db.query("update public.products set stock = 5 where id = $1", [productId]);
    assert.equal((await db.query(
      "select count(*)::integer as count from public.email_outbox where event_key = 'low-stock'"
    )).rows[0].count, 2);

    const { rows: variantProducts } = await db.query(
      "insert into public.products (name, stock) values ('Shade range', 20) returning id"
    );
    const variantProductId = variantProducts[0].id;
    const { rows: variants } = await db.query(
      `insert into public.product_variants (product_id, name, type, stock)
       values ($1, 'Warm beige', 'shade', 5) returning id`,
      [variantProductId]
    );
    await db.query("update public.products set stock = 4 where id = $1", [variantProductId]);
    assert.equal((await db.query(
      "select count(*)::integer as count from public.email_outbox where event_key = 'low-stock'"
    )).rows[0].count, 3);

    await db.query("update public.product_variants set stock = 6 where id = $1", [variants[0].id]);
    await db.query("update public.product_variants set stock = 5 where id = $1", [variants[0].id]);
    assert.equal((await db.query(
      "select count(*)::integer as count from public.email_outbox where event_key = 'low-stock'"
    )).rows[0].count, 4);
  } finally {
    await db.close();
  }
});
