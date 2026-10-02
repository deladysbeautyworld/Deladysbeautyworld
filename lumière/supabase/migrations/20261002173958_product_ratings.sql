create table public.product_reviews (
  product_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  constraint product_reviews_product_user_key unique (product_id, user_id)
);

create index product_reviews_user_id_idx
  on public.product_reviews (user_id);

alter table public.product_reviews enable row level security;

revoke all on table public.product_reviews from public, anon, authenticated;
grant select, insert, update on table public.product_reviews to authenticated;

create policy product_reviews_select_own
  on public.product_reviews for select to authenticated
  using ((select auth.uid()) = user_id);

create policy product_reviews_insert_own
  on public.product_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy product_reviews_update_own
  on public.product_reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.get_product_review_summary(p_product_id text)
returns table (average_rating numeric, reviews_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(avg(review.rating), 0)::numeric, count(*)::bigint
  from public.product_reviews as review
  where review.product_id = p_product_id;
$$;

revoke all on function public.get_product_review_summary(text) from public;
grant execute on function public.get_product_review_summary(text) to anon, authenticated;