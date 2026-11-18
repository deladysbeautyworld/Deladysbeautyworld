import assert from "node:assert/strict";
import test from "node:test";

import {
  createLowStockEmail,
  createOrderEmail,
  escapeHtml,
  sendEmail,
  validEmail,
} from "../server/email.js";

test("escapes untrusted HTML values", () => {
  assert.equal(
    escapeHtml(`<script a="b">&'`),
    "&lt;script a=&quot;b&quot;&gt;&amp;&#39;"
  );
});

test("accepts valid email addresses and rejects malformed or oversized input", () => {
  assert.equal(validEmail("customer@example.com"), true);
  assert.equal(validEmail("not-an-email"), false);
  assert.equal(validEmail(`x${"a".repeat(250)}@example.com`), false);
});

test("sends every transactional email using the configured branded sender", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM_EMAIL;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_FROM_EMAIL = "orders@deladysbeautyworld.com";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ id: "email-test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await sendEmail({
      to: "customer@example.com",
      subject: "Order update",
      text: "Your order has shipped.",
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previousFrom;
  }

  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(JSON.parse(request.options.body).from, "orders@deladysbeautyworld.com");
});

test("order email includes escaped customer data and tracking links", () => {
  const email = createOrderEmail({
    id: "event-1",
    event_key: "status-shipped",
    recipient: "customer@example.com",
    payload: {
      order_id: "12345678-90ab-cdef-1234-567890abcdef",
      name: "<Customer>",
      status: "shipped",
      tracking_number: "TRACK-123",
      tracking_url: "https://carrier.example/track?id=1&source=store",
    },
  });
  assert.equal(email.to, "customer@example.com");
  assert.equal(email.idempotencyKey, "outbox-event-1");
  assert.match(email.html, /&lt;Customer&gt;/);
  assert.match(email.html, /https:\/\/carrier\.example\/track\?id=1&amp;source=store/);
  assert.match(email.text, /TRACK-123/);
});

test("low-stock email escapes product names and formats its quantity", () => {
  const email = createLowStockEmail({
    id: "event-2",
    payload: { product_name: "<Cream>", stock: 1 },
  }, "admin@example.com");
  assert.equal(email.to, "admin@example.com");
  assert.match(email.html, /&lt;Cream&gt;/);
  assert.match(email.text, /1 units remaining/);
});
