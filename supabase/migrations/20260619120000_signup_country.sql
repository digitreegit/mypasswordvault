-- Track signup region (ISO 3166-1 alpha-2) separately from purchase_country.

alter table public.user_entitlements
  add column if not exists signup_country text
    check (signup_country is null or signup_country ~ '^[A-Z]{2}$');

comment on column public.user_entitlements.signup_country is
  'Client-reported ISO 3166-1 alpha-2 region at first sign-in. Distinct from purchase_country.';

drop function if exists public.record_signup_platform(text);

create or replace function public.record_signup_platform(p_platform text, p_country text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country text;
begin
  if auth.uid() is null then
    return;
  end if;

  v_country := upper(trim(coalesce(p_country, '')));
  if v_country = '' or v_country !~ '^[A-Z]{2}$' then
    v_country := null;
  end if;

  update public.user_entitlements
  set
    signup_platform = case
      when signup_platform is null
        and p_platform in ('web', 'ios', 'android')
      then p_platform
      else signup_platform
    end,
    signup_country = case
      when signup_country is null and v_country is not null then v_country
      else signup_country
    end
  where user_id = auth.uid()
    and (
      (signup_platform is null and p_platform in ('web', 'ios', 'android'))
      or (signup_country is null and v_country is not null)
    );
end;
$$;

revoke all on function public.record_signup_platform(text, text) from public;
grant execute on function public.record_signup_platform(text, text) to authenticated;
