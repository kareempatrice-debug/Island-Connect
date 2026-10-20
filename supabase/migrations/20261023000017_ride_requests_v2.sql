-- Island Connect: rides to and from any address, booking for someone else.
alter table public.trip_requests add column if not exists pickup_lat double precision check (pickup_lat between -90 and 90);
alter table public.trip_requests add column if not exists pickup_lng double precision check (pickup_lng between -180 and 180);
alter table public.trip_requests add column if not exists dropoff_lat double precision check (dropoff_lat between -90 and 90);
alter table public.trip_requests add column if not exists dropoff_lng double precision check (dropoff_lng between -180 and 180);
alter table public.trip_requests add column if not exists distance_km numeric(7, 1) check (distance_km is null or distance_km >= 0);
alter table public.trip_requests add column if not exists duration_min integer check (duration_min is null or duration_min >= 0);
-- Who is travelling, when someone books for another person. Their number is private like the customer's.
alter table public.trip_requests add column if not exists rider_name text check (char_length(rider_name) <= 80);
alter table public.trip_contacts add column if not exists rider_phone_e164 text check (rider_phone_e164 is null or rider_phone_e164 ~ '^\+[1-9][0-9]{6,14}$');

create or replace function public.create_trip_request(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_when timestamptz := nullif(p->>'travel_at', '')::timestamptz; v_kind trip_kind := (p->>'kind')::trip_kind;
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if (select count(*) from trip_requests where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 8 then
    raise exception 'You’ve sent a lot of requests today. Please try again tomorrow.';
  end if;
  if v_when is not null and (v_when < now() - interval '1 hour' or v_when > now() + interval '180 days') then
    raise exception 'Choose a date within the next six months';
  end if;
  insert into trip_requests (customer_id, country_code, kind, from_place, to_place, pickup, dropoff, travel_at, passengers, details, cross_border,
                             fixed_fare_xcd, fare_source, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance_km, duration_min, rider_name)
  values (auth.uid(), p->>'country', v_kind, trim(p->>'from'), trim(p->>'to'), trim(p->>'pickup'), trim(p->>'dropoff'),
          v_when, nullif(p->>'passengers', '')::int, nullif(trim(p->>'details'), ''), coalesce((p->>'cross_border')::boolean, false),
          case when v_kind in ('taxi', 'airport') then nullif(p->>'fixed_fare_xcd', '')::numeric end,
          case when v_kind in ('taxi', 'airport') then nullif(trim(p->>'fare_source'), '') end,
          nullif(p->>'pickup_lat', '')::double precision, nullif(p->>'pickup_lng', '')::double precision,
          nullif(p->>'dropoff_lat', '')::double precision, nullif(p->>'dropoff_lng', '')::double precision,
          nullif(p->>'distance_km', '')::numeric, nullif(p->>'duration_min', '')::int, nullif(trim(p->>'rider_name'), ''))
  returning id into v_id;
  if coalesce(p->>'contact_phone', '') <> '' then
    insert into trip_contacts (request_id, phone_e164, rider_phone_e164) values (v_id, p->>'contact_phone', nullif(p->>'rider_phone', ''));
  end if;
  return v_id;
end;
$$;
