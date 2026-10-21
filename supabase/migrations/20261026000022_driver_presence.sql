-- Island Connect: approved drivers can "go online", and customers see cars nearby on the map.
-- Customers only ever see an approximate position (to about 150 metres) and no driver details,
-- and only for drivers active in the last 3 minutes.
create table if not exists public.driver_presence (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null,
  kinds public.trip_kind[] not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  heading smallint check (heading between 0 and 359),
  updated_at timestamptz not null default now()
);
alter table public.driver_presence enable row level security;
-- No direct reads: drivers write through set_presence, customers read through nearby_vehicles.

create or replace function public.set_presence(p_business uuid, p_lat double precision, p_lng double precision, p_heading integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_kinds trip_kind[]; v_country text;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only go online for your own business'; end if;
  select o.kinds into v_kinds from operator_profiles o where o.business_id = p_business and o.status = 'approved';
  if v_kinds is null then raise exception 'Your business isn’t an approved operator yet'; end if;
  if not ('taxi' = any(v_kinds) or 'airport' = any(v_kinds) or 'group' = any(v_kinds)) then raise exception 'Only taxi, airport and minivan operators appear on the map'; end if;
  select l.country_code into v_country from business_locations l where l.business_id = p_business order by l.is_primary desc limit 1;
  insert into driver_presence (business_id, user_id, country_code, kinds, lat, lng, heading, updated_at)
  values (p_business, auth.uid(), coalesce(v_country, 'gd'), v_kinds, p_lat, p_lng, case when p_heading between 0 and 359 then p_heading end, now())
  on conflict (business_id) do update set user_id = excluded.user_id, kinds = excluded.kinds, lat = excluded.lat, lng = excluded.lng,
    heading = excluded.heading, updated_at = now();
end;
$$;

create or replace function public.go_offline(p_business uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_business_member(p_business) then raise exception 'You can only change your own business'; end if;
  delete from driver_presence where business_id = p_business;
end;
$$;

-- Approximate positions only: rounded to about 150 metres, nothing that identifies the driver.
create or replace function public.nearby_vehicles(p_country text)
returns table (lat double precision, lng double precision, heading smallint, van boolean)
language sql stable security definer set search_path = public as $$
  select round((p.lat / 0.0013)::numeric) * 0.0013, round((p.lng / 0.0013)::numeric) * 0.0013, p.heading,
         ('group' = any(p.kinds) and not ('taxi' = any(p.kinds)))
  from driver_presence p
  where p.country_code = p_country and p.updated_at > now() - interval '3 minutes'
  limit 100;
$$;

revoke all on function public.set_presence(uuid, double precision, double precision, integer), public.go_offline(uuid) from public, anon;
grant execute on function public.set_presence(uuid, double precision, double precision, integer), public.go_offline(uuid) to authenticated;
revoke all on function public.nearby_vehicles(text) from public;
grant execute on function public.nearby_vehicles(text) to anon, authenticated;
