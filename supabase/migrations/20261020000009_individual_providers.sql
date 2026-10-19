-- Island Connect: self-employed individuals can list their services (a carpenter, a hairdresser,
-- an accountant) without having a registered business.
alter table public.businesses add column if not exists provider_type text not null default 'business'
  check (provider_type in ('business', 'individual'));
