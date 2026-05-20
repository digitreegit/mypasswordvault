import type { AuthError } from "@supabase/supabase-js";

/** Thrown when sign-up is attempted for an email that already has an account. */
export class AuthEmailTakenError extends Error {
  readonly code = "email_already_exists";

  constructor() {
    super("already registered");
    this.name = "AuthEmailTakenError";
  }
}

export function isAuthEmailTakenError(error: unknown): boolean {
  if (error instanceof AuthEmailTakenError) return true;
  const auth = error as AuthError | undefined;
  if (!auth?.message) return false;
  const lower = auth.message.toLowerCase();
  return (
    auth.code === "user_already_exists" ||
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("already been registered")
  );
}

/**
 * Supabase may return HTTP 200 with an empty `identities` array when the email is
 * already registered (anti-enumeration when confirm email is enabled).
 */
export function isDuplicateSignUpResponse(data: {
  user?: { identities?: { provider: string }[] | null } | null;
  session?: unknown;
}): boolean {
  if (data.session) return false;
  const identities = data.user?.identities;
  return Boolean(data.user) && (!identities || identities.length === 0);
}
