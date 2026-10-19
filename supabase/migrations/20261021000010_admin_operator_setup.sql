-- Island Connect: admins can set a business up as a transport operator directly,
-- without the business having to apply first (for example after checking a licence in person).
create or replace function public.admin_set_operator(p_business uuid, p_kinds public.trip_kind[], p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can set up operators'; end if;
  if p_kinds is null or cardinality(p_kinds) = 0 then raise exception 'Choose at least one kind of trip'; end if;
  if not exists (select 1 from businesses where id = p_business) then raise exception 'Listing not found'; end if;
  insert into operator_profiles (business_id, kinds, status, licence_details, vehicle_details, review_note, applied_by, reviewed_by, reviewed_at)
  values (p_business, p_kinds, 'approved', 'Checked by Island Connect', 'Checked by Island Connect', p_note, auth.uid(), auth.uid(), now())
  on conflict (business_id) do update set kinds = excluded.kinds, status = 'approved', review_note = coalesce(excluded.review_note, operator_profiles.review_note),
    reviewed_by = auth.uid(), reviewed_at = now();
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'operator.set_by_admin', 'business', p_business::text, jsonb_build_object('kinds', p_kinds, 'note', p_note));
end;
$$;
revoke all on function public.admin_set_operator(uuid, public.trip_kind[], text) from public, anon;
grant execute on function public.admin_set_operator(uuid, public.trip_kind[], text) to authenticated;
