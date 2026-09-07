import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import 'fake-indexeddb/auto';

const temp = await mkdtemp(join(tmpdir(), 'mpv-security-'));
test.after(() => rm(temp, { recursive: true, force: true }));
async function bundle(name, source, plugins = []) {
  const outfile = join(temp, `${name}.mjs`);
  await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'ts' },
    outfile, bundle: true, platform: 'node', format: 'esm',
    define: { 'import.meta.env': '{}' }, plugins });
  return import(pathToFileURL(outfile).href);
}
const vault = await bundle('vault', `
  export * from './src/lib/crypto';
  export * from './src/lib/authV2';
  export * from './src/lib/entryCrypto';
  export * from './src/lib/storage';
  export * from './src/lib/vaultBackup';
`);
const key = await vault.importAesGcmKey(vault.randomBytes(32));
const otherKey = await vault.importAesGcmKey(vault.randomBytes(32));
const secret = { categoryId: 'folder', site: '은행', url: 'https://example.test',
  username: 'alice', password: 'Secret-123!', notes: 'note', memo: 'private' };
const row = await vault.buildEncryptedEntryRow(key, 'one', 1, secret);
const meta = { id: 'vault', salt: vault.toBase64(vault.newSalt()),
  verifier: await vault.encryptString(key, vault.VERIFIER_PLAINTEXT),
  totpSecret: await vault.encryptString(key, ''), totpLabel: '',
  autoLockMinutes: 5, createdAt: 1, updatedAt: 1, cloudUserId: 'owner-a' };

test('all entry secrets round-trip without plaintext fields at rest', async () => {
  assert.deepEqual(Object.keys(row).sort(), ['enc', 'id', 'updatedAt']);
  assert.deepEqual(await vault.decryptEntry(key, row), secret);
  assert.notEqual((await vault.buildEncryptedEntryRow(key, 'two', 1, secret)).enc, row.enc);
});
test('wrong keys and modified ciphertext fail instead of returning blank entries', async () => {
  await assert.rejects(vault.decryptEntry(otherKey, row));
  const bytes = vault.fromBase64(row.enc); bytes[20] ^= 1;
  await assert.rejects(vault.decryptEntry(key, { ...row, enc: vault.toBase64(bytes) }));
  await assert.rejects(vault.decryptEntry(otherKey, { id: 'legacy', updatedAt: 1,
    passwordEnc: await vault.encryptString(key, 'original password') }));
});
test('category ciphertext survives metadata updates while locked or during unlock', async () => {
  const categories = [{ id: 'folder', name: '개인 계정' }];
  const stored = await vault.encryptMetaCategories({ ...meta, categories }, key);
  const rewritten = await vault.encryptMetaCategories({ ...stored, categories: [] }, key);
  assert.equal(rewritten.categories, undefined);
  assert.equal(rewritten.categoriesEnc, stored.categoriesEnc);
  assert.deepEqual(await vault.decryptCategories(key, rewritten.categoriesEnc), categories);
  await assert.rejects(vault.decryptCategories(otherKey, rewritten.categoriesEnc));
});
test('valid legacy and v2 backups remain readable', async () => {
  assert.equal(vault.parseVaultBackup(vault.buildVaultBackupJson(meta, [row])).entries.length, 1);
  const material = await vault.createAuthV2Material('correct horse battery staple');
  const v2 = { ...meta, authVersion: 2, salt: vault.toBase64(material.salt),
    pbkdf2Iterations: material.iterations, passwordWrap: material.passwordWrap,
    verifier: await vault.encryptString(material.dataKey, vault.VERIFIER_PLAINTEXT) };
  assert.equal(vault.parseVaultBackup(vault.buildVaultBackupJson(v2, [])).meta.authVersion, 2);
  await vault.assertMasterPassword(v2, 'correct horse battery staple');
  await assert.rejects(vault.assertMasterPassword(v2, 'wrong password'));
});
test('malformed backups are rejected before storage mutation', () => {
  const valid = JSON.parse(vault.buildVaultBackupJson(meta, [row]));
  for (const mutate of [
    b => b.entries.push(b.entries[0]), b => b.entries[0].updatedAt = null,
    b => b.entries[0].enc = 'bad', b => b.meta.salt = 'bad',
    b => b.meta.pbkdf2Iterations = 2 ** 32, b => b.meta.autoLockMinutes = 'never',
    b => b.meta.authVersion = 99, b => b.meta.passkeys = [null],
    b => b.meta.cloudUserId = 12, b => b.meta.categories = {},
  ]) {
    const backup = structuredClone(valid); mutate(backup);
    assert.throws(() => vault.parseVaultBackup(JSON.stringify(backup)));
  }
});
test('untrusted KDF work factors are bounded before expensive derivation', async () => {
  await assert.rejects(vault.deriveKey('test', vault.newSalt(), 2 ** 32));
});
test('failed snapshot replacement rolls back clears and metadata writes', async () => {
  await vault.replaceVaultSnapshot(meta, [row]);
  await assert.rejects(vault.replaceVaultSnapshot({ ...meta, updatedAt: 2 }, [
    { id: 'valid', updatedAt: 2, enc: row.enc }, { updatedAt: 2, enc: row.enc },
  ]));
  assert.deepEqual(await vault.readVaultSnapshot(), { meta, entries: [row] });
  await vault.replaceVaultSnapshot({ ...meta, updatedAt: 3 }, []);
  assert.equal((await vault.readVaultSnapshot()).entries.length, 0);
});

const env = new Map();
globalThis.Deno = { env: { get: name => env.get(name) } };
// Stub only JWT signing; exercise the real verifier and its server-response boundary.
const apple = await bundle('apple', `export * from './supabase/functions/_shared/appleStoreVerify.ts';`, [{
  name: 'jose-test', setup(b) {
    b.onResolve({ filter: /^npm:jose$/ }, () => ({ path: 'jose', namespace: 'test' }));
    b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `
      export const importPKCS8 = async () => ({});
      export class SignJWT {
        setProtectedHeader() { return this; } setIssuer() { return this; }
        setAudience() { return this; } setIssuedAt() { return this; }
        setExpirationTime() { return this; } async sign() { return 'test-jwt'; }
      }` }));
  },
}]);
const product = 'com.skyface.mypasswordvault.pro_lifetime';
const payload = { transactionId: '123', bundleId: 'com.skyface.mypasswordvault', productId: product, environment: 'Sandbox' };
const jws = p => `e30.${Buffer.from(JSON.stringify(p)).toString('base64url')}.fake`;
test('forged sandbox and production JWS never grant without Apple server credentials', async () => {
  env.clear();
  for (const environment of ['Sandbox', 'Xcode', 'Production']) {
    assert.equal((await apple.verifyApplePurchase(jws({ ...payload, environment }), product)).ok, false);
  }
});
test('only authenticated Apple API responses can validate a client transaction hint', async () => {
  env.set('APPLE_ISSUER_ID', 'issuer'); env.set('APPLE_KEY_ID', 'key'); env.set('APPLE_PRIVATE_KEY', 'test');
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      assert.match(url, /^https:\/\/api\.storekit(?:-sandbox)?\.itunes\.apple\.com\//);
      return new Response(JSON.stringify({ signedTransactionInfo: jws(payload) }));
    };
    assert.equal((await apple.verifyApplePurchase(jws(payload), product)).ok, true);
    for (const invalid of [{ ...payload, bundleId: undefined }, { ...payload, productId: 'other' },
      { ...payload, revocationDate: 0 }]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ signedTransactionInfo: jws(invalid) }));
      assert.equal((await apple.verifyApplePurchase(jws(payload), product)).ok, false);
    }
    globalThis.fetch = async () => new Response('{}');
    assert.equal((await apple.verifyApplePurchase(jws(payload), product)).ok, false);
  } finally { globalThis.fetch = originalFetch; env.clear(); }
});

const remote = new Map();
const uploads = [];
globalThis.__testSupabase = {
  from() { return {
    select() { return { eq(_column, userId) { return {
      async maybeSingle() { return { data: remote.has(userId) ? { vault_backup: remote.get(userId) } : null, error: null }; },
    }; } }; },
    async upsert(record) { uploads.push(record); return { error: null }; },
  }; },
};
const cloud = await bundle('cloud', `
  export * from './src/lib/cloudVault';
  export * from './src/lib/storage';
`, [{ name: 'cloud-test', setup(b) {
  b.onResolve({ filter: /\/supabaseClient$/ }, () => ({ path: 'supabase', namespace: 'mock' }));
  b.onResolve({ filter: /\/passkey$/ }, () => ({ path: 'passkey', namespace: 'mock' }));
  b.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'supabase'
    ? 'export function getSupabase() { return globalThis.__testSupabase; }'
    : 'export function vaultPasskeysIndicateDifferentAccount() { return false; }' }));
} }]);
test('a delayed push cannot upload another account’s ciphertext', async () => {
  await cloud.replaceVaultSnapshot(meta, [row]); uploads.length = 0;
  assert.equal(await cloud.pushVaultBackupToCloud('owner-b'), false);
  assert.equal(uploads.length, 0);
  assert.equal((await cloud.getMeta()).cloudUserId, 'owner-a');
  assert.equal(await cloud.pushVaultBackupToCloud('owner-a'), true);
  assert.equal(uploads[0].user_id, 'owner-a');
});
test('invalid cloud data on account switch preserves the previous local vault', async () => {
  await cloud.replaceVaultSnapshot(meta, [row]);
  remote.set('owner-b', 'broken JSON');
  await assert.rejects(cloud.reconcileCloudVault('owner-b'));
  assert.deepEqual(await cloud.readVaultSnapshot(), { meta, entries: [row] });
  remote.clear();
});
test('invalid cloud data for the current account is not silently overwritten', async () => {
  await cloud.replaceVaultSnapshot(meta, [row]); uploads.length = 0;
  remote.set('owner-a', 'broken JSON');
  await assert.rejects(cloud.reconcileCloudVault('owner-a'));
  assert.equal(uploads.length, 0);
  remote.clear();
});

const checkout = await bundle('checkout', `export * from './supabase/functions/_shared/checkoutPayment.ts';`);
test('refunded or disputed Stripe sessions cannot regain a license through paid status', async () => {
  const session = { payment_status: 'paid', payment_intent: 'pi_test' };
  const charge = { refunded: false, amount_refunded: 0, disputed: false };
  const stripe = latest_charge => ({ paymentIntents: { retrieve: async () => ({ status: 'succeeded', latest_charge }) } });
  assert.equal(await checkout.checkoutPaymentIsActive(stripe(charge), session), true);
  for (const invalid of [{ ...charge, refunded: true }, { ...charge, amount_refunded: 100 },
    { ...charge, disputed: true }, null, 'unexpanded_charge']) {
    assert.equal(await checkout.checkoutPaymentIsActive(stripe(invalid), session), false);
  }
});

let resetHandler;
globalThis.Deno.serve = handler => { resetHandler = handler; };
let claims = 0, sends = 0, links = 0, allowReset = true, throttleError = null, redirect;
globalThis.__resetClient = {
  rpc: async () => { claims++; return { data: allowReset, error: throttleError }; },
  auth: { admin: { generateLink: async ({ options }) => {
    links++; redirect = options?.redirectTo;
    return { data: { properties: { action_link: 'https://example.test/recovery' } }, error: null };
  } } },
};
globalThis.__sendReset = async () => { sends++; };
await bundle('reset', `import './supabase/functions/send-password-reset/index.ts';`, [{
  name: 'reset-test', setup(b) {
    b.onResolve({ filter: /^https:/ }, () => ({ path: 'client', namespace: 'reset' }));
    b.onResolve({ filter: /\/sendBrandedResend.ts$/ }, () => ({ path: 'send', namespace: 'reset' }));
    b.onLoad({ filter: /.*/, namespace: 'reset' }, ({ path }) => ({ contents: path === 'client'
      ? 'export const createClient = () => globalThis.__resetClient;'
      : 'export const sendBrandedResend = (...args) => globalThis.__sendReset(...args);' }));
  },
}]);
test('password reset throttling fails closed before creating or sending recovery links', async () => {
  for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']) env.set(name, 'test');
  const request = body => resetHandler(new Request('https://example.test/reset', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  }));
  assert.equal((await request(null)).status, 200);
  assert.equal(claims, 0);
  allowReset = false;
  assert.equal((await request({ email: 'alice@example.test' })).status, 200);
  assert.equal(sends, 0); assert.equal(links, 0);
  throttleError = new Error('database down');
  assert.equal((await request({ email: 'alice@example.test' })).status, 503);
  assert.equal(sends, 0); assert.equal(links, 0);
  throttleError = null; allowReset = true;
  assert.equal((await request({ email: 'alice@example.test', redirectTo: 'https://attacker.test/' })).status, 200);
  assert.equal(redirect, 'https://mypasswordvault.app/app/');
  assert.equal(sends, 1); env.clear();
});
