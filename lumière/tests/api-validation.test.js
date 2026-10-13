import assert from "node:assert/strict";
import test from "node:test";

import contactHandler from "../api/contact.js";
import newsletterHandler from "../api/newsletter.js";

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
  };
}

test("contact endpoint rejects invalid submissions before attempting delivery", async () => {
  const response = mockResponse();
  await contactHandler({
    method: "POST",
    body: { name: "Customer", email: "bad", message: "Hello" },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /valid email/);
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
