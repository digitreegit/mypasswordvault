import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Vite dev serves the marketing page at `/` and the React shell at `/app/`.
 * Pointing the WebView at the origin only shows the landing page — native dev
 * should load `/app/` unless CAPACITOR_DEV_SERVER_USE_ROOT=1.
 */
function resolveCapacitorDevServerUrl(raw: string): string {
  if (process.env.CAPACITOR_DEV_SERVER_USE_ROOT === "1") {
    return raw.trim().replace(/\/?$/, "/");
  }
  const s = raw.trim().replace(/\/+$/, "");
  if (/\/app$/i.test(s)) return `${s}/`;
  if (s.includes("/app/")) return s.endsWith("/") ? s : `${s}/`;
  return `${s}/app/`;
}

const devServer = process.env.CAPACITOR_DEV_SERVER?.trim();

const config: CapacitorConfig = {
  appId: "com.skyface.mypasswordvault",
  appName: "My Password Vault",
  webDir: "dist-capacitor",
  server: {
    androidScheme: "https",
    /** WebAuthn requires https:// origin — default `capacitor://` is rejected on iOS. */
    iosScheme: "https",
    /** Must match rpId + Associated Domains + AASA on the live site. */
    hostname: "mypasswordvault.app",
    ...(devServer
      ? { url: resolveCapacitorDevServerUrl(devServer), cleartext: true }
      : {}),
  },
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "automatic",
    scrollEnabled: false,
    scheme: "My Password Vault",
  },
};

export default config;
