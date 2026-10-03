import { createServiceClient, requireAdmin, sendError, HttpError } from "../server/adminPush.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServiceClient();
    const user = await requireAdmin(req, supabase);
    const { action } = req.body ?? {};

    if (action === "subscribe") {
      const subscription = req.body?.subscription;
      const endpoint = subscription?.endpoint;
      const p256dh = subscription?.keys?.p256dh;
      const auth = subscription?.keys?.auth;

      if (
        typeof endpoint !== "string" ||
        typeof p256dh !== "string" ||
        typeof auth !== "string"
      ) {
        throw new HttpError(400, "A valid push subscription is required.");
      }
      let parsedEndpoint;
      try {
        parsedEndpoint = new URL(endpoint);
      } catch {
        throw new HttpError(400, "Invalid push subscription endpoint.");
      }
      const hostname = parsedEndpoint.hostname.toLowerCase();
      const isTrustedPushService =
        hostname === "fcm.googleapis.com" ||
        hostname === "push.services.mozilla.com" ||
        hostname.endsWith(".push.services.mozilla.com") ||
        hostname.endsWith(".push.apple.com") ||
        hostname.endsWith(".notify.windows.com");
      if (parsedEndpoint.protocol !== "https:" || !isTrustedPushService) {
        throw new HttpError(400, "Unsupported push subscription endpoint.");
      }

      const { error } = await supabase
        .from("admin_push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            expiration_time: subscription.expirationTime ?? null,
          },
          { onConflict: "endpoint" }
        );
      if (error) throw error;
      return res.status(200).json({ subscribed: true });
    }

    if (action === "unsubscribe") {
      const endpoint = req.body?.endpoint;
      if (typeof endpoint !== "string") {
        throw new HttpError(400, "A subscription endpoint is required.");
      }
      const { error } = await supabase
        .from("admin_push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);
      if (error) throw error;
      return res.status(200).json({ subscribed: false });
    }

    throw new HttpError(400, "Unsupported notification action.");
  } catch (error) {
    return sendError(res, error);
  }
}
