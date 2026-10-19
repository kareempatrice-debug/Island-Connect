-- Island Connect: chat on booked trips, and instant booking at the official fare.

-- ---------- Instant booking ----------
-- When a taxi or airport trip matches a published fare, the request carries that fare and
-- the first approved operator to accept gets the job at it. Drivers see the fare before accepting.
alter table public.trip_requests add column if not exists fixed_fare_xcd numeric(10, 2) check (fixed_fare_xcd is null or fixed_fare_xcd > 0);
alter table public.trip_requests add column if not exists fare_source text check (char_length(fare_source) <= 300);

create or replace function public.create_trip_request(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_when timestamptz := nullif(p->>'travel_at', '')::timestamptz; v_kind trip_kind := (p->>'kind')::trip_kind;
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if (select count(*) from trip_requests where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 8 then
    raise exception 'You’ve sent a lot of requests today. Please try again tomorrow.';
  end if;
  if v_when is not null and (v_when < now() - interval '1 hour' or v_when > now() + interval '180 days') then
    raise exception 'Choose a date within the next six months';
  end if;
  insert into trip_requests (customer_id, country_code, kind, from_place, to_place, pickup, dropoff, travel_at, passengers, details, cross_border, fixed_fare_xcd, fare_source)
  values (auth.uid(), p->>'country', v_kind, trim(p->>'from'), trim(p->>'to'), trim(p->>'pickup'), trim(p->>'dropoff'),
          v_when, nullif(p->>'passengers', '')::int, nullif(trim(p->>'details'), ''), coalesce((p->>'cross_border')::boolean, false),
          case when v_kind in ('taxi', 'airport') then nullif(p->>'fixed_fare_xcd', '')::numeric end,
          case when v_kind in ('taxi', 'airport') then nullif(trim(p->>'fare_source'), '') end)
  returning id into v_id;
  if coalesce(p->>'contact_phone', '') <> '' then
    insert into trip_contacts (request_id, phone_e164) values (v_id, p->>'contact_phone');
  end if;
  return v_id;
end;
$$;

-- First approved operator to accept a fixed-fare request gets it.
create or replace function public.accept_fixed_fare(p_request uuid, p_business uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare r trip_requests; v_quote uuid;
begin
  if not public.is_business_member(p_business) then raise exception 'You can only accept for your own business'; end if;
  select * into r from trip_requests where id = p_request for update;   -- one winner, even if two drivers tap at once
  if r.id is null or r.status <> 'open' then raise exception 'Another driver has already taken this trip'; end if;
  if r.fixed_fare_xcd is null then raise exception 'This trip needs a quote, not instant acceptance'; end if;
  if r.customer_id = auth.uid() then raise exception 'You can’t accept your own request'; end if;
  if not public.operator_can_serve(p_business, r.country_code, r.kind) then raise exception 'Your business isn’t approved for this kind of trip'; end if;
  insert into trip_quotes (request_id, business_id, amount_xcd, includes, valid_until, status, created_by)
  values (r.id, p_business, r.fixed_fare_xcd, 'Official fare', now() + interval '1 day', 'accepted', auth.uid())
  on conflict (request_id, business_id) do update set amount_xcd = excluded.amount_xcd, includes = excluded.includes, status = 'accepted'
  returning id into v_quote;
  update trip_quotes set status = 'declined' where request_id = r.id and id <> v_quote and status = 'offered';
  update trip_requests set status = 'booked', accepted_quote_id = v_quote, updated_at = now() where id = r.id;
  return v_quote;
end;
$$;

-- ---------- Trip chat ----------
create table public.trip_messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.trip_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index trip_messages_request_idx on public.trip_messages (request_id, created_at);
alter table public.trip_messages enable row level security;

-- The customer and the booked operator's team, once a trip is booked (and afterwards, as a record).
create or replace function public.is_trip_participant(p_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_requests r left join trip_quotes q on q.id = r.accepted_quote_id
    where r.id = p_request and r.status in ('booked', 'completed', 'cancelled') and r.accepted_quote_id is not null
      and (r.customer_id = auth.uid() or public.is_business_member(q.business_id)));
$$;

create policy "trip chat visible to the customer, the booked operator and admins" on public.trip_messages for select
  using (public.is_trip_participant(request_id) or public.is_admin());

create or replace function public.send_trip_message(p_request uuid, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if not public.is_trip_participant(p_request) then raise exception 'Only the customer and the booked operator can message about this trip'; end if;
  if (select status from trip_requests where id = p_request) = 'cancelled' then raise exception 'This trip was cancelled'; end if;
  if (select count(*) from trip_messages where sender_id = auth.uid() and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'You’ve sent a lot of messages. Please wait a little.';
  end if;
  insert into trip_messages (request_id, sender_id, body) values (p_request, auth.uid(), trim(p_body)) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.accept_fixed_fare(uuid, uuid), public.send_trip_message(uuid, text) from public, anon;
grant execute on function public.accept_fixed_fare(uuid, uuid), public.send_trip_message(uuid, text) to authenticated;
