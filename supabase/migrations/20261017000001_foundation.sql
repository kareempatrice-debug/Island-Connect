-- Island Connect: foundation schema
-- Countries and geography, categories, users and roles, businesses, information articles, audit log.


------------------------------------------------------------------------------
-- Enums
------------------------------------------------------------------------------
create type public.app_role as enum ('customer', 'content_editor', 'admin');
create type public.member_role as enum ('owner', 'staff');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.listing_status as enum ('draft', 'pending_review', 'published', 'suspended');
create type public.article_section as enum ('returning-home', 'property-investment', 'start-a-business');
create type public.article_status as enum ('draft', 'in_review', 'published', 'needs_update');

------------------------------------------------------------------------------
-- Countries and geography
------------------------------------------------------------------------------
create table public.countries (
  code text primary key check (code ~ '^[a-z]{2}$'),
  name text not null,
  short_name text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  time_zone text not null,
  dialling_code text not null check (dialling_code ~ '^\+[0-9]{1,4}$'),
  district_label text not null default 'Parish',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.islands (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  slug text not null,
  name text not null,
  lat double precision,
  lng double precision,
  is_main boolean not null default false,
  unique (country_code, slug)
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  island_id uuid references public.islands(id),
  slug text not null,
  name text not null,
  unique (country_code, slug)
);

------------------------------------------------------------------------------
-- Categories (admin-managed; enabled per country)
------------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  icon text,
  booking_models text[] not null default '{}'
    check (booking_models <@ array['enquiry', 'quote', 'appointment']::text[]),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.country_categories (
  country_code text not null references public.countries(code),
  category_id uuid not null references public.categories(id) on delete cascade,
  is_enabled boolean not null default true,
  primary key (country_code, category_id)
);

------------------------------------------------------------------------------
-- Users and roles
------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_country text references public.countries(code),
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a profile automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer'::public.app_role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_app_role() = 'admin';
$$;

create or replace function public.is_content_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_app_role() in ('admin', 'content_editor');
$$;

-- Server-side and SQL-editor work runs without a signed-in user. Row Level Security
-- already blocks anonymous API users from writing, so a null auth.uid() here means
-- a trusted context (migrations, the Supabase dashboard, or the service role).
create or replace function public.is_trusted_context()
returns boolean language sql stable as $$
  select auth.uid() is null;
$$;

-- Users may not change their own role.
create or replace function public.prevent_role_self_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not (public.is_admin() or public.is_trusted_context()) then
    raise exception 'Only administrators can change roles';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.prevent_role_self_change();

------------------------------------------------------------------------------
-- Businesses
------------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 120),
  tagline text check (char_length(tagline) <= 160),
  description text check (char_length(description) <= 4000),
  logo_path text,
  cover_path text,
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  whatsapp_e164 text check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  email text,
  website text,
  social_links jsonb not null default '{}'::jsonb,
  payment_methods text[] not null default '{}',
  cancellation_policy text,
  verification_status public.verification_status not null default 'unverified',
  listing_status public.listing_status not null default 'draft',
  is_demo boolean not null default false,
  is_featured boolean not null default false,
  featured_until timestamptz,
  rating_avg numeric(3, 2),
  rating_count int not null default 0,
  search_text tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Demonstration listings can never carry a verified status.
  constraint demo_never_verified check (not (is_demo and verification_status = 'verified'))
);

create table public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  country_code text not null references public.countries(code),
  island_id uuid not null references public.islands(id),
  district_id uuid references public.districts(id),
  landmark text,
  address_line text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  is_primary boolean not null default false
);
create unique index business_locations_one_primary
  on public.business_locations (business_id) where is_primary;

-- Islands a business serves beyond its own locations (e.g. water taxis across the Grenadines).
create table public.business_service_areas (
  business_id uuid not null references public.businesses(id) on delete cascade,
  island_id uuid not null references public.islands(id),
  primary key (business_id, island_id)
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.business_categories (
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  is_primary boolean not null default false,
  primary key (business_id, category_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price_min numeric(12, 2) check (price_min >= 0),
  price_max numeric(12, 2) check (price_max >= 0),
  currency_code text not null default 'XCD',
  price_unit text,
  duration_minutes int check (duration_minutes > 0),
  booking_models text[] not null default '{enquiry}'
    check (booking_models <@ array['enquiry', 'quote', 'appointment']::text[]),
  sort_order int not null default 0,
  is_active boolean not null default true,
  check (price_max is null or price_min is null or price_max >= price_min)
);

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens time not null,
  closes time not null,
  check (closes > opens)
);

-- Countries a business appears in: its locations plus the islands it serves.
create or replace view public.business_countries with (security_invoker = true) as
  select business_id, country_code from public.business_locations
  union
  select sa.business_id, i.country_code
  from public.business_service_areas sa join public.islands i on i.id = sa.island_id;

-- Keep the search index current.
create or replace function public.refresh_business_search(p_business_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.businesses b set search_text =
    setweight(to_tsvector('english', coalesce(b.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(b.tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce((
      select string_agg(c.name, ' ') from public.business_categories bc
      join public.categories c on c.id = bc.category_id where bc.business_id = b.id), '')), 'B') ||
    setweight(to_tsvector('english', coalesce((
      select string_agg(s.name || ' ' || coalesce(s.description, ''), ' ')
      from public.services s where s.business_id = b.id), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(b.description, '')), 'D')
  where b.id = p_business_id;
end;
$$;

create or replace function public.businesses_search_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'businesses' then
    if tg_op = 'INSERT' or new.name is distinct from old.name or new.tagline is distinct from old.tagline
       or new.description is distinct from old.description then
      perform public.refresh_business_search(new.id);
    end if;
  else
    perform public.refresh_business_search(coalesce(new.business_id, old.business_id));
  end if;
  return null;
end;
$$;

create trigger businesses_search after insert or update on public.businesses
  for each row execute function public.businesses_search_trigger();
create trigger business_categories_search after insert or update or delete on public.business_categories
  for each row execute function public.businesses_search_trigger();
create trigger services_search after insert or update or delete on public.services
  for each row execute function public.businesses_search_trigger();

create index businesses_search_idx on public.businesses using gin (search_text);
create index businesses_status_idx on public.businesses (listing_status, created_at desc);
create index business_locations_country_idx on public.business_locations (country_code, island_id, district_id);
create index business_categories_category_idx on public.business_categories (category_id);

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.business_members where business_id = p_business_id and user_id = auth.uid());
$$;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = auth.uid() and role = 'owner');
$$;

-- Owners may edit their listing but not its verification, status, featuring, demo flag or ratings.
create or replace function public.guard_business_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_trusted_context()) then
    if new.verification_status is distinct from old.verification_status
       or new.listing_status is distinct from old.listing_status
       or new.is_featured is distinct from old.is_featured
       or new.featured_until is distinct from old.featured_until
       or new.is_demo is distinct from old.is_demo
       or new.rating_avg is distinct from old.rating_avg
       or new.rating_count is distinct from old.rating_count then
      raise exception 'Only administrators can change verification, status, featuring or ratings';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger businesses_admin_fields before update on public.businesses
  for each row execute function public.guard_business_admin_fields();

------------------------------------------------------------------------------
-- Search
------------------------------------------------------------------------------
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
    -- A parent category matches itself and all of its children.
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
  limit least(greatest(p_limit, 1), 100);
$$;

------------------------------------------------------------------------------
-- Information articles (with provenance)
------------------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  country_code text references public.countries(code),
  is_regional boolean not null default false,
  section public.article_section not null,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  summary text,
  body text not null default '',
  sources jsonb not null default '[]'::jsonb,
  verified_at date,
  verified_by text,
  next_review_at date,
  status public.article_status not null default 'draft',
  related_category_slugs text[] not null default '{}',
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (country_code, section, slug),
  -- An article belongs to exactly one country unless explicitly regional.
  constraint article_country_scope check ((country_code is null) = is_regional),
  -- Nothing is published without sources, a verification date and a review date.
  constraint article_publish_requires_provenance check (
    status <> 'published' or (
      jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0
      and verified_at is not null and verified_by is not null and next_review_at is not null))
);

------------------------------------------------------------------------------
-- Audit log
------------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------
alter table public.countries enable row level security;
alter table public.islands enable row level security;
alter table public.districts enable row level security;
alter table public.categories enable row level security;
alter table public.country_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_locations enable row level security;
alter table public.business_service_areas enable row level security;
alter table public.business_members enable row level security;
alter table public.business_categories enable row level security;
alter table public.services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.articles enable row level security;
alter table public.audit_events enable row level security;

-- Reference data: readable by everyone, writable by admins.
create policy "public read countries" on public.countries for select using (is_active or public.is_admin());
create policy "admin write countries" on public.countries for all using (public.is_admin()) with check (public.is_admin());
create policy "public read islands" on public.islands for select using (true);
create policy "admin write islands" on public.islands for all using (public.is_admin()) with check (public.is_admin());
create policy "public read districts" on public.districts for select using (true);
create policy "admin write districts" on public.districts for all using (public.is_admin()) with check (public.is_admin());
create policy "public read categories" on public.categories for select using (is_active or public.is_admin());
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "public read country categories" on public.country_categories for select using (true);
create policy "admin write country categories" on public.country_categories for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: users see and edit their own; admins see all.
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Businesses: published listings are public; members see their own drafts; admins see everything.
create policy "read businesses" on public.businesses for select
  using (listing_status = 'published' or public.is_business_member(id) or public.is_admin());
create policy "owners update business" on public.businesses for update
  using (public.is_business_owner(id) or public.is_admin())
  with check (public.is_business_owner(id) or public.is_admin());
create policy "admin insert business" on public.businesses for insert with check (public.is_admin());
create policy "admin delete business" on public.businesses for delete using (public.is_admin());

-- Child tables follow their parent's visibility.
create policy "read locations" on public.business_locations for select using (
  exists (select 1 from public.businesses b where b.id = business_id));
create policy "write locations" on public.business_locations for all
  using (public.is_business_owner(business_id) or public.is_admin())
  with check (public.is_business_owner(business_id) or public.is_admin());

create policy "read service areas" on public.business_service_areas for select using (
  exists (select 1 from public.businesses b where b.id = business_id));
create policy "write service areas" on public.business_service_areas for all
  using (public.is_business_owner(business_id) or public.is_admin())
  with check (public.is_business_owner(business_id) or public.is_admin());

create policy "read business categories" on public.business_categories for select using (
  exists (select 1 from public.businesses b where b.id = business_id));
create policy "write business categories" on public.business_categories for all
  using (public.is_business_owner(business_id) or public.is_admin())
  with check (public.is_business_owner(business_id) or public.is_admin());

create policy "read services" on public.services for select using (
  exists (select 1 from public.businesses b where b.id = business_id));
create policy "write services" on public.services for all
  using (public.is_business_member(business_id) or public.is_admin())
  with check (public.is_business_member(business_id) or public.is_admin());

create policy "read hours" on public.opening_hours for select using (
  exists (select 1 from public.businesses b where b.id = business_id));
create policy "write hours" on public.opening_hours for all
  using (public.is_business_member(business_id) or public.is_admin())
  with check (public.is_business_member(business_id) or public.is_admin());

-- Membership is private to the business and admins; only admins assign owners for now.
create policy "read own memberships" on public.business_members for select
  using (user_id = auth.uid() or public.is_business_owner(business_id) or public.is_admin());
create policy "admin manage memberships" on public.business_members for all
  using (public.is_admin()) with check (public.is_admin());

-- Articles: published ones are public; editors manage all.
create policy "read articles" on public.articles for select
  using (status in ('published', 'needs_update') or public.is_content_editor());
create policy "editors write articles" on public.articles for all
  using (public.is_content_editor()) with check (public.is_content_editor());

-- Audit log: admins read; nobody updates or deletes through the API.
create policy "admin read audit" on public.audit_events for select using (public.is_admin());
create policy "admin insert audit" on public.audit_events for insert with check (public.is_admin());

grant execute on function public.search_businesses to anon, authenticated;
