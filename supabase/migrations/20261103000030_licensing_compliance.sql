-- Island Connect: licensing and compliance, following the Transport Regulation report (22 Oct 2026).
--
-- 1. Passenger rides only from licensed hire vehicles. Every taxi, airport or minivan operator needs
--    the hire versions of each document: H-plate registration, taxi or PSV driving permit,
--    hire-and-reward insurance, tourism authority taxi licence, and photo ID. Freight and boat
--    operators need their own sets. Any individual can still sign up, but not with a private car.
-- 2. Each document has an expiry date. Drivers whose document lapses are taken offline
--    automatically (no ride offers, no requests, not on the map) until a renewal is approved.
-- (A credit limit and pause for unpaid commission will be added at a later date.)
-- Existing approved operators get 30 days to upload documents before the rules apply to them.

create table if not exists public.operator_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'hire_registration', 'psv_permit', 'hire_insurance', 'tourism_licence', 'photo_id',
    'goods_registration', 'driving_licence', 'goods_insurance',
    'vessel_registration', 'boat_licence', 'marine_insurance', 'police_record')),
  path text not null check (char_length(path) <= 300),
  expires_on date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text check (char_length(note) <= 300),
  uploaded_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists operator_documents_business_idx on public.operator_documents (business_id, doc_type, created_at desc);
alter table public.operator_documents enable row level security;
drop policy if exists "operators see their documents" on public.operator_documents;
create policy "operators see their documents" on public.operator_documents for select using (public.is_business_member(business_id) or public.is_admin());

alter table public.operator_profiles add column if not exists compliance_grace_until date;
update public.operator_profiles set compliance_grace_until = current_date + 30
where status = 'approved' and compliance_grace_until is null
  and not exists (select 1 from public.operator_documents d where d.business_id = operator_profiles.business_id);

-- Which documents an operator needs, from the kinds of work they do.
create or replace function public.required_documents(p_kinds public.trip_kind[])
returns text[] language sql immutable as $$
  select array(select distinct d from unnest(
    case when p_kinds && array['taxi', 'airport', 'group']::public.trip_kind[]
      then array['hire_registration', 'psv_permit', 'hire_insurance', 'tourism_licence', 'photo_id'] else array[]::text[] end
    || case when p_kinds && array['haulage', 'freight']::public.trip_kind[]
      then array['goods_registration', 'driving_licence', 'goods_insurance', 'photo_id'] else array[]::text[] end
    || case when 'boat' = any(p_kinds)
      then array['vessel_registration', 'boat_licence', 'marine_insurance', 'photo_id'] else array[]::text[] end
  ) d order by 1);
$$;

-- Full picture for the driver's dashboard and admin: what's missing, expired, expiring, owed.
create or replace function public.operator_compliance(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o operator_profiles; v_req text[]; v_missing text[] := '{}'; v_expired text[] := '{}'; v_expiring jsonb := '[]'; v_pending text[] := '{}';
  t text; d operator_documents; v_grace boolean;
begin
  if not (public.is_business_member(p_business) or public.is_admin() or auth.uid() is null) then raise exception 'Not your business'; end if;
  select * into o from operator_profiles where business_id = p_business;
  if o.business_id is null then return null; end if;
  v_req := public.required_documents(o.kinds);
  foreach t in array v_req loop
    select * into d from operator_documents where business_id = p_business and doc_type = t and status = 'approved' order by coalesce(expires_on, 'infinity'::date) desc limit 1;
    if d.id is null then
      if exists (select 1 from operator_documents where business_id = p_business and doc_type = t and status = 'pending') then v_pending := v_pending || t;
      else v_missing := v_missing || t; end if;
    elsif d.expires_on is not null and d.expires_on < current_date then
      if exists (select 1 from operator_documents where business_id = p_business and doc_type = t and status = 'pending' and created_at > d.created_at) then v_pending := v_pending || t; end if;
      v_expired := v_expired || t;
    elsif d.expires_on is not null and d.expires_on <= current_date + 30 then
      v_expiring := v_expiring || jsonb_build_object('type', t, 'expires_on', d.expires_on);
    end if;
  end loop;
  v_grace := o.compliance_grace_until is not null and o.compliance_grace_until >= current_date;
  return jsonb_build_object(
    'required', to_jsonb(v_req), 'missing', to_jsonb(v_missing), 'expired', to_jsonb(v_expired), 'pending', to_jsonb(v_pending),
    'expiring', v_expiring, 'grace_until', o.compliance_grace_until,
    'documents_ok', cardinality(v_expired) = 0 and (cardinality(v_missing) + cardinality(v_pending) = 0 or v_grace),
    'good_standing', o.status = 'approved' and cardinality(v_expired) = 0 and (cardinality(v_missing) + cardinality(v_pending) = 0 or v_grace));
end;
$$;

-- Fast yes/no used by every ride check.
create or replace function public.operator_in_good_standing(p_business uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare o operator_profiles; t text; v_grace boolean;
begin
  select * into o from operator_profiles where business_id = p_business;
  if o.business_id is null or o.status <> 'approved' then return false; end if;
  v_grace := o.compliance_grace_until is not null and o.compliance_grace_until >= current_date;
  foreach t in array public.required_documents(o.kinds) loop
    -- An approved document that has expired always takes the operator offline.
    if exists (select 1 from operator_documents where business_id = p_business and doc_type = t and status = 'approved')
       and not exists (select 1 from operator_documents where business_id = p_business and doc_type = t and status = 'approved' and (expires_on is null or expires_on >= current_date)) then
      return false;
    end if;
    if not v_grace and not exists (select 1 from operator_documents where business_id = p_business and doc_type = t and status = 'approved' and (expires_on is null or expires_on >= current_date)) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- Rides only reach operators in good standing.
create or replace function public.operator_can_serve(p_business uuid, p_country text, p_kind public.trip_kind)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from operator_profiles o
    join businesses b on b.id = o.business_id and b.listing_status = 'published'
    where o.business_id = p_business and o.status = 'approved'
      and (p_kind = any (o.kinds) or (p_kind in ('taxi', 'airport') and o.kinds && array['taxi', 'airport']::public.trip_kind[]))
      and (exists (select 1 from business_locations l where l.business_id = b.id and l.country_code = p_country)
        or exists (select 1 from business_service_areas a join islands i on i.id = a.island_id where a.business_id = b.id and i.country_code = p_country)))
    and public.operator_in_good_standing(p_business);
$$;

-- Not on the map either.
create or replace function public.nearby_vehicles(p_country text)
returns table (lat double precision, lng double precision, heading smallint, van boolean)
language sql stable security definer set search_path = public as $$
  select round((p.lat / 0.0013)::numeric) * 0.0013, round((p.lng / 0.0013)::numeric) * 0.0013, p.heading,
         ('group' = any(p.kinds) and not ('taxi' = any(p.kinds)))
  from driver_presence p
  where p.country_code = p_country and p.updated_at > now() - interval '3 minutes'
    and not public.driver_busy(p.business_id) and public.operator_in_good_standing(p.business_id)
  limit 100;
$$;

create or replace function public.set_presence(p_business uuid, p_lat double precision, p_lng double precision, p_heading integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_kinds trip_kind[]; v_country text;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only go online for your own business'; end if;
  select o.kinds into v_kinds from operator_profiles o where o.business_id = p_business and o.status = 'approved';
  if v_kinds is null then raise exception 'Your business isn’t an approved operator yet'; end if;
  if not ('taxi' = any(v_kinds) or 'airport' = any(v_kinds) or 'group' = any(v_kinds)) then raise exception 'Only taxi, airport and minivan operators appear on the map'; end if;
  if not public.operator_in_good_standing(p_business) then
    delete from driver_presence where business_id = p_business;
    raise exception 'You can’t go online until your documents are up to date. See Your documents in your Trips tab.';
  end if;
  select l.country_code into v_country from business_locations l where l.business_id = p_business order by l.is_primary desc limit 1;
  insert into driver_presence (business_id, user_id, country_code, kinds, lat, lng, heading, updated_at)
  values (p_business, auth.uid(), coalesce(v_country, 'gd'), v_kinds, p_lat, p_lng, case when p_heading between 0 and 359 then p_heading end, now())
  on conflict (business_id) do update set user_id = excluded.user_id, kinds = excluded.kinds, lat = excluded.lat, lng = excluded.lng,
    heading = excluded.heading, updated_at = now();
end;
$$;

-- The driver uploads a document (or a renewal). It waits for Island Connect to check it.
create or replace function public.add_operator_document(p_business uuid, p_type text, p_path text, p_expires date)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only add documents for your own business'; end if;
  if p_path not like auth.uid()::text || '/%' then raise exception 'Upload the document again'; end if;
  if p_type <> 'police_record' and p_expires is null then raise exception 'Add the expiry date shown on the document'; end if;
  if p_expires is not null and p_expires < current_date then raise exception 'That document has already expired. Upload the current one'; end if;
  insert into operator_documents (business_id, doc_type, path, expires_on, uploaded_by) values (p_business, p_type, p_path, p_expires, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Admin checks a document.
create or replace function public.admin_review_document(p_document uuid, p_approve boolean, p_note text default null, p_expires date default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review documents'; end if;
  update operator_documents set status = case when p_approve then 'approved' else 'rejected' end, note = p_note,
    expires_on = coalesce(p_expires, expires_on), reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_document;
end;
$$;

-- Applications: documents with types and expiry dates; passenger work needs the hire versions.
create or replace function public.apply_as_driver(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_kinds public.trip_kind[]; v_cats text[]; v_id uuid; v_slug text; v_req text[]; t text; doc jsonb; v_paths text[] := '{}';
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if (select count(*) from business_members m join operator_profiles o on o.business_id = m.business_id
      where m.user_id = auth.uid() and o.status = 'pending') >= 2 then
    raise exception 'You already have an application waiting. We’ll be in touch soon.';
  end if;
  select array_agg(distinct k::public.trip_kind) into v_kinds from jsonb_array_elements_text(p->'kinds') k;
  if v_kinds is null then raise exception 'Choose at least one kind of work'; end if;
  if v_kinds && array['taxi', 'airport', 'group']::public.trip_kind[] and coalesce((p->>'confirm_passenger')::boolean, false) is not true then
    raise exception 'Passenger rides need a licensed hire vehicle (H plate) and a taxi or PSV permit. Confirm you hold them, or choose freight only.';
  end if;
  if v_kinds && array['haulage', 'freight']::public.trip_kind[] and coalesce((p->>'confirm_goods')::boolean, false) is not true then
    raise exception 'Confirm you are 21 or over with at least 12 months of regular driving';
  end if;
  if char_length(trim(coalesce(p->>'licence', ''))) < 3 then raise exception 'Add your permit or licence numbers'; end if;
  if char_length(trim(coalesce(p->>'insurance', ''))) < 3 then raise exception 'Add your insurer and policy number'; end if;
  v_req := public.required_documents(v_kinds);
  foreach t in array v_req loop
    if not exists (select 1 from jsonb_array_elements(coalesce(p->'docs', '[]'::jsonb)) x
                   where x->>'type' = t and x->>'path' like auth.uid()::text || '/%' and (t = 'police_record' or nullif(x->>'expires_on', '') is not null)) then
      raise exception 'Add % with its expiry date', replace(t, '_', ' ');
    end if;
  end loop;

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

  for doc in select * from jsonb_array_elements(coalesce(p->'docs', '[]'::jsonb)) loop
    if doc->>'path' like auth.uid()::text || '/%' then
      insert into operator_documents (business_id, doc_type, path, expires_on, uploaded_by)
      values (v_id, doc->>'type', doc->>'path', nullif(doc->>'expires_on', '')::date, auth.uid());
      v_paths := v_paths || (doc->>'path');
    end if;
  end loop;
  insert into operator_profiles (business_id, kinds, licence_details, vehicle_details, insurance_details, applied_by, status, document_paths)
  values (v_id, v_kinds, trim(p->>'licence'), trim(p->>'vehicles'), trim(p->>'insurance'), auth.uid(), 'pending', v_paths);
  select slug into v_slug from businesses where id = v_id;
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;

-- Approving an operator also approves the documents Island Connect has just checked.
create or replace function public.admin_review_operator(p_business uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review operators'; end if;
  update operator_profiles set status = case when p_approve then 'approved'::operator_status else 'declined'::operator_status end,
    review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where business_id = p_business;
  if not found then raise exception 'No application found'; end if;
  if p_approve then
    update operator_documents set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where business_id = p_business and status = 'pending';
    update businesses set listing_status = case when listing_status = 'pending_review' then 'published'::listing_status else listing_status end,
      verification_status = case when is_demo then verification_status else 'verified'::verification_status end
    where id = p_business;
  end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_approve then 'operator.approved' else 'operator.declined' end, 'business', p_business::text, jsonb_build_object('note', p_note));
end;
$$;

revoke all on function public.operator_compliance(uuid), public.add_operator_document(uuid, text, text, date),
  public.admin_review_document(uuid, boolean, text, date) from public, anon;
grant execute on function public.operator_compliance(uuid), public.add_operator_document(uuid, text, text, date),
  public.admin_review_document(uuid, boolean, text, date) to authenticated;

-- When an operator is approved without a full set of documents (for example one Island Connect
-- set up directly), they get 30 days to upload them before the rules take them offline.
create or replace function public.operator_grace_on_approval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') and new.compliance_grace_until is null
     and exists (select 1 from unnest(public.required_documents(new.kinds)) t
                 where not exists (select 1 from operator_documents d where d.business_id = new.business_id and d.doc_type = t and d.status in ('approved', 'pending'))) then
    new.compliance_grace_until := current_date + 30;
  end if;
  return new;
end;
$$;
drop trigger if exists operator_profiles_grace on public.operator_profiles;
create trigger operator_profiles_grace before insert or update on public.operator_profiles for each row execute function public.operator_grace_on_approval();
