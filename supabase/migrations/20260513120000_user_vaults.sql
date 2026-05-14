-- Encrypted vault payload only (same JSON as local backup export). Master password never sent here.
create table if not exists public.user_vaults (
  user_id uuid primary key references auth.users (id) on delete cascade,
  vault_backup text not null,
  updated_at timestamptz not null default now()
);

comment on table public.user_vaults is 'Per-user encrypted vault snapshot (client-side AES). RLS restricts to owner.';

alter table public.user_vaults enable row level security;

drop policy if exists "user_vaults_select_own" on public.user_vaults;
create policy "user_vaults_select_own"
  on public.user_vaults for select
  using (auth.uid() = user_id);

drop policy if exists "user_vaults_insert_own" on public.user_vaults;
create policy "user_vaults_insert_own"
  on public.user_vaults for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_vaults_update_own" on public.user_vaults;
create policy "user_vaults_update_own"
  on public.user_vaults for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_vaults_delete_own" on public.user_vaults;
create policy "user_vaults_delete_own"
  on public.user_vaults for delete
  using (auth.uid() = user_id);