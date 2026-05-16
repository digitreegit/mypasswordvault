-- Per-account license flag (set by Stripe webhook via service role). Client read-only.
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  licensed boolean not null default false,
  purchased_at timestamptz,
  stripe_checkout_session_id text unique
);

comment on table public.user_entitlements is 'Commercial license; updated by stripe-webhook edge function only.';

alter table public.user_entitlements enable row level security;

drop policy if exists "user_entitlements_select_own" on public.user_entitlements;
create policy "user_entitlements_select_own"
  on public.user_entitlements for select
  using (auth.uid() = user_id);

-- No insert/update/delete for authenticated users — service role bypasses RLS.

create or replace function public.handle_new_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_entitlements on auth.users;
create trigger on_auth_user_created_entitlements
  after insert on auth.users
  for each row execute function public.handle_new_user_entitlement();

-- Backfill existing users (trigger only runs on new inserts)
insert into public.user_entitlements (user_id)
select id from auth.users
on conflict (user_id) do nothing;
