-- Run once in Supabase Dashboard → SQL Editor (production project).
-- Same as migration 20260526160000_data_api_grants.sql — safe to re-run (idempotent grants/revokes).

-- Optional: verify current grants before applying
select
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('user_vaults', 'user_entitlements')
  and grantee in ('anon', 'authenticated', 'service_role')
group by 1, 2, 3
order by 2, 3;

-- Apply explicit Data API grants (REVOKE first, then GRANT minimum privileges)
revoke all on table public.user_vaults from anon;
revoke all on table public.user_vaults from authenticated;
grant select, insert, update, delete on table public.user_vaults to authenticated;
grant all on table public.user_vaults to service_role;

revoke all on table public.user_entitlements from anon;
revoke all on table public.user_entitlements from authenticated;
grant select on table public.user_entitlements to authenticated;
grant all on table public.user_entitlements to service_role;

-- Verify after apply
select
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('user_vaults', 'user_entitlements')
  and grantee in ('anon', 'authenticated', 'service_role')
group by 1, 2, 3
order by 2, 3;
