#!/usr/bin/env node
/**
 * Validates the Firebase environment variables before a build.
 *
 * - Never prints values (only variable names and pass/fail).
 * - Local builds: prints a warning and continues (the app then runs in local-only mode).
 * - Vercel / CI builds (or --strict): fails, so a deployment can't silently ship without cloud sync.
 *   Set ALLOW_LOCAL_ONLY_BUILD=1 to deliberately build a local-only app.
 *
 * Usage: node scripts/check-env.mjs [--strict]
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const strict =
  process.argv.includes('--strict') || Boolean(process.env.VERCEL) || process.env.CI === 'true' || process.env.CI === '1';
const allowLocalOnly = process.env.ALLOW_LOCAL_ONLY_BUILD === '1';

function parseEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

// Same precedence idea as Vite: real environment variables beat .env files.
const fromFiles = ['.env', '.env.local', '.env.production', '.env.production.local']
  .map((f) => parseEnvFile(resolve(ROOT, f)))
  .reduce((acc, cur) => ({ ...acc, ...cur }), {});
const env = { ...fromFiles, ...process.env };

const isPlaceholder = (v) => !v || /^your[-_]/i.test(v.trim());

const CHECKS = [
  {
    name: 'VITE_FIREBASE_API_KEY',
    required: true,
    valid: (v) => /^AIza[0-9A-Za-z_-]{30,}$/.test(v),
    hint: 'Looks like "AIza…" (Firebase Console → Project settings → Your apps → SDK config).',
  },
  {
    name: 'VITE_FIREBASE_AUTH_DOMAIN',
    required: true,
    valid: (v) => /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(v) && !v.includes('://'),
    hint: 'A hostname without "https://", usually <project-id>.firebaseapp.com.',
  },
  {
    name: 'VITE_FIREBASE_PROJECT_ID',
    required: true,
    valid: (v) => /^[a-z][a-z0-9-]{4,29}$/.test(v),
    hint: 'Lowercase project id, e.g. my-project-123.',
  },
  {
    name: 'VITE_FIREBASE_APP_ID',
    required: true,
    valid: (v) => /^\d+:\d+:web:[0-9a-f]+$/.test(v),
    hint: 'Looks like "1:1234567890:web:abcdef123456".',
  },
  {
    name: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    required: false,
    valid: (v) => /^\d+$/.test(v),
    hint: 'Digits only (optional; not needed for Auth or Firestore).',
  },
];

const problems = [];
const notes = [];

for (const check of CHECKS) {
  const value = env[check.name];
  if (isPlaceholder(value)) {
    if (check.required) problems.push(`${check.name} is missing or still a placeholder. ${check.hint}`);
    continue;
  }
  if (!check.valid(value.trim())) problems.push(`${check.name} does not look valid. ${check.hint}`);
}

const projectId = env.VITE_FIREBASE_PROJECT_ID;
const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
if (!isPlaceholder(projectId) && !isPlaceholder(authDomain) && authDomain !== `${projectId}.firebaseapp.com`) {
  notes.push(
    `VITE_FIREBASE_AUTH_DOMAIN is not "<project-id>.firebaseapp.com". That is fine for a custom auth domain, ` +
      'otherwise double-check it belongs to the same Firebase project.'
  );
}

for (const n of notes) console.warn(`[check-env] note: ${n}`);

if (problems.length === 0) {
  console.log('[check-env] Firebase configuration looks valid (values not printed).');
  process.exit(0);
}

console.error('[check-env] Firebase configuration problems:');
for (const p of problems) console.error(`  - ${p}`);

if (strict && !allowLocalOnly) {
  console.error(
    '\n[check-env] Failing the build so a deployment does not silently ship without cloud sync.\n' +
      '  Add the variables (Vercel: Project → Settings → Environment Variables, for Production AND Preview),\n' +
      '  or set ALLOW_LOCAL_ONLY_BUILD=1 to deliberately build a local-only app.'
  );
  process.exit(1);
}

console.warn(
  '\n[check-env] Continuing: the app will run in local-only mode (no Google sign-in / cloud sync).\n' +
    '  Copy .env.example to .env.local and fill it in to enable Firebase.'
);
process.exit(0);
