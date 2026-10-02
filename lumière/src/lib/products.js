/**
 * POS API Product Service
 * Replaces Supabase implementation with direct POS API calls.
 */

import { supabase } from "../utils/supabase.js";
import { getProductReviewSummaries } from "./productReviews.js";

const API_URL = (
  import.meta.env.VITE_POS_API_URL || 'https://delady-api-production.up.railway.app/api'
).replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_POS_API_KEY;
const CATEGORY_CACHE_KEY = 'lumiere.pos-categories.v2';
const CATEGORY_CACHE_TTL = 24 * 60 * 60 * 1000;
let categoriesPromise;

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

function mapProduct(prod, { includeWholesale = false } = {}) {
  if (!prod) return null;

  const imageSource = prod.image_url || prod.imageUrl;
  let imageUrl = '/assets/placeholder.jpg';
  if (imageSource) {
    try {
      imageUrl = new URL(imageSource, API_URL).href;
    } catch {
      imageUrl = imageSource;
    }
  }

  const reorderLevelValue = prod.ReOrderLevel ?? prod.reorder_level;
  const reorderLevel = reorderLevelValue === null || reorderLevelValue === undefined || reorderLevelValue === ''
    ? null
    : Number(reorderLevelValue);
  const onSaleValue = prod.OnSale ?? prod.is_on_sale ?? prod.on_sale;

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
    image_url: imageUrl,
    image_url_source: imageSource || '',
    rating: Number(prod.average_rating) || 0,
    review_count: Number(prod.reviews_count) || 0,
    stock: Number(prod.QtyInStock ?? prod.stock_quantity ?? prod.stock) || 0,
    pack_size: prod.PackSize ?? prod.pack_size ?? null,
    is_on_sale: onSaleValue === true || ['1', 'true', 'yes'].includes(String(onSaleValue).toLowerCase()),
    reorder_level: Number.isFinite(reorderLevel) ? reorderLevel : null,
    expiry_date: prod.ExpireDate ?? prod.expiry_date ?? null,
    ...(includeWholesale && {
      wholesale_price: Number(prod.WholesalePrice ?? prod.wholesale_price) || 0,
    }),
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

function normalizeInteger(value, fallback, min, max = Infinity) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

async function attachReviewSummaries(products) {
  const summaries = await getProductReviewSummaries(products.map((product) => product.id));
  return products.map((product) => ({
    ...product,
    ...(summaries.get(String(product.id)) ?? {}),
  }));
}

/**
 * Fetch all categories
 */
export async function getCategories(onUpdate) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CATEGORY_CACHE_KEY));
    if (cached?.expiresAt > Date.now() && Array.isArray(cached.categories)) {
      onUpdate?.(cached.categories);
      return cached.categories;
    }
  } catch {
    // Ignore unavailable storage and refresh categories from the POS API.
  }

  if (!categoriesPromise) {
    categoriesPromise = (async () => {
      const firstPage = await apiFetch('/products?page=1&pageSize=100');
      const categoryMap = new Map();
      const addCategories = (products) => {
        products.forEach((product) => {
          const name = String(product.Category || product.category || '').trim();
          const key = name.toLowerCase();
          if (key && !categoryMap.has(key)) {
            categoryMap.set(key, {
              id: name,
              name,
              slug: name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            });
          }
        });
      };
      const currentCategories = () => [...categoryMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const firstProducts = Array.isArray(firstPage)
        ? firstPage
        : firstPage.products || [];
      const totalPages = Number(firstPage.totalPages) || 1;
      addCategories(firstProducts);
      onUpdate?.(currentCategories());
      const concurrency = 6;
      for (let page = 2; page <= totalPages; page += concurrency) {
        const pageCount = Math.min(concurrency, totalPages - page + 1);
        const results = await Promise.all(
          Array.from({ length: pageCount }, (_, index) =>
            apiFetch(`/products?${new URLSearchParams({
              page: String(page + index),
              pageSize: '100',
            })}`)
          )
        );
        results.forEach((result) => {
          const products = Array.isArray(result) ? result : result.products || [];
          addCategories(products);
        });
        onUpdate?.(currentCategories());
      }

      const categories = currentCategories();
      try {
        window.localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({
          expiresAt: Date.now() + CATEGORY_CACHE_TTL,
          categories,
        }));
      } catch {
        // Keep the in-memory result when browser storage is unavailable.
      }
      return categories;
    })().catch((error) => {
      categoriesPromise = null;
      throw error;
    });
  }

  const categories = await categoriesPromise;
  onUpdate?.(categories);
  return categories;
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
  const normalizedPage = normalizeInteger(page, 0, 0);
  const apiPage = normalizedPage + 1;
  const apiPageSize = normalizeInteger(pageSize, 9, 1, 100);
  params.append('page', apiPage);
  params.append('pageSize', apiPageSize);

  const data = await apiFetch(`/products?${params.toString()}`);
  const productsRaw = Array.isArray(data) ? data : (data.products || []);
  const total = data.total ?? productsRaw.length;
  const products = await attachReviewSummaries(productsRaw.map(mapProduct));

  return {
    products,
    total: total,
    page: normalizedPage,
    pageSize: apiPageSize,
    totalPages: data.totalPages ?? Math.ceil(total / apiPageSize),
  };
}

/**
 * Paginated product list for the admin dashboard.
 */
export async function getAdminProducts({ search = "", page = 0, pageSize = 20 } = {}) {
  const normalizedPage = normalizeInteger(page, 0, 0);
  const normalizedPageSize = normalizeInteger(pageSize, 20, 1, 100);
  const params = new URLSearchParams({
    page: String(normalizedPage + 1),
    pageSize: String(normalizedPageSize),
  });
  if (search) params.set("q", search);

  const data = await apiFetch(`/products?${params.toString()}`);
  const productsRaw = Array.isArray(data) ? data : (data.products || []);
  const total = Number(data.total ?? productsRaw.length);

  return {
    products: productsRaw.map((product) => mapProduct(product, { includeWholesale: true })),
    total,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages: Number(data.totalPages ?? Math.ceil(total / pageSize)),
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

  const relatedProducts = productsRaw
    .map(mapProduct)
    .filter(p => p.id !== excludeId)
    .slice(0, limit);
  return attachReviewSummaries(relatedProducts);
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
