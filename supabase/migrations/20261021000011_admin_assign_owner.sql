-- Island Connect: admins can hand a listing to its owner's account by email,
-- for businesses set up on their behalf (Add listing) or confirmed by phone.
create or replace function public.admin_assign_owner(p_business uuid, p_email text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only administrators can assign owners'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No account uses that email yet. Ask them to tap Join free on the site first.'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'Listing not found'; end if;
  insert into public.business_members (business_id, user_id, role) values (p_business, v_user, 'owner')
  on conflict (business_id, user_id) do update set role = 'owner';
  update public.businesses set claim_status = 'claimed' where id = p_business;
  insert into public.audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'business.owner_assigned', 'business', p_business::text, jsonb_build_object('email', lower(trim(p_email))));
end;
$$;

-- Who owns a listing (emails), for the admin listing page.
create or replace function public.admin_business_owners(p_business uuid)
returns table (email text) language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can see owners'; end if;
  return query select u.email::text from public.business_members m join auth.users u on u.id = m.user_id
    where m.business_id = p_business and m.role = 'owner' order by u.email;
end;
$$;

revoke all on function public.admin_assign_owner(uuid, text), public.admin_business_owners(uuid) from public, anon;
grant execute on function public.admin_assign_owner(uuid, text), public.admin_business_owners(uuid) to authenticated;
