export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function validEmail(value) {
  return typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendEmail({ to, subject, html, text, replyTo, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo }),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "Email provider rejected the message.");
    error.status = response.status;
    throw error;
  }
  return result;
}

export function createOrderEmail(job) {
  const order = job.payload;
  const name = escapeHtml(order.name || "Customer");
  const orderId = escapeHtml(String(order.order_id || "").slice(0, 8).toUpperCase());
  const status = escapeHtml(order.status || "");
  const trackingUrl = order.tracking_url;
  const safeTrackingUrl = typeof trackingUrl === "string" && /^https:\/\/[^\s]+$/i.test(trackingUrl)
    ? trackingUrl
    : "";
  const tracking = safeTrackingUrl
    ? `<p><a href="${escapeHtml(safeTrackingUrl)}">Track your delivery</a>${order.tracking_number ? ` (${escapeHtml(order.tracking_number)})` : ""}</p>`
    : "";
  const subject = job.event_key === "order-paid"
    ? `Order ${orderId} confirmed`
    : `Order ${orderId} update: ${status}`;
  const text = `Hello ${order.name || "Customer"}, your order ${orderId} is ${order.status}.${order.tracking_number ? ` Tracking: ${order.tracking_number}` : ""}`;

  return {
    to: job.recipient,
    subject,
    html: `<p>Hello ${name},</p><p>Your order <strong>${orderId}</strong> is now <strong>${status}</strong>.</p>${tracking}<p>Thank you for shopping with De Lady's Beauty World.</p>`,
    text,
    idempotencyKey: `outbox-${job.id}`,
  };
}

export function createLowStockEmail(job, recipient) {
  const product = escapeHtml(job.payload.product_name);
  const subjectProduct = String(job.payload.product_name).replace(/[\r\n]+/g, " ").slice(0, 160);
  const quantity = Number(job.payload.stock);
  return {
    to: recipient,
    subject: `Low stock: ${subjectProduct}`,
    html: `<p><strong>${product}</strong> has ${quantity} unit${quantity === 1 ? "" : "s"} remaining (alert threshold: 5).</p>`,
    text: `${job.payload.product_name} has ${quantity} units remaining (alert threshold: 5).`,
    idempotencyKey: `outbox-${job.id}`,
  };
}
