function buildPrompt(products) {
  const list = products
    .map((p) => `- ${p.name} (${p.category ?? "General"})${p.description ? `: ${p.description}` : ""}`)
    .join("\n");

  return `You are a professional skincare and beauty consultant for De Lady's Beauty World, a Nigerian beauty brand.

The customer has selected the following products:
${list}

Generate a personalised daily beauty routine using ONLY these products. Structure it as JSON with this exact format:
{
  "title": "Your Personalised Routine",
  "skin_tip": "One short personalised tip based on the products selected (max 2 sentences)",
  "morning": [
    { "step": 1, "action": "Step name", "product": "Exact product name from the list", "tip": "Short application tip" }
  ],
  "evening": [
    { "step": 1, "action": "Step name", "product": "Exact product name from the list or null if not applicable", "tip": "Short application tip" }
  ],
  "weekly": [
    { "step": 1, "action": "Step name", "product": "Exact product name or null", "tip": "Short tip" }
  ]
}

Rules:
- Only use products from the list provided. Do not invent products.
- If a product is only relevant to morning or evening, only include it there.
- Weekly steps are for treatments like masks, scrubs, or deep conditioning - only include if relevant products were selected.
- Keep tips practical and Nigeria-appropriate (consider humidity and climate).
- Return ONLY the JSON object, no markdown, no extra text.`;
}

function parseGroqJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: "Routine generator is not configured." });
  }

  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const safeProducts = products
    .filter((p) => p && p.id && p.name)
    .slice(0, 12)
    .map((p) => ({
      id: String(p.id),
      name: String(p.name).slice(0, 120),
      category: String(p.category ?? p.categories?.name ?? "General").slice(0, 80),
      description: p.description ? String(p.description).slice(0, 500) : "",
    }));

  if (safeProducts.length === 0) {
    return res.status(400).json({ error: "Select at least one product." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "groq/compound-mini",
        messages: [{ role: "user", content: buildPrompt(safeProducts) }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Routine generator failed." });
    }

    const data = await response.json();
    const routine = parseGroqJson(data.choices?.[0]?.message?.content);
    return res.status(200).json({ routine });
  } catch {
    return res.status(502).json({ error: "Could not generate routine." });
  }
}
