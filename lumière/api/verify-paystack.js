export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Payment verification is not configured." });
  }

  const reference = String(req.body?.reference || "").trim();
  if (!reference) {
    return res.status(400).json({ error: "Missing payment reference." });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const payload = await response.json();

    if (!response.ok || payload?.data?.status !== "success") {
      return res.status(400).json({ error: "Payment was not successful." });
    }

    return res.status(200).json({
      reference,
      amount: payload.data.amount,
      currency: payload.data.currency,
      status: payload.data.status,
    });
  } catch {
    return res.status(502).json({ error: "Could not verify payment." });
  }
}
