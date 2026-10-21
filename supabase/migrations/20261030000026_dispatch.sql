-- Island Connect: Uber-style dispatch for taxi rides with an official fare or an estimate.
--
-- The ride is offered to the nearest online driver, who has 20 seconds to accept. If they decline
-- or the time runs out, it goes to the next nearest, and so on. If nobody has accepted after two
-- minutes, or there are no more online drivers nearby, every eligible driver is alerted (as before).
-- Requests without a pick-up location, and boats and trucking, keep the old request-and-quote flow.

alter table public.trip_requests add column if not exists dispatch_state text check (dispatch_state in ('dispatching', 'broadcast'));
alter table public.trip_requests add column if not exists dispatch_started_at timestamptz;

create table if not exists public.trip_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.trip_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  distance_km numeric(6, 2),
  price_xcd numeric(10, 2) not null,
  status text not null default 'offered' check (status in ('offered', 'accepted', 'declined', 'expired')),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (request_id, business_id)
);
create index if not exists trip_offers_request_idx on public.trip_offers (request_id, status);
alter table public.trip_offers enable row level security;
drop policy if exists "drivers see offers made to them" on public.trip_offers;
create policy "drivers see offers made to them" on public.trip_offers for select using (public.is_business_member(business_id) or public.is_admin());

create or replace function public.km_between(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2) + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

-- While a ride is being offered one driver at a time, only the driver holding the offer can see it.
create or replace function public.can_see_trip_request(p_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_requests r
    where r.id = p_request and (
      r.customer_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from trip_quotes q where q.request_id = r.id and public.is_business_member(q.business_id))
      or exists (select 1 from trip_offers o where o.request_id = r.id and o.status = 'offered' and o.expires_at > now() and public.is_business_member(o.business_id))
      or (r.status = 'open' and r.dispatch_state is distinct from 'dispatching' and exists (
        select 1 from business_members m
        where m.user_id = auth.uid() and public.operator_can_serve(m.business_id, r.country_code, r.kind)))));
$$;

-- The price a dispatched ride is offered at: the official fare, or the middle of the estimate.
create or replace function public.dispatch_price(r public.trip_requests)
returns numeric language sql immutable as $$
  select coalesce(r.fixed_fare_xcd, round(((r.estimate_low_xcd + r.estimate_high_xcd) / 2) / 5) * 5);
$$;

-- Offer the ride to the next nearest online driver, or switch to alerting everyone. Internal.
create or replace function public.dispatch_next(p_request uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r trip_requests; v_biz uuid; v_km double precision; v_offer uuid;
begin
  select * into r from trip_requests where id = p_request for update;
  if r.id is null or r.status <> 'open' or r.dispatch_state is distinct from 'dispatching' then return jsonb_build_object('event', 'none'); end if;
  if exists (select 1 from trip_offers where request_id = r.id and status = 'offered' and expires_at > now()) then return jsonb_build_object('event', 'waiting'); end if;
  if r.dispatch_started_at < now() - interval '2 minutes' then
    update trip_requests set dispatch_state = 'broadcast', updated_at = now() where id = r.id;
    return jsonb_build_object('event', 'broadcast');
  end if;
  select p.business_id, public.km_between(r.pickup_lat, r.pickup_lng, p.lat, p.lng) into v_biz, v_km
  from driver_presence p
  where p.updated_at > now() - interval '3 minutes'
    and public.operator_can_serve(p.business_id, r.country_code, r.kind)
    and not exists (select 1 from trip_offers o where o.request_id = r.id and o.business_id = p.business_id)
    and not exists (select 1 from business_members m where m.business_id = p.business_id and m.user_id = r.customer_id)
    and public.km_between(r.pickup_lat, r.pickup_lng, p.lat, p.lng) <= 25
  order by 2 limit 1;
  if v_biz is null then
    update trip_requests set dispatch_state = 'broadcast', updated_at = now() where id = r.id;
    return jsonb_build_object('event', 'broadcast');
  end if;
  insert into trip_offers (request_id, business_id, distance_km, price_xcd, expires_at)
  values (r.id, v_biz, round(v_km::numeric, 2), public.dispatch_price(r), now() + interval '20 seconds')
  returning id into v_offer;
  return jsonb_build_object('event', 'offered', 'offer_id', v_offer, 'business_id', v_biz, 'km', round(v_km::numeric, 1));
end;
$$;

-- Replaces the earlier one-argument version.
drop function if exists public.start_dispatch(uuid);

-- Called by the customer's app straight after sending a request. Official fares are always matched
-- instantly; routes with only an estimate are matched instantly only if the customer chose "Book now",
-- otherwise drivers send their prices and the customer chooses.
create or replace function public.start_dispatch(p_request uuid, p_instant boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r trip_requests;
begin
  select * into r from trip_requests where id = p_request;
  if r.id is null or r.customer_id <> auth.uid() then raise exception 'Not your request'; end if;
  if r.status <> 'open' or r.dispatch_state is not null then return jsonb_build_object('event', 'none'); end if;
  if r.kind not in ('taxi', 'airport') or r.pickup_lat is null or r.pickup_lng is null
     or (r.fixed_fare_xcd is null and (r.estimate_low_xcd is null or not p_instant)) then
    update trip_requests set dispatch_state = 'broadcast' where id = r.id;
    return jsonb_build_object('event', 'broadcast');
  end if;
  update trip_requests set dispatch_state = 'dispatching', dispatch_started_at = now() where id = r.id;
  return public.dispatch_next(r.id);
end;
$$;

-- Moves things along when an offer times out. Safe to call often; the customer's and driver's
-- screens call it every few seconds, and a database timer calls it as a backstop.
create or replace function public.dispatch_tick(p_request uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r trip_requests;
begin
  select * into r from trip_requests where id = p_request;
  if r.id is null then return jsonb_build_object('event', 'none'); end if;
  if auth.uid() is not null and not (r.customer_id = auth.uid() or public.is_admin()
     or exists (select 1 from trip_offers o where o.request_id = r.id and public.is_business_member(o.business_id))) then
    raise exception 'Not your request';
  end if;
  update trip_offers set status = 'expired' where request_id = r.id and status = 'offered' and expires_at <= now();
  return public.dispatch_next(r.id);
end;
$$;

-- The driver accepts or declines an offer.
create or replace function public.respond_to_offer(p_offer uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o trip_offers; r trip_requests;
begin
  select * into o from trip_offers where id = p_offer for update;
  if o.id is null or not public.is_business_member(o.business_id) then raise exception 'This offer isn’t yours'; end if;
  if o.status <> 'offered' or o.expires_at <= now() then raise exception 'This offer has expired'; end if;
  if not p_accept then
    update trip_offers set status = 'declined' where id = o.id;
    return public.dispatch_next(o.request_id);
  end if;
  select * into r from trip_requests where id = o.request_id for update;
  if r.status <> 'open' then raise exception 'This ride is no longer available'; end if;
  -- An estimated ride is booked at the offered price.
  if r.fixed_fare_xcd is null then
    update trip_requests set fixed_fare_xcd = o.price_xcd, fare_source = 'Island Connect estimate, agreed by the driver' where id = r.id;
  end if;
  update trip_offers set status = 'accepted' where id = o.id;
  perform public.accept_fixed_fare(o.request_id, o.business_id);
  return jsonb_build_object('event', 'accepted', 'request_id', o.request_id);
end;
$$;

-- Instant acceptance by anyone else is held back while the ride is being offered to someone nearer.
create or replace function public.accept_fixed_fare(p_request uuid, p_business uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare r trip_requests; v_quote uuid;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only accept for your own business'; end if;
  select * into r from trip_requests where id = p_request for update;
  if r.id is null or r.status <> 'open' then raise exception 'Another driver has already taken this trip'; end if;
  if r.fixed_fare_xcd is null then raise exception 'This trip needs a quote, not instant acceptance'; end if;
  if r.customer_id = auth.uid() then raise exception 'You can’t accept your own request'; end if;
  if not public.operator_can_serve(p_business, r.country_code, r.kind) then raise exception 'Your business isn’t approved for this kind of trip'; end if;
  if r.dispatch_state = 'dispatching' and not exists (select 1 from trip_offers o where o.request_id = r.id and o.business_id = p_business and o.status in ('offered', 'accepted')) then
    raise exception 'This ride is being offered to a nearer driver first';
  end if;
  insert into trip_quotes (request_id, business_id, amount_xcd, includes, valid_until, status, created_by)
  values (r.id, p_business, r.fixed_fare_xcd, case when r.fare_source like 'Island Connect estimate%' then 'Agreed fare' else 'Official fare' end, now() + interval '1 day', 'accepted', auth.uid())
  on conflict (request_id, business_id) do update set amount_xcd = excluded.amount_xcd, includes = excluded.includes, status = 'accepted'
  returning id into v_quote;
  update trip_quotes set status = 'declined' where request_id = r.id and id <> v_quote and status = 'offered';
  update trip_offers set status = 'expired' where request_id = r.id and status = 'offered' and business_id <> p_business;
  update trip_requests set status = 'booked', accepted_quote_id = v_quote, updated_at = now() where id = r.id;
  return v_quote;
end;
$$;

-- Backstop for when nobody has a screen open: moves every stalled dispatch along.
create or replace function public.dispatch_tick_all()
returns integer language plpgsql security definer set search_path = public as $$
declare v record; n integer := 0;
begin
  for v in select id from trip_requests where status = 'open' and dispatch_state = 'dispatching' loop
    update trip_offers set status = 'expired' where request_id = v.id and status = 'offered' and expires_at <= now();
    perform public.dispatch_next(v.id); n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.dispatch_next(uuid), public.dispatch_tick_all() from public, anon, authenticated;
revoke all on function public.start_dispatch(uuid, boolean), public.dispatch_tick(uuid), public.respond_to_offer(uuid, boolean) from public, anon;
grant execute on function public.start_dispatch(uuid, boolean), public.dispatch_tick(uuid), public.respond_to_offer(uuid, boolean) to authenticated;

-- Run the backstop every 15 seconds if the database timer (pg_cron) is available; skip quietly if not.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'island-connect-dispatch';
  perform cron.schedule('island-connect-dispatch', '15 seconds', 'select public.dispatch_tick_all()');
exception when others then
  raise notice 'pg_cron not available (%). Dispatch still runs from the apps.', sqlerrm;
end $$;

-- What the customer sees while their ride is being offered.
create or replace function public.dispatch_info(p_request uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'state', r.dispatch_state,
    'tried', (select count(*) from trip_offers o where o.request_id = r.id),
    'current_km', (select o.distance_km from trip_offers o where o.request_id = r.id and o.status = 'offered' and o.expires_at > now() limit 1))
  from trip_requests r where r.id = p_request and (r.customer_id = auth.uid() or public.is_admin());
$$;
revoke all on function public.dispatch_info(uuid) from public, anon;
grant execute on function public.dispatch_info(uuid) to authenticated;
