import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_API_URL = "https://delady-api-production.up.railway.app/api/products";
const PAGE_SIZE = 50;
const BATCH_SIZE = 250;
const SOURCE_TAG = "_external_catalog";
const UUID_NAMESPACE = Buffer.from("8f8092b52d314fc88f1d45d45b3c90c4", "hex");

const apiKey = process.env.PRODUCTS_API_KEY;
const apiUrl = process.env.PRODUCTS_API_URL || DEFAULT_API_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey || !supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set PRODUCTS_API_KEY, VITE_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in .env before syncing."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function stableProductId(externalId) {
  const bytes = createHash("sha1")
    .update(UUID_NAMESPACE)
    .update(String(externalId))
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchPage(page) {
  const url = new URL(apiUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "x-api-key": apiKey },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`Product API returned HTTP ${response.status}.`);
        }
        throw new Error(`Temporary product API error: HTTP ${response.status}.`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === 2 || error.message.startsWith("Product API returned")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
}

async function fetchCatalog() {
  const firstPage = await fetchPage(1);
  const totalPages = Number(firstPage.totalPages);
  if (!Array.isArray(firstPage.products) || !Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("Product API returned an unexpected pagination response.");
  }

  const products = [...firstPage.products];
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await fetchPage(page);
    if (!Array.isArray(result.products)) {
      throw new Error(`Product API returned invalid products for page ${page}.`);
    }
    products.push(...result.products);
    console.log(`Fetched page ${page}/${totalPages} (${products.length} products).`);
  }

  return products;
}

async function upsertCategories(products) {
  const categories = new Map();
  for (const product of products) {
    const name = String(product.Category ?? "").trim();
    const slug = slugify(name);
    if (name && slug) categories.set(slug, { name, slug });
  }

  const idsBySlug = new Map();
  const rows = [...categories.values()];
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(rows.slice(offset, offset + BATCH_SIZE), { onConflict: "slug" })
      .select("id, slug");
    if (error) throw error;
    for (const category of data ?? []) idsBySlug.set(category.slug, category.id);
  }
  return idsBySlug;
}

async function getExistingProducts(ids) {
  const existingById = new Map();
  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, description, image_url, rating, review_count, tags, is_featured, created_at, category_id")
      .in("id", ids.slice(offset, offset + BATCH_SIZE));
    if (error) throw error;
    for (const product of data ?? []) existingById.set(product.id, product);
  }
  return existingById;
}

async function getPreviouslySyncedIds() {
  const ids = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .contains("tags", [SOURCE_TAG])
      .range(offset, offset + 999);
    if (error) throw error;
    ids.push(...(data ?? []).map((product) => product.id));
    if ((data ?? []).length < 1000) return ids;
  }
}

async function syncProducts(sourceProducts, categoryIds) {
  const normalized = new Map();
  for (const source of sourceProducts) {
    const externalId = String(source.ProductID ?? "").trim();
    const name = String(source.ProductName ?? "").trim();
    const price = Number(source.SellPrice);
    const stock = Number(source.QtyInStock);
    if (!externalId || !name || !Number.isFinite(price) || !Number.isInteger(stock)) continue;

    const id = stableProductId(externalId);
    normalized.set(id, {
      id,
      externalCategory: String(source.Category ?? "").trim(),
      name,
      price,
      stock: Math.max(0, stock),
      onSale: Number(source.OnSale) === 1,
    });
  }

  const ids = [...normalized.keys()];
  const existingById = await getExistingProducts(ids);
  const rows = [...normalized.values()].map((product) => {
    const existing = existingById.get(product.id);
    const categorySlug = slugify(product.externalCategory);
    const tags = new Set(existing?.tags ?? []);
    tags.add(SOURCE_TAG);
    tags.delete("sale");
    if (product.onSale) tags.add("sale");

    return {
      id: product.id,
      name: product.name,
      description: existing?.description ?? null,
      price: product.price,
      category_id: categoryIds.get(categorySlug) ?? existing?.category_id ?? null,
      image_url: existing?.image_url ?? null,
      rating: existing?.rating ?? 0,
      review_count: existing?.review_count ?? 0,
      stock: product.stock,
      tags: [...tags],
      is_featured: existing?.is_featured ?? false,
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
  });

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const { error } = await supabase
      .from("products")
      .upsert(rows.slice(offset, offset + BATCH_SIZE), { onConflict: "id" });
    if (error) throw error;
    console.log(`Synced ${Math.min(offset + BATCH_SIZE, rows.length)}/${rows.length} products.`);
  }

  const currentIds = new Set(ids);
  const staleIds = (await getPreviouslySyncedIds()).filter((id) => !currentIds.has(id));
  for (let offset = 0; offset < staleIds.length; offset += BATCH_SIZE) {
    const { error } = await supabase
      .from("products")
      .update({ stock: 0 })
      .in("id", staleIds.slice(offset, offset + BATCH_SIZE));
    if (error) throw error;
  }

  return { synced: rows.length, unavailable: staleIds.length };
}

try {
  const sourceProducts = await fetchCatalog();
  const categoryIds = await upsertCategories(sourceProducts);
  const result = await syncProducts(sourceProducts, categoryIds);
  console.log(`Catalog sync complete: ${result.synced} products updated; ${result.unavailable} removed products set out of stock.`);
} catch (error) {
  console.error("Catalog sync failed:", error.message);
  process.exitCode = 1;
}