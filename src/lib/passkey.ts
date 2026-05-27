import { client, server } from "@passwordless-id/webauthn";
import type {
  AuthenticationJSON,
  ExtendedAuthenticatorTransport,
  NamedAlgo,
  RegistrationJSON,
} from "@passwordless-id/webauthn";
import { AppError } from "./errors";
import type { StoredPasskey, VaultMeta } from "./storage";
import { fromBase64, randomBytes, toBase64 } from "./crypto";
import {
  canonicalSiteHostname,
  isLocalDevHost,
  isVercelPreviewHost,
  publicSiteOrigin,
} from "./siteOrigin";

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    client.isAvailable()
  );
}

export function currentPasskeyRpId(): string {
  if (typeof window === "undefined") return canonicalSiteHostname();
  const host = window.location.hostname;
  if (isLocalDevHost(host)) return host;
  return canonicalSiteHostname();
}

function rpId(): string {
  return currentPasskeyRpId();
}

/** Passkeys are bound to the site (rpId) where they were created. */
export function passkeyRegisteredForCurrentSite(meta: VaultMeta): boolean {
  if (!meta.passkeys?.length) return false;
  if (!meta.passkeyRpId) return true;
  return meta.passkeyRpId === currentPasskeyRpId();
}

export function mapPasskeyClientError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return new AppError("errors.passkeyCancelled");
    }
    if (err.name === "SecurityError") {
      return new AppError("errors.passkeyWrongDomain");
    }
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return new AppError("errors.passkeyTimeout");
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/timed out|not allowed/i.test(msg)) {
    return new AppError("errors.passkeyCancelled");
  }
  if (/security|domain|rpid|relying party/i.test(msg)) {
    return new AppError("errors.passkeyWrongDomain");
  }
  return new AppError("errors.passkeyFailed");
}

function expectedOrigin(): string {
  if (typeof window === "undefined") return publicSiteOrigin();
  const host = window.location.hostname;
  if (isLocalDevHost(host)) return window.location.origin;
  if (isVercelPreviewHost(host)) return publicSiteOrigin();
  return window.location.origin;
}

export function newPrfSalt(): string {
  return toBase64(randomBytes(32));
}

function prfExtension(prfSaltB64: string) {
  return {
    prf: {
      eval: { first: fromBase64(prfSaltB64) },
    },
  };
}

export async function registerVaultPasskey(opts: {
  userId: string;
  userName: string;
  excludeCredentialIds: string[];
  prfSaltB64: string;
  hints?: ("client-device" | "security-key" | "hybrid")[];
  label?: string;
}): Promise<{
  registration: RegistrationJSON;
  passkey: StoredPasskey;
  challenge: string;
}> {
  if (!isPasskeySupported()) throw new AppError("errors.passkeyNotSupported");
  const challenge = server.randomChallenge();
  let registration: RegistrationJSON;
  try {
    registration = await client.register({
    user: {
      id: opts.userId,
      name: opts.userName,
      displayName: opts.userName,
    },
    challenge,
    discoverable: "preferred",
    userVerification: "required",
    attestation: true,
    hints: opts.hints,
    customProperties: {
      excludeCredentials: opts.excludeCredentialIds.map((id) => ({
        id,
        type: "public-key",
      })),
      extensions: prfExtension(opts.prfSaltB64),
    },
    });
  } catch (err) {
    throw mapPasskeyClientError(err);
  }
  const info = await server.verifyRegistration(registration, {
    challenge,
    origin: expectedOrigin(),
    domain: rpId(),
    userVerified: true,
  }).catch(() => {
    throw new AppError("errors.passkeyFailed");
  });
  const passkey: StoredPasskey = {
    id: info.credential.id,
    publicKey: info.credential.publicKey,
    algorithm: info.credential.algorithm,
    counter: info.authenticator.counter,
    transports: info.credential.transports ?? [],
    createdAt: Date.now(),
    label: opts.label,
  };
  return { registration, passkey, challenge };
}

export async function authenticateVaultPasskey(
  passkeys: StoredPasskey[],
  prfSaltB64: string
): Promise<{
  authentication: AuthenticationJSON;
  passkey: StoredPasskey;
  challenge: string;
}> {
  if (!passkeys.length) throw new AppError("errors.noPasskeyRegistered");
  if (!isPasskeySupported()) throw new AppError("errors.passkeyNotSupported");
  const challenge = server.randomChallenge();
  let authentication: AuthenticationJSON;
  try {
    authentication = await client.authenticate({
      challenge,
      allowCredentials: passkeys.map((p) => p.id),
      userVerification: "required",
      customProperties: {
        extensions: prfExtension(prfSaltB64),
      },
    });
  } catch (err) {
    throw mapPasskeyClientError(err);
  }
  const passkey = passkeys.find((p) => p.id === authentication.id);
  if (!passkey) throw new AppError("errors.passkeyFailed");
  const info = await server.verifyAuthentication(
    authentication,
    {
      id: passkey.id,
      publicKey: passkey.publicKey,
      algorithm: passkey.algorithm as NamedAlgo,
      transports: passkey.transports as ExtendedAuthenticatorTransport[],
    },
    {
      challenge,
      origin: expectedOrigin(),
      domain: rpId(),
      userVerified: true,
      counter: passkey.counter,
    }
  );
  passkey.counter = info.counter;
  return { authentication, passkey, challenge };
}

/** PRF extension output (32 bytes) when platform supports it. */
export function readPrfFirst(
  ext: Record<string, unknown> | undefined
): Uint8Array | null {
  const prf = ext?.prf as
    | { results?: { first?: ArrayBuffer | Uint8Array } }
    | undefined;
  const first = prf?.results?.first;
  if (!first) return null;
  const bytes = first instanceof ArrayBuffer ? new Uint8Array(first) : first;
  if (bytes.byteLength < 32) return null;
  return bytes.slice(0, 32);
}
