-- Run in Supabase Dashboard → SQL Editor if mobile IAP verify returns db_error.
-- Adds store_transaction_id / store_product_id for verify-store-purchase.

alter table public.user_entitlements
  add column if not exists store_transaction_id text,
  add column if not exists store_product_id text;

comment on column public.user_entitlements.store_transaction_id is
  'App Store transaction id or Google Play order id; unique per purchase.';
comment on column public.user_entitlements.store_product_id is
  'Store product SKU (e.g. com.skyface.mypasswordvault.pro_lifetime).';

create unique index if not exists user_entitlements_store_transaction_id_key
  on public.user_entitlements (store_transaction_id)
  where store_transaction_id is not null;
