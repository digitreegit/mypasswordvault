import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  clearPendingAuthMethod,
  clearSignInAttempt,
  getAuthLastEmail,
  setAuthLastMethod,
  type AuthLastMethod,
} from "./authLastUsed";

/** Persist last-used sign-in method after a successful login. */
export function finalizeSignIn(
  session: Session,
  method: AuthLastMethod,
  _event: AuthChangeEvent | "SIGNED_IN" = "SIGNED_IN",
  emailHint?: string | null
): void {
  const userId = session.user.id;
  const email =
    session.user.email?.trim() || emailHint?.trim() || getAuthLastEmail() || null;

  setAuthLastMethod(method, userId, email);
  clearSignInAttempt();
  clearPendingAuthMethod();
}
