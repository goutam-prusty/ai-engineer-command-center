/**
 * Guards against the most damaging kind of sync bug: documents the client writes being rejected
 * by firestore.rules. For every synced collection it checks that the encoder output satisfies the
 * rules' `hasAll` / `hasOnly` key lists, that timestamps are real Timestamps, and that decoding
 * what was encoded gives the original record back.
 *
 * Note: this checks document *shape* only. It is not a substitute for running the rules against
 * the Firestore emulator or the Rules Playground (see README).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { Timestamp } from 'firebase/firestore';
import { CODECS, profileFromDoc, profileToDoc } from '../src/lib/sync/codecs.ts';
import { SHAPES } from '../src/lib/sync/merge.ts';
import { defaultProfile, SAMPLES, T0, T1 } from './fixtures.ts';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

function functionBody(name: string): string {
  const start = rules.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `rules function ${name} not found`);
  const next = rules.indexOf('\n    function ', start + 10);
  return rules.slice(start, next === -1 ? undefined : next);
}

function keyList(body: string, kind: 'hasAll' | 'hasOnly'): string[] {
  const m = body.match(new RegExp(`data\\.keys\\(\\)\\.${kind}\\(\\[([\\s\\S]*?)\\]\\)`));
  assert.ok(m, `no ${kind} list found`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function validatorFor(collectionName: string): string {
  const start = rules.indexOf(`match /${collectionName}/{`);
  assert.ok(start >= 0, `no match block for ${collectionName}`);
  const end = rules.indexOf('match /', start + 10);
  const block = rules.slice(start, end === -1 ? undefined : end);
  const m = block.match(/allow create:[\s\S]*?(isValid\w+)\(incoming\(\)/);
  assert.ok(m, `no create validator for ${collectionName}`);
  return m[1];
}

describe('encoders satisfy firestore.rules', () => {
  for (const shape of SHAPES) {
    test(shape.name, () => {
      const record = SAMPLES[shape.name];
      const doc = CODECS[shape.name].toDoc('uid1', record, {});
      const body = functionBody(validatorFor(shape.name));
      const keys = Object.keys(doc);

      for (const required of keyList(body, 'hasAll')) {
        assert.ok(keys.includes(required), `${shape.name}: missing required field "${required}"`);
      }
      const allowed = new Set(keyList(body, 'hasOnly'));
      for (const k of keys) assert.ok(allowed.has(k), `${shape.name}: field "${k}" is not allowed by the rules`);

      assert.equal(doc.ownerId, 'uid1');
      assert.ok(doc.updatedAt instanceof Timestamp || doc.createdAt instanceof Timestamp);
      for (const f of ['createdAt', 'updatedAt']) {
        if (f in doc) assert.ok(doc[f] instanceof Timestamp, `${shape.name}.${f} must be a Timestamp`);
      }
    });

    test(`${shape.name}: decode(encode(x)) === x`, () => {
      const record = SAMPLES[shape.name];
      const doc = CODECS[shape.name].toDoc('uid1', record, {});
      assert.deepEqual(CODECS[shape.name].fromDoc(shape.idOf(record), doc), record);
    });
  }

  test('user profile', () => {
    const profile = defaultProfile({ onboardingCompleted: true, learnerName: 'Goutam', currentWeek: 4, updatedAt: T1, createdAt: T0 });
    const doc = profileToDoc('uid1', profile, {});
    const body = functionBody('isValidUserProfile');
    const keys = Object.keys(doc);
    for (const required of keyList(body, 'hasAll')) assert.ok(keys.includes(required), `profile: missing "${required}"`);
    const allowed = new Set(keyList(body, 'hasOnly'));
    for (const k of keys) assert.ok(allowed.has(k), `profile: field "${k}" not allowed`);
    assert.deepEqual(profileFromDoc(doc), profile);
  });

  test('write options override the stamps (used to resolve conflicts and keep createdAt stable)', () => {
    const doc = CODECS.studySessions.toDoc('uid1', SAMPLES.studySessions, { stamp: T1, createdAt: T0 });
    assert.equal((doc.updatedAt as Timestamp).toDate().toISOString(), T1);
    assert.equal((doc.createdAt as Timestamp).toDate().toISOString(), T0);
  });
});
