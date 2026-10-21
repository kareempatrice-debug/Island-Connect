-- Island Connect: family profile, trusted contacts, trip sharing and pick-up PINs.
-- Family members do not get their own accounts: the organiser books and stays in control.

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  kind text not null default 'adult' check (kind in ('adult', 'senior', 'teen')),
  created_at timestamptz not null default now()
);
create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  created_at timestamptz not null default now()
);
alter table public.family_members enable row level security;
alter table public.trusted_contacts enable row level security;
drop policy if exists "own family" on public.family_members;
create policy "own family" on public.family_members for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "own trusted contacts" on public.trusted_contacts;
create policy "own trusted contacts" on public.trusted_contacts for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists family_members_owner_idx on public.family_members (owner_id);
create index if not exists trusted_contacts_owner_idx on public.trusted_contacts (owner_id);

-- Trips: who is riding, when they were picked up, and a private link for sharing.
alter table public.trip_requests add column if not exists rider_kind text check (rider_kind in ('adult', 'senior', 'teen'));
alter table public.trip_requests add column if not exists picked_up_at timestamptz;
alter table public.trip_requests add column if not exists share_token text unique;

-- The pick-up PIN is visible only to the customer (drivers enter it; they can't read it).
create table if not exists public.trip_pins (
  request_id uuid primary key references public.trip_requests(id) on delete cascade,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  attempts smallint not null default 0
);
alter table public.trip_pins enable row level security;
drop policy if exists "customer sees their PIN" on public.trip_pins;
create policy "customer sees their PIN" on public.trip_pins for select
  using (exists (select 1 from public.trip_requests r where r.id = request_id and r.customer_id = auth.uid()));

create or replace function public.trip_extras()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into trip_pins (request_id, pin) values (new.id, lpad((floor(random() * 10000))::int::text, 4, '0'))
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists trip_requests_extras on public.trip_requests;
create trigger trip_requests_extras after insert on public.trip_requests for each row execute function public.trip_extras();

create or replace function public.trip_before_insert()
returns trigger language plpgsql as $$
begin
  if new.share_token is null then new.share_token := replace(gen_random_uuid()::text, '-', ''); end if;
  return new;
end;
$$;
drop trigger if exists trip_requests_token on public.trip_requests;
create trigger trip_requests_token before insert on public.trip_requests for each row execute function public.trip_before_insert();

-- Record who is riding (set by the customer's own request just after creating it).
create or replace function public.set_rider_kind(p_request uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('adult', 'senior', 'teen') then raise exception 'Unknown rider'; end if;
  update trip_requests set rider_kind = p_kind where id = p_request and customer_id = auth.uid() and status = 'open';
end;
$$;

-- The driver confirms pick-up with the passenger's PIN. Five wrong tries lock it.
create or replace function public.confirm_pickup(p_request uuid, p_pin text)
returns void language plpgsql security definer set search_path = public as $$
declare r trip_requests;
begin
  select * into r from trip_requests where id = p_request;
  if r.id is null or r.status <> 'booked' then raise exception 'This trip isn’t booked'; end if;
  if not exists (select 1 from trip_quotes q where q.id = r.accepted_quote_id and public.is_business_member(q.business_id)) then
    raise exception 'Only the booked driver can confirm the pick-up';
  end if;
  if (select attempts from trip_pins where request_id = p_request) >= 5 then raise exception 'Too many wrong PINs. Ask the customer to call you.'; end if;
  if not exists (select 1 from trip_pins where request_id = p_request and pin = trim(p_pin)) then
    update trip_pins set attempts = attempts + 1 where request_id = p_request;
    raise exception 'That PIN doesn’t match. Ask the passenger to read it from their trip screen.';
  end if;
  update trip_requests set picked_up_at = now(), updated_at = now() where id = p_request;
end;
$$;

-- What someone with the share link can see: enough to know the trip is safe, nothing more.
create or replace function public.shared_trip(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r trip_requests; v_biz text; v_pos jsonb;
begin
  if p_token is null or char_length(p_token) <> 32 then return null; end if;
  select * into r from trip_requests where share_token = p_token;
  if r.id is null or r.created_at < now() - interval '3 days' then return null; end if;
  select b.name into v_biz from trip_quotes q join businesses b on b.id = q.business_id where q.id = r.accepted_quote_id;
  select jsonb_build_object('lat', p.lat, 'lng', p.lng, 'at', p.updated_at) into v_pos
  from trip_quotes q join driver_presence p on p.business_id = q.business_id
  where q.id = r.accepted_quote_id and p.updated_at > now() - interval '3 minutes' and r.status = 'booked';
  return jsonb_build_object('pickup', r.pickup, 'dropoff', r.dropoff, 'travel_at', r.travel_at, 'status', r.status,
    'rider', split_part(coalesce(r.rider_name, ''), ' ', 1), 'operator', v_biz, 'picked_up_at', r.picked_up_at,
    'country', r.country_code, 'driver_position', v_pos);
end;
$$;

revoke all on function public.set_rider_kind(uuid, text), public.confirm_pickup(uuid, text) from public, anon;
grant execute on function public.set_rider_kind(uuid, text), public.confirm_pickup(uuid, text) to authenticated;
revoke all on function public.shared_trip(text) from public;
grant execute on function public.shared_trip(text) to anon, authenticated;
