/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Stripe publishable key (pk_test_… / pk_live_…). Optional if returned by create-checkout-session. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Marketing site origin for static pages (e.g. https://mypasswordvault.app). */
  readonly VITE_PUBLIC_SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
