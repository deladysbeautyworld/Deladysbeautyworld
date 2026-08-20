import { supabase } from "../utils/supabase.js";

// Full detail select — includes variants, used on product detail page only
const PRODUCT_SELECT = `
  id, name, description, price, image_url, category_id,
  rating, review_count, stock, tags, is_featured, created_at,
  categories ( id, name, slug ),
  product_variants ( id, name, type, price, stock, sku )
`;

// Lightweight select — no variants, used for grids, search, homepage
const PRODUCT_GRID_SELECT = `
  id, name, description, price, image_url,
  rating, review_count, stock, tags, is_featured, created_at,
  product_variants ( id ),
  categories ( id, name, slug )
`;

function escapePostgrestPattern(value) {
  return String(value).replace(/[\\%_,().]/g, "\\$&");
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

/**
 * Fetch products with optional filters
 *
 * @param {Object} options
 * @param {string|null}  options.category  - category slug to filter by
 * @param {number|null}  options.minPrice  - minimum price in NGN (null = no lower bound)
 * @param {number|null}  options.maxPrice  - maximum price in NGN (null = no upper bound)
 * @param {string}       options.sort      - "price_asc" | "price_desc" | "rating" | "popular" | "newest"
 * @param {boolean|null} options.featured  - only featured products
 * @param {string|null}  options.tag       - single tag to filter by
 * @param {number}       options.page      - page number (0-indexed)
 * @param {number}       options.pageSize  - results per page
 */
export async function getProducts({
  category = null,
  minPrice = null,
  maxPrice = null,
  sort = "newest",
  featured = null,
  tag = null,
  page = 0,
  pageSize = 9,
} = {}) {
  let query = supabase
    .from("products")
    .select(PRODUCT_GRID_SELECT, { count: "exact" });

  // Price filters — only apply when explicitly set
  if (minPrice !== null) query = query.gte("price", minPrice);
  if (maxPrice !== null) query = query.lte("price", maxPrice);

  // Category filter
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (cat) query = query.eq("category_id", cat.id);
  }

  // Featured filter
  if (featured !== null) {
    query = query.eq("is_featured", featured);
  }

  // Tag filter
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // Sorting
  switch (sort) {
    case "price_asc":  query = query.order("price",        { ascending: true });  break;
    case "price_desc": query = query.order("price",        { ascending: false }); break;
    case "rating":     query = query.order("rating",       { ascending: false }); break;
    case "popular":    query = query.order("review_count", { ascending: false }); break;
    case "newest":
    default:           query = query.order("created_at",   { ascending: false }); break;
  }

  // Pagination
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  // 416 = range beyond available rows (empty page) — return gracefully
  if (error) {
    if (error.code === "PGRST103") {
      return { products: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  return {
    products: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Fetch a single product by ID — includes variants
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_GRID_SELECT)
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Related products — same category, excludes current product
 */
export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_GRID_SELECT)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Search products by name or description
 */
export async function searchProducts(searchQuery, limit = 6) {
  const safeQuery = escapePostgrestPattern(searchQuery);
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_GRID_SELECT)
    .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get delivery fee for a specific Nigerian state
 * Returns { fee, zone_name } or null if state not found
 */
export async function getDeliveryFee(state) {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("fee, zone_name")
    .contains("states", [state])
    .single();

  if (error) return null;
  return data;
}

/**
 * Get all delivery zones — used to build state → fee map in checkout
 */
export async function getDeliveryZones() {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("fee", { ascending: true });

  if (error) throw error;
  return data || [];
}
