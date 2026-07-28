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
  // All counts/revenue run in parallel — independent queries.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [revenueRes, todayRes, pendingRes, customerRes] = await Promise.all([
    // Revenue from completed/paid orders (excludes pending/cancelled).
    supabase
      .from("orders")
      .select("total")
      .in("status", ["paid", "processing", "shipped", "delivered"]),
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
    ordersToday:     todayRes.count    ?? 0,
    pendingOrders:   pendingRes.count  ?? 0,
    totalCustomers:  customerRes.count ?? 0,
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
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    if (error.code === "PGRST103") {
      return { orders: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  return {
    orders: data ?? [],
    total: count ?? 0,
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
 * Update order status. Valid statuses match the workflow:
 *   pending → paid → processing → shipped → delivered
 *                                       ↘ cancelled
 */
export async function updateOrderStatus(id, status) {
  const VALID = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
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
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    if (error.code === "PGRST103") {
      return { products: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  return {
    products: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Create a new product. Returns the inserted row.
 * `payload` is the validated form from the product form.
 */
export async function createProduct(payload) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name:         payload.name,
      description:  payload.description ?? null,
      price:        Number(payload.price),
      stock:        Number(payload.stock ?? 0),
      category_id:  payload.category_id ?? null,
      image_url:    payload.image_url ?? null,
      is_featured:  Boolean(payload.is_featured),
      tags:         payload.tags ?? [],
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
 * Delete a product by id. Returns void on success.
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- Customers ---------------- */

/**
 * Customer list — pulls from the profiles table (every user has a profile).
 * Includes aggregated order count + total spent.
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
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    if (error.code === "PGRST103") {
      return { customers: [], total: count ?? 0, page, pageSize, totalPages: 0 };
    }
    throw error;
  }

  // Flatten the embedded orders into summary fields so the UI doesn't
  // need to re-aggregate on every render.
  const customers = (data ?? []).map((c) => {
    const orders = c.orders ?? [];
    const completed = orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "pending"
    );
    return {
      id:          c.id,
      full_name:   c.full_name,
      email:       c.email,
      created_at:  c.created_at,
      orderCount:  orders.length,
      totalSpent:  completed.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    };
  });

  return {
    customers,
    total: count ?? 0,
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
      orders (
        id, status, total, created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
