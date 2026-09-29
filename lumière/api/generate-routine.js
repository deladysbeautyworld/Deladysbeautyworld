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
- Include every selected product by its exact name in at least one routine step.
- If a product is only relevant to morning or evening, only include it there.
- Weekly steps are for treatments like masks, scrubs, or deep conditioning - only include if relevant products were selected.
- Keep tips practical and Nigeria-appropriate (consider humidity and climate).
- Return ONLY the JSON object, no markdown, no extra text.`;
}

function parseGroqJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  if (!clean) throw new Error("Empty response");
  return JSON.parse(clean);
}

function chooseProduct(products, keywords) {
  return (
    products.find((product) => {
      const label = `${product.name} ${product.category ?? ""}`.toLowerCase();
      return keywords.some((keyword) => label.includes(keyword));
    }) ?? null
  );
}

function buildFallbackRoutine(products) {
  const cleanser = chooseProduct(products, ["cleanser", "wash", "foam", "gel", "face wash"]);
  const toner = chooseProduct(products, ["toner", "mist", "essence"]);
  const serum = chooseProduct(products, ["serum", "treatment", "vitamin", "retinol"]);
  const moisturizer = chooseProduct(products, ["moisturizer", "cream", "lotion", "balm"]);
  const sunscreen = chooseProduct(products, ["sunscreen", "spf", "sun", "protect"]);
  const exfoliant = chooseProduct(products, ["scrub", "mask", "exfoli", "peel"]);

  const morning = [
    cleanser && {
      step: 1,
      action: "Cleanse",
      product: cleanser.name,
      tip: "Use a small amount on damp skin and rinse with lukewarm water to keep your skin fresh without stripping it.",
    },
    toner && {
      step: 2,
      action: "Tone or prep",
      product: toner.name,
      tip: "Apply with clean hands or a cotton pad to help rebalance the skin before treatment.",
    },
    serum && {
      step: 3,
      action: "Treat",
      product: serum.name,
      tip: "Apply a few drops to target your main skin goal while the skin is still slightly damp.",
    },
    moisturizer && {
      step: 4,
      action: "Moisturise",
      product: moisturizer.name,
      tip: "Seal in hydration with a light layer to keep skin comfortable in warm weather.",
    },
    sunscreen && {
      step: 5,
      action: "Protect",
      product: sunscreen.name,
      tip: "Finish with sunscreen every morning for everyday protection against UV exposure and sun damage.",
    },
  ].filter(Boolean);

  const evening = [
    cleanser && {
      step: 1,
      action: "Double cleanse",
      product: cleanser.name,
      tip: "Remove sunscreen, sweat, and product buildup thoroughly before the night repair phase.",
    },
    serum && {
      step: 2,
      action: "Targeted treatment",
      product: serum.name,
      tip: "Use this step at night to help support repair and improve your skin over time.",
    },
    moisturizer && {
      step: 3,
      action: "Replenish moisture",
      product: moisturizer.name,
      tip: "Lock in hydration with a generous but comfortable layer to support the skin barrier overnight.",
    },
  ].filter(Boolean);

  const weekly = [
    exfoliant && {
      step: 1,
      action: "Weekly refinement",
      product: exfoliant.name,
      tip: "Use this treatment 1–2 times weekly to help smooth texture and keep skin looking renewed.",
    },
  ].filter(Boolean);

  const usedProductNames = new Set(
    [...morning, ...evening, ...weekly].map((step) => step.product)
  );
  products
    .filter((product) => !usedProductNames.has(product.name))
    .forEach((product) => {
      evening.push({
        step: evening.length + 1,
        action: "Use selected product as directed",
        product: product.name,
        tip: "Follow the product label, introduce active ingredients gradually, and avoid layering anything that irritates your skin.",
      });
    });

  return {
    title: "Your Personalised Routine",
    skin_tip: "Consistency matters more than quantity. Keep the routine simple, gentle, and suited to your skin's needs.",
    morning,
    evening,
    weekly,
  };
}

function usesSelectedProducts(routine, products) {
  const sections = [routine?.morning, routine?.evening, routine?.weekly];
  if (sections.some((steps) => !Array.isArray(steps))) return false;

  const selectedNames = new Set(products.map((product) => product.name));
  const routineNames = sections
    .flatMap((steps) => steps)
    .map((step) => step?.product)
    .filter(Boolean);

  return (
    routineNames.every((name) => typeof name === "string" && selectedNames.has(name)) &&
    [...selectedNames].every((name) => routineNames.includes(name))
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
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

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(200).json({ routine: buildFallbackRoutine(safeProducts) });
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
      return res.status(200).json({ routine: buildFallbackRoutine(safeProducts) });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const routine = parseGroqJson(raw);
    if (!usesSelectedProducts(routine, safeProducts)) {
      return res.status(200).json({ routine: buildFallbackRoutine(safeProducts) });
    }
    return res.status(200).json({ routine });
  } catch (error) {
    console.error("Routine generation fallback triggered:", error);
    return res.status(200).json({ routine: buildFallbackRoutine(safeProducts) });
  }
}
