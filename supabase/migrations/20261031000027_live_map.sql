-- Island Connect: the live map.
-- 1. Drivers already on a job don't show as available, and aren't offered new rides.
-- 2. Once a ride is booked, the customer can see their own driver's live position.

-- Is this business busy with a ride right now (or one starting within 30 minutes)?
create or replace function public.driver_busy(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_requests r join trip_quotes q on q.id = r.accepted_quote_id
    where q.business_id = p_business and r.status = 'booked' and r.updated_at > now() - interval '6 hours'
      and (r.travel_at is null or r.travel_at between now() - interval '2 hours' and now() + interval '30 minutes'));
$$;

create or replace function public.nearby_vehicles(p_country text)
returns table (lat double precision, lng double precision, heading smallint, van boolean)
language sql stable security definer set search_path = public as $$
  select round((p.lat / 0.0013)::numeric) * 0.0013, round((p.lng / 0.0013)::numeric) * 0.0013, p.heading,
         ('group' = any(p.kinds) and not ('taxi' = any(p.kinds)))
  from driver_presence p
  where p.country_code = p_country and p.updated_at > now() - interval '3 minutes' and not public.driver_busy(p.business_id)
  limit 100;
$$;

-- The customer's own booked driver: exact position, only for the customer, only while booked.
create or replace function public.my_driver_position(p_request uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('lat', p.lat, 'lng', p.lng, 'heading', p.heading, 'at', p.updated_at,
                            'km', round(public.km_between(r.pickup_lat, r.pickup_lng, p.lat, p.lng)::numeric, 1))
  from trip_requests r
  join trip_quotes q on q.id = r.accepted_quote_id
  join driver_presence p on p.business_id = q.business_id
  where r.id = p_request and r.customer_id = auth.uid() and r.status = 'booked' and p.updated_at > now() - interval '5 minutes';
$$;
revoke all on function public.my_driver_position(uuid), public.driver_busy(uuid) from public, anon;
grant execute on function public.my_driver_position(uuid) to authenticated;

-- Dispatch skips drivers who are busy.
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
    and not public.driver_busy(p.business_id)
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
revoke all on function public.dispatch_next(uuid) from public, anon, authenticated;
