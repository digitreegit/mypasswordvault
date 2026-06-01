-- Admin dashboard: purchase metadata, refunds, support complaints, account email for lookup.

alter table public.user_entitlements
  add column if not exists account_email text,
  add column if not exists amount_cents integer,
  add column if not exists currency text default 'usd',
  add column if not exists refunded_at timestamptz,
  add column if not exists created_at timestamptz default now();

comment on column public.user_entitlements.account_email is 'Copy of auth email at signup/purchase for admin search (not used for auth).';
comment on column public.user_entitlements.amount_cents is 'Stripe Checkout Session amount_total at purchase.';
comment on column public.user_entitlements.refunded_at is 'Set when license revoked after Stripe refund.';

-- Backfill email and created_at from auth.users
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

comment on table public.admin_complaints is 'Support/complaint log for admin dashboard; service role only.';

alter table public.admin_complaints enable row level security;

-- No policies: only service_role (bypasses RLS) may access.

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

-- Stats for admin-api (service_role only).
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
