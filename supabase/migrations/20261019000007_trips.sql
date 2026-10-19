-- Island Connect, Stage 3: transport operators, in-app trip requests, quotes and the commission ledger.
--
-- Flow: a transport business applies to operate; an admin approves it. A customer sends
-- a trip request (taxi, transfer, group, boat, haulage or freight). Approved operators
-- covering that country and kind of trip see it and send a quote. The customer accepts
-- one; the trip is booked. The operator marks it completed, which writes a ledger entry
-- at the current commission rate (0% at launch). No money moves through the platform.

create type public.trip_kind as enum ('taxi', 'airport', 'group', 'boat', 'haulage', 'freight');
create type public.operator_status as enum ('pending', 'approved', 'declined', 'suspended');
create type public.trip_status as enum ('open', 'booked', 'completed', 'cancelled', 'expired');
create type public.quote_status as enum ('offered', 'accepted', 'declined', 'withdrawn');

-- Platform settings (commission rate starts at 0).
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (key, value) values ('commission_rate', '0'::jsonb) on conflict do nothing;
alter table public.platform_settings enable row level security;
create policy "settings readable" on public.platform_settings for select using (true);
create policy "admins manage settings" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

-- Founder-owned label, shown publicly so customers and other operators can see it.
alter table public.businesses add column if not exists founder_owned boolean not null default false;

-- A transport business approved to receive in-app requests.
create table public.operator_profiles (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  kinds public.trip_kind[] not null check (cardinality(kinds) between 1 and 6),
  status public.operator_status not null default 'pending',
  licence_details text not null check (char_length(licence_details) between 3 and 500),
  vehicle_details text not null check (char_length(vehicle_details) between 3 and 500),
  insurance_details text check (char_length(insurance_details) <= 500),
  review_note text,
  applied_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.operator_profiles enable row level security;
create policy "operators visible to their team and admins" on public.operator_profiles for select
  using (public.is_business_member(business_id) or public.is_admin());

create table public.trip_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null references public.countries(code),
  kind public.trip_kind not null,
  from_place text not null check (char_length(from_place) between 2 and 120),
  to_place text not null check (char_length(to_place) between 2 and 120),
  pickup text not null check (char_length(pickup) between 2 and 160),
  dropoff text not null check (char_length(dropoff) between 2 and 160),
  travel_at timestamptz,                       -- null means as soon as possible
  passengers int check (passengers between 1 and 60),
  details text check (char_length(details) <= 1000),
  cross_border boolean not null default false,
  status public.trip_status not null default 'open',
  accepted_quote_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trip_requests_open_idx on public.trip_requests (country_code, kind) where status = 'open';
create index trip_requests_customer_idx on public.trip_requests (customer_id, created_at desc);
alter table public.trip_requests enable row level security;

create table public.trip_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.trip_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  amount_xcd numeric(10, 2) not null check (amount_xcd > 0 and amount_xcd < 1000000),
  includes text check (char_length(includes) <= 500),
  valid_until timestamptz not null,
  status public.quote_status not null default 'offered',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (request_id, business_id)
);
alter table public.trip_requests add constraint accepted_quote_fk foreign key (accepted_quote_id) references public.trip_quotes(id) on delete set null;
alter table public.trip_quotes enable row level security;

-- The customer's phone or WhatsApp number: shown only to the operator whose quote they accept.
create table public.trip_contacts (
  request_id uuid primary key references public.trip_requests(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$')
);
alter table public.trip_contacts enable row level security;

create table public.commission_ledger (
  id bigint generated always as identity primary key,
  request_id uuid not null unique references public.trip_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  fare_xcd numeric(10, 2) not null,
  rate numeric(5, 4) not null,
  commission_xcd numeric(10, 2) not null,
  created_at timestamptz not null default now()
);
alter table public.commission_ledger enable row level security;
create policy "ledger visible to the business and admins" on public.commission_ledger for select
  using (public.is_business_member(business_id) or public.is_admin());

-- Is this business an approved operator for this kind of trip in this country?
create or replace function public.operator_can_serve(p_business uuid, p_country text, p_kind public.trip_kind)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from operator_profiles o
    join businesses b on b.id = o.business_id and b.listing_status = 'published'
    where o.business_id = p_business and o.status = 'approved' and p_kind = any (o.kinds)
      and (exists (select 1 from business_locations l where l.business_id = b.id and l.country_code = p_country)
        or exists (select 1 from business_service_areas a join islands i on i.id = a.island_id where a.business_id = b.id and i.country_code = p_country)));
$$;

-- Can the signed-in user act for an operator that may see this request?
create or replace function public.can_see_trip_request(p_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_requests r
    where r.id = p_request and (
      r.customer_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from trip_quotes q where q.request_id = r.id and public.is_business_member(q.business_id))
      or (r.status = 'open' and exists (
        select 1 from business_members m
        where m.user_id = auth.uid() and public.operator_can_serve(m.business_id, r.country_code, r.kind)))));
$$;

create policy "trip requests visible to customer, quoting and eligible operators" on public.trip_requests for select
  using (public.can_see_trip_request(id));
create policy "trip contact visible to the customer and the booked operator" on public.trip_contacts for select
  using (exists (
    select 1 from public.trip_requests r
    left join public.trip_quotes q on q.id = r.accepted_quote_id
    where r.id = request_id and (r.customer_id = auth.uid() or public.is_admin()
      or (r.status in ('booked', 'completed') and public.is_business_member(q.business_id)))));
create policy "quotes visible to the customer and the quoting business" on public.trip_quotes for select
  using (public.is_business_member(business_id) or public.is_admin()
    or exists (select 1 from public.trip_requests r where r.id = request_id and r.customer_id = auth.uid()));

-- ---------- Operator applications ----------

create or replace function public.apply_operator(p_business uuid, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_kinds public.trip_kind[];
begin
  if not public.is_business_owner(p_business) then raise exception 'Only the business owner can apply'; end if;
  select array_agg(distinct k::public.trip_kind) into v_kinds from jsonb_array_elements_text(p->'kinds') k;
  if v_kinds is null then raise exception 'Choose at least one kind of trip'; end if;
  insert into operator_profiles (business_id, kinds, licence_details, vehicle_details, insurance_details, applied_by, status)
  values (p_business, v_kinds, trim(p->>'licence'), trim(p->>'vehicles'), nullif(trim(p->>'insurance'), ''), auth.uid(), 'pending')
  on conflict (business_id) do update set kinds = excluded.kinds, licence_details = excluded.licence_details,
    vehicle_details = excluded.vehicle_details, insurance_details = excluded.insurance_details,
    status = case when operator_profiles.status = 'approved' then 'approved'::operator_status else 'pending'::operator_status end;
end;
$$;

create or replace function public.admin_review_operator(p_business uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review operators'; end if;
  update operator_profiles set status = case when p_approve then 'approved'::operator_status else 'declined'::operator_status end,
    review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where business_id = p_business;
  if not found then raise exception 'No application found'; end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'operator.approved' else 'operator.declined' end, 'business', p_business::text, jsonb_build_object('note', p_note));
end;
$$;

-- ---------- Trips ----------

create or replace function public.create_trip_request(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_when timestamptz := nullif(p->>'travel_at', '')::timestamptz;
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if (select count(*) from trip_requests where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 8 then
    raise exception 'You’ve sent a lot of requests today. Please try again tomorrow.';
  end if;
  if v_when is not null and (v_when < now() - interval '1 hour' or v_when > now() + interval '180 days') then
    raise exception 'Choose a date within the next six months';
  end if;
  insert into trip_requests (customer_id, country_code, kind, from_place, to_place, pickup, dropoff, travel_at, passengers, details, cross_border)
  values (auth.uid(), p->>'country', (p->>'kind')::trip_kind, trim(p->>'from'), trim(p->>'to'), trim(p->>'pickup'), trim(p->>'dropoff'),
          v_when, nullif(p->>'passengers', '')::int, nullif(trim(p->>'details'), ''), coalesce((p->>'cross_border')::boolean, false))
  returning id into v_id;
  if coalesce(p->>'contact_phone', '') <> '' then
    insert into trip_contacts (request_id, phone_e164) values (v_id, p->>'contact_phone');
  end if;
  return v_id;
end;
$$;

create or replace function public.send_trip_quote(p_request uuid, p_business uuid, p_amount numeric, p_includes text, p_valid_hours int default 24)
returns uuid language plpgsql security definer set search_path = public as $$
declare r trip_requests; v_id uuid;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only quote for your own business'; end if;
  select * into r from trip_requests where id = p_request for update;
  if r.id is null or r.status <> 'open' then raise exception 'This request is no longer open'; end if;
  if r.customer_id = auth.uid() then raise exception 'You can’t quote on your own request'; end if;
  if not public.operator_can_serve(p_business, r.country_code, r.kind) then raise exception 'Your business isn’t approved for this kind of trip'; end if;
  insert into trip_quotes (request_id, business_id, amount_xcd, includes, valid_until, created_by)
  values (p_request, p_business, p_amount, nullif(trim(p_includes), ''), now() + make_interval(hours => greatest(1, least(p_valid_hours, 168))), auth.uid())
  on conflict (request_id, business_id) do update set amount_xcd = excluded.amount_xcd, includes = excluded.includes,
    valid_until = excluded.valid_until, status = 'offered', created_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.accept_trip_quote(p_quote uuid)
returns void language plpgsql security definer set search_path = public as $$
declare q trip_quotes; r trip_requests;
begin
  select * into q from trip_quotes where id = p_quote;
  select * into r from trip_requests where id = q.request_id for update;
  if r.id is null or r.customer_id <> auth.uid() then raise exception 'Only the person who made the request can accept a quote'; end if;
  if r.status <> 'open' then raise exception 'This request is no longer open'; end if;
  if q.status <> 'offered' or q.valid_until < now() then raise exception 'This quote has expired. Ask the operator for a new one.'; end if;
  update trip_quotes set status = case when id = p_quote then 'accepted'::quote_status else 'declined'::quote_status end
  where request_id = r.id and status = 'offered';
  update trip_requests set status = 'booked', accepted_quote_id = p_quote, updated_at = now() where id = r.id;
end;
$$;

create or replace function public.cancel_trip_request(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update trip_requests set status = 'cancelled', updated_at = now()
  where id = p_request and customer_id = auth.uid() and status in ('open', 'booked');
  if not found then raise exception 'This request can’t be cancelled'; end if;
  update trip_quotes set status = 'withdrawn' where request_id = p_request and status = 'offered';
end;
$$;

create or replace function public.complete_trip(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r trip_requests; q trip_quotes; v_rate numeric;
begin
  select * into r from trip_requests where id = p_request for update;
  select * into q from trip_quotes where id = r.accepted_quote_id;
  if r.id is null or r.status <> 'booked' or q.id is null then raise exception 'Only booked trips can be completed'; end if;
  if not (public.is_business_member(q.business_id) or public.is_admin()) then raise exception 'Only the operator can complete this trip'; end if;
  select coalesce((value #>> '{}')::numeric, 0) into v_rate from platform_settings where key = 'commission_rate';
  v_rate := coalesce(v_rate, 0);
  update trip_requests set status = 'completed', updated_at = now() where id = r.id;
  insert into commission_ledger (request_id, business_id, fare_xcd, rate, commission_xcd)
  values (r.id, q.business_id, q.amount_xcd, v_rate, round(q.amount_xcd * v_rate, 2));
end;
$$;

revoke all on function public.apply_operator(uuid, jsonb), public.admin_review_operator(uuid, boolean, text), public.create_trip_request(jsonb),
  public.send_trip_quote(uuid, uuid, numeric, text, int), public.accept_trip_quote(uuid), public.cancel_trip_request(uuid), public.complete_trip(uuid) from public, anon;
grant execute on function public.apply_operator(uuid, jsonb), public.admin_review_operator(uuid, boolean, text), public.create_trip_request(jsonb),
  public.send_trip_quote(uuid, uuid, numeric, text, int), public.accept_trip_quote(uuid), public.cancel_trip_request(uuid), public.complete_trip(uuid) to authenticated;

-- Only administrators may set the founder-owned label.
create or replace function public.guard_founder_owned()
returns trigger language plpgsql as $$
begin
  if new.founder_owned is distinct from old.founder_owned and not (public.is_admin() or public.is_trusted_context()) then
    raise exception 'Only administrators can change the founder label';
  end if;
  return new;
end;
$$;
drop trigger if exists businesses_guard_founder on public.businesses;
create trigger businesses_guard_founder before update on public.businesses for each row execute function public.guard_founder_owned();
