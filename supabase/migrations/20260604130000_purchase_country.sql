-- Billing country at purchase (ISO 3166-1 alpha-2), for admin regional stats.

alter table public.user_entitlements
  add column if not exists purchase_country text
    check (purchase_country is null or purchase_country ~ '^[A-Z]{2}$');

comment on column public.user_entitlements.purchase_country is
  'ISO 3166-1 alpha-2 billing country at purchase (Stripe, App Store, Play).';
