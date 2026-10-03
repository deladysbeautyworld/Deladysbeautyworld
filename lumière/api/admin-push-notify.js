import { timingSafeEqual } from "node:crypto";
import { createServiceClient, sendError } from "../server/adminPush.js";
import { sendAdminPush } from "../server/sendAdminPush.js";

function hasValidSecret(received, expected) {
  if (typeof received !== "string" || !expected) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasValidSecret(req.headers["x-admin-push-secret"], process.env.ADMIN_PUSH_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orderId = req.body?.order_id;
  if (typeof orderId !== "string" || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(orderId)) {
    return res.status(400).json({ error: "Invalid order ID." });
  }

  try {
    const supabase = createServiceClient();
    const result = await sendAdminPush(supabase, {
      title: "New order received",
      body: "Tap to review the new order.",
      url: `/admin/orders/${orderId}`,
      tag: `new-order-${orderId}`,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Could not send new-order push notifications:", error);
    return sendError(res, error);
  }
}
