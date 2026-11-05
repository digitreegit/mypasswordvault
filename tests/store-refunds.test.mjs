import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'mpv-refunds-'));
test.after(() => rm(temp, { recursive: true, force: true }));

const env = new Map(Object.entries({
  SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  APPLE_ISSUER_ID: 'issuer', APPLE_KEY_ID: 'key', APPLE_PRIVATE_KEY: 'pem',
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'sa@test', private_key: 'pem' }),
  STORE_SWEEP_SECRET: 'sweep-secret',
}));
let handler;
globalThis.Deno = { env: { get: k => env.get(k) }, serve: h => { handler = h; } };

// Minimal PostgREST builder over an in-memory user_entitlements table.
let rows = [];
function query() {
  let patch = null;
  const filters = [];
  let range = null;
  const q = {
    select() { return q; },
    update(p) { patch = p; return q; },
    eq(c, v) { filters.push(r => r[c] === v); return q; },
    in(c, vs) { filters.push(r => vs.includes(r[c])); return q; },
    is(c, v) { filters.push(r => (r[c] ?? null) === v); return q; },
    not(c, _op, v) { filters.push(r => (r[c] ?? null) !== v); return q; },
    range(a, b) { range = [a, b]; return q; },
    then(resolve) {
      let hit = rows.filter(r => filters.every(f => f(r)));
      if (range) hit = hit.slice(range[0], range[1] + 1);
      if (patch) for (const r of hit) Object.assign(r, patch);
      resolve({ data: hit.map(r => ({ ...r })), error: null });
    },
  };
  return q;
}
globalThis.__refundDb = { from: () => query() };

await (async () => {
  const outfile = join(temp, 'store-notifications.mjs');
  await build({ entryPoints: ['supabase/functions/store-notifications/index.ts'], outfile,
    bundle: true, platform: 'node', format: 'esm', plugins: [{ name: 'refund-test', setup(b) {
      b.onResolve({ filter: /^npm:/ }, ({ path }) => ({ path, namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => ({ contents: path.startsWith('npm:jose')
        // Only methods the real jose SignJWT has, so a call to a non-existent one fails here too.
        ? `export const importPKCS8 = async () => ({});
           export class SignJWT { constructor(p) { globalThis.__googleJwtPayload = p; }
             setProtectedHeader() { return this; } setIssuer() { return this; }
             setAudience() { return this; } setIssuedAt() { return this; } setExpirationTime() { return this; }
             async sign() { return 'jwt'; } }`
        : 'export const createClient = () => globalThis.__refundDb;' }));
    } }] });
  await import(pathToFileURL(outfile).href);
})();

const product = 'com.skyface.mypasswordvault.pro_lifetime';
const jws = p => `e30.${Buffer.from(JSON.stringify(p)).toString('base64url')}.sig`;
const appleTx = {}; // what the App Store Server API reports, by transaction id
let voided = [];
globalThis.fetch = async url => {
  const u = String(url);
  if (u.startsWith('https://oauth2.googleapis.com/')) return Response.json({ access_token: 'g' });
  if (u.includes('/voidedpurchases')) return Response.json({ voidedPurchases: voided });
  const id = decodeURIComponent(u.split('/transactions/')[1] ?? '');
  const tx = appleTx[id];
  return tx ? Response.json({ signedTransactionInfo: jws(tx) }) : new Response('{}', { status: 404 });
};

const tx = (id, extra = {}) => ({ transactionId: id, originalTransactionId: id,
  bundleId: 'com.skyface.mypasswordvault', productId: product, ...extra });
const notify = (type, postedTx) => handler(new Request('https://fn.test', { method: 'POST',
  body: JSON.stringify({ signedPayload: jws({ notificationType: type,
    data: { environment: 'Production', signedTransactionInfo: jws(postedTx) } }) }) }));
const sweep = (secret, body = {}) => handler(new Request('https://fn.test', { method: 'POST',
  headers: { 'x-mpv-sweep-secret': secret }, body: JSON.stringify(body) }));
const row = id => rows.find(r => r.user_id === id);

test.beforeEach(() => {
  rows = [
    { user_id: 'ios-1', purchase_platform: 'ios', licensed: true, refunded_at: null, store_transaction_id: 'orig-1' },
    { user_id: 'ios-2', purchase_platform: 'ios', licensed: true, refunded_at: null, store_transaction_id: 'orig-2' },
    { user_id: 'play-1', purchase_platform: 'android', licensed: true, refunded_at: null, store_transaction_id: 'GPA.1' },
    // Paid on the web after an earlier store purchase: a store refund must not touch it.
    { user_id: 'web-1', purchase_platform: 'web', licensed: true, refunded_at: null, store_transaction_id: 'orig-9' },
  ];
  for (const k of Object.keys(appleTx)) delete appleTx[k];
  voided = [];
});

test('a forged refund notification cannot revoke a license', async () => {
  appleTx['orig-1'] = tx('orig-1');
  const res = await notify('REFUND', tx('orig-1', { revocationDate: 1 }));
  assert.equal(res.status, 200);
  assert.equal(row('ios-1').licensed, true);
});

test('an Apple refund revokes PRO and a reversed refund restores it', async () => {
  appleTx['orig-1'] = tx('orig-1', { revocationDate: 1 });
  assert.equal((await notify('REFUND', tx('orig-1'))).status, 200);
  assert.equal(row('ios-1').licensed, false);
  assert.ok(row('ios-1').refunded_at);
  assert.equal(row('ios-2').licensed, true);

  delete appleTx['orig-1'].revocationDate;
  assert.equal((await notify('REFUND_REVERSED', tx('orig-1'))).status, 200);
  assert.equal(row('ios-1').licensed, true);
  assert.equal(row('ios-1').refunded_at, null);
});

test('an unknown transaction is retried by Apple instead of being acknowledged', async () => {
  assert.equal((await notify('REFUND', tx('missing'))).status, 502);
});

test('the daily sweep needs its secret', async () => {
  assert.equal((await sweep('wrong')).status, 401);
  env.delete('STORE_SWEEP_SECRET');
  assert.equal((await sweep('')).status, 401);
  env.set('STORE_SWEEP_SECRET', 'sweep-secret');
});

test('the sweep revokes refunded App Store and Play purchases only', async () => {
  appleTx['orig-1'] = tx('orig-1');
  appleTx['orig-2'] = tx('orig-2', { revocationDate: 1 });
  appleTx['orig-9'] = tx('orig-9', { revocationDate: 1 });
  voided = [{ orderId: 'GPA.1', purchaseToken: 'tok' }];

  const dry = await (await sweep('sweep-secret', { dry_run: true })).json();
  assert.equal(dry.apple.revoked, 1);
  assert.equal(dry.google.revoked, 1);
  assert.ok(rows.every(r => r.licensed));

  const res = await sweep('sweep-secret');
  assert.equal(res.status, 200);
  assert.deepEqual(rows.filter(r => !r.licensed).map(r => r.user_id).sort(), ['ios-2', 'play-1']);
  assert.equal(row('web-1').licensed, true);
  assert.equal(globalThis.__googleJwtPayload?.scope, 'https://www.googleapis.com/auth/androidpublisher');
});
