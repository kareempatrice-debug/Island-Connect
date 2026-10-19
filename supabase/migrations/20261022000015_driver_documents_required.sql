-- Island Connect: drivers must provide all three documents and their licence and insurance details.
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
  if char_length(trim(coalesce(p->>'licence', ''))) < 3 then raise exception 'Add your licence and permit numbers'; end if;
  if char_length(trim(coalesce(p->>'insurance', ''))) < 3 then raise exception 'Add your insurer and type of cover'; end if;
  select array_agg(d) into v_docs from jsonb_array_elements_text(coalesce(p->'documents', '[]'::jsonb)) d
    where d like auth.uid()::text || '/%';
  if not exists (select 1 from unnest(v_docs) d where split_part(d, '/', 2) like 'licence-%') then raise exception 'Add a photo of your licence and permit'; end if;
  if not exists (select 1 from unnest(v_docs) d where split_part(d, '/', 2) like 'insurance-%') then raise exception 'Add a photo of your insurance certificate'; end if;
  if not exists (select 1 from unnest(v_docs) d where split_part(d, '/', 2) like 'vehicle-%') then raise exception 'Add a photo of your vehicle registration'; end if;

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
  values (v_id, v_kinds, trim(p->>'licence'), trim(p->>'vehicles'), trim(p->>'insurance'), auth.uid(), 'pending', v_docs);

  select slug into v_slug from businesses where id = v_id;
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;
