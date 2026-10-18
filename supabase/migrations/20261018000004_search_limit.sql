-- Island Connect: allow larger result pages now that the directory holds hundreds of listings.
-- Same behaviour as before; only the upper limit changes from 100 to 500.
create or replace function public.search_businesses(
  p_country text,
  p_query text default null,
  p_category text default null,
  p_island text default null,
  p_district text default null,
  p_verified_only boolean default false,
  p_min_rating numeric default null,
  p_sort text default 'relevance',
  p_limit int default 50
)
returns table (business_id uuid, rank real)
language sql stable security invoker set search_path = public as $$
  with q as (
    select case when coalesce(trim(p_query), '') = '' then null
                else websearch_to_tsquery('english', p_query) end as tsq
  ),
  cat as (
    select c.id from public.categories c
    where p_category is not null
      and (c.slug = p_category or c.parent_id = (select id from public.categories where slug = p_category))
  )
  select b.id, coalesce(ts_rank(b.search_text, q.tsq), 0)::real as rank
  from public.businesses b, q
  where b.listing_status = 'published'
    and exists (select 1 from public.business_countries bc where bc.business_id = b.id and bc.country_code = p_country)
    and (q.tsq is null or b.search_text @@ q.tsq or b.name ilike '%' || p_query || '%')
    and (p_category is null or exists (
      select 1 from public.business_categories x where x.business_id = b.id and x.category_id in (select id from cat)))
    and (p_island is null or exists (
      select 1 from public.business_locations l join public.islands i on i.id = l.island_id
      where l.business_id = b.id and i.slug = p_island and i.country_code = p_country)
      or exists (
      select 1 from public.business_service_areas sa join public.islands i on i.id = sa.island_id
      where sa.business_id = b.id and i.slug = p_island and i.country_code = p_country))
    and (p_district is null or exists (
      select 1 from public.business_locations l join public.districts d on d.id = l.district_id
      where l.business_id = b.id and d.slug = p_district and d.country_code = p_country))
    and (not p_verified_only or (b.verification_status = 'verified' and not b.is_demo))
    and (p_min_rating is null or b.rating_avg >= p_min_rating)
  order by
    case when p_sort = 'rating' then b.rating_avg end desc nulls last,
    case when p_sort = 'newest' then b.created_at end desc,
    rank desc,
    b.is_demo asc,
    b.name asc
  limit least(greatest(p_limit, 1), 500);
$$;
