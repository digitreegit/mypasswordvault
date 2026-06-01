-- Run once in Supabase Dashboard → SQL Editor.
-- Same as migration 20260603120000_complimentary_grants.sql — safe to re-run.

alter table public.user_entitlements
  add column if not exists complimentary_grant boolean not null default false;

create table if not exists public.admin_complimentary_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  granted_at timestamptz not null default now(),
  granted_by text,
  revoked_at timestamptz
);

create unique index if not exists admin_complimentary_grants_email_active_idx
  on public.admin_complimentary_grants (lower(trim(email)))
  where revoked_at is null;

alter table public.admin_complimentary_grants enable row level security;

create or replace function public.auth_user_id_for_email(p_email text)
returns uuid
language sql
security definer
stable
set search_path = auth, public
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.auth_user_id_for_email(text) from public;
grant execute on function public.auth_user_id_for_email(text) to service_role;

create or replace function public.handle_new_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_comp boolean := false;
begin
  select exists (
    select 1
    from public.admin_complimentary_grants g
    where lower(trim(g.email)) = lower(trim(new.email))
      and g.revoked_at is null
  ) into v_comp;

  insert into public.user_entitlements (
    user_id,
    account_email,
    created_at,
    licensed,
    complimentary_grant
  )
  values (
    new.id,
    new.email,
    coalesce(new.created_at, now()),
    v_comp,
    v_comp
  )
  on conflict (user_id) do update
    set account_email = coalesce(public.user_entitlements.account_email, excluded.account_email),
        licensed = case
          when public.user_entitlements.stripe_checkout_session_id is not null
            and public.user_entitlements.refunded_at is null
          then true
          when v_comp then true
          else public.user_entitlements.licensed
        end,
        complimentary_grant = v_comp
          or (
            public.user_entitlements.complimentary_grant
            and exists (
              select 1
              from public.admin_complimentary_grants g
              where lower(trim(g.email)) = lower(trim(new.email))
                and g.revoked_at is null
            )
          );
  return new;
end;
$$;
