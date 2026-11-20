# AI Engineer Command Center

A personal learning tracker for an AI-engineering curriculum: weekly plan, topic progress, study sessions, projects, flashcards, quizzes, journal and analytics.

- **Stack:** Vite + React 19 + TypeScript + Tailwind 4.
- **Backend:** Firebase only — Google sign-in (Auth) and Cloud Firestore. No Storage, Functions, App Hosting or other paid products. Runs on the free **Spark** plan; hosting is Vercel **Hobby**.
- **Local-first:** all data is kept in `localStorage`. Signing in adds automatic, real-time sync across devices. Without Firebase configuration the app works fully offline/local-only.

## Local setup

```bash
bun install            # or: npm install
cp .env.example .env.local
# fill in the four required values (Firebase Console -> Project settings -> Your apps -> Web app)
bun run dev            # http://localhost:3000
```

`.env.local` is git-ignored. Never commit real values.

| Variable | Required |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | yes |
| `VITE_FIREBASE_APP_ID` | yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | no |

The web API key is not a secret, but restrict it (below). The app uses the **default** Firestore database.

## Scripts

`dev`, `build` (validates env, then `vite build`), `preview`, `typecheck`, `lint`, `test`, `check:env`, `check` (typecheck + lint + test).

On Vercel (or CI) `build` fails if the Firebase variables are missing, so a deploy cannot silently ship without sync. Set `ALLOW_LOCAL_ONLY_BUILD=1` to build a local-only app on purpose.

## Firebase Console setup (done by you)

1. **Authentication -> Sign-in method:** enable Google.
2. **Authentication -> Settings -> Authorized domains:** add `localhost` (present by default), your production domain (e.g. `your-app.vercel.app` or custom domain). Wildcards are not supported, so Vercel preview URLs (`*-git-*.vercel.app`) will not be able to sign in unless added one by one.
3. **Firestore Database:** create in production mode, then publish `firestore.rules` (Rules tab -> paste -> Publish), or `firebase deploy --only firestore:rules` with the Firebase CLI.
4. Optional hardening: Google Cloud Console -> APIs & Services -> Credentials -> the browser key -> restrict to HTTP referrers: `http://localhost:3000/*`, `https://<your-domain>/*` and `https://<project-id>.firebaseapp.com/*` (the last is needed for the sign-in popup).
5. Do not enable Blaze. Nothing in this app requires it.

## Vercel

Project -> Settings -> Environment Variables: add the four required `VITE_FIREBASE_*` variables (plus the optional one) for **Production** and, if you want previews to build, **Preview**. Framework preset: Vite; build command `bun run build` (or `npm run build`); output `dist`. Redeploy after changing variables, since Vite inlines them at build time.

## How sync works

- Data lives under `users/{uid}/...` in Firestore; each signed-in user only sees their own.
- Changes are written to localStorage immediately and to Firestore in coalesced batches; Firestore's persistent cache queues writes while offline and listeners push remote changes in real time.
- Conflicts: the record with the newest `updatedAt` wins (rules also reject stale overwrites). Quiz attempts and activity logs are append-only.
- First sign-in: existing local data is backed up (Settings -> "Automatic safety backups", downloadable) and then merged with the cloud copy; nothing is dropped silently. Deleting or resetting on one device propagates to the others.
- Signing in with a different account on the same browser backs up and clears the previous account's local data.
- Quota-friendly: listeners read only changed documents; activity logs (60) and quiz attempts (200) are loaded as bounded windows. Spark limits: 50K reads / 20K writes / 20K deletes per day.
- Clocks: "newest wins" uses device clocks (rules tolerate up to 1h skew).
- Shared computers: data is cached in the browser (localStorage + IndexedDB). Use Settings -> sign out and clear browser data on shared machines.

## Moving data from the old (AI Studio) deployment

The old backend is not used any more and its cloud data is not migrated automatically. On the old site open **Settings -> Export**, then on the new site (signed in) use **Settings -> Import**. Local data is per-origin, so this is a manual step.

## Tests

`bun run test` runs unit tests for merge/conflict logic, migration metadata and a check that every client write matches `firestore.rules`. They do not exercise live Firebase. After deploying, verify manually: sign in, edit on two devices, go offline and back online, delete and reset.

## Docs

- `firestore.rules` — security rules; `docs/security-spec.md` — their invariants.
- `docs/source-material/` — original course material the curriculum was based on (includes a third-party brochure).
