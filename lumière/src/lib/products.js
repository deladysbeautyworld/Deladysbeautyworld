/**
 * POS API Product Service
 * Replaces Supabase implementation with direct POS API calls.
 */

const API_URL = import.meta.env.VITE_POS_API_URL;
const API_KEY = import.meta.env.VITE_POS_API_KEY;

async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API Error ${response.status}:`, text);

    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    } catch (e) {
      throw new Error(`API Error ${response.status}: Server returned HTML or plain text instead of JSON. Check URL and API Key.`);
    }
  }

  return response.json();
}

/**
 * Mappers to ensure the frontend receives the expected data shapes
 */

function mapCategory(cat) {
  if (!cat) return null;
  return {
    id: cat.id,
    name: cat.name || 'Unknown Category',
    slug: cat.slug || `category-${cat.id}`,
  };
}

function mapProduct(prod, categoriesMap = {}) {
  if (!prod) return null;

  // Resolve category object from map or ID
  const category = categoriesMap[prod.category_id]
    ? categoriesMap[prod.category_id]
    : { id: prod.category_id, name: 'General', slug: 'general' };

  return {
    id: prod.id,
    name: prod.name || 'Unnamed Product',
    description: prod.description || '',
    price: Number(prod.price) || 0,
    image_url: prod.image_url || '/assets/placeholder.jpg',
    rating: Number(prod.average_rating) || 0,
    review_count: Number(prod.reviews_count) || 0,
    stock: Number(prod.stock_quantity) || 0,
    tags: Array.isArray(prod.tags) ? prod.tags : [],
    is_featured: !!prod.is_featured,
    created_at: prod.created_at,
    categories: category,
    product_variants: (prod.variants || []).map(v => ({
      id: v.id,
      name: v.name || 'Standard',
      type: v.type || 'variant',
      price: Number(v.price) || Number(prod.price) || 0,
      stock: Number(v.stock) || 0,
      sku: v.sku || '',
    })),
  };
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const data = await apiFetch('/categories');
  return (data.categories || data).map(mapCategory).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch products with optional filters
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
  const params = new URLSearchParams();

  if (category) params.append('category', category);
  if (minPrice !== null) params.append('minPrice', minPrice);
  if (maxPrice !== null) params.append('maxPrice', maxPrice);
  if (featured !== null) params.append('featured', featured);
  if (tag) params.append('tag', tag);
  if (sort) params.append('sort', sort);
  params.append('page', page);
  params.append('pageSize', pageSize);

  const data = await apiFetch(`/products?${params.toString()}`);

  // The POS API might return a paginated object or a raw array
  const productsRaw = data.products || data;
  const total = data.total || productsRaw.length;

  // We need categories to map them into the products
  const categoriesData = await getCategories();
  const categoriesMap = {};
  categoriesData.forEach(c => { categoriesMap[c.id] = c; });

  return {
    products: productsRaw.map(p => mapProduct(p, categoriesMap)),
    total: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id) {
  const prod = await apiFetch(`/products/${id}`);

  // Fetch category for this product
  const catRaw = await apiFetch(`/categories/${prod.category_id}`).catch(() => null);
  const category = mapCategory(catRaw);

  const categoriesMap = { [prod.category_id]: category };
  return mapProduct(prod, categoriesMap);
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts(limit = 4) {
  const data = await apiFetch(`/products?featured=true&limit=${limit}`);
  const productsRaw = data.products || data;

  const categoriesData = await getCategories();
  const categoriesMap = {};
  categoriesData.forEach(c => { categoriesMap[c.id] = c; });

  return productsRaw.map(p => mapProduct(p, categoriesMap));
}

/**
 * Related products — same category, excludes current product
 */
export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const data = await apiFetch(`/products?category=${categoryId}&limit=${limit}`);
  const productsRaw = data.products || data;

  const categoriesData = await getCategories();
  const categoriesMap = {};
  categoriesData.forEach(c => { categoriesMap[c.id] = c; });

  return productsRaw
    .filter(p => p.id !== excludeId)
    .map(p => mapProduct(p, categoriesMap))
    .slice(0, limit);
}

/**
 * Search products by name or description
 */
export async function searchProducts(searchQuery, limit = 6) {
  const data = await apiFetch(`/products?search=${encodeURIComponent(searchQuery)}&limit=${limit}`);
  const productsRaw = data.products || data;

  const categoriesData = await getCategories();
  const categoriesMap = {};
  categoriesData.forEach(c => { categoriesMap[c.id] = c; });

  return productsRaw.map(p => mapProduct(p, categoriesMap));
}

/**
 * Get delivery fee for a specific Nigerian state
 * Note: Still using Supabase for delivery zones as they aren't in POS API
 */
import { supabase } from "../utils/supabase.js";

export async function getDeliveryFee(state) {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("fee, zone_name")
    .contains("states", [state])
    .single();

  if (error) return null;
  return data;
}

export async function getDeliveryZones() {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("fee", { ascending: true });

  if (error) throw error;
  return data || [];
}
