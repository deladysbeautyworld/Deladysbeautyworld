import webPush from "web-push";
import { HttpError } from "./adminPush.js";

export async function sendAdminPush(supabase, payload) {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").replace(/^["']|["']$/g, "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").replace(/^["']|["']$/g, "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:admin@deladysbeautyworld.com")
    .replace(/^["']|["']$/g, "")
    .trim();

  const finalSubject = (subject.startsWith("mailto:") || subject.startsWith("https://"))
    ? subject
    : `mailto:${subject}`;

  if (!publicKey || !privateKey) {
    throw new HttpError(500, "Push notifications are not configured. VAPID keys are missing.");
  }

  try {
    webPush.setVapidDetails(
      finalSubject,
      publicKey,
      privateKey
    );
  } catch (error) {
    console.error("VAPID Validation Error:", {
      message: error.message,
      publicKeyLength: publicKey.length,
      privateKeyLength: privateKey.length,
      subject: finalSubject
    });
    throw new HttpError(
      500,
      `Push server settings are invalid: ${error.message}. Verify your VAPID keys in Vercel.`
    );
  }

  const { data: subscriptions, error: queryError } = await supabase
    .from("admin_push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (queryError?.code === "42P01" || queryError?.code === "PGRST205") {
    throw new HttpError(
      503,
      "The admin push subscription table is missing. Apply the admin order push notifications SQL migration."
    );
  }
  if (queryError) throw queryError;
  if (!Array.isArray(subscriptions)) {
    throw new HttpError(500, "Could not read saved admin notification devices.");
  }
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
