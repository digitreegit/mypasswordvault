import type { PasskeyKind, StoredPasskey } from "./storage";

/** WebAuthn registration hint groups — one credential per group per setup pass. */
export type PasskeyRegistrationGroup = "platform";

export type PasskeyMethodId = "touch-id" | "face-id" | "fingerprint" | "windows-hello" | "device-pin";

export type PasskeyHint = "client-device";

export type PasskeyMethodRowKind = "selectable" | "included";

export interface PasskeyMethodOption {
  id: PasskeyMethodId;
  labelKey: string;
  rowKind: PasskeyMethodRowKind;
  /** Shown under the label for included rows or optional subtitles. */
  subtitleKey?: string;
  hints?: PasskeyHint[];
  registrationGroup?: PasskeyRegistrationGroup;
}

function detectAppleMobileFaceId(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return true;
  if (/iPad/.test(ua)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * Setup offers one platform passkey (Touch ID / Face ID / etc.).
 * Device PIN is not a separate credential — the OS uses it as fallback UV.
 */
export async function getPasskeyMethodOptions(): Promise<PasskeyMethodOption[]> {
  const options: PasskeyMethodOption[] = [];
  const ua = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua);
  const isWindows = /Win/.test(ua);
  const isAndroid = /Android/.test(ua);

  const platformAvailable =
    typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function" &&
    (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());

  if (!platformAvailable) return options;

  if (isMac) {
    options.push({
      id: "touch-id",
      hints: ["client-device"],
      labelKey: "setup.passkeyMethodTouchId",
      rowKind: "selectable",
      registrationGroup: "platform",
    });
  } else if (detectAppleMobileFaceId()) {
    options.push({
      id: "face-id",
      hints: ["client-device"],
      labelKey: "setup.passkeyMethodFaceId",
      rowKind: "selectable",
      registrationGroup: "platform",
    });
  } else if (isWindows) {
    options.push({
      id: "windows-hello",
      hints: ["client-device"],
      labelKey: "setup.passkeyMethodWindowsHello",
      rowKind: "selectable",
      registrationGroup: "platform",
    });
  } else if (isAndroid) {
    options.push({
      id: "fingerprint",
      hints: ["client-device"],
      labelKey: "setup.passkeyMethodFingerprint",
      rowKind: "selectable",
      registrationGroup: "platform",
    });
  } else {
  options.push({
    id: "fingerprint",
    hints: ["client-device"],
    labelKey: "setup.passkeyMethodBiometric",
    rowKind: "selectable",
    registrationGroup: "platform",
  });
  }

  return options;
}

export function getSelectableMethods(
  methods: PasskeyMethodOption[]
): PasskeyMethodOption[] {
  return methods.filter((m) => m.rowKind === "selectable");
}

/** One WebAuthn registration per group; preserves display order from `methods`. */
export function planPasskeyRegistrations(
  methods: PasskeyMethodOption[],
  selected: ReadonlySet<PasskeyMethodId>,
  registeredIds: ReadonlySet<PasskeyMethodId>
): PasskeyMethodOption[] {
  const planned: PasskeyMethodOption[] = [];
  const seenGroups = new Set<PasskeyRegistrationGroup>();
  for (const method of methods) {
    if (method.rowKind !== "selectable" || !method.registrationGroup) continue;
    if (!selected.has(method.id)) continue;
    if (registeredIds.has(method.id)) continue;
    if (seenGroups.has(method.registrationGroup)) continue;
    planned.push(method);
    seenGroups.add(method.registrationGroup);
  }
  return planned;
}

export function isPasskeyMethodRegistered(
  method: PasskeyMethodOption,
  registeredIds: ReadonlySet<PasskeyMethodId>
): boolean {
  return method.rowKind === "selectable" && registeredIds.has(method.id);
}

export type SettingsPasskeyAddId = "platform" | "security-key" | "hybrid";

export interface SettingsPasskeyAddOption {
  id: SettingsPasskeyAddId;
  labelKey: string;
  subtitleKey?: string;
  hints: ("client-device" | "security-key" | "hybrid")[];
}

async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  return (
    typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function" &&
    (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  );
}

/** Platform passkey (Touch ID, Windows Hello, etc.) — not a security key or phone. */
export function resolvePasskeyKind(passkey: StoredPasskey): PasskeyKind {
  if (passkey.kind) return passkey.kind;
  const tr = passkey.transports ?? [];
  if (tr.includes("usb") || tr.includes("nfc") || tr.includes("ble")) {
    return "security-key";
  }
  if (tr.includes("hybrid") && !tr.includes("internal")) {
    return "hybrid";
  }
  const label = passkey.label?.trim() ?? "";
  if (
    /phone|휴대폰|手机|スマホ|téléphone|telefon|teléfono|telefono|ponsel/i.test(
      label,
    )
  ) {
    return "hybrid";
  }
  if (/security key|보안 키|security-key|yubikey|llave de seguridad|clé de sécurité|sicherheitsschlüssel/i.test(label)) {
    return "security-key";
  }
  return "platform";
}

export function isPlatformPasskey(passkey: StoredPasskey): boolean {
  return resolvePasskeyKind(passkey) === "platform";
}

export function isHybridPasskey(passkey: StoredPasskey): boolean {
  return resolvePasskeyKind(passkey) === "hybrid";
}

function hasPasskeyKind(
  passkeys: StoredPasskey[],
  kind: PasskeyKind,
): boolean {
  return passkeys.some((pk) => resolvePasskeyKind(pk) === kind);
}

/** Options for adding passkeys from Settings (platform, security key, phone). */
export async function getSettingsPasskeyAddOptions(
  existing: StoredPasskey[] = [],
): Promise<SettingsPasskeyAddOption[]> {
  const options: SettingsPasskeyAddOption[] = [];

  if (
    (await isPlatformAuthenticatorAvailable()) &&
    !hasPasskeyKind(existing, "platform")
  ) {
    options.push({
      id: "platform",
      labelKey: "setup.passkeyDeviceTitle",
      subtitleKey: "settings.passkeysAddPlatformHint",
      hints: ["client-device"],
    });
  }

  if (!hasPasskeyKind(existing, "hybrid")) {
    options.push({
      id: "hybrid",
      labelKey: "setup.passkeyMethodPhone",
      subtitleKey: "settings.passkeysAddPhoneHint",
      hints: ["hybrid"],
    });
  }

  if (!hasPasskeyKind(existing, "security-key")) {
    options.push({
      id: "security-key",
      labelKey: "setup.passkeyMethodSecurityKey",
      subtitleKey: "settings.passkeysAddSecurityKeyHint",
      hints: ["security-key"],
    });
  }

  return options;
}
