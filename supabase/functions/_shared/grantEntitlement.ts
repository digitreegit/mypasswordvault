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
  };
  if (input.accountEmail) row.account_email = input.accountEmail;
  if (input.amountCents != null) row.amount_cents = input.amountCents;
  if (input.currency) row.currency = input.currency;
  if (input.purchaseCountry) row.purchase_country = input.purchaseCountry;
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
