-- Master-password continuity: same password proof → same vault user_id.
-- Client sends PBKDF2 proof; server stores HMAC(pepper, proof) only.

create table if not exists public.vault_continuity (
  proof_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vault_continuity_user_id_uidx
  on public.vault_continuity (user_id);

comment on table public.vault_continuity is
  'Lookup from HMAC(master-password proof) to canonical vault user_id. Never stores the password.';

alter table public.vault_continuity enable row level security;
-- No client policies; Edge Functions use service role.

-- Move OAuth/email identities from an empty Auth user onto the canonical vault owner,
-- then delete the empty Auth user. Called only after isEmptyClaimableAccount checks.
create or replace function public.admin_absorb_empty_auth_user(
  p_empty_user_id uuid,
  p_canonical_user_id uuid
) returns void
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  id_row record;
begin
  if p_empty_user_id is null or p_canonical_user_id is null then
    raise exception 'invalid_ids';
  end if;
  if p_empty_user_id = p_canonical_user_id then
    raise exception 'same_user';
  end if;

  -- Move each identity; skip if canonical already has that provider+provider_id.
  for id_row in
    select id, provider, provider_id
    from auth.identities
    where user_id = p_empty_user_id
  loop
    if exists (
      select 1 from auth.identities i
      where i.user_id = p_canonical_user_id
        and i.provider = id_row.provider
        and i.provider_id = id_row.provider_id
    ) then
      delete from auth.identities where id = id_row.id;
    elsif exists (
      select 1 from auth.identities i
      where i.user_id = p_canonical_user_id
        and i.provider = id_row.provider
    ) then
      -- Canonical already has this provider (different id) — drop empty's copy.
      delete from auth.identities where id = id_row.id;
    else
      update auth.identities
      set user_id = p_canonical_user_id
      where id = id_row.id;
    end if;
  end loop;

  delete from auth.users where id = p_empty_user_id;
end;
$$;

revoke all on function public.admin_absorb_empty_auth_user(uuid, uuid) from public;
grant execute on function public.admin_absorb_empty_auth_user(uuid, uuid) to service_role;
