-- Run once in Supabase Dashboard → SQL Editor (production: fzwkemfytbaymkjrygpb).
-- Same as migration 20260602120000_admin_billing.sql — safe to re-run (IF NOT EXISTS / OR REPLACE).

alter table public.user_entitlements
  add column if not exists account_email text,
  add column if not exists amount_cents integer,
  add column if not exists currency text default 'usd',
  add column if not exists refunded_at timestamptz,
  add column if not exists created_at timestamptz default now();

update public.user_entitlements ue
set
  account_email = coalesce(ue.account_email, u.email),
  created_at = coalesce(ue.created_at, u.created_at)
from auth.users u
where ue.user_id = u.id;

create table if not exists public.admin_complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_checkout_session_id text,
  account_email text,
  note text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.admin_complaints enable row level security;

create or replace function public.handle_new_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_entitlements (user_id, account_email, created_at)
  values (new.id, new.email, coalesce(new.created_at, now()))
  on conflict (user_id) do update
    set account_email = coalesce(public.user_entitlements.account_email, excluded.account_email);
  return new;
end;
$$;

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'utc');
begin
  return json_build_object(
    'sales_today', (
      select count(*)::int
      from public.user_entitlements
      where licensed = true
        and purchased_at >= day_start
        and refunded_at is null
    ),
    'sales_amount_cents_today', (
      select coalesce(sum(amount_cents), 0)::int
      from public.user_entitlements
      where licensed = true
        and purchased_at >= day_start
        and refunded_at is null
    ),
    'free_signups_today', (
      select count(*)::int from auth.users where created_at >= day_start
    ),
    'paid_members', (
      select count(*)::int
      from public.user_entitlements
      where licensed = true and refunded_at is null
    ),
    'free_members', (
      select count(*)::int
      from public.user_entitlements
      where licensed = false
    ),
    'open_complaints', (
      select count(*)::int from public.admin_complaints where status = 'open'
    )
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to service_role;

-- Backfill purchase amounts for rows created before amount_cents was stored.
update public.user_entitlements
set
  amount_cents = 499,
  currency = coalesce(currency, 'usd')
where amount_cents is null
  and (stripe_checkout_session_id is not null or purchased_at is not null);
