import { createClient } from "@supabase/supabase-js";

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const authorization = req.headers.authorization || "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return json(res, 401, { error: "Sign in before finalizing an order." });
  }

  const secretKey = process.env.KORAPAY_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey || !supabaseUrl || !serviceRoleKey) {
    console.error("KoraPay order finalization is missing server environment configuration.");
    return json(res, 500, { error: "Order finalization is not configured." });
  }

  const reference = String(req.body?.reference || "").trim();
  const paymentReference = String(req.body?.paymentReference || "").trim();
  const expectedAmount = Number(req.body?.expectedAmount);
  const orderPayload = req.body?.order;
  if (
    !reference ||
    !paymentReference ||
    !Number.isSafeInteger(expectedAmount) ||
    expectedAmount <= 0 ||
    !orderPayload ||
    typeof orderPayload !== "object" ||
    Array.isArray(orderPayload)
  ) {
    return json(res, 400, { error: "Missing or invalid payment details." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return json(res, 401, { error: "Your session is invalid. Sign in and try again." });
    }

    const response = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (!response.ok) {
      console.error("KoraPay order verification failed.", { status: response.status });
      return json(res, 502, { error: "Could not verify payment." });
    }

    const result = await response.json();
    const transaction = result?.data;
    const verifiedReference = transaction?.payment_reference ?? transaction?.reference;
    const verifiedAmount = Number(transaction?.amount_expected ?? transaction?.amount);
    if (
      transaction?.status !== "success" ||
      (transaction.transaction_status && transaction.transaction_status !== "success") ||
      verifiedReference !== paymentReference ||
      transaction.currency !== "NGN" ||
      verifiedAmount !== expectedAmount
    ) {
      return json(res, 400, { error: "Payment details could not be verified." });
    }

    const { data: order, error: finalizeError } = await supabase.rpc("finalize_order", {
      payload: {
        ...orderPayload,
        payment_reference: paymentReference,
        user_id: user.id,
        verified_amount: verifiedAmount,
      },
    });
    if (finalizeError) {
      console.error("Verified KoraPay payment could not be finalized.", finalizeError);
      return json(res, 409, { error: "Payment was verified, but the order could not be finalized. Contact support with your payment reference." });
    }

    return json(res, 200, { order });
  } catch (error) {
    console.error("KoraPay order finalization failed.", error);
    return json(res, 502, { error: "Could not finalize the verified payment." });
  }
}
