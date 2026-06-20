import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

export type AdminStats = {
  sales_today: number;
  sales_amount_cents_today: number;
  sales_total: number;
  sales_amount_cents_total: number;
  free_signups_today: number;
  paid_members: number;
  free_members: number;
  open_complaints: number;
  sales_by_platform: { web: number; ios: number; android: number };
  sales_by_country: { country: string; count: number }[];
  signups_by_country: { country: string; count: number }[];
};

export type PurchasePlatform = "web" | "ios" | "android";

export type AdminCustomerRow = {
  userId: string;
  email: string;
  plan: "pro" | "free";
  licensed: boolean;
  refunded: boolean;
  /** ADMIN_EMAILS operator — no purchase/refund amounts in admin UI. */
  isAdmin?: boolean;
  complimentary?: boolean;
  purchasedAt: string | null;
  amountCents: number | null;
  currency: string;
  licenseKey: string | null;
  purchasePlatform: PurchasePlatform | null;
  /** First sign-in platform when no purchase yet. */
  signupPlatform?: PurchasePlatform | null;
  createdAt: string | null;
};

export type AdminComplimentaryGrant = {
  id: string;
  email: string;
  note: string | null;
  granted_at: string;
  granted_by: string | null;
};

export type AdminComplaint = {
  id: string;
  user_id: string | null;
  stripe_checkout_session_id: string | null;
  account_email: string | null;
  note: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

type AdminApiError =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "admin_not_configured"
  | "network"
  | string;

async function parseInvokeError(
  error: unknown,
  data: unknown,
): Promise<AdminApiError> {
  const payload = data as Record<string, unknown> | null;
  if (payload?.error) return String(payload.error);

  if (error && typeof error === "object") {
    const e = error as { message?: string; context?: Response };
    if (e.context && typeof e.context.json === "function") {
      try {
        const body = (await e.context.json()) as Record<string, unknown>;
        if (body?.error) return String(body.error);
      } catch {
        /* response body not JSON */
      }
    }
    const msg = e.message ?? "";
    if (/403|forbidden/i.test(msg)) return "forbidden";
    if (/401|unauthorized/i.test(msg)) return "unauthorized";
    if (/503|admin_not_configured/i.test(msg)) return "admin_not_configured";
    if (/404|not found|failed to send/i.test(msg)) return "function_not_deployed";
    if (/non-2xx/i.test(msg)) return "function_error";
    if (msg) return msg;
  }
  return "network";
}

async function invokeAdmin<T>(
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: AdminApiError }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "not_configured" };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "not_configured" };

  const { data, error } = await sb.functions.invoke("admin-api", { body });
  if (error) {
    return { ok: false, error: await parseInvokeError(error, data) };
  }

  const payload = data as Record<string, unknown> | null;
  if (payload?.error === "forbidden") return { ok: false, error: "forbidden" };
  if (payload?.error === "unauthorized") return { ok: false, error: "unauthorized" };
  if (payload?.error === "admin_not_configured") {
    return { ok: false, error: "admin_not_configured" };
  }
  if (payload?.error) return { ok: false, error: String(payload.error) };

  return { ok: true, data: payload as T };
}

export async function fetchIsAdmin() {
  const r = await invokeAdmin<{ isAdmin: boolean }>({ action: "check_admin" });
  return r.ok && Boolean(r.data.isAdmin);
}

export async function fetchAdminStats() {
  return invokeAdmin<{ stats: AdminStats }>({ action: "stats" });
}

export async function fetchAdminCustomers(opts: {
  q?: string;
  plan?: "all" | "pro" | "free";
  refunded?: "all" | "yes" | "no";
  limit?: number;
  offset?: number;
}) {
  return invokeAdmin<{
    rows: AdminCustomerRow[];
    total: number;
    limit: number;
    offset: number;
  }>({
    action: "list",
    q: opts.q ?? "",
    plan: opts.plan ?? "all",
    refunded: opts.refunded ?? "all",
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
  });
}

export async function adminRefund(sessionId: string) {
  return invokeAdmin<{ ok: true; refundedAt: string }>({
    action: "refund",
    session_id: sessionId,
  });
}

export async function fetchAdminComplaints() {
  return invokeAdmin<{ complaints: AdminComplaint[] }>({
    action: "complaints_list",
  });
}

export async function adminAddComplaint(opts: {
  sessionId?: string;
  userId?: string;
  email?: string;
  note?: string;
}) {
  return invokeAdmin<{ complaint: { id: string } }>({
    action: "complaint_add",
    session_id: opts.sessionId,
    user_id: opts.userId,
    email: opts.email,
    note: opts.note,
  });
}

export async function adminResolveComplaint(id: string) {
  return invokeAdmin<{ ok: true }>({ action: "complaint_resolve", id });
}

export async function fetchComplimentaryGrants() {
  return invokeAdmin<{ grants: AdminComplimentaryGrant[] }>({
    action: "complimentary_list",
  });
}

export async function adminGrantComplimentary(opts: {
  email: string;
  note?: string;
}) {
  return invokeAdmin<{
    grant: AdminComplimentaryGrant;
    applied: boolean;
  }>({
    action: "complimentary_add",
    email: opts.email,
    note: opts.note,
  });
}

export async function adminRevokeComplimentary(id: string) {
  return invokeAdmin<{ ok: true }>({ action: "complimentary_revoke", id });
}

export async function adminDeleteUser(userId: string) {
  return invokeAdmin<{ ok: true }>({ action: "delete_user", user_id: userId });
}
