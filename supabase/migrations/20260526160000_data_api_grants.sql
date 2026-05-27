-- Explicit Data API grants (Supabase: public schema tables require GRANT from Oct 2026).
-- REVOKE first: GRANT alone does not remove Supabase default privileges on existing tables.
-- Bundle with RLS: grants control role access; policies control row access.

-- user_vaults: signed-in client read/write own row (RLS enforces user_id = auth.uid()).
revoke all on table public.user_vaults from anon;
revoke all on table public.user_vaults from authenticated;
grant select, insert, update, delete on table public.user_vaults to authenticated;
grant all on table public.user_vaults to service_role;

-- user_entitlements: signed-in client read own row only; writes via service_role (Stripe webhook).
revoke all on table public.user_entitlements from anon;
revoke all on table public.user_entitlements from authenticated;
grant select on table public.user_entitlements to authenticated;
grant all on table public.user_entitlements to service_role;
