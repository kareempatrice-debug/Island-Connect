-- Island Connect: deleting an account erases the person's data, not just their sign-in.
--
-- Removed with the account (database cascades): profile, sign-in devices and passkeys, messages,
-- conversations they started, trip requests and the private phone numbers attached to them,
-- business memberships and claims.
-- Removed by prepare_account_deletion (below): listings they created or that describe them as a
-- self-employed person, when nobody else manages them; their email in the admin log.
-- Removed by the app after this function: their uploaded documents and the photos of erased listings.
-- Kept, without personal details: the financial record of completed trips (fare and commission),
-- which Island Connect must keep for its accounts; it records the business name, not the customer.

-- 1. The commission ledger survives the deletion of the trip or the business it came from.
alter table public.commission_ledger add column if not exists business_name text;
alter table public.commission_ledger add column if not exists trip_kind text;
alter table public.commission_ledger add column if not exists country_code text;
update public.commission_ledger l set business_name = b.name from public.businesses b where b.id = l.business_id and l.business_name is null;
update public.commission_ledger l set trip_kind = r.kind::text, country_code = r.country_code from public.trip_requests r where r.id = l.request_id and l.trip_kind is null;
alter table public.commission_ledger alter column request_id drop not null;
alter table public.commission_ledger alter column business_id drop not null;
alter table public.commission_ledger drop constraint if exists commission_ledger_request_id_fkey,
  add constraint commission_ledger_request_id_fkey foreign key (request_id) references public.trip_requests(id) on delete set null;
alter table public.commission_ledger drop constraint if exists commission_ledger_business_id_fkey,
  add constraint commission_ledger_business_id_fkey foreign key (business_id) references public.businesses(id) on delete set null;

-- Keep the snapshot filled for new ledger entries.
create or replace function public.ledger_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.business_name is null then select name into new.business_name from businesses where id = new.business_id; end if;
  if new.trip_kind is null then select kind::text, country_code into new.trip_kind, new.country_code from trip_requests where id = new.request_id; end if;
  return new;
end;
$$;
drop trigger if exists commission_ledger_snapshot on public.commission_ledger;
create trigger commission_ledger_snapshot before insert on public.commission_ledger for each row execute function public.ledger_snapshot();

-- 2. Prepare an account for deletion. Returns the listings it erased, so the app can delete their photos.
drop function if exists public.prepare_account_deletion();
create or replace function public.prepare_account_deletion()
returns uuid[] language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_solo uuid[];
  v_erase uuid[];
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if public.is_admin() and (select count(*) from profiles where role = 'admin') <= 1 then
    raise exception 'You’re the only administrator. Make someone else an admin before deleting your account.';
  end if;
  select lower(email) into v_email from auth.users where id = v_user;

  -- Listings this person alone manages.
  select coalesce(array_agg(b.id), '{}') into v_solo from businesses b
  where exists (select 1 from business_members m where m.business_id = b.id and m.user_id = v_user and m.role = 'owner')
    and not exists (select 1 from business_members m where m.business_id = b.id and m.user_id <> v_user and m.role = 'owner');

  -- Erase the ones that are theirs: registered by them, describing them as self-employed,
  -- or not from public research. Researched listings they had claimed go back to unclaimed and
  -- are hidden until an admin reviews them.
  select coalesce(array_agg(id), '{}') into v_erase from businesses
  where id = any(v_solo) and not is_demo and (created_by = v_user or provider_type = 'individual' or source_url is null or source_checked_at is null);

  perform set_config('island.system_change', 'on', true);
  update businesses set listing_status = 'suspended', claim_status = 'unclaimed'
  where id = any(v_solo) and not (id = any(v_erase));
  delete from businesses where id = any(v_erase);
  perform set_config('island.system_change', 'off', true);

  -- Their email out of the admin log (the log keeps what happened, not who they were).
  if v_email is not null then
    update audit_events set data = data - 'email' where data ->> 'email' = v_email;
  end if;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (null, 'account.deleted', 'user', 'erased', jsonb_build_object('listings_erased', cardinality(v_erase), 'listings_released', cardinality(v_solo) - cardinality(v_erase)));
  return v_erase;
end;
$$;
revoke all on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;
