import assert from "node:assert/strict";
import test from "node:test";

import contactHandler from "../api/contact.js";
import finalizeKorapayOrderHandler from "../api/finalize-korapay-order.js";
import newsletterHandler from "../api/newsletter.js";
import sitemapHandler from "../api/sitemap.xml.js";

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

test("sitemap includes canonical public pages and dynamically discovered content", async () => {
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  globalThis.fetch = async (request) => {
    const requestUrl = typeof request === "string" ? request : request.url;
    if (requestUrl.includes("/rest/v1/posts")) {
      return new Response(JSON.stringify([{ id: "post-1", slug: "skin & body" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (requestUrl === "https://delady-api-production.up.railway.app/api/products") {
      return new Response(JSON.stringify({ products: [{ id: "product-1" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected sitemap request: ${requestUrl}`);
  };

  const response = mockResponse();
  try {
    await sitemapHandler({}, response);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;
  }

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["Content-Type"], /application\/xml/);
  assert.match(response.body, /<loc>https:\/\/deladysbeautyworld\.com\/shop<\/loc>\s*<changefreq>daily<\/changefreq>\s*<priority>0\.9<\/priority>/);
  assert.match(response.body, /https:\/\/deladysbeautyworld\.com\/contact/);
  assert.match(response.body, /https:\/\/deladysbeautyworld\.com\/privacy/);
  assert.match(response.body, /https:\/\/deladysbeautyworld\.com\/journal\/skin%20%26%20body/);
  assert.match(response.body, /https:\/\/deladysbeautyworld\.com\/product\/product-1/);
  assert.doesNotMatch(response.body, /[?](category|sort|sale)=|\/(cart|checkout|profile|admin)(\/|<)/);
});

test("contact endpoint rejects invalid submissions before attempting delivery", async () => {
  const response = mockResponse();
  await contactHandler({
    method: "POST",
    body: { name: "Customer", email: "bad", message: "Hello" },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /valid email/);
});

test("contact endpoint trims the reply address and delivers through the configured sender", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM_EMAIL;
  const previousInbox = process.env.CONTACT_INBOX_EMAIL;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_FROM_EMAIL = "orders@deladysbeautyworld.com";
  process.env.CONTACT_INBOX_EMAIL = "support@example.com";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ id: "email-test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = mockResponse();
  try {
    await contactHandler({
      method: "POST",
      body: { name: "Customer", email: " customer@example.com ", message: "Hello" },
    }, response);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previousFrom;
    if (previousInbox === undefined) delete process.env.CONTACT_INBOX_EMAIL;
    else process.env.CONTACT_INBOX_EMAIL = previousInbox;
  }

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(request.options.body).from, "orders@deladysbeautyworld.com");
  assert.equal(JSON.parse(request.options.body).reply_to, "customer@example.com");
});

test("newsletter endpoint requires explicit marketing consent", async () => {
  const response = mockResponse();
  await newsletterHandler({
    method: "POST",
    body: { email: "customer@example.com", consent: false },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /confirm you want to receive updates/);
});

test("newsletter endpoint adds a normalized consented address to the configured Resend audience", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousAudienceId = process.env.RESEND_AUDIENCE_ID;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_AUDIENCE_ID = "aud_test";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ id: "contact-test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = mockResponse();
  try {
    await newsletterHandler({
      method: "POST",
      body: { email: " Customer@Example.com ", consent: true },
    }, response);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousAudienceId === undefined) delete process.env.RESEND_AUDIENCE_ID;
    else process.env.RESEND_AUDIENCE_ID = previousAudienceId;
  }

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { subscribed: true });
  assert.match(request.url, /api\.resend\.com\/audiences\/aud_test\/contacts/);
  assert.deepEqual(JSON.parse(request.options.body), {
    email: "customer@example.com",
    unsubscribed: false,
  });
});

test("KoraPay order finalization requires an authenticated session", async () => {
  const response = mockResponse();
  await finalizeKorapayOrderHandler({
    method: "POST",
    headers: {},
    body: {},
  }, response);
  assert.equal(response.statusCode, 401);
  assert.match(response.body.error, /Sign in/);
});
