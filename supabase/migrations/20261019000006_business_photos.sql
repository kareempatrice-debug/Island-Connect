-- Island Connect: business photos (logo, cover and a gallery of up to 10).
--
-- Files live in the public storage bucket "business-media", in a folder named after
-- the business id: <business id>/<file>. Only that business's owners (and admins)
-- can add, replace or remove files in its folder. Anyone can view them, as they
-- appear on the public listing.

alter table public.businesses add column if not exists gallery_paths text[] not null default '{}';

-- A stored path must sit in the business's own folder (or be a full https link).
create or replace function public.media_path_ok(p_business uuid, p_path text)
returns boolean language sql immutable as $$
  select p_path is null
      or p_path ~ '^https://'
      or (p_path like p_business::text || '/%' and p_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$');
$$;

create or replace function public.media_paths_ok(p_business uuid, p_paths text[])
returns boolean language sql immutable as $$
  select coalesce(array_length(p_paths, 1), 0) <= 10
     and coalesce((select bool_and(public.media_path_ok(p_business, x)) from unnest(p_paths) as x), true);
$$;

alter table public.businesses drop constraint if exists media_paths_ok;
alter table public.businesses add constraint media_paths_ok check (
  public.media_path_ok(id, logo_path)
  and public.media_path_ok(id, cover_path)
  and public.media_paths_ok(id, gallery_paths)
);

-- Who may change files in a folder: the business's owners, or an admin.
create or replace function public.can_manage_media(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_folder text := split_part(p_name, '/', 1);
begin
  if v_folder !~ '^[0-9a-f-]{36}$' then return false; end if;
  return public.is_business_owner(v_folder::uuid) or public.is_admin();
end;
$$;

-- Storage bucket and its rules (skipped where Supabase Storage isn't present, e.g. local tests).
do $outer$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not found: skipping bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('business-media', 'business-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

  execute $p$drop policy if exists "business media public read" on storage.objects$p$;
  execute $p$drop policy if exists "business media owners add" on storage.objects$p$;
  execute $p$drop policy if exists "business media owners change" on storage.objects$p$;
  execute $p$drop policy if exists "business media owners remove" on storage.objects$p$;

  execute $p$create policy "business media public read" on storage.objects for select
    using (bucket_id = 'business-media')$p$;
  execute $p$create policy "business media owners add" on storage.objects for insert to authenticated
    with check (bucket_id = 'business-media' and public.can_manage_media(name))$p$;
  execute $p$create policy "business media owners change" on storage.objects for update to authenticated
    using (bucket_id = 'business-media' and public.can_manage_media(name))$p$;
  execute $p$create policy "business media owners remove" on storage.objects for delete to authenticated
    using (bucket_id = 'business-media' and public.can_manage_media(name))$p$;
end
$outer$;
