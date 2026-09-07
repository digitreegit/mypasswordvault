import type Stripe from "npm:stripe@17.4.0";

/** Checkout remains "paid" after refunds; never reactivate a refunded purchase. */
export async function checkoutPaymentIsActive(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const id = typeof session.payment_intent === "string"
    ? session.payment_intent : session.payment_intent?.id;
  if (session.payment_status !== "paid" || !id) return false;
  const intent = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] });
  const charge = intent.latest_charge;
  return intent.status === "succeeded" && !!charge && typeof charge !== "string" &&
    !charge.refunded && charge.amount_refunded === 0 && !charge.disputed;
}
