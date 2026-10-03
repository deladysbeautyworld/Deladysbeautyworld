import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const secretKey = process.env.KORAPAY_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey || !supabaseUrl || !serviceRoleKey) {
    console.error("KoraPay webhook is missing server environment configuration.");
    return json(res, 500, { error: "Webhook is not configured." });
  }

  const { event, data } = req.body ?? {};
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json(res, 400, { error: "Invalid webhook payload." });
  }

  const signature = req.headers["x-korapay-signature"];
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) {
    return json(res, 401, { error: "Invalid webhook signature." });
  }

  const expectedSignature = createHmac("sha256", secretKey)
    .update(JSON.stringify(data))
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");
  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    return json(res, 401, { error: "Invalid webhook signature." });
  }

  if (event !== "charge.success" || data.status !== "success") {
    return json(res, 200, { received: true });
  }

  const reference = String(data.reference ?? "").trim();
  if (!reference) {
    return json(res, 400, { error: "Missing transaction reference." });
  }

  try {
    const transactionResponse = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (!transactionResponse.ok) {
      console.error("KoraPay transaction verification failed.", {
        status: transactionResponse.status,
      });
      return json(res, 502, { error: "Could not verify transaction." });
    }

    const transactionPayload = await transactionResponse.json();
    const transaction = transactionPayload?.data;
    const paymentReference = transaction?.payment_reference ?? transaction?.reference;
    const amount = Number(transaction?.amount_expected ?? transaction?.amount);
    if (
      transaction?.status !== "success" ||
      (transaction.transaction_status && transaction.transaction_status !== "success") ||
      transaction.currency !== "NGN" ||
      !paymentReference ||
      (data.payment_reference && data.payment_reference !== paymentReference) ||
      !Number.isFinite(amount) ||
      (data.amount !== undefined && Number(data.amount) !== amount)
    ) {
      console.error("KoraPay webhook transaction did not pass verification.", { reference });
      return json(res, 200, { received: true });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total, payment_method, payment_status")
      .eq("payment_reference", paymentReference)
      .maybeSingle();

    if (orderError) {
      console.error("Could not find the KoraPay order.", orderError);
      return json(res, 500, { error: "Could not process payment notification." });
    }
    if (!order) {
      return json(res, 503, { error: "Order is not available yet; retry notification." });
    }
    if (
      order.payment_method !== "korapay" ||
      Number(order.total) !== amount
    ) {
      console.error("KoraPay transaction does not match its order.", {
        orderId: order.id,
        reference: paymentReference,
      });
      return json(res, 200, { received: true });
    }
    if (order.payment_status === "paid") {
      return json(res, 200, { received: true });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order.id);

    if (updateError) {
      console.error("Could not update KoraPay order payment status.", updateError);
      return json(res, 500, { error: "Could not update order payment status." });
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error("KoraPay webhook processing failed.", error);
    return json(res, 502, { error: "Could not process payment notification." });
  }
}
