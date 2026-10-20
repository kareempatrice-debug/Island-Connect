-- Island Connect: sign in with Face ID, Touch ID, fingerprint or a device PIN (passkeys / WebAuthn).
-- Only the public half of each key is stored; the private key never leaves the person's device.
create table if not exists public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique check (char_length(credential_id) between 16 and 1024),
  public_key text not null check (char_length(public_key) <= 4096),
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_name text check (char_length(device_name) <= 80),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkeys_user_idx on public.passkeys (user_id);
alter table public.passkeys enable row level security;
create policy "people see their own passkeys" on public.passkeys for select using (user_id = auth.uid());
create policy "people add their own passkeys" on public.passkeys for insert with check (user_id = auth.uid());
create policy "people remove their own passkeys" on public.passkeys for delete using (user_id = auth.uid());
