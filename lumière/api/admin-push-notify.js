import { timingSafeEqual } from "node:crypto";
import webPush from "web-push";
import { createServiceClient } from "../server/adminPush.js";

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

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("Admin push VAPID keys are not configured.");
    return res.status(500).json({ error: "Push notifications are not configured." });
  }

  try {
    const supabase = createServiceClient();
    const { data: subscriptions, error: queryError } = await supabase
      .from("admin_push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    if (queryError) throw queryError;
    if (!subscriptions.length) return res.status(200).json({ sent: 0 });

    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@deladysbeautyworld.com",
      publicKey,
      privateKey
    );

    const payload = JSON.stringify({
      title: "New order received",
      body: "Tap to review the new order.",
      url: `/admin/orders/${orderId}`,
      tag: `new-order-${orderId}`,
    });
    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 3600 }
        )
      )
    );

    const staleIds = [];
    let failures = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") return;
      const statusCode = result.reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(subscriptions[index].id);
      } else {
        failures += 1;
        console.error("Could not send an admin push notification:", {
          statusCode,
          message: result.reason?.message,
        });
      }
    });

    if (staleIds.length) {
      const { error: deleteError } = await supabase
        .from("admin_push_subscriptions")
        .delete()
        .in("id", staleIds);
      if (deleteError) throw deleteError;
    }

    if (failures) {
      return res.status(502).json({ error: "Some admin notifications could not be delivered." });
    }
    return res.status(200).json({ sent: results.length - staleIds.length });
  } catch (error) {
    console.error("Could not send new-order push notifications:", error);
    return res.status(500).json({ error: "Could not send new-order notifications." });
  }
}
