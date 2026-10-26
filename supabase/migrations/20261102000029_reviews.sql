-- Island Connect: ratings and reviews (no tipping).
-- Only real customers can review: someone whose ride with the business was completed (or who
-- was picked up), or who messaged the business and got a reply. One review per ride or
-- conversation; it can be edited. Businesses' star ratings update automatically.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('trip', 'service')),
  request_id uuid references public.trip_requests(id) on delete set null,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, request_id),
  unique (author_id, enquiry_id)
);
create index if not exists reviews_business_idx on public.reviews (business_id, created_at desc);
alter table public.reviews enable row level security;
drop policy if exists "people see their own reviews" on public.reviews;
create policy "people see their own reviews" on public.reviews for select using (author_id = auth.uid() or public.is_admin());

-- Recalculate a business's star rating from its published reviews.
create or replace function public.refresh_rating(p_business uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('island.system_change', 'on', true);
  update businesses b set
    rating_avg = (select round(avg(rating)::numeric, 2) from reviews where business_id = p_business and status = 'published'),
    rating_count = (select count(*) from reviews where business_id = p_business and status = 'published')
  where b.id = p_business;
  perform set_config('island.system_change', 'off', true);
end;
$$;
revoke all on function public.refresh_rating(uuid) from public, anon, authenticated;

-- Submit or update a review. p_kind 'trip' with a trip request id, or 'service' with a conversation id.
create or replace function public.submit_review(p_kind text, p_ref uuid, p_rating integer, p_comment text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_business uuid; v_id uuid; v_comment text := nullif(left(trim(coalesce(p_comment, '')), 1000), '');
begin
  if auth.uid() is null then raise exception 'Sign in to leave a review'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Choose between 1 and 5 stars'; end if;
  if p_kind = 'trip' then
    select q.business_id into v_business from trip_requests r join trip_quotes q on q.id = r.accepted_quote_id
    where r.id = p_ref and r.customer_id = auth.uid() and (r.status = 'completed' or r.picked_up_at is not null);
    if v_business is null then raise exception 'You can rate a ride once it has taken place'; end if;
    insert into reviews (business_id, author_id, kind, request_id, rating, comment)
    values (v_business, auth.uid(), 'trip', p_ref, p_rating, v_comment)
    on conflict (author_id, request_id) do update set rating = excluded.rating, comment = excluded.comment, updated_at = now()
    returning id into v_id;
  elsif p_kind = 'service' then
    select e.business_id into v_business from enquiries e
    where e.id = p_ref and e.customer_id = auth.uid()
      and exists (select 1 from enquiry_messages m join business_members bm on bm.business_id = e.business_id and bm.user_id = m.sender_id where m.enquiry_id = e.id);
    if v_business is null then raise exception 'You can review a business once it has replied to you'; end if;
    if exists (select 1 from business_members where business_id = v_business and user_id = auth.uid()) then raise exception 'You can’t review your own business'; end if;
    insert into reviews (business_id, author_id, kind, enquiry_id, rating, comment)
    values (v_business, auth.uid(), 'service', p_ref, p_rating, v_comment)
    on conflict (author_id, enquiry_id) do update set rating = excluded.rating, comment = excluded.comment, updated_at = now()
    returning id into v_id;
  else
    raise exception 'Unknown review type';
  end if;
  perform public.refresh_rating(v_business);
  return v_id;
end;
$$;

-- Public reviews for a business page: first name only.
create or replace function public.business_reviews(p_business uuid, p_limit integer default 20)
returns table (id uuid, rating smallint, comment text, kind text, created_at timestamptz, author text)
language sql stable security definer set search_path = public as $$
  select r.id, r.rating, r.comment, r.kind, r.created_at,
         coalesce(nullif(split_part(coalesce(p.full_name, ''), ' ', 1), ''), 'Customer')
  from reviews r left join profiles p on p.id = r.author_id
  where r.business_id = p_business and r.status = 'published'
  order by r.created_at desc limit least(coalesce(p_limit, 20), 100);
$$;

-- What the signed-in person can rate now: their latest finished ride not yet rated (last 7 days).
create or replace function public.pending_rating()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('kind', 'trip', 'ref', r.id, 'business', b.name,
           'driver', nullif(split_part(coalesce(o.driver_name, ''), ' ', 1), ''), 'dropoff', r.dropoff, 'country', r.country_code)
  from trip_requests r
  join trip_quotes q on q.id = r.accepted_quote_id
  join businesses b on b.id = q.business_id
  left join operator_profiles o on o.business_id = q.business_id
  where r.customer_id = auth.uid() and (r.status = 'completed' or r.picked_up_at is not null)
    and r.updated_at > now() - interval '7 days'
    and not exists (select 1 from reviews v where v.author_id = auth.uid() and v.request_id = r.id)
  order by r.updated_at desc limit 1;
$$;

-- Admin moderation: hide or show a review.
create or replace function public.admin_set_review_status(p_review uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_business uuid;
begin
  if not public.is_admin() then raise exception 'Only administrators can moderate reviews'; end if;
  update reviews set status = p_status, updated_at = now() where id = p_review returning business_id into v_business;
  if v_business is not null then perform public.refresh_rating(v_business); end if;
end;
$$;

revoke all on function public.submit_review(text, uuid, integer, text), public.pending_rating(), public.admin_set_review_status(uuid, text) from public, anon;
grant execute on function public.submit_review(text, uuid, integer, text), public.pending_rating(), public.admin_set_review_status(uuid, text) to authenticated;
revoke all on function public.business_reviews(uuid, integer) from public;
grant execute on function public.business_reviews(uuid, integer) to anon, authenticated;
