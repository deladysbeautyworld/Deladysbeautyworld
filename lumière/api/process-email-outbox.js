import { createServiceClient } from "../server/adminPush.js";
import {
  createLowStockEmail,
  createOrderEmail,
  sendEmail,
} from "../server/email.js";

const json = (res, status, body) => res.status(status).json(body);
const MAX_ATTEMPTS = 10;

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed." });
  }
  if (!process.env.CRON_SECRET ||
      req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return json(res, 401, { error: "Unauthorized." });
  }

  try {
    const supabase = createServiceClient();
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { error: exhaustError } = await supabase
      .from("email_outbox")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
        last_error: "Worker stopped before completing this delivery.",
      })
      .eq("status", "processing")
      .gte("attempts", MAX_ATTEMPTS)
      .lt("updated_at", staleBefore);
    if (exhaustError) throw exhaustError;

    const { error: resetError } = await supabase
      .from("email_outbox")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("status", "processing")
      .lt("attempts", MAX_ATTEMPTS)
      .lt("updated_at", staleBefore);
    if (resetError) throw resetError;

    const { data: jobs, error: listError } = await supabase
      .from("email_outbox")
      .select("id, event_key, recipient, payload, attempts")
      .eq("status", "pending")
      .lte("next_attempt_at", new Date().toISOString())
      .order("created_at")
      .limit(10);
    if (listError) throw listError;

    let sent = 0;
    let failed = 0;
    for (const job of jobs ?? []) {
      const { data: claimed, error: claimError } = await supabase
        .from("email_outbox")
        .update({
          status: "processing",
          attempts: job.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) continue;

      try {
        let email;
        if (job.event_key === "low-stock") {
          const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;
          if (!recipient) throw new Error("ADMIN_NOTIFICATION_EMAIL is not configured.");
          email = createLowStockEmail(job, recipient);
        } else {
          email = createOrderEmail(job);
        }
        await sendEmail(email);
        const { error } = await supabase
          .from("email_outbox")
          .update({ status: "sent", updated_at: new Date().toISOString(), last_error: null })
          .eq("id", job.id)
          .eq("status", "processing");
        if (error) throw error;
        sent += 1;
      } catch (error) {
        const attempts = job.attempts + 1;
        const exhausted = attempts >= MAX_ATTEMPTS;
        const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 6));
        const { error: updateError } = await supabase
          .from("email_outbox")
          .update({
            status: exhausted ? "failed" : "pending",
            next_attempt_at: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            last_error: String(error.message || error).slice(0, 1000),
          })
          .eq("id", job.id)
          .eq("status", "processing");
        if (updateError) throw updateError;
        console.error("Outbox email delivery failed.", { jobId: job.id, attempts, error });
        failed += 1;
      }
    }

    return json(res, 200, { processed: sent + failed, sent, failed });
  } catch (error) {
    console.error("Could not process email outbox:", error);
    return json(res, 500, { error: "Could not process email queue." });
  }
}
