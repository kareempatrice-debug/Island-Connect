-- Island Connect: phone notifications for the installed app (Web Push).
-- One row per device a person has switched notifications on for.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "people manage their own devices" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
