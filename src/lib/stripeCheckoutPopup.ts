/** Centered popup for Stripe Hosted Checkout (not full-tab navigation). */
export const STRIPE_CHECKOUT_POPUP_NAME = "mpw_stripe_checkout";

const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 720;

export function stripePopupFeatures(): string {
  const left = Math.max(0, Math.round((window.screen.width - POPUP_WIDTH) / 2));
  const top = Math.max(0, Math.round((window.screen.height - POPUP_HEIGHT) / 2));
  return [
    "popup=yes",
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "toolbar=no",
    "menubar=no",
    "location=yes",
    "status=no",
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
}

function checkoutPopupLoadingHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Loading checkout…</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #334155;
    }
    .wrap { text-align: center; padding: 1.5rem; }
    .spinner {
      width: 2rem;
      height: 2rem;
      margin: 0 auto 1rem;
      border: 2px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { margin: 0; font-size: 0.875rem; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner" aria-hidden="true"></div>
    <p>Loading secure checkout…</p>
  </div>
</body>
</html>`;
}

/** Open synchronously on user click so the browser allows the popup. */
export function openStripeCheckoutPopup(): Window | null {
  const popup = window.open(
    "about:blank",
    STRIPE_CHECKOUT_POPUP_NAME,
    stripePopupFeatures(),
  );
  if (!popup) return null;
  try {
    popup.document.open();
    popup.document.write(checkoutPopupLoadingHtml());
    popup.document.close();
  } catch {
    /* ok once navigated away */
  }
  return popup;
}

export function navigateStripePopup(popup: Window, url: string): void {
  popup.location.href = url;
}

export function closeStripeCheckoutPopup(): void {
  try {
    const existing = window.open("", STRIPE_CHECKOUT_POPUP_NAME);
    existing?.close();
  } catch {
    /* ignore */
  }
}

export function watchCheckoutPopup(
  popup: Window,
  onClosed: () => void,
): () => void {
  const id = window.setInterval(() => {
    if (popup.closed) {
      window.clearInterval(id);
      onClosed();
    }
  }, 400);
  return () => window.clearInterval(id);
}
