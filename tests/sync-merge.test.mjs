import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import 'fake-indexeddb/auto';

const USER = 'user-1';
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};

const temp = await mkdtemp(join(tmpdir(), 'mpv-sync-'));
test.after(() => rm(temp, { recursive: true, force: true }));

// user_vaults rows with updated_at compare-and-swap, like PostgREST + Postgres.
const table = { rows: new Map(), clock: 0, beforeUpdate: null,
  get row() { return this.rows.get(USER) ?? null; },
  set row(v) { if (v) this.rows.set(USER, v); else this.rows.delete(USER); } };
const stamp = () => `t${++table.clock}`;
globalThis.__testSupabase = {
  from() { return {
    select() { return { eq(_col, uid) { return {
      async maybeSingle() {
        const r = table.rows.get(uid);
        return { data: r ? { vault_backup: r.vault_backup, updated_at: r.updated_at } : null, error: null };
      },
    }; } }; },
    async insert(rec) {
      if (table.rows.has(rec.user_id)) return { error: { code: '23505', message: 'duplicate key' } };
      table.rows.set(rec.user_id, { vault_backup: rec.vault_backup, updated_at: stamp() });
      return { error: null };
    },
    async upsert(rec) { table.rows.set(rec.user_id, { vault_backup: rec.vault_backup, updated_at: stamp() }); return { error: null }; },
    update(rec) { return { eq(_col, uid) { return { eq(_c, expected) { return {
      async select() {
        if (table.beforeUpdate) { const hook = table.beforeUpdate; table.beforeUpdate = null; hook(); }
        const r = table.rows.get(uid);
        if (!r || r.updated_at !== expected) return { data: [], error: null };
        table.rows.set(uid, { vault_backup: rec.vault_backup, updated_at: stamp() });
        return { data: [{ user_id: uid }], error: null };
      },
    }; } }; } }; },
    delete() { return { async eq(_col, uid) { table.rows.delete(uid); return { error: null }; } }; },
  }; },
};

async function bundle(name, source, plugins = []) {
  const outfile = join(temp, `${name}.mjs`);
  await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'ts' },
    outfile, bundle: true, platform: 'node', format: 'esm',
    define: { 'import.meta.env': '{}' }, plugins });
  return import(pathToFileURL(outfile).href);
}
const lib = await bundle('sync', `
  export * from './src/lib/cloudVault';
  export * from './src/lib/storage';
  export * from './src/lib/vaultMerge';
  export * from './src/lib/vaultBackup';
  export * from './src/lib/crypto';
  export * from './src/lib/entryCrypto';
`, [{ name: 'sync-test', setup(b) {
  b.onResolve({ filter: /\/supabaseClient$/ }, () => ({ path: 'supabase', namespace: 'mock' }));
  b.onResolve({ filter: /\/passkey$/ }, () => ({ path: 'passkey', namespace: 'mock' }));
  b.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'supabase'
    ? 'export function getSupabase() { return globalThis.__testSupabase; }'
    : 'export function vaultPasskeysIndicateDifferentAccount() { return false; }' }));
} }]);

const key = await lib.importAesGcmKey(lib.randomBytes(32));
const secret = site => ({ categoryId: '', site, url: '', username: 'u', password: 'p', notes: '', memo: '' });
const entry = async (id, t) => lib.buildEncryptedEntryRow(key, id, t, secret(`${id}@${t}`));
const meta = { id: 'vault', salt: lib.toBase64(lib.newSalt()),
  verifier: await lib.encryptString(key, lib.VERIFIER_PLAINTEXT),
  totpSecret: await lib.encryptString(key, ''), totpLabel: '',
  autoLockMinutes: 5, createdAt: 1, updatedAt: 1, cloudUserId: USER };
const ids = entries => entries.map(e => `${e.id}@${e.updatedAt}`).sort();
const remoteSnapshot = () => lib.parseVaultBackup(table.row.vault_backup);
const otherDeviceWrites = (m, entries) => {
  table.row = { vault_backup: lib.buildVaultBackupJson(m, entries), updated_at: stamp() };
};

test('merge keeps concurrent edits to different entries', async () => {
  const [a1, b1, a2, b2] = [await entry('a', 1), await entry('b', 1), await entry('a', 2), await entry('b', 3)];
  const base = lib.syncBaseOf({ meta, entries: [a1, b1] });
  const merged = lib.mergeVaultSnapshots({ meta, entries: [a2, b1] }, { meta, entries: [a1, b2] }, base);
  assert.deepEqual(ids(merged.entries), ['a@2', 'b@3']);
});

test('merge propagates deletions but an edit beats a concurrent delete', async () => {
  const [a1, b1, c1, a5] = [await entry('a', 1), await entry('b', 1), await entry('c', 4), await entry('a', 5)];
  const base = lib.syncBaseOf({ meta, entries: [a1, b1] });
  // Remote deleted b; local deleted a while remote edited it; local added c.
  const merged = lib.mergeVaultSnapshots({ meta, entries: [b1, c1] }, { meta, entries: [a5] }, base);
  assert.deepEqual(ids(merged.entries), ['a@5', 'c@4']);
});

test('without a sync base nothing is dropped', async () => {
  const [a1, b1] = [await entry('a', 1), await entry('b', 1)];
  const merged = lib.mergeVaultSnapshots({ meta, entries: [a1] }, { meta, entries: [b1] }, null);
  assert.deepEqual(ids(merged.entries), ['a@1', 'b@1']);
});

test('snapshots from different data keys are never mixed', async () => {
  const otherKey = await lib.importAesGcmKey(lib.randomBytes(32));
  const other = { ...meta, verifier: await lib.encryptString(otherKey, lib.VERIFIER_PLAINTEXT) };
  assert.equal(lib.mergeVaultSnapshots({ meta, entries: [] }, { meta: other, entries: [] }, null), null);
});

test('meta follows the side that changed since the last sync', () => {
  const base = lib.syncBaseOf({ meta, entries: [] });
  const remoteMeta = { ...meta, autoLockMinutes: 10, updatedAt: 2 };
  // A stale device with a newer timestamp (entry edit bump) must not revert the remote change.
  const localMeta = { ...meta, updatedAt: 9 };
  assert.equal(lib.mergeVaultSnapshots({ meta: localMeta, entries: [] }, { meta: remoteMeta, entries: [] }, base).meta.autoLockMinutes, 10);
});

test('push merges another device’s edits instead of overwriting them', async () => {
  table.row = null; store.clear();
  const [a1, b1] = [await entry('a', 1), await entry('b', 1)];
  await lib.replaceVaultSnapshot(meta, [a1, b1]);
  assert.equal(await lib.pushVaultBackupToCloud(USER), 'local_pushed');

  // Other device edits b and adds d; this device edits a before it has pulled.
  otherDeviceWrites(meta, [a1, await entry('b', 5), await entry('d', 5)]);
  await lib.putEntry(await entry('a', 6));
  assert.equal(await lib.pushVaultBackupToCloud(USER), 'remote_applied');

  assert.deepEqual(ids(remoteSnapshot().entries), ['a@6', 'b@5', 'd@5']);
  assert.deepEqual(ids(await lib.listEntries()), ['a@6', 'b@5', 'd@5']);
});

test('a deletion on another device removes the entry here', async () => {
  const before = remoteSnapshot();
  otherDeviceWrites(before.meta, before.entries.filter(e => e.id !== 'd'));
  assert.equal(await lib.reconcileCloudVault(USER), 'remote_applied');
  assert.deepEqual(ids(await lib.listEntries()), ['a@6', 'b@5']);
});

test('a write from another device between read and write is merged, not lost', async () => {
  await lib.putEntry(await entry('a', 7));
  table.beforeUpdate = () => {
    const current = remoteSnapshot();
    otherDeviceWrites(current.meta, [...current.entries, { ...current.entries[0], id: 'e', updatedAt: 8 }]);
  };
  await lib.pushVaultBackupToCloud(USER);
  assert.deepEqual(ids(remoteSnapshot().entries), ['a@7', 'b@5', 'e@8']);
  assert.deepEqual(ids(await lib.listEntries()), ['a@7', 'b@5', 'e@8']);
});

test('first sync after updating applies remote deletions unless a push is outstanding', async () => {
  const [a1, b1] = [await entry('a', 1), await entry('b', 1)];
  for (const pending of [false, true]) {
    store.clear();
    if (pending) store.set('mpv_cloud_sync_pending', JSON.stringify({ [USER]: true }));
    await lib.replaceVaultSnapshot(meta, [a1, b1]);
    otherDeviceWrites(meta, [a1]);
    await lib.reconcileCloudVault(USER);
    assert.deepEqual(ids(await lib.listEntries()), pending ? ['a@1', 'b@1'] : ['a@1']);
  }
});

test('applying a merged snapshot never clobbers an edit made meanwhile', async () => {
  await lib.replaceVaultSnapshot(meta, [await entry('a', 7), await entry('b', 5), await entry('e', 8)]);
  const read = await lib.readVaultSnapshot();
  await lib.putEntry(await entry('b', 20));
  const next = { meta: read.meta, entries: read.entries.filter(e => e.id !== 'b') };
  assert.equal(await lib.applyVaultSnapshotChanges(read, next), false);
  assert.deepEqual(ids(await lib.listEntries()), ['a@7', 'b@20', 'e@8']);
});

test('switching accounts keeps the first account’s unsynced edits until it signs back in', async () => {
  const OTHER = 'user-2';
  store.clear(); table.rows.clear();
  const [a1, b1] = [await entry('a', 1), await entry('b', 1)];
  await lib.replaceVaultSnapshot(meta, [a1, b1]);
  assert.equal(await lib.pushVaultBackupToCloud(USER), 'local_pushed');

  // Offline edit that never reached the cloud, then another account signs in here.
  await lib.putEntry(await entry('a', 9));
  store.set('mpv_cloud_sync_pending', JSON.stringify({ [USER]: true }));
  const otherMeta = { ...meta, cloudUserId: OTHER };
  table.rows.set(OTHER, { vault_backup: lib.buildVaultBackupJson(otherMeta, [await entry('z', 1)]), updated_at: stamp() });
  assert.equal(await lib.reconcileCloudVault(OTHER), 'remote_applied');
  assert.deepEqual(ids(await lib.listEntries()), ['z@1']);

  // Meanwhile the first account changed on another device.
  otherDeviceWrites(meta, [a1, b1, await entry('c', 3)]);
  assert.equal(await lib.reconcileCloudVault(USER), 'remote_applied');
  assert.deepEqual(ids(await lib.listEntries()), ['a@9', 'b@1', 'c@3']);
  assert.deepEqual(ids(remoteSnapshot().entries), ['a@9', 'b@1', 'c@3']);
});

test('a fully synced vault is not kept on the device after an account switch', async () => {
  const OTHER = 'user-2';
  // USER is fully synced from the previous test; switching away must not leave a copy.
  assert.equal(await lib.reconcileCloudVault(OTHER), 'remote_applied');
  table.rows.delete(USER);
  await lib.reconcileCloudVault(USER);
  assert.deepEqual(await lib.listEntries(), []);
});
