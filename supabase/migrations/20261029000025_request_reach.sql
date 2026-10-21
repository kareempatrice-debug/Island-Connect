-- Island Connect: make sure ride requests reach the right drivers, and show why when they don't.
--
-- Rides to or from the airport are recorded as "airport" trips. A driver approved only for "taxi"
-- (or only for "airport") was missing them. Taxi and airport work are now treated as the same pool.
create or replace function public.operator_can_serve(p_business uuid, p_country text, p_kind public.trip_kind)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from operator_profiles o
    join businesses b on b.id = o.business_id and b.listing_status = 'published'
    where o.business_id = p_business and o.status = 'approved'
      and (p_kind = any (o.kinds) or (p_kind in ('taxi', 'airport') and o.kinds && array['taxi', 'airport']::public.trip_kind[]))
      and (exists (select 1 from business_locations l where l.business_id = b.id and l.country_code = p_country)
        or exists (select 1 from business_service_areas a join islands i on i.id = a.island_id where a.business_id = b.id and i.country_code = p_country)));
$$;

-- How many drivers a request reached (for the customer's own trip screen).
create or replace function public.request_reach(p_request uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from trip_requests r, operator_profiles o
  where r.id = p_request and (r.customer_id = auth.uid() or public.is_admin())
    and public.operator_can_serve(o.business_id, r.country_code, r.kind)
    and not exists (select 1 from business_members m where m.business_id = o.business_id and m.user_id = r.customer_id);
$$;

-- Admin: every approved operator and whether this request reached them, with the reason if not.
create or replace function public.admin_request_reach(p_request uuid)
returns table (business_name text, reached boolean, reason text)
language plpgsql stable security definer set search_path = public as $$
declare r trip_requests;
begin
  if not public.is_admin() then raise exception 'Only administrators can see this'; end if;
  select * into r from trip_requests where id = p_request;
  return query
    select b.name,
      public.operator_can_serve(o.business_id, r.country_code, r.kind)
        and not exists (select 1 from business_members m where m.business_id = o.business_id and m.user_id = r.customer_id),
      case
        when o.status <> 'approved' then 'Not approved as an operator yet'
        when b.listing_status <> 'published' then 'Listing isn’t live (' || b.listing_status::text || ')'
        when not (r.kind = any (o.kinds) or (r.kind in ('taxi', 'airport') and o.kinds && array['taxi', 'airport']::public.trip_kind[]))
          then 'Doesn’t take ' || r.kind::text || ' trips (takes ' || array_to_string(o.kinds, ', ') || ')'
        when not public.operator_can_serve(o.business_id, r.country_code, r.kind) then 'Not based in or serving this country'
        when exists (select 1 from business_members m where m.business_id = o.business_id and m.user_id = r.customer_id)
          then 'Belongs to the person who made the request'
        else 'Reached' end
    from operator_profiles o join businesses b on b.id = o.business_id
    order by 2 desc, b.name;
end;
$$;

revoke all on function public.request_reach(uuid), public.admin_request_reach(uuid) from public, anon;
grant execute on function public.request_reach(uuid), public.admin_request_reach(uuid) to authenticated;
