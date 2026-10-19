-- Island Connect: one-step sign-up for drivers and operators.
-- Anyone with a licence and a vehicle or vessel can apply: an individual earning extra money
-- or a business. One form creates their listing and their operator application together;
-- an admin checks the documents and approves both at once.

alter table public.operator_profiles add column if not exists document_paths text[] not null default '{}';

-- Private documents (licence, insurance, registration): each person's own folder, readable by admins.
do $outer$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not found: skipping document bucket';
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('operator-documents', 'operator-documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  on conflict (id) do update set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  execute $p$drop policy if exists "operator documents: own folder add" on storage.objects$p$;
  execute $p$drop policy if exists "operator documents: own folder or admin read" on storage.objects$p$;
  execute $p$drop policy if exists "operator documents: own folder remove" on storage.objects$p$;
  execute $p$create policy "operator documents: own folder add" on storage.objects for insert to authenticated
    with check (bucket_id = 'operator-documents' and split_part(name, '/', 1) = auth.uid()::text)$p$;
  execute $p$create policy "operator documents: own folder or admin read" on storage.objects for select to authenticated
    using (bucket_id = 'operator-documents' and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin()))$p$;
  execute $p$create policy "operator documents: own folder remove" on storage.objects for delete to authenticated
    using (bucket_id = 'operator-documents' and split_part(name, '/', 1) = auth.uid()::text)$p$;
end
$outer$;

create or replace function public.apply_as_driver(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_kinds public.trip_kind[];
  v_cats text[];
  v_id uuid;
  v_slug text;
  v_docs text[];
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if (select count(*) from business_members m join operator_profiles o on o.business_id = m.business_id
      where m.user_id = auth.uid() and o.status = 'pending') >= 2 then
    raise exception 'You already have an application waiting. We’ll be in touch soon.';
  end if;
  select array_agg(distinct k::public.trip_kind) into v_kinds from jsonb_array_elements_text(p->'kinds') k;
  if v_kinds is null then raise exception 'Choose at least one kind of trip'; end if;
  select array_agg(d) into v_docs from jsonb_array_elements_text(coalesce(p->'documents', '[]'::jsonb)) d
    where d like auth.uid()::text || '/%';
  if coalesce(cardinality(v_docs), 0) = 0 then raise exception 'Add a photo of your driving or operator licence'; end if;

  -- Categories that match the trips they take, so customers can also find them in the directory.
  select array_agg(distinct c) into v_cats from unnest(v_kinds) k,
    lateral (select case k when 'taxi' then 'taxis' when 'airport' then 'airport-transfers' when 'group' then 'taxis'
                           when 'boat' then 'water-taxis' when 'haulage' then 'trucking-haulage' else null end as c) x
    where c is not null;

  v_id := public.create_business_core(
    jsonb_build_object(
      'country', p->>'country', 'island', p->>'island', 'district', nullif(p->>'district', ''), 'landmark', nullif(p->>'area', ''),
      'name', p->>'name', 'tagline', p->>'tagline', 'description', nullif(p->>'description', ''),
      'phone', nullif(p->>'phone', ''), 'whatsapp', nullif(p->>'whatsapp', ''), 'categories', to_jsonb(v_cats)),
    'pending_review', 'claimed', auth.uid());

  update businesses set provider_type = case when p->>'provider_type' = 'business' then 'business' else 'individual' end where id = v_id;

  insert into operator_profiles (business_id, kinds, licence_details, vehicle_details, insurance_details, applied_by, status, document_paths)
  values (v_id, v_kinds, trim(p->>'licence'), trim(p->>'vehicles'), nullif(trim(p->>'insurance'), ''), auth.uid(), 'pending', v_docs);

  select slug into v_slug from businesses where id = v_id;
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;
revoke all on function public.apply_as_driver(jsonb) from public, anon;
grant execute on function public.apply_as_driver(jsonb) to authenticated;

-- Approving an operator also puts their listing live (if it was waiting), in one step.
create or replace function public.admin_review_operator(p_business uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review operators'; end if;
  update operator_profiles set status = case when p_approve then 'approved'::operator_status else 'declined'::operator_status end,
    review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where business_id = p_business;
  if not found then raise exception 'No application found'; end if;
  if p_approve then
    update businesses set listing_status = 'published' where id = p_business and listing_status = 'pending_review';
  end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'operator.approved' else 'operator.declined' end, 'business', p_business::text, jsonb_build_object('note', p_note));
end;
$$;
