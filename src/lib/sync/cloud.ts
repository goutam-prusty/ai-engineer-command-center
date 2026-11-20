/**
 * Firestore access for cloud sync (the only sync file that talks to the Firebase SDK).
 *
 * Data model (unchanged): users/{uid} (profile) and users/{uid}/{collection}/{id}.
 * Timestamps are written by the client (the real edit time) so that offline edits keep
 * their true order; Firestore Security Rules bound them against server time and reject
 * writes that would overwrite a newer cloud version.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  waitForPendingWrites,
  writeBatch,
} from 'firebase/firestore';
import type { UserProfile } from '../../types';
import { db } from '../firebase';
import { CODECS, profileFromDoc, profileToDoc, WriteOptions } from './codecs';
import { CollectionName, CollectionShape, SHAPES } from './merge';

type Rec = any;

function requireDb() {
  if (!db) throw new Error('Cloud sync is not configured for this deployment.');
  return db;
}

/* ---------- writes ---------- */

export async function writeProfile(uid: string, profile: UserProfile, o: WriteOptions = {}): Promise<void> {
  await setDoc(doc(requireDb(), 'users', uid), profileToDoc(uid, profile, o));
}

export async function writeRecord(
  uid: string,
  name: CollectionName,
  rec: unknown,
  o: WriteOptions = {}
): Promise<void> {
  const shape = SHAPES.find((s) => s.name === name) as CollectionShape;
  const id = shape.idOf(rec);
  await setDoc(doc(requireDb(), 'users', uid, name, id), CODECS[name].toDoc(uid, rec, o));
}

export async function deleteRecord(uid: string, name: CollectionName, id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'users', uid, name, id));
}

/** Resolves when all local writes are acknowledged by the server, or after `timeoutMs` (e.g. offline). */
export async function waitForWrites(timeoutMs: number): Promise<void> {
  if (!db) return;
  await Promise.race([
    waitForPendingWrites(db).catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Deletes every document in all synced collections (used by "Reset all progress").
 * Reads and deletes are proportional to the number of stored documents (one-off).
 */
export async function purgeAllCollections(uid: string): Promise<void> {
  const database = requireDb();
  for (const shape of SHAPES) {
    for (let guard = 0; guard < 100; guard++) {
      const snap = await getDocs(query(collection(database, 'users', uid, shape.name), limit(400)));
      if (snap.empty) break;
      const batch = writeBatch(database);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

/* ---------- live subscription ---------- */

export interface CollectionSnapshot {
  shape: CollectionShape;
  /** Every document currently in the (possibly limited) result, decoded. */
  all: Map<string, Rec>;
  changes: { type: 'added' | 'modified' | 'removed'; id: string; rec: Rec | null }[];
  /** True while the data only comes from the local cache (server not reached yet). */
  fromCache: boolean;
}

export interface ProfileSnapshot {
  profile: UserProfile | null;
  fromCache: boolean;
}

export interface SubscribeHandlers {
  onProfile: (snap: ProfileSnapshot) => void;
  onCollection: (snap: CollectionSnapshot) => void;
  onError: (err: unknown, scope: string) => void;
}

/**
 * Real-time listeners for one user. After the first server snapshot Firestore only bills
 * one read per changed document, so an idle tab costs nothing. Activity logs and quiz
 * attempts listen to a bounded newest-N window.
 */
export function subscribeUser(uid: string, handlers: SubscribeHandlers): () => void {
  const database = requireDb();
  const unsubs: (() => void)[] = [];
  const opts = { includeMetadataChanges: true };

  unsubs.push(
    onSnapshot(
      doc(database, 'users', uid),
      opts,
      (snap) => {
        handlers.onProfile({
          profile: snap.exists() ? profileFromDoc(snap.data()) : null,
          fromCache: snap.metadata.fromCache,
        });
      },
      (err) => handlers.onError(err, 'profile')
    )
  );

  for (const shape of SHAPES) {
    const coll = collection(database, 'users', uid, shape.name);
    const q = shape.limit ? query(coll, orderBy('createdAt', 'desc'), limit(shape.limit)) : coll;
    const codec = CODECS[shape.name];
    unsubs.push(
      onSnapshot(
        q,
        opts,
        (snap) => {
          const all = new Map<string, Rec>();
          snap.docs.forEach((d) => {
            const rec = codec.fromDoc(d.id, d.data());
            if (rec) all.set(d.id, rec);
          });
          const changes = snap.docChanges().map((c) => ({
            type: c.type,
            id: c.doc.id,
            rec: c.type === 'removed' ? null : codec.fromDoc(c.doc.id, c.doc.data()),
          }));
          handlers.onCollection({ shape, all, changes, fromCache: snap.metadata.fromCache });
        },
        (err) => handlers.onError(err, shape.name)
      )
    );
  }

  return () => unsubs.forEach((u) => u());
}
