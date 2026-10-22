-- Island Connect: live trip sharing like Uber's "Share my trip".
-- Drivers add their first name and car details (make, model, colour, number plate), which are shown
-- to their booked customer and to anyone the customer shares the trip with. The shared trip now
-- includes the pick-up and destination points for the live map. Phone numbers are never shared.

alter table public.operator_profiles add column if not exists driver_name text check (char_length(driver_name) <= 40);
alter table public.operator_profiles add column if not exists vehicle_make text check (char_length(vehicle_make) <= 40);
alter table public.operator_profiles add column if not exists vehicle_model text check (char_length(vehicle_model) <= 40);
alter table public.operator_profiles add column if not exists vehicle_colour text check (char_length(vehicle_colour) <= 30);
alter table public.operator_profiles add column if not exists vehicle_plate text check (char_length(vehicle_plate) <= 15);

create or replace function public.set_vehicle_details(p_business uuid, p_driver text, p_make text, p_model text, p_colour text, p_plate text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_business_member(p_business) then raise exception 'You can only change your own business'; end if;
  update operator_profiles set
    driver_name = nullif(left(trim(p_driver), 40), ''),
    vehicle_make = nullif(left(trim(p_make), 40), ''),
    vehicle_model = nullif(left(trim(p_model), 40), ''),
    vehicle_colour = nullif(left(trim(p_colour), 30), ''),
    vehicle_plate = nullif(upper(left(trim(p_plate), 15)), '')
  where business_id = p_business;
end;
$$;
revoke all on function public.set_vehicle_details(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.set_vehicle_details(uuid, text, text, text, text, text) to authenticated;

create or replace function public.shared_trip(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r trip_requests; v_biz text; v_op operator_profiles; v_pos jsonb;
begin
  if p_token is null or char_length(p_token) <> 32 then return null; end if;
  select * into r from trip_requests where share_token = p_token;
  if r.id is null or r.created_at < now() - interval '3 days' then return null; end if;
  select b.name into v_biz from trip_quotes q join businesses b on b.id = q.business_id where q.id = r.accepted_quote_id;
  select o.* into v_op from trip_quotes q join operator_profiles o on o.business_id = q.business_id where q.id = r.accepted_quote_id;
  -- Live position only while the trip is booked and the driver's app reported in the last 3 minutes.
  select jsonb_build_object('lat', p.lat, 'lng', p.lng, 'heading', p.heading, 'at', p.updated_at) into v_pos
  from trip_quotes q join driver_presence p on p.business_id = q.business_id
  where q.id = r.accepted_quote_id and p.updated_at > now() - interval '3 minutes' and r.status = 'booked';
  return jsonb_build_object('pickup', r.pickup, 'dropoff', r.dropoff, 'travel_at', r.travel_at, 'status', r.status,
    'rider', split_part(coalesce(r.rider_name, ''), ' ', 1), 'operator', v_biz, 'picked_up_at', r.picked_up_at,
    'country', r.country_code, 'driver_position', v_pos,
    'pickup_point', case when r.pickup_lat is not null then jsonb_build_object('lat', r.pickup_lat, 'lng', r.pickup_lng) end,
    'dropoff_point', case when r.dropoff_lat is not null then jsonb_build_object('lat', r.dropoff_lat, 'lng', r.dropoff_lng) end,
    'driver', split_part(coalesce(v_op.driver_name, ''), ' ', 1),
    'vehicle', nullif(trim(concat_ws(' ', v_op.vehicle_colour, v_op.vehicle_make, v_op.vehicle_model)), ''),
    'plate', v_op.vehicle_plate);
end;
$$;
revoke all on function public.shared_trip(text) from public;
grant execute on function public.shared_trip(text) to anon, authenticated;
