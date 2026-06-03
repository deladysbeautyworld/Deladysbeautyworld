import { supabase } from "../utils/supabase";

const PRODUCT_SELECT = `
  id, name, description, price, rating, review_count,
  stock, tags, is_featured, image_url, created_at,
  categories ( id, name, slug )
`;

export async function getProducts({
  category = null,
  priceRange = null,
  tag = null,
  sort = "newest",
  page = 1,
  limit = 12,
} = {}) {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" });

  // Category filter via join
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  // Price range
  if (priceRange) {
    query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
  }

  // Tag filter (array contains)
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // Sort
  switch (sort) {
    case "price_asc":   query = query.order("price", { ascending: true });  break;
    case "price_desc":  query = query.order("price", { ascending: false }); break;
    case "rating":      query = query.order("rating", { ascending: false }); break;
    case "popular":     query = query.order("review_count", { ascending: false }); break;
    default:            query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: data || [], total: count || 0 };
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function searchProducts(query, limit = 10) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .ilike("name", `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data || [];
}