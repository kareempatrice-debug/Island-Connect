-- Island Connect: admins can see who has joined (for running the platform: support, approvals,
-- safety). Read-only and admins only.
create or replace function public.admin_list_members(p_search text default null, p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, email text, name text, role text, joined_as text, joined_at timestamptz, last_sign_in_at timestamptz,
               confirmed boolean, listings integer, trips integer, total bigint)
language plpgsql stable security definer set search_path = public, auth as $$
declare q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if not public.is_admin() then raise exception 'Only administrators can see members'; end if;
  return query
    select u.id, u.email::text, p.full_name, p.role::text, (u.raw_user_meta_data ->> 'joined_as'),
           u.created_at, u.last_sign_in_at, (u.email_confirmed_at is not null),
           (select count(*)::int from business_members m where m.user_id = u.id),
           (select count(*)::int from trip_requests r where r.customer_id = u.id),
           count(*) over ()
    from auth.users u left join profiles p on p.id = u.id
    where q is null or u.email ilike '%' || q || '%' or p.full_name ilike '%' || q || '%'
    order by u.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200)) offset greatest(0, coalesce(p_offset, 0));
end;
$$;
revoke all on function public.admin_list_members(text, integer, integer) from public, anon;
grant execute on function public.admin_list_members(text, integer, integer) to authenticated;
