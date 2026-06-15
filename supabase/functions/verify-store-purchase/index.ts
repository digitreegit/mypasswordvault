/**
 * Verifies iOS App Store / Google Play purchase and grants user_entitlements.
 * JWT required. Secrets: see docs/mobile.md
 * Optional dev: STORE_VERIFY_DEV_BYPASS=1 (never in production).
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { grantLicense } from "../_shared/grantEntitlement.ts";
import { verifyApplePurchase } from "../_shared/appleStoreVerify.ts";
import { verifyGooglePurchase } from "../_shared/googlePlayVerify.ts";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function getServiceRoleKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      for (const name of ["default", "service_role"]) {
        const v = keys[name];
        if (typeof v === "string" && v.length > 10) return v;
      }
      const first = Object.values(keys).find(
        (v) => typeof v === "string" && v.length > 10,
      );
      if (first) return first;
    } catch {
      /* fall through */
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
}

type Body = {
  platform?: "ios" | "android";
  product_id?: string;
  /** Apple: signed transaction JWS or transaction id. Google: purchase token. */
  verification_data?: string;
  transaction_id?: string;
  restore?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const platform = body.platform;
  if (platform !== "ios" && platform !== "android") {
    return json({ error: "invalid_platform" }, 400);
  }

  const productId = body.product_id?.trim();
  const verificationData = body.verification_data?.trim();
  const transactionIdHint = body.transaction_id?.trim();

  const devBypass =
    Deno.env.get("STORE_VERIFY_DEV_BYPASS") === "1" &&
    Deno.env.get("DENO_ENV") !== "production";

  let verifiedTransactionId = transactionIdHint ?? "";
  let amountCents: number | null = null;

  if (devBypass && verificationData === "dev_ok") {
    verifiedTransactionId =
      transactionIdHint ||
      `dev_${platform}_${user.id.slice(0, 8)}_${Date.now()}`;
    amountCents = Number(Deno.env.get("STRIPE_LICENSE_AMOUNT_CENTS") ?? "499");
  } else if (!verificationData) {
    return json({ error: "missing_verification_data" }, 400);
  } else if (platform === "ios") {
    const r = await verifyApplePurchase(verificationData, productId ?? "");
    if (!r.ok) {
      return json({ error: r.error ?? "verify_failed" }, 502);
    }
    verifiedTransactionId = r.transactionId;
  } else {
    const r = await verifyGooglePurchase(verificationData, productId ?? "");
    if (!r.ok) {
      return json({ error: r.error ?? "verify_failed" }, 502);
    }
    verifiedTransactionId = r.transactionId;
  }

  if (!verifiedTransactionId) {
    return json({ error: "no_transaction_id" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: existing } = await admin
    .from("user_entitlements")
    .select("user_id, licensed")
    .eq("store_transaction_id", verifiedTransactionId)
    .maybeSingle();

  if (existing?.licensed && existing.user_id !== user.id) {
    return json({ error: "transaction_owned_by_other_user" }, 409);
  }

  if (existing?.licensed && existing.user_id === user.id) {
    return json({
      licensed: true,
      purchase_platform: platform,
      restore: Boolean(body.restore),
      already_licensed: true,
    });
  }

  const { error: grantError } = await grantLicense(admin, {
    userId: user.id,
    platform,
    accountEmail: user.email?.trim() ?? null,
    amountCents,
    currency: "usd",
    storeTransactionId: verifiedTransactionId,
    storeProductId: productId ?? null,
  });

  if (grantError) {
    console.error("verify-store-purchase grant failed", grantError);
    return json(
      { error: "db_error", detail: grantError.message },
      500,
    );
  }

  return json({
    licensed: true,
    purchase_platform: platform,
    restore: Boolean(body.restore),
  });
});
