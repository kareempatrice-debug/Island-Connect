-- Island Connect: Stage 1 — business registration, sourced (unclaimed) listings,
-- ownership claims, admin review, and the fixed-fare table.

------------------------------------------------------------------------------
-- Where a listing came from and whether its owner has taken it over
------------------------------------------------------------------------------
create type public.claim_status as enum ('unclaimed', 'claimed');
create type public.review_status as enum ('pending', 'approved', 'rejected');

alter table public.businesses
  add column claim_status public.claim_status not null default 'claimed',
  add column source_url text check (source_url is null or source_url ~ '^https?://'),
  add column source_note text check (char_length(source_note) <= 500),
  add column source_checked_at date,
  add column review_note text check (char_length(review_note) <= 1000),
  add column created_by uuid references auth.users(id);

-- A listing added from research must say where its facts came from and when they were checked.
alter table public.businesses add constraint unclaimed_requires_source check (
  claim_status = 'claimed' or is_demo or (source_url is not null and source_checked_at is not null)
);

------------------------------------------------------------------------------
-- Ownership claims
------------------------------------------------------------------------------
create table public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimant_name text not null check (char_length(claimant_name) between 2 and 120),
  role_at_business text not null check (char_length(role_at_business) between 2 and 80),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  evidence text not null check (char_length(evidence) between 10 and 2000),
  status public.review_status not null default 'pending',
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- One open claim per person per listing.
create unique index business_claims_one_pending on public.business_claims (business_id, user_id) where status = 'pending';

alter table public.business_claims enable row level security;
create policy "claimants read own claims" on public.business_claims for select using (user_id = auth.uid() or public.is_admin());
create policy "claimants submit claims" on public.business_claims for insert with check (
  user_id = auth.uid() and status = 'pending' and reviewed_by is null
  and exists (select 1 from public.businesses b where b.id = business_id and b.claim_status = 'unclaimed' and not b.is_demo)
);

------------------------------------------------------------------------------
-- Shared helper: create a business with its location, categories and service areas
------------------------------------------------------------------------------
create or replace function public.unique_business_slug(p_name text)
returns text language plpgsql stable set search_path = public as $$
declare base text; candidate text; n int := 1;
begin
  base := trim(both '-' from regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'business'; end if;
  base := left(base, 60);
  candidate := base;
  while exists (select 1 from public.businesses where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_business_core(
  p jsonb, p_listing public.listing_status, p_claim public.claim_status, p_owner uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_country text := p ->> 'country';
  v_island uuid;
  v_district uuid;
  v_cat text;
  v_first boolean := true;
  v_count int := 0;
begin
  select id into v_island from islands where country_code = v_country and slug = p ->> 'island';
  if v_island is null then raise exception 'Unknown island for this country'; end if;
  select id into v_district from districts where country_code = v_country and slug = p ->> 'district';

  insert into businesses (slug, name, tagline, description, phone_e164, whatsapp_e164, email, website,
                          payment_methods, listing_status, claim_status, source_url, source_note, source_checked_at, created_by)
  values (
    unique_business_slug(p ->> 'name'),
    trim(p ->> 'name'),
    nullif(trim(p ->> 'tagline'), ''),
    nullif(trim(p ->> 'description'), ''),
    nullif(p ->> 'phone', ''),
    nullif(p ->> 'whatsapp', ''),
    nullif(lower(trim(p ->> 'email')), ''),
    nullif(trim(p ->> 'website'), ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'paymentMethods', '[]'::jsonb))), '{}'),
    p_listing, p_claim,
    nullif(p ->> 'sourceUrl', ''), nullif(p ->> 'sourceNote', ''), nullif(p ->> 'sourceCheckedAt', '')::date,
    auth.uid()
  ) returning id into v_id;

  insert into business_locations (business_id, country_code, island_id, district_id, landmark, lat, lng, is_primary)
  values (v_id, v_country, v_island, v_district, nullif(trim(p ->> 'landmark'), ''),
          nullif(p ->> 'lat', '')::double precision, nullif(p ->> 'lng', '')::double precision, true);
  insert into business_service_areas (business_id, island_id) values (v_id, v_island);

  for v_cat in select jsonb_array_elements_text(coalesce(p -> 'categories', '[]'::jsonb)) loop
    insert into business_categories (business_id, category_id, is_primary)
    select v_id, c.id, v_first from categories c
    join country_categories cc on cc.category_id = c.id and cc.country_code = v_country and cc.is_enabled
    where c.slug = v_cat and c.parent_id is not null;
    if found then v_first := false; v_count := v_count + 1; end if;
  end loop;
  if v_count = 0 then raise exception 'Choose at least one category'; end if;
  if v_count > 3 then raise exception 'Choose no more than three categories'; end if;

  if p_owner is not null then
    insert into business_members (business_id, user_id, role) values (v_id, p_owner, 'owner');
  end if;
  return v_id;
end;
$$;
revoke all on function public.create_business_core(jsonb, public.listing_status, public.claim_status, uuid) from public, anon, authenticated;

------------------------------------------------------------------------------
-- Self-service registration (signed-in users)
------------------------------------------------------------------------------
create or replace function public.register_business(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slug text;
begin
  if auth.uid() is null then raise exception 'Sign in to register a business'; end if;
  if char_length(coalesce(trim(p ->> 'name'), '')) < 2 then raise exception 'Enter the business name'; end if;
  if coalesce(p ->> 'phone', '') = '' and coalesce(p ->> 'whatsapp', '') = '' and coalesce(p ->> 'email', '') = '' then
    raise exception 'Add at least one way for customers to contact you';
  end if;
  -- Light abuse protection: at most three registrations awaiting review per person.
  if (select count(*) from businesses b join business_members m on m.business_id = b.id
      where m.user_id = auth.uid() and b.listing_status = 'pending_review') >= 3 then
    raise exception 'You already have three businesses awaiting review';
  end if;
  v_id := create_business_core(p, 'pending_review', 'claimed', auth.uid());
  select slug into v_slug from businesses where id = v_id;
  insert into audit_events (actor_id, action, entity_type, entity_id) values (auth.uid(), 'business.registered', 'business', v_id::text);
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;
grant execute on function public.register_business(jsonb) to authenticated;

------------------------------------------------------------------------------
-- Admin: add a researched listing, review registrations and claims
------------------------------------------------------------------------------
create or replace function public.admin_add_listing(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slug text;
begin
  if not is_admin() then raise exception 'Administrators only'; end if;
  if coalesce(p ->> 'sourceUrl', '') = '' or coalesce(p ->> 'sourceCheckedAt', '') = '' then
    raise exception 'Researched listings need a source link and the date it was checked';
  end if;
  v_id := create_business_core(p, 'published', 'unclaimed', null);
  select slug into v_slug from businesses where id = v_id;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'business.added_from_research', 'business', v_id::text, jsonb_build_object('source', p ->> 'sourceUrl'));
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;
grant execute on function public.admin_add_listing(jsonb) to authenticated;

create or replace function public.admin_review_business(p_business uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Administrators only'; end if;
  update businesses
     set listing_status = case when p_approve then 'published'::listing_status else 'draft'::listing_status end,
         review_note = nullif(trim(p_note), '')
   where id = p_business and listing_status = 'pending_review';
  if not found then raise exception 'That registration is not awaiting review'; end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'business.approved' else 'business.rejected' end, 'business', p_business::text,
          jsonb_build_object('note', p_note));
end;
$$;
grant execute on function public.admin_review_business(uuid, boolean, text) to authenticated;

create or replace function public.admin_review_claim(p_claim uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c business_claims;
begin
  if not is_admin() then raise exception 'Administrators only'; end if;
  select * into c from business_claims where id = p_claim and status = 'pending' for update;
  if not found then raise exception 'That claim is not awaiting review'; end if;
  update business_claims set status = case when p_approve then 'approved'::review_status else 'rejected'::review_status end,
         review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_claim;
  if p_approve then
    insert into business_members (business_id, user_id, role) values (c.business_id, c.user_id, 'owner')
      on conflict (business_id, user_id) do update set role = 'owner';
    update businesses set claim_status = 'claimed' where id = c.business_id;
    -- Any other open claims on the same listing are closed.
    update business_claims set status = 'rejected', review_note = 'Listing claimed by another person',
           reviewed_by = auth.uid(), reviewed_at = now()
     where business_id = c.business_id and status = 'pending' and id <> p_claim;
  end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'claim.approved' else 'claim.rejected' end, 'business_claim', p_claim::text,
          jsonb_build_object('business', c.business_id, 'note', p_note));
end;
$$;
grant execute on function public.admin_review_claim(uuid, boolean, text) to authenticated;

------------------------------------------------------------------------------
-- Fixed fares for common routes (used by rides in Stage 3)
------------------------------------------------------------------------------
create table public.fare_rules (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  from_place text not null,
  to_place text not null,
  vehicle text not null default 'any' check (vehicle in ('any', 'car', 'van')),
  amount numeric(10, 2) not null check (amount > 0),
  currency_code text not null default 'XCD',
  max_passengers int check (max_passengers between 1 and 20),
  notes text,
  source_title text,
  source_url text check (source_url is null or source_url ~ '^https?://'),
  verified_at date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  -- A fare is only shown to riders once its source and check date are recorded.
  constraint fare_active_requires_source check (not is_active or (source_title is not null and verified_at is not null)),
  unique (country_code, from_place, to_place, vehicle)
);
alter table public.fare_rules enable row level security;
create policy "public read active fares" on public.fare_rules for select using (is_active or public.is_admin());
create policy "admin manage fares" on public.fare_rules for all using (public.is_admin()) with check (public.is_admin());
