/** Minimal types for Stripe Embedded Checkout (runtime API on js.stripe.com). */
export type StripeEmbeddedCheckout = {
  mount: (element: HTMLElement | string) => void;
  destroy: () => void;
};

export type StripeEmbeddedInitOptions = {
  clientSecret: string;
  onComplete?: () => void;
};

export type StripeWithEmbeddedCheckout = {
  initEmbeddedCheckout: (
    options: StripeEmbeddedInitOptions,
  ) => Promise<StripeEmbeddedCheckout>;
};
