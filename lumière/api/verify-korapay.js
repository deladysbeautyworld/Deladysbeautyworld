export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.KORAPAY_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Payment verification is not configured." });
  }

  const reference = String(req.body?.reference || "").trim();
  const paymentReference = String(req.body?.paymentReference || "").trim();
  const expectedAmount = Number(req.body?.expectedAmount);
  if (!reference || !paymentReference || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return res.status(400).json({ error: "Missing or invalid payment details." });
  }

  try {
    const response = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const payload = await response.json();
    const transaction = payload?.data;

    if (!response.ok || transaction?.status !== "success" ||
        (transaction.transaction_status && transaction.transaction_status !== "success")) {
      return res.status(400).json({ error: "Payment was not successful." });
    }

    const verifiedPaymentReference = transaction.payment_reference ?? transaction.reference;
    const verifiedAmount = Number(transaction.amount_expected ?? transaction.amount);
    if (verifiedPaymentReference !== paymentReference ||
        transaction.currency !== "NGN" || verifiedAmount !== expectedAmount) {
      return res.status(400).json({ error: "Payment details do not match this order." });
    }

    return res.status(200).json({
      reference: paymentReference,
      amount: verifiedAmount,
      currency: transaction.currency,
      status: transaction.status,
    });
  } catch {
    return res.status(502).json({ error: "Could not verify payment." });
  }
}