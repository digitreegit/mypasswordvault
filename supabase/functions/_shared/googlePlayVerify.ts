export type GoogleVerifyResult =
  | { ok: true; transactionId: string }
  | { ok: false; transactionId: string; error: string };

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type GoogleProductPurchase = {
  purchaseState?: number;
  orderId?: string;
  acknowledgementState?: number;
  consumptionState?: number;
};

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function parseServiceAccount(json: string): ServiceAccount | null {
  try {
    const sa = JSON.parse(json) as ServiceAccount;
    if (!sa.client_email?.trim() || !sa.private_key?.trim()) return null;
    return sa;
  } catch {
    return null;
  }
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string | null> {
  const { SignJWT, importPKCS8 } = await import("npm:jose");
  const key = await importPKCS8(normalizePrivateKey(sa.private_key), "RS256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience(sa.token_uri ?? "https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .setClaim("scope", "https://www.googleapis.com/auth/androidpublisher")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error("Google OAuth token failed", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token?.trim() ?? null;
}

async function fetchProductPurchase(
  accessToken: string,
  packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<GoogleProductPurchase | null> {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.error(
      "Google Play product purchase lookup failed",
      res.status,
      await res.text(),
    );
    return null;
  }
  return (await res.json()) as GoogleProductPurchase;
}

export async function verifyGooglePurchase(
  purchaseToken: string,
  expectedProductId: string,
): Promise<GoogleVerifyResult> {
  const token = purchaseToken.trim();
  if (!token) {
    return { ok: false, transactionId: "", error: "missing_purchase_token" };
  }

  const packageName =
    Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME")?.trim() ??
    "com.skyface.mypasswordvault";
  const saJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")?.trim();
  if (!saJson) {
    return { ok: false, transactionId: "", error: "google_not_configured" };
  }

  const sa = parseServiceAccount(saJson);
  if (!sa) {
    return { ok: false, transactionId: "", error: "google_invalid_service_account" };
  }

  const accessToken = await getGoogleAccessToken(sa);
  if (!accessToken) {
    return { ok: false, transactionId: "", error: "google_auth_failed" };
  }

  const productId = expectedProductId.trim();
  if (!productId) {
    return { ok: false, transactionId: "", error: "missing_product_id" };
  }

  const purchase = await fetchProductPurchase(
    accessToken,
    packageName,
    productId,
    token,
  );
  if (!purchase) {
    return { ok: false, transactionId: "", error: "google_verify_failed" };
  }

  // 0 = purchased, 1 = canceled, 2 = pending
  if (purchase.purchaseState !== 0) {
    return {
      ok: false,
      transactionId: purchase.orderId?.trim() ?? token,
      error: purchase.purchaseState === 2 ? "purchase_pending" : "purchase_canceled",
    };
  }

  const transactionId = purchase.orderId?.trim() || token;
  return { ok: true, transactionId };
}
