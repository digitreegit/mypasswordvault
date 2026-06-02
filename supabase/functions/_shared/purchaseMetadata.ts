import type Stripe from "npm:stripe@17.4.0";

/** ISO 3166-1 alpha-2 country code from Stripe Checkout, or null. */
export function purchaseCountryFromCheckoutSession(
  sess: Stripe.Checkout.Session,
): string | null {
  const raw =
    sess.customer_details?.address?.country?.trim() ??
    sess.shipping_details?.address?.country?.trim() ??
    "";
  const code = raw.toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function normalizePurchaseCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}
