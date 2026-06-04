/** StoreKit 2 transaction fields inside a signed JWS payload. */
export type AppleTransactionPayload = {
  transactionId?: string;
  originalTransactionId?: string;
  bundleId?: string;
  productId?: string;
  environment?: string;
  type?: string;
  revocationDate?: number;
};

export type AppleVerifyResult =
  | { ok: true; transactionId: string }
  | { ok: false; transactionId: string; error: string };

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function decodeJwsPayload(jws: string): AppleTransactionPayload | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  try {
    const pad = parts[1].length % 4 === 0
      ? ""
      : "=".repeat(4 - (parts[1].length % 4));
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/") + pad;
    const json = atob(b64);
    return JSON.parse(json) as AppleTransactionPayload;
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
      payload?.transactionId?.trim() ||
      payload?.originalTransactionId?.trim() ||
      "";
    return { transactionId, payload };
  }
  return { transactionId: verificationData.trim(), payload: null };
}

function isSandboxEnvironment(payload: AppleTransactionPayload | null): boolean {
  const env = payload?.environment?.toLowerCase();
  return env === "sandbox" || env === "xcode";
}

function validatePayloadFields(
  payload: AppleTransactionPayload,
  expectedBundleId: string,
  expectedProductId: string,
): string | null {
  if (payload.revocationDate) return "transaction_revoked";
  if (payload.bundleId && payload.bundleId !== expectedBundleId) {
    return "bundle_mismatch";
  }
  if (expectedProductId && payload.productId !== expectedProductId) {
    return "product_mismatch";
  }
  return null;
}

function verifiedIdFromPayload(
  payload: AppleTransactionPayload,
  fallback: string,
): string {
  return (
    payload.transactionId?.trim() ||
    payload.originalTransactionId?.trim() ||
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
  return { ok: true, transactionId: verifiedId };
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
    payload?.transactionId?.trim() ||
    payload?.originalTransactionId?.trim() ||
    "";

  // StoreKit JWS from device — accept Sandbox / Xcode without App Store Server API keys.
  if (payload && isSandboxEnvironment(payload)) {
    const trusted = tryTrustStoreKitJws(
      payload,
      bundleId,
      expectedProductId,
      txFallback,
    );
    if (trusted) return trusted;
  }

  const hasApiCredentials = Boolean(
    issuerId && keyId && privateKey && bundleId,
  );

  if (hasApiCredentials && txFallback) {
    const sandboxHint = isSandboxEnvironment(payload);
    const jwt = await createAppStoreServerJwt(
      issuerId!,
      keyId!,
      bundleId,
      privateKey!,
    );

    let apiPayload = await fetchAppleTransaction(txFallback, sandboxHint, jwt);
    if (!apiPayload && !sandboxHint) {
      apiPayload = await fetchAppleTransaction(txFallback, true, jwt);
    }
    if (!apiPayload && sandboxHint) {
      apiPayload = await fetchAppleTransaction(txFallback, false, jwt);
    }

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

  // No Apple API keys: still trust StoreKit JWS when product/bundle match.
  if (!hasApiCredentials && payload) {
    const trusted = tryTrustStoreKitJws(
      payload,
      bundleId,
      expectedProductId,
      txFallback,
    );
    if (trusted?.ok) return trusted;
  }

  if (!hasApiCredentials) {
    return { ok: false, transactionId: txFallback, error: "apple_not_configured" };
  }

  return { ok: false, transactionId: txFallback, error: "apple_verify_failed" };
}
