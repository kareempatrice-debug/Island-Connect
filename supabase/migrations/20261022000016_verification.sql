-- Island Connect: admins mark listings as verified (genuine business, checked by Island Connect),
-- and approving a transport operator (licence, insurance and registration checked) verifies them too.
create or replace function public.admin_set_verified(p_business uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can verify listings'; end if;
  if exists (select 1 from businesses where id = p_business and is_demo) and p_verified then
    raise exception 'Demonstration listings can’t be verified';
  end if;
  update businesses set verification_status = case when p_verified then 'verified'::verification_status else 'unverified'::verification_status end
  where id = p_business;
  if not found then raise exception 'Listing not found'; end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_verified then 'business.verified' else 'business.unverified' end, 'business', p_business::text, '{}'::jsonb);
end;
$$;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

create or replace function public.admin_review_operator(p_business uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review operators'; end if;
  update operator_profiles set status = case when p_approve then 'approved'::operator_status else 'declined'::operator_status end,
    review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where business_id = p_business;
  if not found then raise exception 'No application found'; end if;
  if p_approve then
    update businesses set listing_status = case when listing_status = 'pending_review' then 'published'::listing_status else listing_status end,
      verification_status = case when is_demo then verification_status else 'verified'::verification_status end
    where id = p_business;
  end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'operator.approved' else 'operator.declined' end, 'business', p_business::text, jsonb_build_object('note', p_note));
end;
$$;

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
  update businesses set verification_status = 'verified' where id = p_business and not is_demo;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), 'operator.set_by_admin', 'business', p_business::text, jsonb_build_object('kinds', p_kinds, 'note', p_note));
end;
$$;

-- Clearer wording when a message can’t be sent.
create or replace function public.start_enquiry(p_business uuid, p_subject text, p_body text, p_service uuid default null, p_date date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to send a message'; end if;
  if not exists (select 1 from businesses where id = p_business and listing_status = 'published' and not is_demo
                 and exists (select 1 from business_members m where m.business_id = p_business)) then
    raise exception 'This business can’t receive messages on Island Connect yet. Try WhatsApp or phone instead.';
  end if;
  if is_business_member(p_business) then raise exception 'This is your own business, so you can’t message it. Sign in with a customer account to test messaging.'; end if;
  if (select count(*) from enquiries where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You’ve started a lot of conversations today. Please try again tomorrow.';
  end if;
  if char_length(coalesce(trim(p_body), '')) < 10 then raise exception 'Tell the business a little more about what you need'; end if;
  insert into enquiries (business_id, customer_id, subject, service_id, preferred_date)
  values (p_business, auth.uid(), left(trim(p_subject), 120), p_service, p_date) returning id into v_id;
  insert into enquiry_messages (enquiry_id, sender_id, body) values (v_id, auth.uid(), trim(p_body));
  return v_id;
end;
$$;
