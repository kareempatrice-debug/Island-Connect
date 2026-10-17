-- Island Connect: Stage 2 — how each business wants to be contacted, enquiries with
-- message threads, and contact-click tracking for business statistics.

------------------------------------------------------------------------------
-- Contact preference: take enquiries on Island Connect, or send customers elsewhere
------------------------------------------------------------------------------
create type public.contact_preference as enum ('platform', 'whatsapp', 'phone', 'website', 'external_booking');

alter table public.businesses
  add column contact_preference public.contact_preference not null default 'platform',
  add column external_booking_url text check (external_booking_url is null or external_booking_url ~ '^https://');

alter table public.businesses add constraint external_booking_needs_url
  check (contact_preference <> 'external_booking' or external_booking_url is not null);

------------------------------------------------------------------------------
-- Enquiries and their message threads
------------------------------------------------------------------------------
create type public.enquiry_status as enum ('new', 'open', 'closed');

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 2 and 120),
  service_id uuid references public.services(id) on delete set null,
  preferred_date date,
  status public.enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index enquiries_business_idx on public.enquiries (business_id, last_message_at desc);
create index enquiries_customer_idx on public.enquiries (customer_id, last_message_at desc);

create table public.enquiry_messages (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index enquiry_messages_thread_idx on public.enquiry_messages (enquiry_id, created_at);

create or replace function public.is_enquiry_participant(p_enquiry uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enquiries e
    where e.id = p_enquiry and (e.customer_id = auth.uid() or is_business_member(e.business_id))
  );
$$;

alter table public.enquiries enable row level security;
alter table public.enquiry_messages enable row level security;

create policy "participants read enquiries" on public.enquiries for select
  using (customer_id = auth.uid() or public.is_business_member(business_id) or public.is_admin());
create policy "members update enquiry status" on public.enquiries for update
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "participants read messages" on public.enquiry_messages for select
  using (public.is_enquiry_participant(enquiry_id) or public.is_admin());
create policy "participants write messages" on public.enquiry_messages for insert
  with check (sender_id = auth.uid() and public.is_enquiry_participant(enquiry_id));

-- Starting an enquiry: one call creates the enquiry and its first message, with abuse limits.
create or replace function public.start_enquiry(p_business uuid, p_subject text, p_body text, p_service uuid default null, p_date date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to send an enquiry'; end if;
  if not exists (select 1 from businesses where id = p_business and listing_status = 'published' and not is_demo
                 and exists (select 1 from business_members m where m.business_id = p_business)) then
    raise exception 'This business can’t receive enquiries on Island Connect yet';
  end if;
  if is_business_member(p_business) then raise exception 'You can’t send an enquiry to your own business'; end if;
  if (select count(*) from enquiries where customer_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You’ve sent a lot of enquiries today. Please try again tomorrow.';
  end if;
  if char_length(coalesce(trim(p_body), '')) < 10 then raise exception 'Tell the business a little more about what you need'; end if;
  insert into enquiries (business_id, customer_id, subject, service_id, preferred_date)
  values (p_business, auth.uid(), left(trim(p_subject), 120), p_service, p_date) returning id into v_id;
  insert into enquiry_messages (enquiry_id, sender_id, body) values (v_id, auth.uid(), trim(p_body));
  return v_id;
end;
$$;
grant execute on function public.start_enquiry(uuid, text, text, uuid, date) to authenticated;

-- Replies keep the thread's status and ordering current.
create or replace function public.after_enquiry_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update enquiries set last_message_at = new.created_at,
         status = case when status = 'closed' then 'open'::enquiry_status
                       when new.sender_id <> customer_id then 'open'::enquiry_status else status end
   where id = new.enquiry_id;
  return null;
end;
$$;
create trigger enquiry_message_after after insert on public.enquiry_messages
  for each row execute function public.after_enquiry_message();

------------------------------------------------------------------------------
-- Contact clicks: counts of customers sent to each business, by channel
------------------------------------------------------------------------------
create table public.contact_clicks (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'phone', 'email', 'website', 'booking', 'maps')),
  country_code text references public.countries(code),
  created_at timestamptz not null default now()
);
create index contact_clicks_business_idx on public.contact_clicks (business_id, created_at desc);
alter table public.contact_clicks enable row level security;
create policy "members read own clicks" on public.contact_clicks for select
  using (public.is_business_member(business_id) or public.is_admin());

create or replace function public.log_contact_click(p_slug text, p_channel text, p_country text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from businesses where slug = p_slug and listing_status = 'published' and not is_demo;
  if v_id is null or p_channel not in ('whatsapp', 'phone', 'email', 'website', 'booking', 'maps') then return; end if;
  insert into contact_clicks (business_id, channel, country_code)
  values (v_id, p_channel, (select code from countries where code = p_country));
end;
$$;
grant execute on function public.log_contact_click(text, text, text) to anon, authenticated;

-- Members may also edit their contact preference (owners already update businesses under RLS).
