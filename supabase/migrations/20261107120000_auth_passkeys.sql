-- Account passkeys for silent web sign-in (separate from vault-unlock PRF passkeys).
-- Service role only via Edge Functions; no client RLS policies for writes.

create table if not exists public.auth_passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null,
  public_key text not null,
  algorithm text not null,
  counter bigint not null default 0,
  transports text[] null,
  rp_id text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null,
  constraint auth_passkeys_credential_id_unique unique (credential_id)
);

create index if not exists auth_passkeys_user_id_idx on public.auth_passkeys (user_id);

comment on table public.auth_passkeys is
  'Discoverable WebAuthn credentials for Supabase session login (not vault PRF unlock).';

alter table public.auth_passkeys enable row level security;

-- No policies: clients never read/write directly. Edge Functions use service role.

create table if not exists public.auth_passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  user_id uuid null references auth.users (id) on delete cascade,
  purpose text not null check (purpose in ('register', 'login')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_passkey_challenges_expires_idx
  on public.auth_passkey_challenges (expires_at);

comment on table public.auth_passkey_challenges is
  'Short-lived WebAuthn challenges for auth-passkey-register / auth-passkey-login.';

alter table public.auth_passkey_challenges enable row level security;
