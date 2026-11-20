/**
 * Small persisted bookkeeping for cloud sync, kept in localStorage (never in Firestore, so it
 * costs no reads or writes). Takes a storage object so it can be unit tested.
 */
import type { CollectionName } from './merge.ts';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export interface SyncMeta {
  /** Ids this device has seen in the cloud, per collection. */
  known: Partial<Record<CollectionName, string[]>>;
  /** Locally deleted ids whose cloud delete is not confirmed yet. */
  pendingDeletes: Partial<Record<CollectionName, string[]>>;
  /** A "reset all progress" is still being applied to the cloud. */
  pendingReset: boolean;
  /** First reconcile (migration) for this account on this device has finished. */
  migrated: boolean;
}

const META_PREFIX = 'aiecc_syncmeta_';
const OWNER_KEY = 'aiecc_owner_uid';
const BACKUP_PREFIX = 'aiecc_backup_';
const MAX_BACKUPS_PER_ACCOUNT = 2;

export function emptyMeta(): SyncMeta {
  return { known: {}, pendingDeletes: {}, pendingReset: false, migrated: false };
}

export function loadMeta(storage: StorageLike, uid: string): SyncMeta {
  try {
    const raw = storage.getItem(META_PREFIX + uid);
    if (!raw) return emptyMeta();
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      known: parsed.known && typeof parsed.known === 'object' ? parsed.known : {},
      pendingDeletes: parsed.pendingDeletes && typeof parsed.pendingDeletes === 'object' ? parsed.pendingDeletes : {},
      pendingReset: Boolean(parsed.pendingReset),
      migrated: Boolean(parsed.migrated),
    };
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(storage: StorageLike, uid: string, meta: SyncMeta): boolean {
  try {
    storage.setItem(META_PREFIX + uid, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function readOwner(storage: StorageLike): string | null {
  try {
    return storage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function writeOwner(storage: StorageLike, uid: string): void {
  try {
    storage.setItem(OWNER_KEY, uid);
  } catch {
    // Best effort: without an owner marker the account-switch guard simply does not trigger.
  }
}

export interface BackupInfo {
  key: string;
  createdAt: string;
  bytes: number;
  reason: string;
}

function backupKey(uid: string, createdAtIso: string, reason: string): string {
  return `${BACKUP_PREFIX}${uid}__${reason}__${createdAtIso}`;
}

export function listBackups(storage: StorageLike, uid?: string): BackupInfo[] {
  const out: BackupInfo[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith(BACKUP_PREFIX)) continue;
    const [owner, reason, createdAt] = key.slice(BACKUP_PREFIX.length).split('__');
    if (uid && owner !== uid) continue;
    out.push({ key, createdAt: createdAt || '', reason: reason || '', bytes: (storage.getItem(key) || '').length });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Stores a copy of the raw local state before it can be changed by a sync. The copy is read
 * back and compared; if that fails the caller must NOT continue (no silent data loss).
 */
export function createBackup(
  storage: StorageLike,
  ownerUid: string,
  rawState: string,
  reason: 'premigration' | 'otheraccount',
  nowIso: string
): { ok: true; key: string } | { ok: false; error: string } {
  const key = backupKey(ownerUid, nowIso, reason);
  try {
    storage.setItem(key, rawState);
    if (storage.getItem(key) !== rawState) {
      storage.removeItem(key);
      return { ok: false, error: 'Backup verification failed.' };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not write backup.' };
  }
  // Keep only the newest few backups per account to bound storage use.
  const all = listBackups(storage, ownerUid);
  for (const old of all.slice(MAX_BACKUPS_PER_ACCOUNT)) {
    try {
      storage.removeItem(old.key);
    } catch {
      // ignore
    }
  }
  return { ok: true, key };
}
