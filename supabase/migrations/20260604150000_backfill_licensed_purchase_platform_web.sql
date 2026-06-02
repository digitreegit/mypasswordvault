-- Licensed users without purchase_platform (complimentary, admin, legacy) → web.

update public.user_entitlements
set purchase_platform = 'web'
where purchase_platform is null
  and licensed = true
  and refunded_at is null;
