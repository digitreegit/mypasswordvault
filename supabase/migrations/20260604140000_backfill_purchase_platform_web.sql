-- Backfill web for paid rows missing purchase_platform (Stripe / legacy purchases).

update public.user_entitlements
set purchase_platform = 'web'
where purchase_platform is null
  and purchased_at is not null
  and coalesce(complimentary_grant, false) = false;
