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
  isPasskeyOriginHost,
  isVercelPreviewHost,
  publicSiteOrigin,
} from "./siteOrigin";

export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential || !client.isAvailable()) return false;
  return isPasskeyOriginHost(window.location.hostname);
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

function isLocalDev(): boolean {
  return (
    typeof window !== "undefined" &&
    isLocalDevHost(window.location.hostname)
  );
}

/** Passkeys are bound to the site (rpId) where they were created. */
export function passkeyRegisteredForCurrentSite(meta: VaultMeta): boolean {
  if (!meta.passkeys?.length) return false;
  if (!meta.passkeyRpId) return true;
  return meta.passkeyRpId === currentPasskeyRpId();
}

export function mapPasskeyClientError(
  err: unknown,
  context: "setup" | "unlock" = "unlock",
): AppError {
  if (err instanceof AppError) return err;
  const detail =
    err instanceof Error ? err.message : err != null ? String(err) : undefined;
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return new AppError("errors.passkeyCancelled", detail);
    }
    if (err.name === "SecurityError") {
      const onIp =
        typeof window !== "undefined" &&
        !isPasskeyOriginHost(window.location.hostname);
      return new AppError(
        onIp
          ? "errors.passkeyUseLocalhost"
          : context === "setup"
            ? "errors.passkeySetupSecurity"
            : "errors.passkeyWrongDomain",
        detail,
      );
    }
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return new AppError("errors.passkeyTimeout", detail);
    }
    if (err.name === "InvalidStateError") {
      return new AppError("errors.passkeyInvalidState", detail);
    }
  }
  const msg = detail ?? "";
  if (/invalid domain/i.test(msg)) {
    return new AppError("errors.passkeyUseLocalhost", detail);
  }
  if (/timed out|not allowed/i.test(msg)) {
    return new AppError("errors.passkeyCancelled", detail);
  }
  if (/unexpected clientdata origin|origin:/i.test(msg)) {
    return new AppError(
      context === "setup"
        ? "errors.passkeySetupOrigin"
        : "errors.passkeyWrongDomain",
      detail,
    );
  }
  if (/user verification required/i.test(msg)) {
    return new AppError("errors.passkeySetupUv", detail);
  }
  if (/security|domain|rpid|relying party|rpidhash/i.test(msg)) {
    return new AppError(
      context === "setup"
        ? "errors.passkeySetupSecurity"
        : "errors.passkeyWrongDomain",
      detail,
    );
  }
  if (/prf/i.test(msg)) {
    return new AppError("errors.passkeyNoPasswordless", detail);
  }
  return new AppError("errors.passkeyFailed", detail);
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

/** Enable PRF on the credential at registration (do not pass `eval` here — Chrome rejects it). */
function prfEnableExtension() {
  return { prf: {} };
}

function prfEvalExtension(prfSaltB64: string) {
  return {
    prf: {
      eval: { first: fromBase64(prfSaltB64) },
    },
  };
}

type RegisterStrategy = {
  enablePrf: boolean;
  attestation: boolean;
};

function registerStrategies(): RegisterStrategy[] {
  if (isLocalDev()) {
    return [
      { enablePrf: false, attestation: false },
      { enablePrf: true, attestation: false },
      { enablePrf: false, attestation: true },
      { enablePrf: true, attestation: true },
    ];
  }
  return [
    { enablePrf: true, attestation: true },
    { enablePrf: true, attestation: false },
    { enablePrf: false, attestation: true },
    { enablePrf: false, attestation: false },
  ];
}

async function createRegistration(
  opts: {
    userId: string;
    userName: string;
    excludeCredentialIds: string[];
    hints?: ("client-device" | "security-key" | "hybrid")[];
  },
  strategy: RegisterStrategy,
  challenge: string,
): Promise<RegistrationJSON> {
  const customProperties: Record<string, unknown> = {
    excludeCredentials: opts.excludeCredentialIds.map((id) => ({
      id,
      type: "public-key",
    })),
  };
  if (strategy.enablePrf) {
    customProperties.extensions = prfEnableExtension();
  }
  return client.register({
    user: {
      id: opts.userId,
      name: opts.userName,
      displayName: opts.userName,
    },
    challenge,
    domain: rpId(),
    discoverable: "preferred",
    userVerification: "required",
    attestation: strategy.attestation,
    hints: opts.hints,
    customProperties,
  });
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
  prfBytes: Uint8Array | null;
}> {
  if (!isPasskeySupported()) throw new AppError("errors.passkeyNotSupported");
  const challenge = server.randomChallenge();
  let registration: RegistrationJSON | null = null;
  let lastErr: unknown;

  for (const strategy of registerStrategies()) {
    try {
      registration = await createRegistration(opts, strategy, challenge);
      break;
    } catch (err) {
      lastErr = err;
      if (
        err instanceof DOMException &&
        (err.name === "SecurityError" || err.name === "NotSupportedError")
      ) {
        continue;
      }
      throw mapPasskeyClientError(err, "setup");
    }
  }

  if (!registration) {
    throw mapPasskeyClientError(lastErr, "setup");
  }

  let info;
  try {
    info = await server.verifyRegistration(registration, {
      challenge,
      origin: expectedOrigin(),
      domain: rpId(),
      userVerified: true,
    });
  } catch (err) {
    if (isLocalDev()) {
      try {
        info = await server.verifyRegistration(registration, {
          challenge,
          origin: expectedOrigin(),
          domain: rpId(),
          userVerified: false,
        });
      } catch (retryErr) {
        throw mapPasskeyClientError(retryErr, "setup");
      }
    } else {
      throw mapPasskeyClientError(err, "setup");
    }
  }

  const passkey: StoredPasskey = {
    id: info.credential.id,
    publicKey: info.credential.publicKey,
    algorithm: info.credential.algorithm,
    counter: info.authenticator.counter,
    transports: info.credential.transports ?? [],
    createdAt: Date.now(),
    label: opts.label,
  };
  const prfBytes = readPrfFirst(
    registration.clientExtensionResults as Record<string, unknown>,
  );
  return { registration, passkey, challenge, prfBytes };
}

const PRF_RETRY_MS = [0, 400, 1200];

/** After registration, derive PRF output (second Touch ID). Retries help right after create on Chrome/macOS. */
export async function derivePrfAfterRegistration(
  passkey: StoredPasskey,
  prfSaltB64: string,
): Promise<Uint8Array | null> {
  let lastErr: unknown;
  for (const delayMs of PRF_RETRY_MS) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    try {
      const auth = await authenticateVaultPasskey(
        [passkey],
        prfSaltB64,
        "setup",
      );
      const prfBytes = readPrfFirst(
        auth.authentication.clientExtensionResults as Record<
          string,
          unknown
        >,
      );
      if (prfBytes) return prfBytes;
    } catch (err) {
      lastErr = err;
      if (
        err instanceof DOMException &&
        err.name === "NotAllowedError"
      ) {
        throw mapPasskeyClientError(err, "setup");
      }
    }
  }
  if (lastErr && import.meta.env.DEV) {
    console.warn("derivePrfAfterRegistration", lastErr);
  }
  return null;
}

export async function authenticateVaultPasskey(
  passkeys: StoredPasskey[],
  prfSaltB64: string,
  context: "setup" | "unlock" = "unlock",
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
      domain: rpId(),
      allowCredentials: passkeys.map((p) => p.id),
      userVerification: "required",
      customProperties: {
        extensions: prfEvalExtension(prfSaltB64),
      },
    });
  } catch (err) {
    throw mapPasskeyClientError(err, context);
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
    },
  ).catch((err) => {
    throw mapPasskeyClientError(err, context);
  });
  passkey.counter = info.counter;
  return { authentication, passkey, challenge };
}

/** PRF extension output (32 bytes) when platform supports it. */
export function readPrfFirst(
  ext: Record<string, unknown> | undefined,
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
