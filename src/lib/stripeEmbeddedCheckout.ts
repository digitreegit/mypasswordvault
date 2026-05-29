/** Stripe Embedded Checkout (runtime API on js.stripe.com). */
export type StripeEmbeddedCheckout = {
  mount: (element: HTMLElement | string) => void;
  unmount: () => void;
  destroy: () => void;
};

export type StripeEmbeddedCheckoutOptions = {
  fetchClientSecret: () => Promise<string>;
  onComplete?: () => void;
};

export type StripeWithEmbeddedCheckout = {
  createEmbeddedCheckoutPage: (
    options: StripeEmbeddedCheckoutOptions,
  ) => Promise<StripeEmbeddedCheckout>;
};
