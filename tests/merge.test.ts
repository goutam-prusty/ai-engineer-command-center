import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  applyToState,
  collectionToMap,
  hasLocalProgress,
  isDefaultProfile,
  newestWins,
  planProfile,
  planReconcile,
  selectNewerCloud,
  shapeByName,
  stampMs,
} from '../src/lib/sync/merge.ts';
import { defaultProfile, emptyState, session, T0, T1, T2, topic } from './fixtures.ts';

const topics = shapeByName('topicProgress');
const sessions = shapeByName('studySessions');
const activity = shapeByName('activityLogs');
const maps = (o: Record<string, unknown>) => new Map(Object.entries(o));
const none = new Set<string>();

describe('newestWins / stampMs', () => {
  test('compares ISO stamps', () => {
    assert.equal(newestWins(T0, T1), 'cloud');
    assert.equal(newestWins(T2, T1), 'local');
    assert.equal(newestWins(T1, T1), 'same');
  });
  test('invalid or missing stamps count as oldest', () => {
    assert.equal(stampMs('not a date'), 0);
    assert.equal(newestWins(undefined, T0), 'cloud');
    assert.equal(newestWins(T0, undefined), 'local');
  });
});

describe('planReconcile (migration + conflict resolution)', () => {
  test('cloud-only record is taken (new device)', () => {
    const plan = planReconcile({
      shape: topics, local: maps({}), cloud: maps({ a: topic('a') }), knownCloudIds: none, pendingDeletes: none,
    });
    assert.deepEqual(plan, { takeCloud: ['a'], push: [], removeLocal: [], deleteCloud: [] });
  });

  test('local-only, never-synced record is pushed (first-login migration, no data loss)', () => {
    const plan = planReconcile({
      shape: topics, local: maps({ a: topic('a') }), cloud: maps({}), knownCloudIds: none, pendingDeletes: none,
    });
    assert.deepEqual(plan.push, [{ id: 'a', restamp: false }]);
    assert.deepEqual(plan.removeLocal, []);
  });

  test('newest updatedAt wins in both directions', () => {
    const plan = planReconcile({
      shape: topics,
      local: maps({ cloudNewer: topic('x', T0), localNewer: topic('y', T2), same: topic('z', T1) }),
      cloud: maps({ cloudNewer: topic('x', T1), localNewer: topic('y', T1), same: topic('z', T1) }),
      knownCloudIds: none, pendingDeletes: none,
    });
    assert.deepEqual(plan.takeCloud, ['cloudNewer']);
    assert.deepEqual(plan.push, [{ id: 'localNewer', restamp: false }]);
  });

  test('a record seen in the cloud and now gone was deleted elsewhere -> removed locally, not resurrected', () => {
    const plan = planReconcile({
      shape: sessions, local: maps({ s1: session('s1') }), cloud: maps({}),
      knownCloudIds: new Set(['s1']), pendingDeletes: none,
    });
    assert.deepEqual(plan.removeLocal, ['s1']);
    assert.deepEqual(plan.push, []);
  });

  test('a reset on another device propagates to non-deletable collections too', () => {
    const plan = planReconcile({
      shape: topics, local: maps({ a: topic('a') }), cloud: maps({}),
      knownCloudIds: new Set(['a']), pendingDeletes: none,
    });
    assert.deepEqual(plan.removeLocal, ['a']);
  });

  test('a local delete made offline is sent to the cloud instead of the record coming back', () => {
    const plan = planReconcile({
      shape: sessions, local: maps({}), cloud: maps({ s1: session('s1') }),
      knownCloudIds: new Set(['s1']), pendingDeletes: new Set(['s1']),
    });
    assert.deepEqual(plan.deleteCloud, ['s1']);
    assert.deepEqual(plan.takeCloud, []);
  });

  test('restoring a backup (forceLocal) wins conflicts by restamping, and re-creates known-but-missing records', () => {
    const plan = planReconcile({
      shape: sessions,
      local: maps({ old: session('old', T0), gone: session('gone', T0) }),
      cloud: maps({ old: session('old', T2) }),
      knownCloudIds: new Set(['gone']), pendingDeletes: none, forceLocal: true,
    });
    assert.deepEqual(plan.push, [{ id: 'old', restamp: true }, { id: 'gone', restamp: false }]);
    assert.deepEqual(plan.takeCloud, []);
  });

  test('limited windows (activity logs): known-but-absent records are left alone, never deleted', () => {
    const log = { id: 'l1', type: 'topic', title: 't', detail: '', week: 1, createdAt: T0 };
    const plan = planReconcile({
      shape: activity, local: maps({ l1: log }), cloud: maps({}), knownCloudIds: new Set(['l1']), pendingDeletes: none,
    });
    assert.deepEqual(plan, { takeCloud: [], push: [], removeLocal: [], deleteCloud: [] });
  });

  test('append-only records are never overwritten when both sides have them', () => {
    const local = { id: 'l1', type: 'topic', title: 'local', detail: '', week: 1, createdAt: T2 };
    const cloud = { id: 'l1', type: 'topic', title: 'cloud', detail: '', week: 1, createdAt: T0 };
    const plan = planReconcile({
      shape: activity, local: maps({ l1: local }), cloud: maps({ l1: cloud }), knownCloudIds: none, pendingDeletes: none,
    });
    assert.deepEqual(plan, { takeCloud: [], push: [], removeLocal: [], deleteCloud: [] });
  });
});

describe('profile merge', () => {
  const real = (over = {}) => defaultProfile({ onboardingCompleted: true, learnerName: 'Goutam', currentWeek: 5, ...over });

  test('detects an untouched default profile', () => {
    assert.equal(isDefaultProfile(defaultProfile()), true);
    assert.equal(isDefaultProfile(real()), false);
  });

  test('a fresh default profile never overwrites real cloud data, even when its timestamp is newer', () => {
    const local = defaultProfile({ updatedAt: T2 });
    const cloud = real({ updatedAt: T0 });
    assert.equal(planProfile({ local, cloud }), 'takeCloud');
  });

  test('no cloud profile: push real local profile, but not an untouched default', () => {
    assert.equal(planProfile({ local: real(), cloud: null }), 'push');
    assert.equal(planProfile({ local: defaultProfile(), cloud: null }), 'none');
  });

  test('both real: newest wins', () => {
    assert.equal(planProfile({ local: real({ updatedAt: T0 }), cloud: real({ updatedAt: T1 }) }), 'takeCloud');
    assert.equal(planProfile({ local: real({ updatedAt: T2 }), cloud: real({ updatedAt: T1 }) }), 'push');
    assert.equal(planProfile({ local: real({ updatedAt: T1 }), cloud: real({ updatedAt: T1 }) }), 'none');
  });

  test('pending reset pushes the local (fresh) profile over the old cloud one', () => {
    assert.equal(planProfile({ local: defaultProfile({ updatedAt: T2 }), cloud: real({ updatedAt: T1 }), pendingReset: true }), 'push');
    assert.equal(planProfile({ local: defaultProfile({ updatedAt: T0 }), cloud: real({ updatedAt: T1 }), pendingReset: true }), 'pushRestamp');
  });

  test('restore (forceLocal) overrides a newer cloud profile via restamp', () => {
    assert.equal(planProfile({ local: real({ updatedAt: T0 }), cloud: real({ updatedAt: T2 }), forceLocal: true }), 'pushRestamp');
  });
});

describe('applying changes to state', () => {
  test('selectNewerCloud only takes new or strictly newer records', () => {
    const local = maps({ a: topic('a', T1), b: topic('b', T2) });
    const incoming = maps({ a: topic('a', T2), b: topic('b', T1), c: topic('c', T0) });
    const take = selectNewerCloud(local, incoming, topics);
    assert.deepEqual([...take.keys()].sort(), ['a', 'c']);
  });

  test('applyToState upserts and removes in map collections without mutating the input', () => {
    const before = emptyState({ topicProgress: { a: topic('a'), b: topic('b') } });
    const after = applyToState(before, topics, maps({ c: topic('c') }), ['a']);
    assert.deepEqual(Object.keys(after.topicProgress).sort(), ['b', 'c']);
    assert.deepEqual(Object.keys(before.topicProgress).sort(), ['a', 'b']);
  });

  test('applyToState keeps list collections sorted and activity logs capped at 60', () => {
    let state = emptyState();
    const logs = new Map(
      Array.from({ length: 75 }, (_, i) => {
        const createdAt = new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString();
        return [`l${i}`, { id: `l${i}`, type: 'topic', title: 't', detail: '', week: 1, createdAt }] as const;
      })
    );
    state = applyToState(state, activity, logs);
    assert.equal(state.activityLogs.length, 60);
    assert.equal(state.activityLogs[0].id, 'l74'); // newest first
  });

  test('collectionToMap round-trips list and map collections', () => {
    const state = emptyState({ studySessions: [session('s1'), session('s2')], topicProgress: { a: topic('a') } });
    assert.deepEqual([...collectionToMap(state, sessions).keys()], ['s1', 's2']);
    assert.deepEqual([...collectionToMap(state, topics).keys()], ['a']);
  });
});

describe('hasLocalProgress', () => {
  test('false for a pristine state, true once anything exists', () => {
    assert.equal(hasLocalProgress(emptyState()), false);
    assert.equal(hasLocalProgress(emptyState({ topicProgress: { a: topic('a') } })), true);
    assert.equal(hasLocalProgress(emptyState({ profile: defaultProfile({ learnerName: 'Goutam' }) })), true);
  });
});
