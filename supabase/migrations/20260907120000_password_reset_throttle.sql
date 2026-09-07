-- Admin-generated email links bypass Auth's public endpoint rate limits.
create table public.password_reset_throttle (
  email_hash text primary key,
  requested_at timestamptz not null default now()
);
alter table public.password_reset_throttle enable row level security;
revoke all on public.password_reset_throttle from public, anon, authenticated;

create or replace function public.claim_password_reset(p_email_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare claimed text;
begin
  if p_email_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  delete from public.password_reset_throttle where requested_at < now() - interval '1 day';
  insert into public.password_reset_throttle (email_hash, requested_at)
  values (p_email_hash, now())
  on conflict (email_hash) do update set requested_at = excluded.requested_at
    where password_reset_throttle.requested_at < now() - interval '5 minutes'
  returning email_hash into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_password_reset(text) from public, anon, authenticated;
grant execute on function public.claim_password_reset(text) to service_role;
