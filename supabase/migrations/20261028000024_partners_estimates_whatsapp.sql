-- Island Connect: partner links and QR codes (villas, hotels, airport), fare estimates on
-- requests, and WhatsApp alerts for drivers who opt in.

alter table public.trip_requests add column if not exists estimate_low_xcd numeric(10, 2) check (estimate_low_xcd is null or estimate_low_xcd > 0);
alter table public.trip_requests add column if not exists estimate_high_xcd numeric(10, 2) check (estimate_high_xcd is null or estimate_high_xcd > 0);
alter table public.trip_requests add column if not exists partner_code text;
alter table public.operator_profiles add column if not exists whatsapp_alerts boolean not null default false;

-- ---------- Partners ----------
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{3,40}$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  kind text not null default 'villa' check (kind in ('hotel', 'villa', 'airport', 'port', 'other')),
  country_code text not null check (country_code in ('gd', 'vc')),
  landing text not null default 'ride' check (landing in ('ride', 'airport', 'home')),
  contact text check (char_length(contact) <= 200),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.partner_visits (
  partner_id uuid not null references public.partners(id) on delete cascade,
  day date not null default (now() at time zone 'America/Grenada')::date,
  visits integer not null default 0,
  primary key (partner_id, day)
);
alter table public.partners enable row level security;
alter table public.partner_visits enable row level security;
drop policy if exists "admins manage partners" on public.partners;
create policy "admins manage partners" on public.partners for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read partner visits" on public.partner_visits;
create policy "admins read partner visits" on public.partner_visits for select using (public.is_admin());

-- Someone scanned a partner's QR code: count it and say where to send them.
create or replace function public.partner_landing(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p partners;
begin
  select * into p from partners where code = lower(trim(p_code)) and active;
  if p.id is null then return null; end if;
  insert into partner_visits (partner_id, day, visits) values (p.id, (now() at time zone 'America/Grenada')::date, 1)
  on conflict (partner_id, day) do update set visits = partner_visits.visits + 1;
  return jsonb_build_object('code', p.code, 'country', p.country_code, 'landing', p.landing, 'name', p.name);
end;
$$;
revoke all on function public.partner_landing(text) from public;
grant execute on function public.partner_landing(text) to anon, authenticated;

create or replace function public.admin_partner_stats()
returns table (id uuid, code text, name text, kind text, country_code text, landing text, contact text, active boolean, created_at timestamptz,
               visits_30d bigint, visits_total bigint, requests bigint, booked bigint, completed bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can see partners'; end if;
  return query
    select p.id, p.code, p.name, p.kind, p.country_code, p.landing, p.contact, p.active, p.created_at,
      (select coalesce(sum(v.visits), 0) from partner_visits v where v.partner_id = p.id and v.day > (now() at time zone 'America/Grenada')::date - 30),
      (select coalesce(sum(v.visits), 0) from partner_visits v where v.partner_id = p.id),
      (select count(*) from trip_requests r where r.partner_code = p.code),
      (select count(*) from trip_requests r where r.partner_code = p.code and r.status in ('booked', 'completed')),
      (select count(*) from trip_requests r where r.partner_code = p.code and r.status = 'completed')
    from partners p order by p.created_at desc;
end;
$$;
revoke all on function public.admin_partner_stats() from public, anon;
grant execute on function public.admin_partner_stats() to authenticated;

-- ---------- WhatsApp alerts (drivers opt in) ----------
create or replace function public.set_whatsapp_alerts(p_business uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_business_member(p_business) then raise exception 'You can only change your own business'; end if;
  update operator_profiles set whatsapp_alerts = p_on where business_id = p_business;
end;
$$;
revoke all on function public.set_whatsapp_alerts(uuid, boolean) from public, anon;
grant execute on function public.set_whatsapp_alerts(uuid, boolean) to authenticated;

-- ---------- Requests carry the estimate shown and the partner they came through ----------
create or replace function public.create_trip_request(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_when timestamptz := nullif(p->>'travel_at', '')::timestamptz; v_kind trip_kind := (p->>'kind')::trip_kind; v_partner text;
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if (select count(*) from trip_requests where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 8 then
    raise exception 'You’ve sent a lot of requests today. Please try again tomorrow.';
  end if;
  if v_when is not null and (v_when < now() - interval '1 hour' or v_when > now() + interval '180 days') then
    raise exception 'Choose a date within the next six months';
  end if;
  select code into v_partner from partners where code = lower(nullif(trim(p->>'partner_code'), '')) and active;
  insert into trip_requests (customer_id, country_code, kind, from_place, to_place, pickup, dropoff, travel_at, passengers, details, cross_border,
                             fixed_fare_xcd, fare_source, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance_km, duration_min, rider_name,
                             estimate_low_xcd, estimate_high_xcd, partner_code)
  values (auth.uid(), p->>'country', v_kind, trim(p->>'from'), trim(p->>'to'), trim(p->>'pickup'), trim(p->>'dropoff'),
          v_when, nullif(p->>'passengers', '')::int, nullif(trim(p->>'details'), ''), coalesce((p->>'cross_border')::boolean, false),
          case when v_kind in ('taxi', 'airport') then nullif(p->>'fixed_fare_xcd', '')::numeric end,
          case when v_kind in ('taxi', 'airport') then nullif(trim(p->>'fare_source'), '') end,
          nullif(p->>'pickup_lat', '')::double precision, nullif(p->>'pickup_lng', '')::double precision,
          nullif(p->>'dropoff_lat', '')::double precision, nullif(p->>'dropoff_lng', '')::double precision,
          nullif(p->>'distance_km', '')::numeric, nullif(p->>'duration_min', '')::int, nullif(trim(p->>'rider_name'), ''),
          nullif(p->>'estimate_low_xcd', '')::numeric, nullif(p->>'estimate_high_xcd', '')::numeric, v_partner)
  returning id into v_id;
  if coalesce(p->>'contact_phone', '') <> '' then
    insert into trip_contacts (request_id, phone_e164, rider_phone_e164) values (v_id, p->>'contact_phone', nullif(p->>'rider_phone', ''));
  end if;
  return v_id;
end;
$$;
