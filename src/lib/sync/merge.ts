/**
 * Pure, framework-free sync logic (no Firebase / React imports) so it can be unit tested.
 *
 * Conflict policy: the record with the newest `updatedAt` wins (append-only records such
 * as quiz attempts and activity logs are never overwritten). Deletions are propagated using
 * a persisted set of "ids we have seen in the cloud" plus a set of locally pending deletes,
 * so a record deleted on one device is not resurrected by another device's stale local copy.
 */
import type {
  ActivityLogRecord,
  AppDataState,
  JournalEntryRecord,
  ProjectRecord,
  QuizAttemptRecord,
  UserProfile,
  WeakConceptRecord,
} from '../../types.ts';

export type CollectionName =
  | 'topicProgress'
  | 'bonusProgress'
  | 'resourceStates'
  | 'studySessions'
  | 'practiceLogs'
  | 'projects'
  | 'weakConcepts'
  | 'flashcardStates'
  | 'quizAttempts'
  | 'journalEntries'
  | 'activityLogs';

type AnyRecord = any;

export interface CollectionShape {
  name: CollectionName;
  stateKey: keyof AppDataState;
  kind: 'map' | 'list';
  idOf: (rec: AnyRecord) => string;
  /** Timestamp used for newest-wins comparison. */
  stampOf: (rec: AnyRecord) => string;
  /** Created once, never updated (quiz attempts, activity logs). */
  appendOnly: boolean;
  /** Listen to only the newest N documents (keeps reads inside the free quota). */
  limit?: number;
  /** Keep at most N records locally after a merge. */
  maxItems?: number;
  sort?: (a: AnyRecord, b: AnyRecord) => number;
}

const byUpdatedDesc = (a: ProjectRecord | WeakConceptRecord, b: ProjectRecord | WeakConceptRecord) =>
  b.updatedAt.localeCompare(a.updatedAt);
const byCreatedDesc = (a: QuizAttemptRecord | ActivityLogRecord, b: QuizAttemptRecord | ActivityLogRecord) =>
  b.createdAt.localeCompare(a.createdAt);

export const SHAPES: CollectionShape[] = [
  { name: 'topicProgress', stateKey: 'topicProgress', kind: 'map', idOf: (r) => r.topicId, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'bonusProgress', stateKey: 'bonusProgress', kind: 'map', idOf: (r) => r.moduleId, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'resourceStates', stateKey: 'resourceStates', kind: 'map', idOf: (r) => r.resourceId, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'studySessions', stateKey: 'studySessions', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'practiceLogs', stateKey: 'practiceLogs', kind: 'map', idOf: (r) => r.exerciseId, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'projects', stateKey: 'projects', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.updatedAt, appendOnly: false, sort: byUpdatedDesc },
  { name: 'weakConcepts', stateKey: 'weakConcepts', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.updatedAt, appendOnly: false, sort: byUpdatedDesc },
  { name: 'flashcardStates', stateKey: 'flashcardStates', kind: 'map', idOf: (r) => r.cardId, stampOf: (r) => r.updatedAt, appendOnly: false },
  { name: 'quizAttempts', stateKey: 'quizAttempts', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.createdAt, appendOnly: true, limit: 200, sort: byCreatedDesc },
  {
    name: 'journalEntries', stateKey: 'journalEntries', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.updatedAt,
    appendOnly: false,
    sort: (a: JournalEntryRecord, b: JournalEntryRecord) => b.date.localeCompare(a.date),
  },
  { name: 'activityLogs', stateKey: 'activityLogs', kind: 'list', idOf: (r) => r.id, stampOf: (r) => r.createdAt, appendOnly: true, limit: 60, maxItems: 60, sort: byCreatedDesc },
];

export function shapeByName(name: CollectionName): CollectionShape {
  const s = SHAPES.find((x) => x.name === name);
  if (!s) throw new Error(`Unknown collection: ${name}`);
  return s;
}

/** Milliseconds for an ISO stamp; invalid/missing stamps sort as the oldest possible value. */
export function stampMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const n = Date.parse(iso);
  return Number.isNaN(n) ? 0 : n;
}

export type Winner = 'cloud' | 'local' | 'same';

export function newestWins(localStamp: string | null | undefined, cloudStamp: string | null | undefined): Winner {
  const l = stampMs(localStamp);
  const c = stampMs(cloudStamp);
  if (c > l) return 'cloud';
  if (l > c) return 'local';
  return 'same';
}

export function collectionToMap(state: AppDataState, shape: CollectionShape): Map<string, AnyRecord> {
  const raw = state[shape.stateKey] as unknown;
  if (shape.kind === 'map') {
    return new Map(Object.entries((raw as Record<string, AnyRecord>) || {}));
  }
  return new Map(((raw as AnyRecord[]) || []).map((r) => [shape.idOf(r), r]));
}

/** Returns a new state with `upserts` applied and `removals` removed for one collection. */
export function applyToState(
  state: AppDataState,
  shape: CollectionShape,
  upserts: ReadonlyMap<string, AnyRecord>,
  removals: Iterable<string> = []
): AppDataState {
  const removeSet = new Set(removals);
  if (upserts.size === 0 && removeSet.size === 0) return state;

  if (shape.kind === 'map') {
    const next: Record<string, AnyRecord> = { ...((state[shape.stateKey] as Record<string, AnyRecord>) || {}) };
    for (const id of removeSet) delete next[id];
    for (const [id, rec] of upserts) next[id] = rec;
    return { ...state, [shape.stateKey]: next };
  }

  const current = collectionToMap(state, shape);
  for (const id of removeSet) current.delete(id);
  for (const [id, rec] of upserts) current.set(id, rec);
  let list = Array.from(current.values());
  if (shape.sort) list = list.sort(shape.sort);
  if (shape.maxItems) list = list.slice(0, shape.maxItems);
  return { ...state, [shape.stateKey]: list };
}

/** Which cloud records should replace local ones (used for live snapshot changes). */
export function selectNewerCloud(
  local: ReadonlyMap<string, AnyRecord>,
  incoming: ReadonlyMap<string, AnyRecord>,
  shape: CollectionShape
): Map<string, AnyRecord> {
  const take = new Map<string, AnyRecord>();
  for (const [id, cloudRec] of incoming) {
    const localRec = local.get(id);
    if (!localRec) {
      take.set(id, cloudRec);
    } else if (!shape.appendOnly && newestWins(shape.stampOf(localRec), shape.stampOf(cloudRec)) === 'cloud') {
      take.set(id, cloudRec);
    }
  }
  return take;
}

export interface ReconcileInput {
  shape: CollectionShape;
  local: ReadonlyMap<string, AnyRecord>;
  cloud: ReadonlyMap<string, AnyRecord>;
  /** Ids this device has previously seen in the cloud. */
  knownCloudIds: ReadonlySet<string>;
  /** Ids deleted locally whose cloud delete has not been confirmed yet. */
  pendingDeletes: ReadonlySet<string>;
  /** Local data wins conflicts (restoring a backup). */
  forceLocal?: boolean;
}

export interface ReconcilePlan {
  /** Apply the cloud version locally. */
  takeCloud: string[];
  /** Write the local version to the cloud. `restamp` = local lost on time but must win. */
  push: { id: string; restamp: boolean }[];
  /** Deleted on another device: remove locally. */
  removeLocal: string[];
  /** Deleted locally while offline: delete in cloud. */
  deleteCloud: string[];
}

export function planReconcile(input: ReconcileInput): ReconcilePlan {
  const { shape, local, cloud, knownCloudIds, pendingDeletes, forceLocal } = input;
  const cloudComplete = !shape.limit;
  const plan: ReconcilePlan = { takeCloud: [], push: [], removeLocal: [], deleteCloud: [] };

  for (const [id, cloudRec] of cloud) {
    if (pendingDeletes.has(id)) {
      plan.deleteCloud.push(id);
      continue;
    }
    const localRec = local.get(id);
    if (!localRec) {
      plan.takeCloud.push(id);
      continue;
    }
    if (shape.appendOnly) continue;
    const winner = newestWins(shape.stampOf(localRec), shape.stampOf(cloudRec));
    if (winner === 'cloud') {
      if (forceLocal) plan.push.push({ id, restamp: true });
      else plan.takeCloud.push(id);
    } else if (winner === 'local') {
      plan.push.push({ id, restamp: false });
    }
  }

  for (const id of local.keys()) {
    if (cloud.has(id) || pendingDeletes.has(id)) continue;
    if (knownCloudIds.has(id)) {
      // Seen in the cloud before but gone now. With a complete (unlimited) listener that means
      // it was deleted elsewhere (single delete or a reset); with a limited window it is merely
      // older than the newest-N window, so leave it alone.
      if (cloudComplete) {
        if (forceLocal) plan.push.push({ id, restamp: false });
        else plan.removeLocal.push(id);
      }
      continue;
    }
    plan.push.push({ id, restamp: false });
  }

  return plan;
}

const DEFAULT_LEARNER_NAME = 'AI Engineer Learner';

/** True when the profile is still the untouched default created on first launch. */
export function isDefaultProfile(p: UserProfile): boolean {
  return (
    !p.onboardingCompleted &&
    p.learnerName === DEFAULT_LEARNER_NAME &&
    p.currentWeek === 1 &&
    !p.internshipIntakeDone &&
    !p.internshipCertificateDone &&
    !p.internshipExperienceLetterDone &&
    (p.internshipMentoringHours || 0) === 0
  );
}

export type ProfileAction = 'none' | 'takeCloud' | 'push' | 'pushRestamp';

export function planProfile(args: {
  local: UserProfile;
  cloud: UserProfile | null;
  pendingReset?: boolean;
  forceLocal?: boolean;
}): ProfileAction {
  const { local, cloud, pendingReset, forceLocal } = args;
  const localIsDefault = isDefaultProfile(local);

  if (!cloud) return localIsDefault && !pendingReset ? 'none' : 'push';

  if (pendingReset) {
    return newestWins(local.updatedAt, cloud.updatedAt) === 'cloud' ? 'pushRestamp' : 'push';
  }
  // An untouched default profile must never overwrite real cloud data, even though its
  // timestamp (creation time on this device) may be newer.
  if (localIsDefault && !forceLocal) return 'takeCloud';

  const winner = newestWins(local.updatedAt, cloud.updatedAt);
  if (winner === 'cloud') return forceLocal ? 'pushRestamp' : 'takeCloud';
  if (winner === 'local') return 'push';
  return 'none';
}

/** True when the local state holds anything worth protecting with a backup. */
export function hasLocalProgress(state: AppDataState): boolean {
  if (!isDefaultProfile(state.profile)) return true;
  return SHAPES.some((s) => collectionToMap(state, s).size > 0);
}
