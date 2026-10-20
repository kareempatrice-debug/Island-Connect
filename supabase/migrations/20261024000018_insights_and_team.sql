-- Island Connect: dashboard insights (first-party page views, no cookies, no personal data)
-- and admin team management.

-- ---------- Page views, counted per day and page ----------
create table if not exists public.page_views (
  day date not null default (now() at time zone 'America/Grenada')::date,
  path text not null check (char_length(path) between 1 and 200 and path like '/%'),
  views integer not null default 0,
  primary key (day, path)
);
alter table public.page_views enable row level security;
create policy "admins read page views" on public.page_views for select using (public.is_admin());

create or replace function public.record_view(p_path text)
returns void language plpgsql security definer set search_path = public as $$
declare v_path text := left(split_part(split_part(coalesce(p_path, ''), '?', 1), '#', 1), 200);
begin
  if v_path = '' or left(v_path, 1) <> '/' or v_path like '/admin%' or v_path like '/api/%' then return; end if;
  -- Individual listing and trip pages are grouped, so the table stays small and holds no personal detail.
  v_path := regexp_replace(v_path, '^/(gd|vc)/(trips|messages)/[^/]+.*$', '/\1/\2/…');
  insert into page_views (day, path, views) values ((now() at time zone 'America/Grenada')::date, v_path, 1)
  on conflict (day, path) do update set views = page_views.views + 1;
end;
$$;
revoke all on function public.record_view(text) from public;
grant execute on function public.record_view(text) to anon, authenticated;

-- ---------- Everything the dashboard charts, in one call ----------
create or replace function public.admin_insights(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  d integer := greatest(7, least(coalesce(p_days, 30), 365));
  since date := (now() at time zone 'America/Grenada')::date - (d - 1);
  result jsonb;
begin
  if not public.is_admin() then raise exception 'Only administrators can see insights'; end if;
  with days as (select generate_series(since, since + (d - 1), interval '1 day')::date as day),
  views as (select day, sum(views)::int n from page_views where day >= since group by day),
  signups as (select (created_at at time zone 'America/Grenada')::date as day, count(*)::int n from auth.users where created_at >= since group by 1),
  requests as (select (created_at at time zone 'America/Grenada')::date as day, count(*)::int n from trip_requests where created_at >= since group by 1),
  booked as (select (q.created_at at time zone 'America/Grenada')::date as day, count(*)::int n from trip_requests r join trip_quotes q on q.id = r.accepted_quote_id where q.created_at >= since group by 1),
  completed as (select (created_at at time zone 'America/Grenada')::date as day, count(*)::int n, sum(fare_xcd) fares from commission_ledger where created_at >= since group by 1),
  convos as (select (created_at at time zone 'America/Grenada')::date as day, count(*)::int n from enquiries where created_at >= since group by 1),
  msgs as (select day, sum(n)::int n from (
      select (created_at at time zone 'America/Grenada')::date as day, count(*) n from enquiry_messages where created_at >= since group by 1
      union all select (created_at at time zone 'America/Grenada')::date as day, count(*) from trip_messages where created_at >= since group by 1) x group by day),
  clicks as (select (created_at at time zone 'America/Grenada')::date as day, count(*)::int n from contact_clicks where created_at >= since group by 1)
  select jsonb_build_object(
    'days', d,
    'series', (select jsonb_agg(jsonb_build_object(
        'day', days.day,
        'views', coalesce(views.n, 0), 'signups', coalesce(signups.n, 0), 'requests', coalesce(requests.n, 0),
        'booked', coalesce(booked.n, 0), 'completed', coalesce(completed.n, 0), 'fares', coalesce(completed.fares, 0),
        'conversations', coalesce(convos.n, 0), 'messages', coalesce(msgs.n, 0), 'clicks', coalesce(clicks.n, 0)) order by days.day)
      from days left join views using (day) left join signups using (day) left join requests using (day) left join booked using (day)
      left join completed using (day) left join convos using (day) left join msgs using (day) left join clicks using (day)),
    'previous', jsonb_build_object(
      'views', (select coalesce(sum(views), 0) from page_views where day >= since - d and day < since),
      'signups', (select count(*) from auth.users where created_at >= since - d and created_at < since),
      'requests', (select count(*) from trip_requests where created_at >= since - d and created_at < since),
      'booked', (select count(*) from trip_quotes where status in ('accepted') and created_at >= since - d and created_at < since),
      'conversations', (select count(*) from enquiries where created_at >= since - d and created_at < since),
      'clicks', (select count(*) from contact_clicks where created_at >= since - d and created_at < since)),
    'trip_kinds', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind::text, count(*) n from trip_requests where created_at >= since group by kind) k),
    'trip_countries', (select coalesce(jsonb_object_agg(country_code, n), '{}'::jsonb) from (select country_code, count(*) n from trip_requests where created_at >= since group by country_code) c),
    'trip_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status::text, count(*) n from trip_requests where created_at >= since group by status) s),
    'click_channels', (select coalesce(jsonb_object_agg(channel, n), '{}'::jsonb) from (select channel, count(*) n from contact_clicks where created_at >= since group by channel) c),
    'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', v) order by v desc), '[]'::jsonb) from (select path, sum(views) v from page_views where day >= since group by path order by v desc limit 10) p),
    'top_businesses', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'clicks', clicks, 'conversations', convos) order by clicks + convos desc), '[]'::jsonb) from (
        select b.name,
          (select count(*) from contact_clicks c where c.business_id = b.id and c.created_at >= since) clicks,
          (select count(*) from enquiries e where e.business_id = b.id and e.created_at >= since) convos
        from businesses b where b.listing_status = 'published' and not b.is_demo
        order by 2 + 3 desc limit 10) t where clicks + convos > 0),
    'totals', jsonb_build_object(
      'accounts', (select count(*) from auth.users),
      'listings', (select count(*) from businesses where listing_status = 'published' and not is_demo),
      'claimed', (select count(*) from businesses where claim_status = 'claimed' and listing_status = 'published' and not is_demo),
      'verified', (select count(*) from businesses where verification_status = 'verified' and not is_demo),
      'operators', (select count(*) from operator_profiles where status = 'approved'),
      'notification_devices', (select count(*) from push_subscriptions))
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_insights(integer) from public, anon;
grant execute on function public.admin_insights(integer) to authenticated;

-- ---------- Admin team ----------
create or replace function public.admin_team()
returns table (id uuid, email text, name text) language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can see the team'; end if;
  return query select p.id, u.email::text, p.full_name from profiles p join auth.users u on u.id = p.id where p.role = 'admin' order by u.email;
end;
$$;

create or replace function public.admin_set_admin(p_email text, p_admin boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only administrators can change the team'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No account uses that email yet. Ask them to join on the site first, then try again.'; end if;
  if not p_admin and v_user = auth.uid() then raise exception 'You can’t remove your own admin access.'; end if;
  if not p_admin and (select count(*) from profiles where role = 'admin') <= 1 then raise exception 'There must always be at least one administrator.'; end if;
  update profiles set role = case when p_admin then 'admin'::app_role else 'customer'::app_role end where id = v_user;
  insert into audit_events (actor_id, action, entity_type, entity_id, data)
  values (auth.uid(), case when p_admin then 'admin.granted' else 'admin.removed' end, 'user', v_user::text, jsonb_build_object('email', lower(trim(p_email))));
end;
$$;
revoke all on function public.admin_team(), public.admin_set_admin(text, boolean) from public, anon;
grant execute on function public.admin_team(), public.admin_set_admin(text, boolean) to authenticated;
