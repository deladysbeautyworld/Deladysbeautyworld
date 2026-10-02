create or replace function public.get_product_review_summaries(p_product_ids text[])
returns table (product_id text, average_rating numeric, reviews_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select review.product_id, avg(review.rating)::numeric, count(*)::bigint
  from public.product_reviews as review
  where review.product_id = any(p_product_ids)
  group by review.product_id;
$$;

revoke all on function public.get_product_review_summaries(text[]) from public;
grant execute on function public.get_product_review_summaries(text[]) to anon, authenticated;