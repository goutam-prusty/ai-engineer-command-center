import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  createBackup,
  listBackups,
  loadMeta,
  readOwner,
  saveMeta,
  writeOwner,
  type StorageLike,
} from '../src/lib/sync/meta.ts';

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  failWrites = false;
  corruptReads = false;
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) {
    const v = this.data.get(k) ?? null;
    return this.corruptReads && v !== null && k.startsWith('aiecc_backup_') ? v + 'x' : v;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string) { this.data.delete(k); }
}

describe('sync meta', () => {
  test('round-trips and survives corrupt JSON', () => {
    const s = new MemoryStorage();
    const meta = loadMeta(s, 'u1');
    meta.known.topicProgress = ['a', 'b'];
    meta.pendingDeletes.studySessions = ['s1'];
    meta.pendingReset = true;
    meta.migrated = true;
    assert.equal(saveMeta(s, 'u1', meta), true);
    assert.deepEqual(loadMeta(s, 'u1'), meta);
    s.setItem('aiecc_syncmeta_u2', '{not json');
    assert.equal(loadMeta(s, 'u2').migrated, false);
  });

  test('meta is per account', () => {
    const s = new MemoryStorage();
    const m = loadMeta(s, 'u1');
    m.migrated = true;
    saveMeta(s, 'u1', m);
    assert.equal(loadMeta(s, 'u2').migrated, false);
  });

  test('owner marker', () => {
    const s = new MemoryStorage();
    assert.equal(readOwner(s), null);
    writeOwner(s, 'u1');
    assert.equal(readOwner(s), 'u1');
  });
});

describe('safety backups', () => {
  test('creates a verified backup that can be listed and read back', () => {
    const s = new MemoryStorage();
    const raw = JSON.stringify({ hello: 'world' });
    const res = createBackup(s, 'u1', raw, 'premigration', '2026-01-01T00:00:00.000Z');
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(s.getItem(res.key), raw);
    const list = listBackups(s, 'u1');
    assert.equal(list.length, 1);
    assert.equal(list[0].reason, 'premigration');
  });

  test('fails closed when storage rejects the write (caller must not continue syncing)', () => {
    const s = new MemoryStorage();
    s.failWrites = true;
    const res = createBackup(s, 'u1', '{}', 'premigration', '2026-01-01T00:00:00.000Z');
    assert.equal(res.ok, false);
  });

  test('fails closed when the read-back does not match', () => {
    const s = new MemoryStorage();
    s.corruptReads = true;
    const res = createBackup(s, 'u1', '{"a":1}', 'premigration', '2026-01-01T00:00:00.000Z');
    assert.equal(res.ok, false);
    assert.equal(listBackups(s, 'u1').length, 0);
  });

  test('keeps only the newest two backups per account, and never touches other accounts', () => {
    const s = new MemoryStorage();
    for (let i = 1; i <= 4; i++) {
      createBackup(s, 'u1', `{"n":${i}}`, 'premigration', `2026-01-0${i}T00:00:00.000Z`);
    }
    createBackup(s, 'u2', '{"other":true}', 'premigration', '2026-01-01T00:00:00.000Z');
    const mine = listBackups(s, 'u1');
    assert.equal(mine.length, 2);
    assert.deepEqual(mine.map((b) => b.createdAt), ['2026-01-04T00:00:00.000Z', '2026-01-03T00:00:00.000Z']);
    assert.equal(listBackups(s, 'u2').length, 1);
  });
});
