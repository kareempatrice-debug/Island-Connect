-- Island Connect: admin tools to edit, hide and delete listings.
-- Every change is written to audit_events with who made it and why.

-- Edit a listing's public details. Only fields present in p are changed.
create or replace function public.admin_edit_business(p_business uuid, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb;
begin
  if not public.is_admin() then raise exception 'Only administrators can edit listings'; end if;
  select to_jsonb(b) - 'search_text' into v_before from public.businesses b where id = p_business;
  if v_before is null then raise exception 'Listing not found'; end if;
  if p ? 'name' and char_length(trim(p->>'name')) < 2 then raise exception 'The name is too short'; end if;

  update public.businesses set
    name          = coalesce(nullif(trim(p->>'name'), ''), name),
    tagline       = case when p ? 'tagline' then nullif(trim(p->>'tagline'), '') else tagline end,
    description   = case when p ? 'description' then nullif(trim(p->>'description'), '') else description end,
    phone_e164    = case when p ? 'phone' then nullif(p->>'phone', '') else phone_e164 end,
    whatsapp_e164 = case when p ? 'whatsapp' then nullif(p->>'whatsapp', '') else whatsapp_e164 end,
    email         = case when p ? 'email' then nullif(lower(trim(p->>'email')), '') else email end,
    website       = case when p ? 'website' then nullif(trim(p->>'website'), '') else website end
  where id = p_business;

  update public.business_locations set landmark = nullif(trim(p->>'landmark'), '')
  where business_id = p_business and is_primary and p ? 'landmark';

  insert into public.audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'business.edited', 'business', p_business::text,
          jsonb_build_object('changes', p, 'before', v_before - 'description'));
end;
$$;

-- Publish, hide (suspend) or send back to review.
create or replace function public.admin_set_listing_status(p_business uuid, p_status public.listing_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_old public.listing_status;
begin
  if not public.is_admin() then raise exception 'Only administrators can change a listing''s status'; end if;
  select listing_status into v_old from public.businesses where id = p_business;
  if v_old is null then raise exception 'Listing not found'; end if;
  update public.businesses set listing_status = p_status where id = p_business;
  insert into public.audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'business.status_changed', 'business', p_business::text,
          jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note));
end;
$$;

-- Delete permanently. Refused when customers have enquiries with the business,
-- so their conversations are never lost: hide the listing instead.
create or replace function public.admin_delete_business(p_business uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if not public.is_admin() then raise exception 'Only administrators can delete listings'; end if;
  select name into v_name from public.businesses where id = p_business;
  if v_name is null then raise exception 'Listing not found'; end if;
  if exists (select 1 from public.enquiries where business_id = p_business) then
    raise exception 'This business has customer enquiries, so it can''t be deleted. Hide it instead.';
  end if;
  insert into public.audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'business.deleted', 'business', p_business::text, jsonb_build_object('name', v_name, 'reason', p_reason));
  delete from public.businesses where id = p_business;
end;
$$;

revoke all on function public.admin_edit_business(uuid, jsonb) from public, anon;
revoke all on function public.admin_set_listing_status(uuid, public.listing_status, text) from public, anon;
revoke all on function public.admin_delete_business(uuid, text) from public, anon;
grant execute on function public.admin_edit_business(uuid, jsonb) to authenticated;
grant execute on function public.admin_set_listing_status(uuid, public.listing_status, text) to authenticated;
grant execute on function public.admin_delete_business(uuid, text) to authenticated;
