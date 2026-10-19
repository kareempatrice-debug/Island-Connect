-- Island Connect: people can delete their own account.
-- Before the account is removed, any listing they alone own is hidden (so it doesn't stay live
-- with nobody to manage it), and the request is recorded. Conversations and trips that belong
-- to the account are removed with it.
-- Trusted database functions may mark a change as a system change (for example hiding a
-- departing owner's listing). Only functions can set this; it lasts for the one transaction.
create or replace function public.guard_business_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_trusted_context() or coalesce(current_setting('island.system_change', true), '') = 'on') then
    if new.verification_status is distinct from old.verification_status
       or new.listing_status is distinct from old.listing_status
       or new.is_featured is distinct from old.is_featured
       or new.featured_until is distinct from old.featured_until
       or new.is_demo is distinct from old.is_demo
       or new.rating_avg is distinct from old.rating_avg
       or new.rating_count is distinct from old.rating_count then
      raise exception 'Only administrators can change verification, status, featuring or ratings';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prepare_account_deletion()
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if public.is_admin() and (select count(*) from profiles where role = 'admin') <= 1 then
    raise exception 'You’re the only administrator. Make someone else an admin before deleting your account.';
  end if;
  perform set_config('island.system_change', 'on', true);
  update businesses b set listing_status = 'suspended'
  where exists (select 1 from business_members m where m.business_id = b.id and m.user_id = v_user and m.role = 'owner')
    and not exists (select 1 from business_members m where m.business_id = b.id and m.user_id <> v_user and m.role = 'owner');
  perform set_config('island.system_change', 'off', true);
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (v_user, 'account.deleted', 'user', v_user::text, '{}'::jsonb);
end;
$$;
revoke all on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;

-- Records that point at a person keep working when their account is deleted (the link becomes empty).
alter table public.articles drop constraint if exists articles_author_id_fkey,
  add constraint articles_author_id_fkey foreign key (author_id) references auth.users(id) on delete set null;
alter table public.audit_events drop constraint if exists audit_events_actor_id_fkey,
  add constraint audit_events_actor_id_fkey foreign key (actor_id) references auth.users(id) on delete set null;
alter table public.businesses drop constraint if exists businesses_created_by_fkey,
  add constraint businesses_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.business_claims drop constraint if exists business_claims_reviewed_by_fkey,
  add constraint business_claims_reviewed_by_fkey foreign key (reviewed_by) references auth.users(id) on delete set null;
