import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/**
 * Firebase is the only backend. Configuration comes exclusively from Vite env vars
 * (see .env.example). Firebase web config values are public identifiers, not secrets,
 * but they are still kept out of source control so the project can be re-pointed
 * without code changes. Data is protected by Firestore Security Rules.
 *
 * Services used (all available on the free Spark plan): Authentication (Google) and
 * Cloud Firestore. No Storage, Functions, Analytics or paid products.
 */

const env = import.meta.env;

const REQUIRED_VARS = [
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
] as const;

function readVar(value: unknown): string {
  const v = typeof value === 'string' ? value.trim() : '';
  // Treat unfilled placeholders (e.g. copied straight from .env.example) as missing.
  if (!v || /^your[-_]/i.test(v) || /^YOUR_/.test(v)) return '';
  return v;
}

const rawConfig: Record<string, string> = {
  VITE_FIREBASE_API_KEY: readVar(env.VITE_FIREBASE_API_KEY),
  VITE_FIREBASE_AUTH_DOMAIN: readVar(env.VITE_FIREBASE_AUTH_DOMAIN),
  VITE_FIREBASE_PROJECT_ID: readVar(env.VITE_FIREBASE_PROJECT_ID),
  VITE_FIREBASE_APP_ID: readVar(env.VITE_FIREBASE_APP_ID),
  VITE_FIREBASE_MESSAGING_SENDER_ID: readVar(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
};

/** Names of required env vars that are missing or still placeholders. */
export const missingFirebaseEnv: string[] = REQUIRED_VARS.filter(([name]) => !rawConfig[name]).map(
  ([name]) => name
);

export const isFirebaseConfigured: boolean = missingFirebaseEnv.length === 0;

function createApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    console.warn(
      `[firebase] Cloud sync disabled. Missing environment variables: ${missingFirebaseEnv.join(', ')}. ` +
        'The app is running in local-only mode.'
    );
    return null;
  }
  const options: FirebaseOptions = {
    apiKey: rawConfig.VITE_FIREBASE_API_KEY,
    authDomain: rawConfig.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: rawConfig.VITE_FIREBASE_PROJECT_ID,
    appId: rawConfig.VITE_FIREBASE_APP_ID,
  };
  if (rawConfig.VITE_FIREBASE_MESSAGING_SENDER_ID) {
    options.messagingSenderId = rawConfig.VITE_FIREBASE_MESSAGING_SENDER_ID;
  }
  return getApps().length ? getApp() : initializeApp(options);
}

function createDb(firebaseApp: FirebaseApp): Firestore {
  try {
    // Default database. The persistent cache (IndexedDB) keeps data available offline,
    // queues writes made while offline, and lets the SDK resume listeners cheaply
    // (important for the Spark plan's daily read quota).
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialised (e.g. dev hot reload) or IndexedDB unavailable: fall back to the
    // default instance, which still works online and offline-in-memory.
    return getFirestore(firebaseApp);
  }
}

export const app: FirebaseApp | null = createApp();
export const auth: Auth | null = app ? getAuth(app) : null; // default persistence is local (survives refresh)
export const db: Firestore | null = app ? createDb(app) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function errorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) return String((err as { code: unknown }).code);
  return '';
}

/** Human-readable message for a Firebase Auth failure. */
export function describeAuthError(err: unknown): string {
  const code = errorCode(err);
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled before it finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This website address is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project.';
    case 'auth/network-request-failed':
      return 'Network problem while signing in. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'The Firebase API key is invalid. Check VITE_FIREBASE_API_KEY.';
    default:
      if (code.startsWith('auth/requests-from-referer')) {
        return 'This website is blocked by the API key restrictions. Add it under the key’s allowed HTTP referrers in Google Cloud Console.';
      }
      return err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
  }
}

/** Human-readable message for a Firestore failure. */
export function describeFirestoreError(err: unknown): string {
  switch (errorCode(err)) {
    case 'resource-exhausted':
      return 'Firebase free daily quota reached. Changes keep saving on this device and will sync after the quota resets.';
    case 'permission-denied':
      return 'The server rejected a change (a newer version exists, or the device clock is wrong). Latest cloud data will load automatically.';
    case 'unavailable':
      return 'Cloud is unreachable right now. Changes keep saving on this device and will sync when you are back online.';
    case 'unauthenticated':
      return 'Your session expired. Sign in again to resume cloud sync.';
    default:
      return err instanceof Error ? err.message : 'Cloud sync failed.';
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const u = auth?.currentUser;
  const info = {
    error: error instanceof Error ? error.message : String(error),
    code: errorCode(error),
    operationType,
    path,
    userId: u?.uid ?? null,
  };
  console.error('Firestore Error: ', JSON.stringify(info));
  throw new Error(describeFirestoreError(error));
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Cloud sync is not configured for this deployment.');
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  if (!auth) return;
  return signOut(auth);
}
