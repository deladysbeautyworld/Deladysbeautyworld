import { supabase } from "../utils/supabase.js";

/* ------------------------------------------------------------------ *
 *  Admin data access — every function talks to Supabase directly.
 *  RLS policies on the backend are expected to gate non-admin access.
 * ------------------------------------------------------------------ */

// Select used for order lists — joins the customer profile.
const ORDER_LIST_SELECT = `
  id, status, total, delivery_fee, created_at,
  shipping_name, shipping_city, shipping_state,
  profiles ( id, full_name, email )
`;

// Select used for the order detail page — includes line items + product names.
const ORDER_DETAIL_SELECT = `
  id, status, total, delivery_fee, payment_method, created_at,
  shipping_name, shipping_email, shipping_phone,
  shipping_address, shipping_city, shipping_state,
  whatsapp_number, order_note,
  profiles ( id, full_name, email ),
  order_items (
    id, quantity, unit_price,
    products ( id, name, image_url )
  )
`;

/* ---------------- Overview / dashboard ---------------- */

/**
 * Aggregate metrics for the admin dashboard.
 * Returns: { revenue, ordersToday, pendingOrders, totalCustomers }
 */
export async function getOverviewStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [revenueRes, todayRes, pendingRes, customerRes] = await Promise.all([
    // Revenue from confirmed/shipped/delivered orders only
    supabase
      .from("orders")
      .select("total")
      .in("status", ["confirmed", "shipped", "delivered"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
  ]);

  if (revenueRes.error)  throw revenueRes.error;
  if (todayRes.error)    throw todayRes.error;
  if (pendingRes.error)  throw pendingRes.error;
  if (customerRes.error) throw customerRes.error;

  const revenue = (revenueRes.data ?? []).reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0
  );

  return {
    revenue,
    ordersToday:    todayRes.count   ?? 0,
    pendingOrders:  pendingRes.count ?? 0,
    totalCustomers: customerRes.count ?? 0,
  };
}

/**
 * Most recent orders for the overview widget.
 */
export async function getRecentOrders(limit = 5) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/* ---------------- Orders ---------------- */

/**
 * Paginated order list with optional status filter.
 */
export async function listOrders({ status = null, page = 0, pageSize = 20 } = {}) {
  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const from = page * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    if (error.code === "PGRST103") {
      return { orders: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  return {
    orders:     data ?? [],
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Single order with line items — used on the order detail page.
 */
export async function getOrderDetail(id) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update order status.
 * Valid statuses match the DB constraint:
 *   pending → confirmed → shipped → delivered
 *                                 ↘ cancelled
 */
export async function updateOrderStatus(id, status) {
  const VALID = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!VALID.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ---------------- Products ---------------- */

/**
 * Admin product list — includes category name and stock, sorted by recency.
 */
export async function listAdminProducts({ search = "", page = 0, pageSize = 20 } = {}) {
  let query = supabase
    .from("products")
    .select(`
      id, name, price, stock, is_featured, created_at, image_url,
      categories ( id, name, slug )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = page * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    if (error.code === "PGRST103") {
      return { products: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  return {
    products:   data ?? [],
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Create a new product. Returns the inserted row.
 */
export async function createProduct(payload) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name:        payload.name,
      description: payload.description ?? null,
      price:       Number(payload.price),
      stock:       Number(payload.stock ?? 0),
      category_id: payload.category_id ?? null,
      image_url:   payload.image_url ?? null,
      is_featured: Boolean(payload.is_featured),
      tags:        payload.tags ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Patch a product — only the fields the caller passes are updated.
 */
export async function updateProduct(id, patch) {
  const sanitised = {};
  if ("name"        in patch) sanitised.name        = patch.name;
  if ("description" in patch) sanitised.description = patch.description;
  if ("price"       in patch) sanitised.price       = Number(patch.price);
  if ("stock"       in patch) sanitised.stock       = Number(patch.stock);
  if ("category_id" in patch) sanitised.category_id = patch.category_id;
  if ("image_url"   in patch) sanitised.image_url   = patch.image_url;
  if ("is_featured" in patch) sanitised.is_featured = Boolean(patch.is_featured);
  if ("tags"        in patch) sanitised.tags        = patch.tags;

  const { data, error } = await supabase
    .from("products")
    .update(sanitised)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a product by id.
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- Promo codes ---------------- */

/**
 * All promo codes sorted by most recently created.
 */
export async function listPromoCodes() {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Create a promo code.
 */
export async function createPromoCode(payload) {
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code:       payload.code.toUpperCase().trim(),
      type:       payload.type,
      value:      Number(payload.value),
      min_order:  Number(payload.min_order ?? 0),
      max_uses:   payload.max_uses ? Number(payload.max_uses) : null,
      expires_at: payload.expires_at ?? null,
      active:     true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle a promo code active/inactive.
 */
export async function togglePromoCode(id, active) {
  const { error } = await supabase
    .from("promo_codes")
    .update({ active })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Delete a promo code.
 */
export async function deletePromoCode(id) {
  const { error } = await supabase
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- Customers ---------------- */

/**
 * Customer list with aggregated order count + total spent.
 */
export async function listCustomers({ search = "", page = 0, pageSize = 20 } = {}) {
  let query = supabase
    .from("profiles")
    .select(`
      id, full_name, email, created_at,
      orders ( id, total, status )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = page * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    if (error.code === "PGRST103") {
      return { customers: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  const customers = (data ?? []).map((c) => {
    const orders    = c.orders ?? [];
    const completed = orders.filter(
      (o) => !["cancelled", "pending"].includes(o.status)
    );
    return {
      id:         c.id,
      full_name:  c.full_name,
      email:      c.email,
      created_at: c.created_at,
      orderCount: orders.length,
      totalSpent: completed.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    };
  });

  return {
    customers,
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Single customer with their full order history.
 */
export async function getCustomerDetail(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, full_name, email, created_at,
      orders ( id, status, total, created_at )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/* ---------------- User profile ---------------- */

/**
 * Get a single user's profile including role.
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

/* ---------------- Customer-facing orders ---------------- */

/**
 * All orders for a single user, newest first. Each order includes its line
 * items + the product name/image so the profile page can render them without
 * a follow-up query.
 */
export async function getUserOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total, delivery_fee, created_at,
      order_items (
        id, quantity, unit_price,
        products ( id, name, image_url )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* ---------------- Categories ---------------- */

/**
 * Slugify a category name. Mirrors the storefront's expected URL format.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * All categories, alphabetical by name.
 */
export async function listAdminCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Create a category. Auto-generates the slug if the caller didn't supply one.
 */
export async function createCategory({ name, slug }) {
  const finalSlug = (slug && slug.trim()) || slugify(name || "");
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), slug: finalSlug })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Patch a category by id.
 */
export async function updateCategory(id, { name, slug }) {
  const patch = {};
  if (name !== undefined) patch.name = name.trim();
  if (slug !== undefined) {
    patch.slug = (slug && slug.trim()) || (name ? slugify(name) : "");
  }

  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a category by id. Surfaces the FK violation as a thrown error if a
 * product still references the category.
 */
export async function deleteCategory(id) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- Delivery zones ---------------- */

/**
 * All delivery zones with their state arrays.
 */
export async function listAdminDeliveryZones() {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, zone_name, fee, states")
    .order("zone_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Create a delivery zone. `states` must be an array of Nigerian state names.
 */
export async function createDeliveryZone({ zone_name, fee, states }) {
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      zone_name: zone_name.trim(),
      fee:       Number(fee),
      states:    Array.isArray(states) ? states : [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Patch a delivery zone. Only the supplied fields are written.
 */
export async function updateDeliveryZone(id, { zone_name, fee, states }) {
  const patch = {};
  if (zone_name !== undefined) patch.zone_name = zone_name.trim();
  if (fee !== undefined)       patch.fee       = Number(fee);
  if (states !== undefined)    patch.states    = Array.isArray(states) ? states : [];

  const { data, error } = await supabase
    .from("delivery_zones")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a delivery zone by id.
 */
export async function deleteDeliveryZone(id) {
  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- Product variants ---------------- */

/**
 * All variants for a single product, ordered by `type` then `name` so the
 * storefront's grouping on the PDP reads naturally.
 */
export async function listProductVariants(productId) {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, name, type, price, stock, sku")
    .eq("product_id", productId)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Insert a new variant for a product. `type` is one of: shade | size | scent.
 */
export async function createVariant(productId, payload) {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      name:       payload.name.trim(),
      type:       payload.type,
      price:      Number(payload.price ?? 0),
      stock:      Number(payload.stock ?? 0),
      sku:        payload.sku?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Patch a variant. Only the supplied fields are written.
 */
export async function updateVariant(id, patch) {
  const sanitised = {};
  if ("name"  in patch) sanitised.name  = patch.name.trim();
  if ("type"  in patch) sanitised.type  = patch.type;
  if ("price" in patch) sanitised.price = Number(patch.price);
  if ("stock" in patch) sanitised.stock = Number(patch.stock);
  if ("sku"   in patch) sanitised.sku   = patch.sku?.trim() || null;

  const { data, error } = await supabase
    .from("product_variants")
    .update(sanitised)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a variant by id.
 */
export async function deleteVariant(id) {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Delete all variants for a product. Used by the inline Variants section in
 * the Products admin modal — easier than diffing when the user edits.
 */
export async function deleteVariantsForProduct(productId) {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (error) throw error;
}

/* ---------------- Overview trends (last 30d vs prior 30d) ---------------- */

function deltaPct(current, prior) {
  if (prior === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - prior) / prior) * 100);
}

/**
 * Compute trend stats: 30-day current vs 30-day prior windows.
 * Returns zeros on any per-query error so the dashboard still renders.
 */
export async function getOverviewTrendsSafe() {
  const now = new Date();
  const prior = new Date(now);
  prior.setDate(prior.getDate() - 60);
  const mid = new Date(now);
  mid.setDate(mid.getDate() - 30);

  const currentSince = mid.toISOString();
  const priorSince   = prior.toISOString();

  try {
    const [currSales, prevSales, currOrders, prevOrders, currCustomers, prevCustomers] =
      await Promise.all([
        supabase
          .from("orders")
          .select("total")
          .in("status", ["confirmed", "shipped", "delivered"])
          .gte("created_at", currentSince),
        supabase
          .from("orders")
          .select("total")
          .in("status", ["confirmed", "shipped", "delivered"])
          .gte("created_at", priorSince)
          .lt("created_at", currentSince),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", currentSince),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", priorSince)
          .lt("created_at", currentSince),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", currentSince),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", priorSince)
          .lt("created_at", currentSince),
      ]);

    const sumTotal = (rows) =>
      (rows ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0);

    const salesCurrent       = sumTotal(currSales.data);
    const salesPrior         = sumTotal(prevSales.data);
    const ordersCurrent      = currOrders.count ?? 0;
    const ordersPrior        = prevOrders.count ?? 0;
    const customersCurrent   = currCustomers.count ?? 0;
    const customersPrior     = prevCustomers.count ?? 0;

    return {
      sales: {
        current:   salesCurrent,
        prior:     salesPrior,
        deltaPct:  deltaPct(salesCurrent, salesPrior),
      },
      orders: {
        current:   ordersCurrent,
        prior:     ordersPrior,
        deltaPct:  deltaPct(ordersCurrent, ordersPrior),
      },
      customers: {
        current:   customersCurrent,
        prior:     customersPrior,
        deltaPct:  deltaPct(customersCurrent, customersPrior),
      },
    };
  } catch {
    return {
      sales:     { current: 0, prior: 0, deltaPct: 0 },
      orders:    { current: 0, prior: 0, deltaPct: 0 },
      customers: { current: 0, prior: 0, deltaPct: 0 },
    };
  }
}