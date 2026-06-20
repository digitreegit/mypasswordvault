/**
 * Admin dashboard API: stats, customer list, Stripe refunds, complaint log.
 * Secrets: ADMIN_EMAILS (comma-separated), STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY.
 * Caller must send a valid user JWT; email must be in ADMIN_EMAILS.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import Stripe from "npm:stripe@17.4.0";
import { permanentlyDeleteUserAccount } from "../_shared/deleteUserAccount.ts";
import { normalizePurchaseCountry } from "../_shared/purchaseMetadata.ts";

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

function adminEmailAllowlist(): Set<string> {
  const raw = Deno.env.get("ADMIN_EMAILS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceKey = getServiceRoleKey();
  const allow = adminEmailAllowlist();

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { error: json({ error: "server_misconfigured" }, 500) };
  }
  if (allow.size === 0) {
    return { error: json({ error: "admin_not_configured" }, 503) };
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return { error: json({ error: "unauthorized" }, 401) };
  }

  const supa = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
  });
  const { data: userData, error: userErr } = await supa.auth.getUser();
  if (userErr || !userData.user) {
    return { error: json({ error: "unauthorized" }, 401) };
  }

  const email = (userData.user.email ?? "").trim().toLowerCase();
  if (!email || !allow.has(email)) {
    return { error: json({ error: "forbidden" }, 403) };
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const stripe = stripeKey ? new Stripe(stripeKey) : null;

  return { admin, stripe, email, userId: userData.user.id };
}

async function getAuthedUserEmail(
  req: Request,
): Promise<{ email: string } | { error: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!supabaseUrl || !anonKey) {
    return { error: json({ error: "server_misconfigured" }, 500) };
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return { error: json({ error: "unauthorized" }, 401) };
  }

  const supa = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
  });
  const { data: userData, error: userErr } = await supa.auth.getUser();
  if (userErr || !userData.user?.email) {
    return { error: json({ error: "unauthorized" }, 401) };
  }

  return { email: userData.user.email.trim().toLowerCase() };
}

type EntRow = {
  user_id: string;
  licensed: boolean;
  purchased_at: string | null;
  stripe_checkout_session_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  refunded_at: string | null;
  account_email: string | null;
  created_at: string | null;
  complimentary_grant: boolean | null;
  purchase_platform: string | null;
  signup_platform: string | null;
};

type PurchasePlatform = "web" | "ios" | "android";

function resolvePurchasePlatform(r: EntRow): PurchasePlatform | null {
  const p = r.purchase_platform?.trim().toLowerCase();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  if (p === "web") return "web";
  if (r.stripe_checkout_session_id || r.purchased_at || r.refunded_at) {
    return "web";
  }
  // Complimentary PRO, ADMIN_EMAILS operators, legacy licensed rows (web-only product).
  if (r.licensed && !r.refunded_at) return "web";
  return null;
}

function resolveSignupPlatform(r: EntRow): PurchasePlatform | null {
  const p = r.signup_platform?.trim().toLowerCase();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  if (p === "web") return "web";
  return null;
}

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function userIdForEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.rpc("auth_user_id_for_email", {
    p_email: email,
  });
  if (error) {
    if (isSchemaGap(error)) return null;
    console.error("auth_user_id_for_email", error);
    return null;
  }
  return typeof data === "string" ? data : null;
}

async function applyComplimentaryToUser(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<boolean> {
  const userId = await userIdForEmail(admin, email);
  if (!userId) return false;

  const { data: ent, error: readErr } = await admin
    .from("user_entitlements")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) {
    console.error("complimentary read entitlement", readErr);
    return false;
  }
  if (!ent) {
    const { error: insErr } = await admin.from("user_entitlements").insert({
      user_id: userId,
      account_email: email,
      licensed: true,
      complimentary_grant: true,
      purchase_platform: "web",
    });
    if (insErr) {
      console.error("complimentary insert entitlement", insErr);
      return false;
    }
    return true;
  }

  const { error: upErr } = await admin.from("user_entitlements").upsert(
    {
      user_id: userId,
      account_email: email,
      licensed: true,
      complimentary_grant: true,
      purchase_platform: "web",
    },
    { onConflict: "user_id" },
  );
  if (upErr) {
    console.error("complimentary upsert entitlement", upErr);
    return false;
  }
  return true;
}

async function revokeComplimentaryFromUser(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<void> {
  const userId = await userIdForEmail(admin, email);
  if (!userId) return;

  const { data: ent, error: readErr } = await admin
    .from("user_entitlements")
    .select("stripe_checkout_session_id, refunded_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) {
    console.error("complimentary revoke read", readErr);
    return;
  }

  const hasPaid =
    Boolean(ent?.stripe_checkout_session_id) && !ent?.refunded_at;

  const { error: upErr } = await admin
    .from("user_entitlements")
    .update({
      complimentary_grant: false,
      licensed: hasPaid,
    })
    .eq("user_id", userId);
  if (upErr) console.error("complimentary revoke update", upErr);
}

function defaultLicenseAmountCents(): number {
  const n = Number(Deno.env.get("STRIPE_LICENSE_AMOUNT_CENTS") ?? "499");
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 499;
}

function hadPurchase(r: EntRow): boolean {
  return Boolean(
    r.stripe_checkout_session_id || r.purchased_at || r.refunded_at,
  );
}

function resolveAmountCents(r: EntRow): number | null {
  if (!hadPurchase(r)) return null;
  const raw = r.amount_cents ?? defaultLicenseAmountCents();
  return r.refunded_at ? -Math.abs(raw) : Math.abs(raw);
}

function formatRow(r: EntRow, isAdmin: boolean) {
  if (isAdmin) {
    return {
      userId: r.user_id,
      email: r.account_email ?? "",
      plan: "pro" as const,
      licensed: true,
      refunded: false,
      isAdmin: true,
      complimentary: Boolean(r.complimentary_grant),
      purchasedAt: r.purchased_at,
      amountCents: null,
      currency: r.currency ?? "usd",
      licenseKey: r.stripe_checkout_session_id,
      purchasePlatform: resolvePurchasePlatform(r),
      signupPlatform: resolveSignupPlatform(r),
      createdAt: r.created_at,
    };
  }

  const refunded = Boolean(r.refunded_at);
  const pro = r.licensed && !refunded;
  return {
    userId: r.user_id,
    email: r.account_email ?? "",
    plan: pro ? "pro" : "free",
    licensed: r.licensed,
    refunded,
    isAdmin: false,
    complimentary: Boolean(r.complimentary_grant),
    purchasedAt: r.purchased_at,
    amountCents: resolveAmountCents(r),
    currency: r.currency ?? "usd",
    licenseKey: r.stripe_checkout_session_id,
    purchasePlatform: resolvePurchasePlatform(r),
    signupPlatform: resolveSignupPlatform(r),
    createdAt: r.created_at,
  };
}

async function isProtectedAdminUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const allow = adminEmailAllowlist();
  const { data: ent } = await admin
    .from("user_entitlements")
    .select("account_email")
    .eq("user_id", userId)
    .maybeSingle();
  const fromEnt = (ent?.account_email ?? "").trim().toLowerCase();
  if (fromEnt && allow.has(fromEnt)) return true;

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const fromAuth = (authUser?.user?.email ?? "").trim().toLowerCase();
  return Boolean(fromAuth && allow.has(fromAuth));
}

function isSchemaGap(err: { message?: string; code?: string } | null): boolean {
  const m = err?.message ?? "";
  const code = err?.code ?? "";
  return (
    /column|does not exist|42703|admin_complaints|admin_complimentary|schema cache|PGRST204/i.test(m) ||
    code === "42703" ||
    code === "PGRST204"
  );
}

function utcDayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

type CountResult = {
  count: number | null;
  error: { message?: string; code?: string } | null;
};

async function countEntitlements(
  admin: ReturnType<typeof createClient>,
  apply: (
    q: ReturnType<ReturnType<typeof createClient>["from"]>,
    useRefundFilter: boolean,
  ) => ReturnType<ReturnType<typeof createClient>["from"]>,
): Promise<number> {
  for (const useRefundFilter of [true, false]) {
    let q = admin
      .from("user_entitlements")
      .select("user_id", { count: "exact", head: true });
    q = apply(q, useRefundFilter);
    const { count, error } = (await q) as CountResult;
    if (!error) return count ?? 0;
    if (!isSchemaGap(error)) {
      console.error("admin stats count", error);
      return 0;
    }
  }
  return 0;
}

type PurchaseBreakdownRow = {
  purchase_platform: string | null;
  purchase_country: string | null;
  stripe_checkout_session_id: string | null;
};

function resolvePlatformForStats(row: PurchaseBreakdownRow): PurchasePlatform {
  const p = row.purchase_platform?.trim().toLowerCase();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
}

async function fetchPaidPurchaseRows(
  admin: ReturnType<typeof createClient>,
): Promise<PurchaseBreakdownRow[]> {
  const selectAttempts = [
    "purchase_platform, purchase_country, stripe_checkout_session_id",
    "purchase_platform, stripe_checkout_session_id",
    "stripe_checkout_session_id",
  ];

  for (const useRefundFilter of [true, false]) {
    for (const columns of selectAttempts) {
      let q = admin
        .from("user_entitlements")
        .select(columns)
        .eq("licensed", true)
        .not("purchased_at", "is", null);
      if (useRefundFilter) q = q.is("refunded_at", null);
      const { data, error } = await q;
      if (!error) return (data ?? []) as PurchaseBreakdownRow[];
      if (!isSchemaGap(error)) {
        console.error("admin stats purchase breakdown", error);
        return [];
      }
    }
  }
  return [];
}

async function fetchPurchaseBreakdownStats(
  admin: ReturnType<typeof createClient>,
): Promise<{
  sales_by_platform: { web: number; ios: number; android: number };
  sales_by_country: { country: string; count: number }[];
}> {
  const rows = await fetchPaidPurchaseRows(admin);

  const platform = { web: 0, ios: 0, android: 0 };
  const countryMap = new Map<string, number>();

  for (const row of rows) {
    const plat = resolvePlatformForStats(row);
    platform[plat] += 1;

    const country = normalizePurchaseCountry(row.purchase_country) ?? "unknown";
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
  }

  const sales_by_country = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, 16);

  return { sales_by_platform: platform, sales_by_country };
}

async function fetchSignupByCountryStats(
  admin: ReturnType<typeof createClient>,
): Promise<{ country: string; count: number }[]> {
  const { data, error } = await admin
    .from("user_entitlements")
    .select("signup_country");

  if (error) {
    if (!isSchemaGap(error)) {
      console.error("admin stats signup country", error);
    }
    return [];
  }

  const countryMap = new Map<string, number>();
  for (const row of (data ?? []) as { signup_country: string | null }[]) {
    const country =
      normalizePurchaseCountry(row.signup_country) ?? "unknown";
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
  }

  return Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, 16);
}

async function fetchDashboardStats(admin: ReturnType<typeof createClient>) {
  const since = utcDayStartIso();

  const sales_today = await countEntitlements(admin, (q, useRefundFilter) => {
    let next = q.eq("licensed", true).gte("purchased_at", since);
    if (useRefundFilter) next = next.is("refunded_at", null);
    return next;
  });

  let sales_amount_cents_today = 0;
  for (const useRefundFilter of [true, false]) {
    let q = admin
      .from("user_entitlements")
      .select("amount_cents")
      .eq("licensed", true)
      .gte("purchased_at", since);
    if (useRefundFilter) q = q.is("refunded_at", null);
    const { data, error } = await q;
    if (!error) {
      const rows = (data ?? []) as { amount_cents: number | null }[];
      const fallback = defaultLicenseAmountCents();
      sales_amount_cents_today = rows.reduce(
        (sum, row) => sum + (row.amount_cents ?? fallback),
        0,
      );
      break;
    }
    if (!isSchemaGap(error)) {
      console.error("admin stats amount", error);
      break;
    }
  }

  const sales_total = await countEntitlements(admin, (q, useRefundFilter) => {
    let next = q.eq("licensed", true).not("purchased_at", "is", null);
    if (useRefundFilter) next = next.is("refunded_at", null);
    return next;
  });

  let sales_amount_cents_total = 0;
  for (const useRefundFilter of [true, false]) {
    let q = admin
      .from("user_entitlements")
      .select("amount_cents")
      .eq("licensed", true)
      .not("purchased_at", "is", null);
    if (useRefundFilter) q = q.is("refunded_at", null);
    const { data, error } = await q;
    if (!error) {
      const rows = (data ?? []) as { amount_cents: number | null }[];
      const fallback = defaultLicenseAmountCents();
      sales_amount_cents_total = rows.reduce(
        (sum, row) => sum + (row.amount_cents ?? fallback),
        0,
      );
      break;
    }
    if (!isSchemaGap(error)) {
      console.error("admin stats amount total", error);
      break;
    }
  }

  let free_signups_today = 0;
  {
    const { count, error } = await admin
      .from("user_entitlements")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", since);
    if (!error) free_signups_today = count ?? 0;
    else if (!isSchemaGap(error)) console.error("admin stats signups", error);
  }

  const paid_members = await countEntitlements(admin, (q, useRefundFilter) => {
    let next = q.eq("licensed", true);
    if (useRefundFilter) next = next.is("refunded_at", null);
    return next;
  });

  const free_members = await countEntitlements(admin, (q) =>
    q.eq("licensed", false),
  );

  let open_complaints = 0;
  {
    const { count, error } = await admin
      .from("admin_complaints")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    if (!error) open_complaints = count ?? 0;
    else if (!isSchemaGap(error)) console.error("admin stats complaints", error);
  }

  const breakdown = await fetchPurchaseBreakdownStats(admin);
  const signups_by_country = await fetchSignupByCountryStats(admin);

  return {
    stats: {
      sales_today,
      sales_amount_cents_today,
      sales_total,
      sales_amount_cents_total,
      free_signups_today,
      paid_members,
      free_members,
      open_complaints,
      sales_by_platform: breakdown.sales_by_platform,
      sales_by_country: breakdown.sales_by_country,
      signups_by_country,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const action = typeof body.action === "string" ? body.action : "";

  if (action === "check_admin") {
    const auth = await getAuthedUserEmail(req);
    if ("error" in auth) {
      return json({ isAdmin: false });
    }
    return json({ isAdmin: adminEmailAllowlist().has(auth.email) });
  }

  const ctx = await requireAdmin(req);
  if ("error" in ctx && ctx.error) return ctx.error;
  const { admin, stripe, email: adminEmail, userId: callerUserId } = ctx;

  if (action === "stats") {
    return json(await fetchDashboardStats(admin));
  }

  if (action === "list") {
    const plan =
      body.plan === "pro" || body.plan === "free" || body.plan === "all"
        ? body.plan
        : "all";
    const refundedFilter =
      body.refunded === "yes" || body.refunded === "no" || body.refunded === "all"
        ? body.refunded
        : "all";
    const q = typeof body.q === "string" ? body.q.trim() : "";
    const limit = Math.min(
      200,
      Math.max(1, Number(body.limit) || 50),
    );
    const offset = Math.max(0, Number(body.offset) || 0);

    let query = admin
      .from("user_entitlements")
      .select(
        "user_id, licensed, purchased_at, stripe_checkout_session_id, amount_cents, currency, refunded_at, account_email, created_at, complimentary_grant, purchase_platform, signup_platform",
        { count: "exact" },
      )
      .order("purchased_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (plan === "pro") {
      query = query.eq("licensed", true).is("refunded_at", null);
    } else if (plan === "free") {
      query = query.eq("licensed", false);
    }

    if (refundedFilter === "yes") {
      query = query.not("refunded_at", "is", null);
    } else if (refundedFilter === "no") {
      query = query.is("refunded_at", null);
    }

    if (q.length >= 2) {
      const esc = q.replace(/,/g, " ").slice(0, 80);
      query = query.or(
        `account_email.ilike.%${esc}%,stripe_checkout_session_id.ilike.%${esc}%`,
      );
    }

    let { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error && isSchemaGap(error)) {
      let legacy = admin
        .from("user_entitlements")
        .select(
          "user_id, licensed, purchased_at, stripe_checkout_session_id",
          { count: "exact" },
        )
        .order("purchased_at", { ascending: false, nullsFirst: false });

      if (plan === "pro") legacy = legacy.eq("licensed", true);
      else if (plan === "free") legacy = legacy.eq("licensed", false);

      if (q.length >= 2) {
        const esc = q.replace(/,/g, " ").slice(0, 80);
        legacy = legacy.ilike("stripe_checkout_session_id", `%${esc}%`);
      }

      ({ data, error, count } = await legacy.range(offset, offset + limit - 1));
    }

    if (error) {
      console.error("admin list", error);
      return json({ error: "db_error" }, 500);
    }

    const rows: ReturnType<typeof formatRow>[] = [];
    for (const r of (data ?? []) as EntRow[]) {
      const isAdmin = await isProtectedAdminUser(admin, r.user_id);
      rows.push(formatRow(r, isAdmin));
    }
    return json({ rows, total: count ?? rows.length, limit, offset });
  }

  if (action === "refund") {
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.trim() : "";
    if (!sessionId.startsWith("cs_")) {
      return json({ error: "invalid_session_id" }, 400);
    }
    if (!stripe) {
      return json({ error: "stripe_not_configured" }, 500);
    }

    const { data: ent, error: entErr } = await admin
      .from("user_entitlements")
      .select("user_id, licensed, refunded_at, amount_cents")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (entErr) {
      console.error("admin refund lookup", entErr);
      return json({ error: "db_error" }, 500);
    }
    if (!ent) {
      return json({ error: "session_not_found" }, 404);
    }
    if (await isProtectedAdminUser(admin, ent.user_id)) {
      return json({ error: "protected_admin" }, 403);
    }
    if (ent.refunded_at) {
      return json({ error: "already_refunded" }, 409);
    }

    let sess: Stripe.Checkout.Session;
    try {
      sess = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (e) {
      console.error("admin refund stripe retrieve", e);
      return json({ error: "stripe_error" }, 502);
    }

    const pi =
      typeof sess.payment_intent === "string"
        ? sess.payment_intent
        : sess.payment_intent?.id;
    if (!pi) {
      return json({ error: "no_payment_intent" }, 400);
    }

    try {
      await stripe.refunds.create({ payment_intent: pi });
    } catch (e) {
      console.error("admin refund stripe create", e);
      return json({ error: "stripe_refund_failed" }, 502);
    }

    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("user_entitlements")
      .update({
        licensed: false,
        refunded_at: now,
        amount_cents: ent.amount_cents ?? defaultLicenseAmountCents(),
        currency: "usd",
      })
      .eq("user_id", ent.user_id);
    if (upErr) {
      console.error("admin refund db update", upErr);
      return json({ error: "db_error" }, 500);
    }

    return json({ ok: true, refundedAt: now });
  }

  if (action === "complaint_add") {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.trim() : null;
    const userId =
      typeof body.user_id === "string" ? body.user_id.trim() : null;
    const email =
      typeof body.email === "string" ? body.email.trim() : null;

    const { data, error } = await admin
      .from("admin_complaints")
      .insert({
        user_id: userId || null,
        stripe_checkout_session_id: sessionId || null,
        account_email: email || null,
        note: note || null,
        status: "open",
      })
      .select("id, status, created_at")
      .single();
    if (error) {
      console.error("admin complaint_add", error);
      return json({ error: "db_error" }, 500);
    }
    return json({ complaint: data });
  }

  if (action === "complaint_resolve") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return json({ error: "invalid_id" }, 400);
    const now = new Date().toISOString();
    const { error } = await admin
      .from("admin_complaints")
      .update({ status: "resolved", resolved_at: now })
      .eq("id", id);
    if (error) {
      console.error("admin complaint_resolve", error);
      return json({ error: "db_error" }, 500);
    }
    return json({ ok: true });
  }

  if (action === "complaints_list") {
    const { data, error } = await admin
      .from("admin_complaints")
      .select(
        "id, user_id, stripe_checkout_session_id, account_email, note, status, created_at, resolved_at",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      if (isSchemaGap(error)) return json({ complaints: [] });
      console.error("admin complaints_list", error);
      return json({ error: "db_error" }, 500);
    }
    return json({ complaints: data ?? [] });
  }

  if (action === "complimentary_list") {
    const { data, error } = await admin
      .from("admin_complimentary_grants")
      .select("id, email, note, granted_at, granted_by")
      .is("revoked_at", null)
      .order("granted_at", { ascending: false })
      .limit(200);
    if (error) {
      if (isSchemaGap(error)) return json({ grants: [] });
      console.error("admin complimentary_list", error);
      return json({ error: "db_error" }, 500);
    }
    return json({ grants: data ?? [] });
  }

  if (action === "complimentary_add") {
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = normalizeEmail(rawEmail);
    if (!email) return json({ error: "invalid_email" }, 400);
    const note = typeof body.note === "string" ? body.note.trim() : null;

    const { data: grant, error } = await admin
      .from("admin_complimentary_grants")
      .insert({
        email,
        note: note || null,
        granted_by: adminEmail,
      })
      .select("id, email, note, granted_at, granted_by")
      .single();
    if (error) {
      if (error.code === "23505") {
        return json({ error: "already_granted" }, 409);
      }
      if (isSchemaGap(error)) return json({ error: "db_error" }, 500);
      console.error("admin complimentary_add", error);
      return json({ error: "db_error" }, 500);
    }

    const applied = await applyComplimentaryToUser(admin, email);
    return json({ grant, applied });
  }

  if (action === "complimentary_revoke") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return json({ error: "invalid_id" }, 400);

    const { data: grant, error: fetchErr } = await admin
      .from("admin_complimentary_grants")
      .select("id, email")
      .eq("id", id)
      .is("revoked_at", null)
      .maybeSingle();
    if (fetchErr) {
      console.error("admin complimentary_revoke fetch", fetchErr);
      return json({ error: "db_error" }, 500);
    }
    if (!grant) return json({ error: "not_found" }, 404);

    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("admin_complimentary_grants")
      .update({ revoked_at: now })
      .eq("id", id);
    if (upErr) {
      console.error("admin complimentary_revoke", upErr);
      return json({ error: "db_error" }, 500);
    }

    await revokeComplimentaryFromUser(admin, grant.email);
    return json({ ok: true });
  }

  if (action === "delete_user") {
    const userId =
      typeof body.user_id === "string" ? body.user_id.trim() : "";
    if (!userId) return json({ error: "invalid_user_id" }, 400);
    if (userId === callerUserId) {
      return json({ error: "cannot_delete_self" }, 400);
    }
    if (await isProtectedAdminUser(admin, userId)) {
      return json({ error: "cannot_delete_admin" }, 403);
    }

    const result = await permanentlyDeleteUserAccount(admin, userId);
    if ("error" in result) return json({ error: result.error }, 500);
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
