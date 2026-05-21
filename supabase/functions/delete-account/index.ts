/**
 * Permanently delete the signed-in user: cloud vault, entitlements, and Auth account.
 * Requires a valid user JWT (verify_jwt = true on deploy).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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

function getAdminApiKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      for (const name of ["default", "service_role"]) {
        const v = keys[name];
        if (typeof v === "string" && v.length > 10) return v;
      }
      const first = Object.values(keys).find(
        (v) => typeof v === "string" && v.length > 10
      );
      if (first) return first;
    } catch {
      /* fall through */
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const adminKey = getAdminApiKey();

  if (!supabaseUrl || !anonKey || !adminKey) {
    console.error("delete-account: missing env");
    return json({ error: "server_misconfigured" }, 500);
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user?.id) {
    return json({ error: "unauthorized" }, 401);
  }
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: vaultErr } = await admin
    .from("user_vaults")
    .delete()
    .eq("user_id", userId);
  if (vaultErr) {
    console.error("delete-account: user_vaults", vaultErr);
    return json({ error: "delete_failed" }, 500);
  }

  const { error: entErr } = await admin
    .from("user_entitlements")
    .delete()
    .eq("user_id", userId);
  if (entErr) {
    console.error("delete-account: user_entitlements", entErr);
    return json({ error: "delete_failed" }, 500);
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("delete-account: deleteUser", delErr);
    return json({ error: "delete_failed" }, 500);
  }

  return json({ ok: true });
});
