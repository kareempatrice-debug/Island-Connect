-- Island Connect Gateway: return home, start a business or invest, from anywhere.
-- People follow step-by-step journeys, track their progress, and send applications, appointment
-- requests and questions to government agencies, with documents, and follow the reply here.
-- Agencies get a free portal to receive and answer requests. Until an agency is set up, Island
-- Connect's team receives its requests and passes them on, so nothing is lost.

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code in ('gd', 'vc')),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 3 and 160),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 60),
  website text check (char_length(website) <= 300),
  address text check (char_length(address) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.agencies enable row level security;
drop policy if exists "anyone sees active agencies" on public.agencies;
create policy "anyone sees active agencies" on public.agencies for select using (active or public.is_admin());
drop policy if exists "admins manage agencies" on public.agencies;
create policy "admins manage agencies" on public.agencies for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);
alter table public.agency_members enable row level security;
drop policy if exists "members see their agencies" on public.agency_members;
create policy "members see their agencies" on public.agency_members for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.is_agency_member(p_agency uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from agency_members where agency_id = p_agency and user_id = auth.uid());
$$;

create sequence if not exists public.gateway_ref_seq;
create table if not exists public.gateway_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('IC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.gateway_ref_seq')::text, 5, '0')),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (country_code in ('gd', 'vc')),
  agency_id uuid not null references public.agencies(id),
  service_slug text not null check (service_slug ~ '^[a-z0-9-]{3,60}$'),
  kind text not null check (kind in ('application', 'appointment', 'question')),
  details jsonb not null default '{}'::jsonb,
  documents text[] not null default '{}',
  status text not null default 'submitted' check (status in ('submitted', 'received', 'in_review', 'needs_info', 'approved', 'declined', 'closed')),
  appointment_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gateway_requests_user_idx on public.gateway_requests (user_id, created_at desc);
create index if not exists gateway_requests_agency_idx on public.gateway_requests (agency_id, status, created_at desc);
alter table public.gateway_requests enable row level security;
drop policy if exists "people, their agency and admins see requests" on public.gateway_requests;
create policy "people, their agency and admins see requests" on public.gateway_requests for select
  using (user_id = auth.uid() or public.is_agency_member(agency_id) or public.is_admin());

create table if not exists public.gateway_messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.gateway_requests(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  from_agency boolean not null default false,
  body text not null check (char_length(body) between 1 and 4000),
  documents text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists gateway_messages_request_idx on public.gateway_messages (request_id, created_at);
alter table public.gateway_messages enable row level security;
drop policy if exists "request parties see messages" on public.gateway_messages;
create policy "request parties see messages" on public.gateway_messages for select
  using (exists (select 1 from gateway_requests r where r.id = request_id and (r.user_id = auth.uid() or public.is_agency_member(r.agency_id) or public.is_admin())));

create table if not exists public.journey_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (country_code in ('gd', 'vc')),
  journey text not null check (journey ~ '^[a-z0-9-]{3,40}$'),
  step text not null check (step ~ '^[a-z0-9-]{2,60}$'),
  done boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, country_code, journey, step)
);
alter table public.journey_progress enable row level security;
drop policy if exists "own progress" on public.journey_progress;
create policy "own progress" on public.journey_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Send a request to an agency.
create or replace function public.submit_gateway_request(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_agency agencies; v_id uuid; v_ref text; v_docs text[];
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if (select count(*) from gateway_requests where user_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You’ve sent a lot of requests today. Please try again tomorrow.';
  end if;
  select * into v_agency from agencies where slug = p->>'agency' and active;
  if v_agency.id is null then raise exception 'That agency isn’t available yet'; end if;
  select coalesce(array_agg(d), '{}') into v_docs from jsonb_array_elements_text(coalesce(p->'documents', '[]'::jsonb)) d
    where d like auth.uid()::text || '/%';
  insert into gateway_requests (user_id, country_code, agency_id, service_slug, kind, details, documents)
  values (auth.uid(), v_agency.country_code, v_agency.id, p->>'service', p->>'kind', coalesce(p->'details', '{}'::jsonb), v_docs)
  returning id, reference into v_id, v_ref;
  return jsonb_build_object('id', v_id, 'reference', v_ref);
end;
$$;

-- A message on a request, from the person or from the agency (or Island Connect's team on its behalf).
create or replace function public.add_gateway_message(p_request uuid, p_body text, p_documents text[] default '{}')
returns bigint language plpgsql security definer set search_path = public as $$
declare r gateway_requests; v_agency boolean; v_id bigint;
begin
  select * into r from gateway_requests where id = p_request;
  if r.id is null then raise exception 'Request not found'; end if;
  v_agency := public.is_agency_member(r.agency_id) or (public.is_admin() and r.user_id <> auth.uid());
  if not (r.user_id = auth.uid() or v_agency) then raise exception 'Not your request'; end if;
  insert into gateway_messages (request_id, sender_id, from_agency, body, documents)
  values (p_request, auth.uid(), v_agency, left(trim(p_body), 4000),
          array(select d from unnest(coalesce(p_documents, '{}')) d where d like auth.uid()::text || '/%'))
  returning id into v_id;
  update gateway_requests set updated_at = now(),
    status = case when not v_agency and status = 'needs_info' then 'in_review' when v_agency and status = 'submitted' then 'received' else status end
  where id = p_request;
  return v_id;
end;
$$;

-- The agency (or Island Connect's team) updates the status, and can confirm an appointment.
create or replace function public.agency_update_request(p_request uuid, p_status text, p_appointment timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare r gateway_requests;
begin
  select * into r from gateway_requests where id = p_request;
  if r.id is null or not (public.is_agency_member(r.agency_id) or public.is_admin()) then raise exception 'Only the agency can update this request'; end if;
  if p_status not in ('received', 'in_review', 'needs_info', 'approved', 'declined', 'closed') then raise exception 'Unknown status'; end if;
  update gateway_requests set status = p_status, appointment_at = coalesce(p_appointment, appointment_at), updated_at = now() where id = p_request;
end;
$$;

create or replace function public.admin_set_agency_member(p_agency uuid, p_email text, p_add boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only administrators can manage agency staff'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No Island Connect account with that email. Ask them to join first.'; end if;
  if p_add then insert into agency_members (agency_id, user_id) values (p_agency, v_user) on conflict do nothing;
  else delete from agency_members where agency_id = p_agency and user_id = v_user; end if;
end;
$$;

revoke all on function public.submit_gateway_request(jsonb), public.add_gateway_message(uuid, text, text[]),
  public.agency_update_request(uuid, text, timestamptz), public.admin_set_agency_member(uuid, text, boolean) from public, anon;
grant execute on function public.submit_gateway_request(jsonb), public.add_gateway_message(uuid, text, text[]),
  public.agency_update_request(uuid, text, timestamptz), public.admin_set_agency_member(uuid, text, boolean) to authenticated;

-- Private document storage for Gateway uploads (each person's own folder; agencies see them through the app).
do $outer$
begin
  if to_regclass('storage.buckets') is null then raise notice 'storage schema not found: skipping gateway bucket'; return; end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('gateway-documents', 'gateway-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  execute $p$drop policy if exists "gateway documents: own folder add" on storage.objects$p$;
  execute $p$drop policy if exists "gateway documents: own folder read" on storage.objects$p$;
  execute $p$create policy "gateway documents: own folder add" on storage.objects for insert to authenticated
    with check (bucket_id = 'gateway-documents' and split_part(name, '/', 1) = auth.uid()::text)$p$;
  execute $p$create policy "gateway documents: own folder read" on storage.objects for select to authenticated
    using (bucket_id = 'gateway-documents' and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin()))$p$;
end
$outer$;

-- The agencies people deal with most (contact details can be added and corrected in Admin → Agencies).
insert into public.agencies (country_code, slug, name, phone, website, address) values
  ('gd', 'gd-returning-nationals', 'Returning Nationals Facilitation Bureau, Ministry of Finance', '+1 473 440 2731', 'https://www.finance.gd', 'Ministry of Finance, St George’s'),
  ('gd', 'gd-caipo', 'Corporate Affairs and Intellectual Property Office (CAIPO)', null, null, 'St George’s'),
  ('gd', 'gd-ird', 'Inland Revenue Division', null, 'https://tax.gov.gd', 'The Carenage, St George’s'),
  ('gd', 'gd-nis', 'National Insurance Scheme', null, 'https://nisgrenada.org', 'St George’s'),
  ('gd', 'gd-gidc', 'Grenada Investment Development Corporation (GIDC)', null, null, 'St George’s'),
  ('gd', 'gd-pda', 'Planning and Development Authority', null, null, 'St George’s'),
  ('vc', 'vc-customs', 'Customs and Excise Department (Comptroller of Customs)', null, null, 'Custom House, Upper Bay Street, Kingstown'),
  ('vc', 'vc-cipo', 'Commerce and Intellectual Property Office (CIPO)', '+1 784 456 1516', 'https://cipo.gov.vc', 'First Floor, Brewster’s Building, McCoy Street, Kingstown'),
  ('vc', 'vc-ird', 'Inland Revenue Department', null, 'https://etax.gov.vc', 'Kingstown'),
  ('vc', 'vc-nis', 'National Insurance Services', null, 'https://www.nissvg.org', 'Kingstown'),
  ('vc', 'vc-invest-svg', 'Invest SVG', null, null, 'Kingstown'),
  ('vc', 'vc-physical-planning', 'Physical Planning Unit', null, null, 'Kingstown')
on conflict (slug) do nothing;
update public.agencies set email = 'pbr.cipo@gov.vc' where slug = 'vc-cipo' and email is null;
