-- Track where PRO was purchased (web Stripe, iOS IAP, Android Play Billing).

alter table public.user_entitlements
  add column if not exists purchase_platform text
    check (purchase_platform is null or purchase_platform in ('web', 'ios', 'android'));

comment on column public.user_entitlements.purchase_platform is
  'Purchase channel: web (Stripe), ios (App Store), android (Google Play). Null for free or complimentary-only.';

-- Existing Stripe purchases → web
update public.user_entitlements
set purchase_platform = 'web'
where purchase_platform is null
  and purchased_at is not null
  and coalesce(complimentary_grant, false) = false;
