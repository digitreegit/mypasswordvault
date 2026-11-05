import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.8";

export type PurchasePlatform = "web" | "ios" | "android";

export type GrantLicenseInput = {
  userId: string;
  platform: PurchasePlatform;
  accountEmail?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  purchaseCountry?: string | null;
  stripeCheckoutSessionId?: string | null;
  storeTransactionId?: string | null;
  storeProductId?: string | null;
};

export async function grantLicense(
  admin: SupabaseClient,
  input: GrantLicenseInput,
): Promise<{ error: Error | null }> {
  const row: Record<string, unknown> = {
    user_id: input.userId,
    licensed: true,
    purchased_at: new Date().toISOString(),
    purchase_platform: input.platform,
    refunded_at: null,
    // Always overwrite, so a new purchase never inherits an earlier purchase's figures.
    amount_cents: input.amountCents ?? null,
    purchase_country: input.purchaseCountry ?? null,
  };
  if (input.accountEmail) row.account_email = input.accountEmail;
  if (input.currency) row.currency = input.currency;
  if (input.stripeCheckoutSessionId) {
    row.stripe_checkout_session_id = input.stripeCheckoutSessionId;
  }
  if (input.storeTransactionId) {
    row.store_transaction_id = input.storeTransactionId;
  }
  if (input.storeProductId) row.store_product_id = input.storeProductId;

  const { error } = await admin.from("user_entitlements").upsert(row, {
    onConflict: "user_id",
  });
  return { error: error ? new Error(error.message) : null };
}

/**
 * Revoke (or, after a reversed refund, restore) the license granted by a store purchase.
 * Matches on the purchase ids *and* the platform, so an account that later paid another way
 * keeps that license. Returns the number of rows changed.
 */
export async function setStorePurchaseRefunded(
  admin: SupabaseClient,
  platform: "ios" | "android",
  purchaseIds: string[],
  refunded: boolean,
): Promise<{ updated: number; error: Error | null }> {
  const ids = [...new Set(purchaseIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return { updated: 0, error: null };
  let query = admin
    .from("user_entitlements")
    .update(
      refunded
        ? { licensed: false, refunded_at: new Date().toISOString() }
        : { licensed: true, refunded_at: null },
    )
    .eq("purchase_platform", platform)
    .in("store_transaction_id", ids);
  query = refunded ? query.is("refunded_at", null) : query.not("refunded_at", "is", null);
  const { data, error } = await query.select("user_id");
  return { updated: data?.length ?? 0, error: error ? new Error(error.message) : null };
}
