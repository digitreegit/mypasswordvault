export type GoogleVerifyResult =
  /** `uncharged` marks license-tester and promo-code purchases, which Google never charges. */
  | {
      ok: true;
      transactionId: string;
      uncharged: boolean;
      regionCode: string | null;
      /** 0 = yet to acknowledge, 1 = acknowledged */
      acknowledgementState: number | null;
    }
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
  /** 0 = test (license tester), 1 = promo, 2 = rewarded; absent for normal purchases. */
  purchaseType?: number;
  regionCode?: string;
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
  try {
    const { SignJWT, importPKCS8 } = await import("npm:jose");
    const key = await importPKCS8(normalizePrivateKey(sa.private_key), "RS256");
    const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/androidpublisher" })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(sa.client_email)
      .setAudience(sa.token_uri ?? "https://oauth2.googleapis.com/token")
      .setIssuedAt()
      .setExpirationTime("1h")
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
  } catch (e) {
    console.error("Google OAuth token failed", e);
    return null;
  }
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

export type GoogleVoidedPurchase = {
  purchaseToken?: string;
  orderId?: string;
  voidedTimeMillis?: string;
  voidedReason?: number;
  voidedSource?: number;
};

/**
 * Refunded / charged-back / revoked purchases voided within the last `days` (Play keeps 30).
 * Null when not configured or when Play rejects the call (e.g. missing permission).
 */
/** Google keeps 30 days of voided purchases and rejects a start time at the very edge. */
export async function listGoogleVoidedPurchases(
  days = 29,
): Promise<GoogleVoidedPurchase[] | null> {
  const packageName =
    Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME")?.trim() ??
    "com.skyface.mypasswordvault";
  const saJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")?.trim();
  const sa = saJson ? parseServiceAccount(saJson) : null;
  if (!sa) return null;
  const accessToken = await getGoogleAccessToken(sa);
  if (!accessToken) return null;

  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const voided: GoogleVoidedPurchase[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/voidedpurchases`,
    );
    url.searchParams.set("startTime", String(startTime));
    url.searchParams.set("maxResults", "1000");
    if (pageToken) url.searchParams.set("token", pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      console.error("Google Play voided purchases failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      voidedPurchases?: GoogleVoidedPurchase[];
      tokenPagination?: { nextPageToken?: string };
    };
    voided.push(...(data.voidedPurchases ?? []));
    pageToken = data.tokenPagination?.nextPageToken;
  } while (pageToken);
  return voided;
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
  const region = purchase.regionCode?.trim().toUpperCase() ?? "";
  return {
    ok: true,
    transactionId,
    uncharged: purchase.purchaseType === 0 || purchase.purchaseType === 1,
    regionCode: /^[A-Z]{2}$/.test(region) ? region : null,
    acknowledgementState:
      typeof purchase.acknowledgementState === "number"
        ? purchase.acknowledgementState
        : null,
  };
}

/**
 * Tell Google the purchase was fulfilled so Play will not auto-refund after ~3 days.
 * Safe to call when already acknowledged. Does not throw — callers treat failure as non-fatal
 * after PRO has already been granted.
 */
export async function acknowledgeGooglePurchase(
  purchaseToken: string,
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = purchaseToken.trim();
  const pid = productId.trim();
  if (!token) return { ok: false, error: "missing_purchase_token" };
  if (!pid) return { ok: false, error: "missing_product_id" };

  const packageName =
    Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME")?.trim() ??
    "com.skyface.mypasswordvault";
  const saJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")?.trim();
  const sa = saJson ? parseServiceAccount(saJson) : null;
  if (!sa) return { ok: false, error: "google_not_configured" };

  const accessToken = await getGoogleAccessToken(sa);
  if (!accessToken) return { ok: false, error: "google_auth_failed" };

  // Skip if already acknowledged (avoids noisy 400s from Play).
  const current = await fetchProductPurchase(accessToken, packageName, pid, token);
  if (current?.acknowledgementState === 1) return { ok: true };

  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(pid)}/tokens/${encodeURIComponent(token)}:acknowledge`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    const text = await res.text();
    // Already acknowledged races still return success for the caller.
    if (res.status === 400 && /already.?acknowledged/i.test(text)) {
      return { ok: true };
    }
    console.error("Google Play acknowledge failed", res.status, text);
    return { ok: false, error: `google_acknowledge_failed:${res.status}` };
  }
  return { ok: true };
}
