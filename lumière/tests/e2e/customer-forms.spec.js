import { expect, test } from "@playwright/test";

test("contact form confirms receipt only after the message is delivered", async ({ page }) => {
  let submittedMessage;
  await page.route("**/api/contact", async (route) => {
    submittedMessage = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sent: true }),
    });
  });

  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Test Customer");
  await page.getByLabel("Email").fill("customer@example.com");
  await page.getByLabel("Message").fill("I have a question about an order.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("heading", { name: "Thanks — we received your message" })).toBeVisible();
  expect(submittedMessage).toMatchObject({
    name: "Test Customer",
    email: "customer@example.com",
    message: "I have a question about an order.",
  });
});

test("contact form shows a retryable error when delivery fails", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({ error: "Could not send your message. Please try again." }),
  }));

  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Test Customer");
  await page.getByLabel("Email").fill("customer@example.com");
  await page.getByLabel("Message").fill("Please help.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("alert")).toHaveText("Could not send your message. Please try again.");
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
});

test("newsletter signup requires consent and submits to the mailing-list API", async ({ page }) => {
  let signup;
  await page.route("**/api/newsletter", async (route) => {
    signup = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ subscribed: true }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Your email address").fill("customer@example.com");
  await page.getByLabel("I agree to receive beauty news and offers. I can unsubscribe anytime.").check();
  await page.getByRole("button", { name: "Subscribe" }).click();

  await expect(page.getByText("You're on the list. Welcome to De Lady's Beauty World.")).toBeVisible();
  expect(signup).toEqual({ email: "customer@example.com", consent: true });
});

test("newsletter signup leaves the form available when subscription fails", async ({ page }) => {
  await page.route("**/api/newsletter", (route) => route.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({ error: "Could not subscribe right now. Please try again." }),
  }));

  await page.goto("/");
  await page.getByLabel("Your email address").fill("customer@example.com");
  await page.getByLabel("I agree to receive beauty news and offers. I can unsubscribe anytime.").check();
  await page.getByRole("button", { name: "Subscribe" }).click();

  await expect(page.getByRole("alert")).toHaveText("Could not subscribe right now. Please try again.");
  await expect(page.getByRole("button", { name: "Subscribe" })).toBeVisible();
});
