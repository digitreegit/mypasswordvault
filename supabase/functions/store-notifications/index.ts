/**
 * Store refund handling.
 *
 * - App Store Server Notifications V2 (POST { signedPayload }): REFUND / REVOKE revoke the
 *   PRO license, REFUND_REVERSED restores it. The posted payload is only used to find the
 *   transaction id; its state is re-read from the App Store Server API with our key.
 * - Daily sweep (POST with header x-mpv-sweep-secret = STORE_SWEEP_SECRET): re-checks every
 *   active iOS license against the App Store Server API and applies Google Play voided
 *   purchases, so a missed notification (or Play, which has no notification here) still
 *   revokes refunded purchases. Body { "dry_run": true } reports without changing anything.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.8";
import {
  appleApiConfigured,
  decodeJwsPayload,
  lookupAppleTransaction,
  type AppleTransactionPayload,
} from "../_shared/appleStoreVerify.ts";
import { listGoogleVoidedPurchases } from "../_shared/googlePlayVerify.ts";
import { setStorePurchaseRefunded } from "../_shared/grantEntitlement.ts";

type AppleNotification = {
  notificationType?: string;
  subtype?: string;
  notificationUUID?: string;
  data?: { bundleId?: string; environment?: string; signedTransactionInfo?: string };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
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
    } catch {
      /* fall through */
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const bundleId = () => Deno.env.get("APPLE_BUNDLE_ID")?.trim() ?? "com.skyface.mypasswordvault";
const proProductId = () =>
  Deno.env.get("STORE_PRO_PRODUCT_ID")?.trim() || "com.skyface.mypasswordvault.pro_lifetime";

function applePurchaseIds(tx: AppleTransactionPayload): string[] {
  return [tx.originalTransactionId, tx.transactionId].filter((id): id is string => Boolean(id?.trim()));
}

const REVOKING_TYPES = new Set(["REFUND", "REVOKE"]);

async function handleAppleNotification(admin: SupabaseClient, signedPayload: string) {
  const notification = decodeJwsPayload<AppleNotification>(signedPayload);
  const type = notification?.notificationType ?? "";
  if (!notification || !type) return json({ error: "invalid_payload" }, 400);
  if (type === "TEST") {
    console.info("store-notifications: Apple test notification", notification.notificationUUID);
    return json({ ok: true, test: true });
  }
  if (!REVOKING_TYPES.has(type) && type !== "REFUND_REVERSED") {
    return json({ ok: true, ignored: type });
  }

  const posted = decodeJwsPayload(notification.data?.signedTransactionInfo ?? "");
  const transactionId = posted?.transactionId?.trim() || posted?.originalTransactionId?.trim();
  if (!transactionId) return json({ error: "missing_transaction" }, 400);

  const sandbox = notification.data?.environment?.toLowerCase() === "sandbox";
  const verified = await lookupAppleTransaction(transactionId, sandbox);
  // 5xx makes Apple retry; a forged notification simply finds nothing.
  if (!verified) return json({ error: "transaction_lookup_failed" }, 502);
  if (verified.bundleId !== bundleId() || verified.productId !== proProductId()) {
    return json({ ok: true, ignored: "other_product" });
  }

  const revoked = verified.revocationDate != null;
  if (!revoked && type !== "REFUND_REVERSED") {
    return json({ ok: true, ignored: "not_revoked" });
  }
  const { updated, error } = await setStorePurchaseRefunded(
    admin,
    "ios",
    applePurchaseIds(verified),
    revoked,
  );
  if (error) {
    console.error("store-notifications: entitlement update failed", error);
    return json({ error: "db_error" }, 500);
  }
  console.info("store-notifications: Apple", type, revoked ? "revoked" : "restored", updated);
  return json({ ok: true, type, revoked, updated });
}

async function sweepApple(admin: SupabaseClient, dryRun: boolean) {
  if (!appleApiConfigured()) return { skipped: "apple_not_configured" };
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("user_entitlements")
      .select("store_transaction_id")
      .eq("purchase_platform", "ios")
      .eq("licensed", true)
      .is("refunded_at", null)
      .not("store_transaction_id", "is", null)
      .range(from, from + 999);
    if (error) return { error: error.message };
    ids.push(...(data ?? []).map((r) => String(r.store_transaction_id)));
    if (!data || data.length < 1000) break;
  }

  let revoked = 0;
  let lookupFailures = 0;
  for (const id of ids) {
    const tx = await lookupAppleTransaction(id);
    if (!tx) {
      lookupFailures++;
      continue;
    }
    if (tx.revocationDate == null) continue;
    if (dryRun) {
      revoked++;
      continue;
    }
    const { updated, error } = await setStorePurchaseRefunded(
      admin,
      "ios",
      [id, ...applePurchaseIds(tx)],
      true,
    );
    if (error) return { checked: ids.length, revoked, error: error.message };
    revoked += updated;
  }
  return { checked: ids.length, revoked, lookupFailures };
}

async function sweepGoogle(admin: SupabaseClient, dryRun: boolean) {
  const voided = await listGoogleVoidedPurchases();
  if (!voided) return { error: "voided_purchases_unavailable" };
  const ids = voided.flatMap((v) => [v.orderId ?? "", v.purchaseToken ?? ""]).filter(Boolean);
  if (dryRun) {
    if (ids.length === 0) return { voided: 0, revoked: 0 };
    const { data, error } = await admin
      .from("user_entitlements")
      .select("user_id")
      .eq("purchase_platform", "android")
      .is("refunded_at", null)
      .in("store_transaction_id", ids);
    if (error) return { voided: voided.length, error: error.message };
    return { voided: voided.length, revoked: data?.length ?? 0 };
  }
  const { updated, error } = await setStorePurchaseRefunded(admin, "android", ids, true);
  if (error) return { voided: voided.length, error: error.message };
  return { voided: voided.length, revoked: updated };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceKey) return json({ error: "misconfigured" }, 500);
  const admin = createClient(supabaseUrl, serviceKey);

  const sweepHeader = req.headers.get("x-mpv-sweep-secret");
  if (sweepHeader !== null) {
    const secret = Deno.env.get("STORE_SWEEP_SECRET")?.trim();
    if (!secret || !constantTimeEqual(sweepHeader, secret)) {
      return json({ error: "unauthorized" }, 401);
    }
    let dryRun = false;
    try {
      dryRun = Boolean(((await req.json()) as { dry_run?: boolean })?.dry_run);
    } catch {
      /* empty body */
    }
    const apple = await sweepApple(admin, dryRun);
    const google = await sweepGoogle(admin, dryRun);
    const failed = "error" in apple || "error" in google;
    console.info("store-notifications: sweep", JSON.stringify({ dryRun, apple, google }));
    return json({ ok: !failed, dryRun, apple, google }, failed ? 500 : 200);
  }

  let body: { signedPayload?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (typeof body?.signedPayload !== "string") return json({ error: "invalid_payload" }, 400);
  return handleAppleNotification(admin, body.signedPayload);
});
