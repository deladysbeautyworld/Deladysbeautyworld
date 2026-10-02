import { supabase } from "../utils/supabase.js";

export async function getProductReviewSummary(productId) {
  const { data, error } = await supabase.rpc("get_product_review_summary", {
    p_product_id: String(productId),
  });

  if (error) throw error;
  const summary = Array.isArray(data) ? data[0] : data;

  return {
    rating: Number(summary?.average_rating ?? 0),
    count: Number(summary?.reviews_count ?? 0),
  };
}

export async function getProductReviewSummaries(productIds) {
  const ids = [...new Set(productIds.map(String))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.rpc("get_product_review_summaries", {
    p_product_ids: ids,
  });

  if (error) throw error;
  return new Map((data ?? []).map((summary) => [
    String(summary.product_id),
    {
      rating: Number(summary.average_rating ?? 0),
      review_count: Number(summary.reviews_count ?? 0),
    },
  ]));
}

export async function getCustomerProductRating(productId, userId) {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", String(productId))
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.rating ?? null;
}

export async function saveCustomerProductRating(productId, userId, rating) {
  const { data, error } = await supabase
    .from("product_reviews")
    .upsert(
      { product_id: String(productId), user_id: userId, rating },
      { onConflict: "product_id,user_id" }
    )
    .select("rating")
    .single();

  if (error) throw error;
  return data.rating;
}