/**
 * POS API Product Service
 * Replaces Supabase implementation with direct POS API calls.
 */

import { supabase } from "../utils/supabase.js";

const API_URL = (
  import.meta.env.VITE_POS_API_URL || 'https://delady-api-production.up.railway.app/api'
).replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_POS_API_KEY;

async function apiFetch(endpoint, options = {}) {
  if (!API_KEY?.trim()) {
    throw new Error('VITE_POS_API_KEY is not configured for this build.');
  }

  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY.trim(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    const responseType = contentType || 'an unknown content type';
    throw new Error(
      `POS API returned ${responseType} instead of JSON (HTTP ${response.status}). Check VITE_POS_API_URL and the deployed POS API configuration.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `POS API error: ${response.status} ${response.statusText}`
    );
  }

  return data;
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

function mapProduct(prod) {
  if (!prod) return null;

  const categoryName = prod.Category || prod.category || 'General';
  const categorySlug = categoryName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'general';
  const categoryId = prod.GroupID ?? prod.category_id ?? categoryName;

  return {
    id: prod.ProductID ?? prod.id,
    name: prod.ProductName || prod.name || 'Unnamed Product',
    description: prod.description || '',
    price: Number(prod.SellPrice ?? prod.price) || 0,
    image_url: prod.image_url || '/assets/placeholder.jpg',
    rating: Number(prod.average_rating) || 0,
    review_count: Number(prod.reviews_count) || 0,
    stock: Number(prod.QtyInStock ?? prod.stock_quantity ?? prod.stock) || 0,
    tags: Array.isArray(prod.tags) ? prod.tags : [],
    is_featured: !!prod.is_featured,
    created_at: prod.created_at,
    category_id: categoryId,
    categories: { id: categoryId, name: categoryName, slug: categorySlug },
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
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return (data || []).map(mapCategory);
}

/**
 * Fetch products with optional filters
 */
export async function getProducts(options = {}) {
  const {
    category = null,
    tag = null,
    page = 0,
    pageSize = 9,
  } = options;
  const params = new URLSearchParams();

  if (category) params.append('category', category);
  if (tag) params.append('q', tag);
  const apiPage = Math.max(1, Number(page) + 1);
  const apiPageSize = Math.min(100, Math.max(1, Number(pageSize) || 9));
  params.append('page', apiPage);
  params.append('pageSize', apiPageSize);

  const data = await apiFetch(`/products?${params.toString()}`);
  const productsRaw = Array.isArray(data) ? data : (data.products || []);
  const total = data.total ?? productsRaw.length;

  return {
    products: productsRaw.map(mapProduct),
    total: total,
    page,
    pageSize: apiPageSize,
    totalPages: data.totalPages ?? Math.ceil(total / apiPageSize),
  };
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id) {
  const prod = await apiFetch(`/products/${id}`);
  return mapProduct(prod);
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts(limit = 4) {
  const { products } = await getProducts({ pageSize: limit });
  return products;
}

/**
 * Related products — same category, excludes current product
 */
export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const params = new URLSearchParams({
    category: categoryId,
    page: '1',
    pageSize: String(Math.min(100, limit + 1)),
  });
  const data = await apiFetch(`/products?${params.toString()}`);
  const productsRaw = Array.isArray(data) ? data : (data.products || []);

  return productsRaw
    .map(mapProduct)
    .filter(p => p.id !== excludeId)
    .slice(0, limit);
}

/**
 * Search products by name or description
 */
export async function searchProducts(searchQuery, limit = 6) {
  const params = new URLSearchParams({ q: searchQuery, page: '1', pageSize: String(limit) });
  const data = await apiFetch(`/products?${params.toString()}`);
  const productsRaw = Array.isArray(data) ? data : (data.products || []);
  return productsRaw.map(mapProduct);
}

/**
 * Get delivery fee for a specific Nigerian state
 * Note: Still using Supabase for delivery zones as they aren't in POS API
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

export async function getDeliveryZones() {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("fee", { ascending: true });

  if (error) throw error;
  return data || [];
}
