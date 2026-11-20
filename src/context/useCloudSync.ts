/**
 * Cloud sync controller (Firebase Auth user -> Cloud Firestore), local-first.
 *
 * - localStorage stays the source the UI renders from; Firestore is mirrored in both directions.
 * - Real-time listeners (with persistent offline cache) deliver other devices' changes.
 * - Newest `updatedAt` wins; deletions propagate; nothing is overwritten without a local backup.
 * - Writes are coalesced (typing in a notes box = one write) to stay inside Spark free quotas.
 * - A "reconcile" pass (zero reads: it uses the in-memory snapshots) pushes any local-only or
 *   newer records, which doubles as the first-login migration and the retry mechanism for
 *   writes that failed or never left the device.
 */
import type { User } from 'firebase/auth';
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppDataState, UserProfile } from '../types';
import { describeFirestoreError, errorCode, isFirebaseConfigured, missingFirebaseEnv } from '../lib/firebase';
import {
  CollectionSnapshot,
  deleteRecord,
  ProfileSnapshot,
  purgeAllCollections,
  subscribeUser,
  waitForWrites,
  writeProfile,
  writeRecord,
} from '../lib/sync/cloud';
import {
  applyToState,
  CollectionName,
  collectionToMap,
  hasLocalProgress,
  planProfile,
  planReconcile,
  selectNewerCloud,
  SHAPES,
  shapeByName,
} from '../lib/sync/merge';
import { BackupInfo, createBackup, emptyMeta, listBackups, loadMeta, readOwner, saveMeta, SyncMeta, writeOwner } from '../lib/sync/meta';
import { nowIso } from '../lib/util';

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'error' | 'offline';
type ToastType = 'info' | 'success' | 'warning';

const WRITE_DELAY_MS = 1000; // coalesce rapid edits of the same record into one write
const PROFILE_GATE_TIMEOUT_MS = 3500; // never keep the onboarding dialog hidden longer than this
const FOCUS_RECHECK_MS = 30_000;

const BACKUP_FAILED_MESSAGE =
  'Cloud sync is paused because a safety backup of your local data could not be saved (browser storage may be full or blocked). Use Settings → Export backup, free some space, then press Sync.';
const RULES_HINT =
  'Cloud access was denied. Publish the Firestore security rules from this repository (firestore.rules) in the Firebase Console, then sign in again.';

interface Params {
  user: User | null;
  authReady: boolean;
  stateRef: MutableRefObject<AppDataState>;
  setState: Dispatch<SetStateAction<AppDataState>>;
  storageKey: string;
  /** Replace local state with a fresh one (must also update stateRef synchronously). */
  resetLocalState: () => void;
  /** A cloud profile was applied locally. `first` = first application in this session. */
  onCloudProfile: (profile: UserProfile, first: boolean) => void;
  pushToast: (message: string, type?: ToastType) => void;
}

interface QueueItem {
  timer: ReturnType<typeof setTimeout>;
  kind: 'profile' | 'record';
  name?: CollectionName;
  id?: string;
}

export function useCloudSync(params: Params) {
  const { user, authReady, stateRef, setState, resetLocalState } = params;
  const canSync = Boolean(isFirebaseConfigured && user && user.emailVerified);
  const uid = canSync && user ? user.uid : null;

  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [cloudReady, setCloudReady] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [backupsVersion, setBackupsVersion] = useState(0);

  const uidRef = useRef<string | null>(null);
  const metaRef = useRef<SyncMeta>(emptyMeta());
  const cloudMapsRef = useRef(new Map<CollectionName, Map<string, unknown>>());
  const cloudProfileRef = useRef<UserProfile | null>(null);
  const loadedRef = useRef(new Set<string>());
  const reconciledRef = useRef(false);
  const forceLocalRef = useRef(false);
  const profileAppliedRef = useRef(false);
  const queueRef = useRef(new Map<string, QueueItem>());
  const errorKindRef = useRef<'write' | 'listen' | null>(null);
  const lastWarnRef = useRef(0);
  const lastRecheckRef = useRef(0);
  const runReconcileRef = useRef<(forceLocal: boolean) => number>(() => 0);

  const callbacksRef = useRef({ pushToast: params.pushToast, onCloudProfile: params.onCloudProfile });
  callbacksRef.current = { pushToast: params.pushToast, onCloudProfile: params.onCloudProfile };

  /* ---------- meta persistence ---------- */

  const persistMeta = useCallback(() => {
    const owner = uidRef.current;
    if (owner) saveMeta(window.localStorage, owner, metaRef.current);
  }, []);

  const markKnown = useCallback(
    (name: CollectionName, id: string) => {
      const set = new Set(metaRef.current.known[name] ?? []);
      if (set.has(id)) return;
      set.add(id);
      metaRef.current.known[name] = Array.from(set);
      persistMeta();
    },
    [persistMeta]
  );

  const clearPendingDelete = useCallback(
    (name: CollectionName, id: string) => {
      const next = (metaRef.current.pendingDeletes[name] ?? []).filter((x) => x !== id);
      metaRef.current.pendingDeletes[name] = next;
      persistMeta();
    },
    [persistMeta]
  );

  /* ---------- tracked writes ---------- */

  const reportWriteError = useCallback((err: unknown, scope: string, appendOnly: boolean) => {
    const code = errorCode(err);
    if (code === 'permission-denied') {
      // Append-only records that already exist are rejected by design. For other records the
      // server refused a stale (older than cloud) or invalid write; the newer cloud version
      // arrives through the listener.
      if (appendOnly) return;
      console.warn(`[sync] write rejected: ${scope}`, err);
      const now = Date.now();
      if (now - lastWarnRef.current > 30_000) {
        lastWarnRef.current = now;
        callbacksRef.current.pushToast(describeFirestoreError(err), 'info');
      }
      return;
    }
    // Network trouble is retried by the SDK / the next reconcile pass.
    if (['unavailable', 'cancelled', 'aborted', 'deadline-exceeded'].includes(code)) return;
    console.error(`[sync] ${scope} failed`, err);
    errorKindRef.current = 'write';
    setSyncError(describeFirestoreError(err));
  }, []);

  const trackWrite = useCallback(
    async (scope: string, appendOnly: boolean, op: () => Promise<void>) => {
      setPendingCount((n) => n + 1);
      try {
        await op();
        setLastSyncedAt(nowIso());
        if (errorKindRef.current === 'write') {
          errorKindRef.current = null;
          setSyncError(null);
        }
      } catch (err) {
        reportWriteError(err, scope, appendOnly);
      } finally {
        setPendingCount((n) => n - 1);
      }
    },
    [reportWriteError]
  );

  /* ---------- write queue (coalescing) ---------- */

  const flushKey = useCallback(
    async (key: string) => {
      const item = queueRef.current.get(key);
      if (!item) return;
      clearTimeout(item.timer);
      queueRef.current.delete(key);
      const currentUid = uidRef.current;
      if (!currentUid) return;
      const state = stateRef.current;

      if (item.kind === 'profile') {
        const profile = state.profile;
        const createdAt = cloudProfileRef.current?.createdAt;
        await trackWrite('profile', false, () => writeProfile(currentUid, profile, { createdAt }));
        return;
      }
      const shape = shapeByName(item.name as CollectionName);
      const rec = collectionToMap(state, shape).get(item.id as string);
      if (!rec) return; // deleted in the meantime
      await trackWrite(key, shape.appendOnly, async () => {
        await writeRecord(currentUid, shape.name, rec);
        markKnown(shape.name, item.id as string);
      });
    },
    [markKnown, stateRef, trackWrite]
  );

  const flushAll = useCallback(() => {
    for (const key of Array.from(queueRef.current.keys())) void flushKey(key);
  }, [flushKey]);

  const enqueue = useCallback(
    (kind: 'profile' | 'record', name?: CollectionName, id?: string, delay = WRITE_DELAY_MS) => {
      if (!uidRef.current) return;
      const key = kind === 'profile' ? 'profile' : `${name}/${id}`;
      const prev = queueRef.current.get(key);
      if (prev) clearTimeout(prev.timer);
      const timer = setTimeout(() => void flushKey(key), delay);
      queueRef.current.set(key, { timer, kind, name, id });
    },
    [flushKey]
  );

  /*
   * Adapters used by the mutators. They only say "this record changed"; the latest local
   * version is read when the write is flushed, so its own `updatedAt` is what reaches the cloud.
   */
  const syncProfileToCloud = useCallback((_uid: string, _profile?: unknown) => enqueue('profile'), [enqueue]);
  const syncTopicToCloud = useCallback((_uid: string, r: { topicId: string }) => enqueue('record', 'topicProgress', r.topicId), [enqueue]);
  const syncBonusToCloud = useCallback((_uid: string, moduleId: string, ..._rest: unknown[]) => enqueue('record', 'bonusProgress', moduleId), [enqueue]);
  const syncResourceToCloud = useCallback((_uid: string, resourceId: string, ..._rest: unknown[]) => enqueue('record', 'resourceStates', resourceId), [enqueue]);
  const syncStudySessionToCloud = useCallback((_uid: string, s: { id: string }, _isNew?: boolean) => enqueue('record', 'studySessions', s.id), [enqueue]);
  const syncPracticeToCloud = useCallback((_uid: string, l: { exerciseId: string }) => enqueue('record', 'practiceLogs', l.exerciseId), [enqueue]);
  const syncProjectToCloud = useCallback((_uid: string, p: { id: string }, _isNew?: boolean) => enqueue('record', 'projects', p.id), [enqueue]);
  const syncWeakConceptToCloud = useCallback((_uid: string, w: { id: string }, _isNew?: boolean) => enqueue('record', 'weakConcepts', w.id), [enqueue]);
  const syncFlashcardToCloud = useCallback((_uid: string, cardId: string, ..._rest: unknown[]) => enqueue('record', 'flashcardStates', cardId), [enqueue]);
  const syncQuizAttemptToCloud = useCallback((_uid: string, a: { id: string }) => enqueue('record', 'quizAttempts', a.id, 250), [enqueue]);
  const syncJournalToCloud = useCallback((_uid: string, e: { id: string }, _isNew?: boolean) => enqueue('record', 'journalEntries', e.id), [enqueue]);
  const syncActivityToCloud = useCallback((_uid: string, l: { id: string }) => enqueue('record', 'activityLogs', l.id, 250), [enqueue]);

  /** Send queued edits and wait (bounded) for the server to acknowledge them, e.g. before sign-out. */
  const flushAndWait = useCallback(async () => {
    flushAll();
    await waitForWrites(4000);
  }, [flushAll]);

  /* ---------- deletes ---------- */

  const deleteCloudRecord = useCallback(
    (name: CollectionName, id: string) => {
      const key = `${name}/${id}`;
      const queued = queueRef.current.get(key);
      if (queued) {
        clearTimeout(queued.timer);
        queueRef.current.delete(key);
      }
      const active = uidRef.current;
      const owner = active ?? readOwner(window.localStorage);
      if (!owner) return; // never synced: nothing in the cloud to delete
      const meta = active ? metaRef.current : loadMeta(window.localStorage, owner);
      const set = new Set(meta.pendingDeletes[name] ?? []);
      set.add(id);
      meta.pendingDeletes[name] = Array.from(set);
      saveMeta(window.localStorage, owner, meta);
      if (active) {
        void trackWrite(key, false, async () => {
          await deleteRecord(active, name, id);
          clearPendingDelete(name, id);
        });
      }
      // Signed out: the pending delete is applied the next time this account signs in.
    },
    [clearPendingDelete, trackWrite]
  );

  /* ---------- reset ---------- */

  const finishReset = useCallback(
    async (currentUid: string) => {
      await trackWrite('reset', false, async () => {
        await purgeAllCollections(currentUid);
        await writeProfile(currentUid, stateRef.current.profile, { createdAt: cloudProfileRef.current?.createdAt });
        metaRef.current.pendingReset = false;
        metaRef.current.pendingDeletes = {};
        metaRef.current.known = {};
        persistMeta();
      });
    },
    [persistMeta, stateRef, trackWrite]
  );

  /** Call after the local state has been reset. Clears this account's cloud data too. */
  const resetCloudData = useCallback(() => {
    for (const item of queueRef.current.values()) clearTimeout(item.timer);
    queueRef.current.clear();
    const active = uidRef.current;
    const owner = active ?? readOwner(window.localStorage);
    if (!owner) return;
    const meta = active ? metaRef.current : loadMeta(window.localStorage, owner);
    meta.pendingReset = true;
    meta.pendingDeletes = {};
    saveMeta(window.localStorage, owner, meta);
    if (active && reconciledRef.current) void finishReset(active);
    // Otherwise it runs at the next reconcile (after sign-in / once the server is reachable).
  }, [finishReset]);

  /* ---------- reconcile (migration + retry) ---------- */

  const runReconcile = useCallback(
    (forceLocal: boolean): number => {
      const currentUid = uidRef.current;
      if (!currentUid) return 0;
      const meta = metaRef.current;
      if (meta.pendingReset) {
        void finishReset(currentUid);
        return 1;
      }

      const local = stateRef.current;
      let ops = 0;
      const updates: { shape: (typeof SHAPES)[number]; take: Map<string, unknown>; remove: string[] }[] = [];

      for (const shape of SHAPES) {
        const localMap = collectionToMap(local, shape);
        const cloudMap = cloudMapsRef.current.get(shape.name) ?? new Map<string, unknown>();
        const plan = planReconcile({
          shape,
          local: localMap,
          cloud: cloudMap,
          knownCloudIds: new Set(meta.known[shape.name] ?? []),
          pendingDeletes: new Set(meta.pendingDeletes[shape.name] ?? []),
          forceLocal,
        });

        if (plan.takeCloud.length || plan.removeLocal.length) {
          updates.push({
            shape,
            take: new Map(plan.takeCloud.map((id) => [id, cloudMap.get(id)])),
            remove: plan.removeLocal,
          });
          ops += plan.takeCloud.length + plan.removeLocal.length;
        }

        for (const item of plan.push) {
          const rec = localMap.get(item.id);
          if (!rec) continue;
          ops++;
          const cloudRec = cloudMap.get(item.id) as { createdAt?: string } | undefined;
          const opts = { createdAt: cloudRec?.createdAt, stamp: item.restamp ? nowIso() : undefined };
          void trackWrite(`${shape.name}/${item.id}`, shape.appendOnly, async () => {
            await writeRecord(currentUid, shape.name, rec, opts);
            markKnown(shape.name, item.id);
          });
        }

        for (const id of plan.deleteCloud) {
          ops++;
          void trackWrite(`${shape.name}/${id}`, false, async () => {
            await deleteRecord(currentUid, shape.name, id);
            clearPendingDelete(shape.name, id);
          });
        }
      }

      if (updates.length) {
        setState((prev) =>
          updates.reduce(
            (acc, u) => applyToState(acc, u.shape, selectNewerCloud(collectionToMap(acc, u.shape), u.take as Map<string, unknown>, u.shape), u.remove),
            prev
          )
        );
      }

      const cloudProfile = cloudProfileRef.current;
      const action = planProfile({ local: local.profile, cloud: cloudProfile, forceLocal });
      if (action === 'takeCloud' && cloudProfile) {
        ops++;
        setState((prev) => ({ ...prev, profile: cloudProfile }));
        callbacksRef.current.onCloudProfile(cloudProfile, !profileAppliedRef.current);
        profileAppliedRef.current = true;
      } else if (action === 'push' || action === 'pushRestamp') {
        ops++;
        const profile = cloudProfile ? { ...local.profile, createdAt: cloudProfile.createdAt } : local.profile;
        if (cloudProfile) setState((prev) => ({ ...prev, profile: { ...prev.profile, createdAt: cloudProfile.createdAt } }));
        const opts = { createdAt: cloudProfile?.createdAt, stamp: action === 'pushRestamp' ? nowIso() : undefined };
        void trackWrite('profile', false, () => writeProfile(currentUid, profile, opts));
      }

      meta.migrated = true;
      persistMeta();
      writeOwner(window.localStorage, currentUid);
      reconciledRef.current = true;
      return ops;
    },
    [clearPendingDelete, finishReset, markKnown, persistMeta, setState, stateRef, trackWrite]
  );
  runReconcileRef.current = runReconcile;

  /* ---------- snapshot handlers ---------- */

  const markLoaded = useCallback((scope: string) => {
    loadedRef.current.add(scope);
    if (loadedRef.current.size < SHAPES.length + 1) return;
    setCloudReady(true);
    if (!reconciledRef.current) {
      const force = forceLocalRef.current;
      forceLocalRef.current = false;
      runReconcileRef.current(force);
      setLastSyncedAt(nowIso());
    }
  }, []);

  const handleProfile = useCallback(
    (snap: ProfileSnapshot) => {
      cloudProfileRef.current = snap.profile;
      if (!snap.fromCache) {
        setProfileResolved(true);
        markLoaded('profile');
      }
      if (metaRef.current.pendingReset || !snap.profile) return;
      const cloud = snap.profile;
      if (planProfile({ local: stateRef.current.profile, cloud }) === 'takeCloud') {
        setState((prev) => ({ ...prev, profile: cloud }));
        callbacksRef.current.onCloudProfile(cloud, !profileAppliedRef.current);
        profileAppliedRef.current = true;
      }
    },
    [markLoaded, setState, stateRef]
  );

  const handleCollection = useCallback(
    (snap: CollectionSnapshot) => {
      const { shape } = snap;
      cloudMapsRef.current.set(shape.name, snap.all);
      const meta = metaRef.current;

      if (!meta.pendingReset) {
        const incoming = new Map<string, unknown>();
        const removals: string[] = [];
        for (const c of snap.changes) {
          if (c.type === 'removed') {
            // Inside a limited window a "removed" only means it scrolled out of the newest-N.
            if (!shape.limit) removals.push(c.id);
          } else if (c.rec) {
            incoming.set(c.id, c.rec);
          }
        }
        if (incoming.size || removals.length) {
          setState((prev) =>
            applyToState(prev, shape, selectNewerCloud(collectionToMap(prev, shape), incoming, shape), removals)
          );
        }
      }

      const known = new Set(meta.known[shape.name] ?? []);
      for (const id of snap.all.keys()) known.add(id);
      if (!shape.limit) {
        for (const c of snap.changes) if (c.type === 'removed') known.delete(c.id);
      }
      meta.known[shape.name] = Array.from(known);
      persistMeta();

      if (!snap.fromCache) markLoaded(shape.name);
    },
    [markLoaded, persistMeta, setState]
  );

  const handleListenError = useCallback((err: unknown, scope: string) => {
    console.error(`[sync] listener error (${scope})`, err);
    errorKindRef.current = 'listen';
    setSyncError(errorCode(err) === 'permission-denied' ? RULES_HINT : describeFirestoreError(err));
  }, []);

  /* ---------- subscription lifecycle ---------- */

  useEffect(() => {
    if (!uid) {
      uidRef.current = null;
      setCloudReady(false);
      setProfileResolved(false);
      return;
    }

    const storage = window.localStorage;
    setSyncError(null);
    errorKindRef.current = null;
    setBlocked(false);
    setCloudReady(false);
    setProfileResolved(false);
    loadedRef.current = new Set();
    reconciledRef.current = false;
    profileAppliedRef.current = false;
    cloudMapsRef.current = new Map();
    cloudProfileRef.current = null;

    // Safety first: never let a sync touch local data that has no backup.
    const owner = readOwner(storage);
    const rawLocal = JSON.stringify(stateRef.current);
    if (owner && owner !== uid) {
      // This browser's data belongs to a different Google account: keep it, don't mix it in.
      if (hasLocalProgress(stateRef.current)) {
        const backup = createBackup(storage, owner, rawLocal, 'otheraccount', nowIso());
        if (!backup.ok) {
          setBlocked(true);
          errorKindRef.current = 'listen';
          setSyncError(BACKUP_FAILED_MESSAGE);
          return;
        }
        callbacksRef.current.pushToast(
          'This browser held data from a different Google account. It was backed up on this device and not mixed into this account.',
          'info'
        );
        setBackupsVersion((v) => v + 1);
      }
      resetLocalState();
      writeOwner(storage, uid);
    } else if (!loadMeta(storage, uid).migrated && hasLocalProgress(stateRef.current)) {
      const backup = createBackup(storage, uid, rawLocal, 'premigration', nowIso());
      if (!backup.ok) {
        setBlocked(true);
        errorKindRef.current = 'listen';
        setSyncError(BACKUP_FAILED_MESSAGE);
        return;
      }
      setBackupsVersion((v) => v + 1);
    }

    metaRef.current = loadMeta(storage, uid);
    uidRef.current = uid;

    const gateTimer = setTimeout(() => setProfileResolved(true), PROFILE_GATE_TIMEOUT_MS);
    const unsubscribe = subscribeUser(uid, {
      onProfile: handleProfile,
      onCollection: handleCollection,
      onError: handleListenError,
    });

    return () => {
      clearTimeout(gateTimer);
      flushAll();
      unsubscribe();
      uidRef.current = null;
    };
  }, [uid, epoch]);

  /* ---------- connectivity / visibility ---------- */

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      if (reconciledRef.current) setTimeout(() => runReconcileRef.current(false), 800);
    };
    const onOffline = () => setOnline(false);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushAll();
      } else if (reconciledRef.current && Date.now() - lastRecheckRef.current > FOCUS_RECHECK_MS) {
        lastRecheckRef.current = Date.now();
        runReconcileRef.current(false);
      }
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('pagehide', flushAll);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('pagehide', flushAll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushAll]);

  /* ---------- public actions ---------- */

  const syncNow = useCallback(async () => {
    if (!canSync) {
      callbacksRef.current.pushToast('Sign in with Google in Settings to enable cloud sync.', 'info');
      return;
    }
    flushAll();
    if (blocked || (syncError && !cloudReady)) {
      setEpoch((e) => e + 1); // tear down and reconnect
      callbacksRef.current.pushToast('Reconnecting to cloud…', 'info');
      return;
    }
    if (!reconciledRef.current) {
      callbacksRef.current.pushToast(
        online
          ? 'Still connecting to the cloud…'
          : 'You are offline. Changes are saved on this device and will sync when you reconnect.',
        'info'
      );
      return;
    }
    const ops = runReconcile(false);
    callbacksRef.current.pushToast(ops === 0 ? 'Already in sync.' : `Syncing ${ops} change${ops === 1 ? '' : 's'}…`, 'success');
  }, [blocked, canSync, cloudReady, flushAll, online, runReconcile, syncError]);

  /** After importing a backup: local data wins conflicts and is uploaded. */
  const requestForceReconcile = useCallback(() => {
    if (!uidRef.current) return;
    if (reconciledRef.current) runReconcileRef.current(true);
    else forceLocalRef.current = true;
  }, []);

  const localBackups: BackupInfo[] = useMemo(
    () => listBackups(window.localStorage),
    [backupsVersion]
  );

  const getBackupJson = useCallback((key: string) => window.localStorage.getItem(key), []);

  const syncStatus: SyncStatus = !canSync
    ? 'local_only'
    : blocked || syncError
      ? 'error'
      : !online
        ? 'offline'
        : !cloudReady || pendingCount > 0
          ? 'syncing'
          : 'synced';

  return {
    canSync,
    cloudConfigured: isFirebaseConfigured,
    missingFirebaseEnv,
    syncStatus,
    syncError,
    lastSyncedAt,
    pendingCount,
    /** False while a signed-in session is still loading its profile (avoids onboarding flash). */
    profileGateOpen: authReady && (!canSync || profileResolved),
    localBackups,
    getBackupJson,
    syncNow,
    flushAll,
    flushAndWait,
    requestForceReconcile,
    resetCloudData,
    deleteCloudRecord,
    syncProfileToCloud,
    syncTopicToCloud,
    syncBonusToCloud,
    syncResourceToCloud,
    syncStudySessionToCloud,
    syncPracticeToCloud,
    syncProjectToCloud,
    syncWeakConceptToCloud,
    syncFlashcardToCloud,
    syncQuizAttemptToCloud,
    syncJournalToCloud,
    syncActivityToCloud,
  };
}
