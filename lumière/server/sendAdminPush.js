import webPush from "web-push";
import { HttpError } from "./adminPush.js";

export async function sendAdminPush(supabase, payload, userId) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new HttpError(500, "Push notifications are not configured.");
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@deladysbeautyworld.com",
    publicKey,
    privateKey
  );

  let query = supabase
    .from("admin_push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (userId) query = query.eq("user_id", userId);

  const { data: subscriptions, error: queryError } = await query;
  if (queryError) throw queryError;
  if (!subscriptions.length) return { sent: 0 };

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
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
    throw new HttpError(502, "Some admin notifications could not be delivered.");
  }
  return { sent: results.length - staleIds.length };
}
