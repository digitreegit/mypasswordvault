/** StoreKit 2 transaction fields inside a signed JWS payload. */
export type AppleTransactionPayload = {
  transactionId?: string;
  originalTransactionId?: string;
  bundleId?: string;
  productId?: string;
  environment?: string;
  type?: string;
  revocationDate?: number;
  /** Customer price in milliunits of `currency` (4990 = 4.99). */
  price?: number;
  currency?: string;
};

export type AppleVerifyResult =
  /**
   * `transactionId` is the purchase's originalTransactionId: restoring a non-consumable
   * mints a new transactionId, so only the original id identifies the purchase across
   * restores and accounts. `relatedTransactionIds` holds the other ids seen for it.
   * `amountCents` is 0 for sandbox/TestFlight purchases, which Apple never charges, and null
   * when the charge isn't in USD.
   */
  | {
    ok: true;
    transactionId: string;
    relatedTransactionIds: string[];
    amountCents: number | null;
    currency: string | null;
  }
  | { ok: false; transactionId: string; error: string };

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

/** Decodes without verifying the signature; only trust fields re-read from the App Store Server API. */
export function decodeJwsPayload<T = AppleTransactionPayload>(jws: string): T | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  try {
    const pad = parts[1].length % 4 === 0
      ? ""
      : "=".repeat(4 - (parts[1].length % 4));
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/") + pad;
    const json = atob(b64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function transactionIdFromVerificationData(
  verificationData: string,
): { transactionId: string; payload: AppleTransactionPayload | null } {
  if (verificationData.includes(".")) {
    const payload = decodeJwsPayload(verificationData);
    const transactionId =
      (typeof payload?.transactionId === "string" ? payload.transactionId.trim() : "") ||
      (typeof payload?.originalTransactionId === "string" ? payload.originalTransactionId.trim() : "") ||
      "";
    return { transactionId, payload };
  }
  return { transactionId: verificationData.trim(), payload: null };
}

function isSandboxEnvironment(payload: AppleTransactionPayload | null): boolean {
  const env = typeof payload?.environment === "string" ? payload.environment.toLowerCase() : "";
  return env === "sandbox" || env === "xcode";
}

function validatePayloadFields(
  payload: AppleTransactionPayload,
  expectedBundleId: string,
  expectedProductId: string,
): string | null {
  if (payload.revocationDate != null) return "transaction_revoked";
  if (payload.bundleId !== expectedBundleId) {
    return "bundle_mismatch";
  }
  if (!expectedProductId || payload.productId !== expectedProductId) {
    return "product_mismatch";
  }
  return null;
}

function verifiedIdFromPayload(
  payload: AppleTransactionPayload,
  fallback: string,
): string {
  return (
    payload.originalTransactionId?.trim() ||
    payload.transactionId?.trim() ||
    fallback
  );
}

async function createAppStoreServerJwt(
  issuerId: string,
  keyId: string,
  bundleId: string,
  privateKeyPem: string,
): Promise<string> {
  const { SignJWT, importPKCS8 } = await import("npm:jose");
  const key = await importPKCS8(normalizePrivateKey(privateKeyPem), "ES256");
  return await new SignJWT({ bid: bundleId })
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setAudience("appstoreconnect-v1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

async function fetchAppleTransaction(
  transactionId: string,
  sandbox: boolean,
  jwt: string,
): Promise<AppleTransactionPayload | null> {
  const host = sandbox
    ? "https://api.storekit-sandbox.itunes.apple.com"
    : "https://api.storekit.itunes.apple.com";
  const res = await fetch(
    `${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!res.ok) {
    console.error(
      "Apple transaction lookup failed",
      res.status,
      await res.text(),
    );
    return null;
  }
  const data = (await res.json()) as { signedTransactionInfo?: string };
  if (!data.signedTransactionInfo) return null;
  return decodeJwsPayload(data.signedTransactionInfo);
}

function tryTrustStoreKitJws(
  payload: AppleTransactionPayload | null,
  bundleId: string,
  expectedProductId: string,
  fallbackTransactionId: string,
): AppleVerifyResult | null {
  if (!payload) return null;
  const fieldError = validatePayloadFields(payload, bundleId, expectedProductId);
  if (fieldError) {
    return { ok: false, transactionId: fallbackTransactionId, error: fieldError };
  }
  const verifiedId = verifiedIdFromPayload(payload, fallbackTransactionId);
  if (!verifiedId) {
    return { ok: false, transactionId: "", error: "missing_transaction_id" };
  }
  const relatedTransactionIds = [
    ...new Set([payload.transactionId?.trim(), fallbackTransactionId]),
  ].filter((id): id is string => Boolean(id) && id !== verifiedId);
  const currency = typeof payload.currency === "string" && payload.currency.trim()
    ? payload.currency.trim().toLowerCase()
    : null;
  let amountCents: number | null = null;
  if (isSandboxEnvironment(payload)) {
    amountCents = 0;
  } else if (
    currency === "usd" && typeof payload.price === "number" && Number.isFinite(payload.price)
  ) {
    // Revenue totals are summed in USD; other currencies fall back to the list price.
    amountCents = Math.round(payload.price / 10);
  }
  return { ok: true, transactionId: verifiedId, relatedTransactionIds, amountCents, currency };
}

export function appleApiConfigured(): boolean {
  return Boolean(
    Deno.env.get("APPLE_ISSUER_ID")?.trim() &&
      Deno.env.get("APPLE_KEY_ID")?.trim() &&
      Deno.env.get("APPLE_PRIVATE_KEY")?.trim(),
  );
}

/**
 * Authoritative transaction state from the App Store Server API (production first unless the
 * hint says sandbox, then the other environment). Null when not configured or not found.
 */
export async function lookupAppleTransaction(
  transactionId: string,
  sandboxHint = false,
): Promise<AppleTransactionPayload | null> {
  const bundleId =
    Deno.env.get("APPLE_BUNDLE_ID")?.trim() ?? "com.skyface.mypasswordvault";
  const issuerId = Deno.env.get("APPLE_ISSUER_ID")?.trim();
  const keyId = Deno.env.get("APPLE_KEY_ID")?.trim();
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY")?.trim();
  if (!issuerId || !keyId || !privateKey || !transactionId) return null;
  const jwt = await createAppStoreServerJwt(issuerId, keyId, bundleId, privateKey);
  return (await fetchAppleTransaction(transactionId, sandboxHint, jwt)) ??
    (await fetchAppleTransaction(transactionId, !sandboxHint, jwt));
}

export async function verifyApplePurchase(
  verificationData: string,
  expectedProductId: string,
): Promise<AppleVerifyResult> {
  const bundleId =
    Deno.env.get("APPLE_BUNDLE_ID")?.trim() ?? "com.skyface.mypasswordvault";
  const issuerId = Deno.env.get("APPLE_ISSUER_ID")?.trim();
  const keyId = Deno.env.get("APPLE_KEY_ID")?.trim();
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY")?.trim();

  const { transactionId, payload: clientPayload } =
    transactionIdFromVerificationData(verificationData);
  const payload = clientPayload ??
    (verificationData.includes(".") ? decodeJwsPayload(verificationData) : null);

  if (!transactionId && !payload) {
    return { ok: false, transactionId: "", error: "missing_transaction_id" };
  }

  const txFallback = transactionId ||
    (typeof payload?.transactionId === "string" ? payload.transactionId.trim() : "") ||
    (typeof payload?.originalTransactionId === "string" ? payload.originalTransactionId.trim() : "") ||
    "";

  const hasApiCredentials = Boolean(
    issuerId && keyId && privateKey && bundleId,
  );

  if (hasApiCredentials && txFallback) {
    const apiPayload = await lookupAppleTransaction(txFallback, isSandboxEnvironment(payload));
    if (apiPayload) {
      const trusted = tryTrustStoreKitJws(
        apiPayload,
        bundleId,
        expectedProductId,
        txFallback,
      );
      if (trusted) return trusted;
    }
  }

  if (!hasApiCredentials) {
    return { ok: false, transactionId: txFallback, error: "apple_not_configured" };
  }

  return { ok: false, transactionId: txFallback, error: "apple_verify_failed" };
}
