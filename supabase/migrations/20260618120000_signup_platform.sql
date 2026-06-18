-- Track where the account was first created (web / ios / android), separate from purchase_platform.

alter table public.user_entitlements
  add column if not exists signup_platform text
    check (signup_platform is null or signup_platform in ('web', 'ios', 'android'));

comment on column public.user_entitlements.signup_platform is
  'Client-reported platform at first sign-in (web, ios, android). Distinct from purchase_platform.';

create or replace function public.record_signup_platform(p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_platform is null or p_platform not in ('web', 'ios', 'android') then
    return;
  end if;
  update public.user_entitlements
  set signup_platform = p_platform
  where user_id = auth.uid()
    and signup_platform is null;
end;
$$;

revoke all on function public.record_signup_platform(text) from public;
grant execute on function public.record_signup_platform(text) to authenticated;
