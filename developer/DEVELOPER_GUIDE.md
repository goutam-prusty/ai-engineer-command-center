# AI Engineer Command Center: Developer Guide

Version of this guide: 22 Nov 2026 (after merge of PR #1, commit `388a904` on `main`)
Repository: https://github.com/goutam-prusty/ai-engineer-command-center
Production: https://ai-engineer-command-center-seven.vercel.app
Owner: Goutam Prusty

This guide is for anyone who needs to update or extend the app. Everything here was checked against the code in `main` at the commit above. Where something is a recommendation rather than a fact, it says so.

---

## 1. Quick start (read this first)

```bash
git clone https://github.com/goutam-prusty/ai-engineer-command-center.git
cd ai-engineer-command-center
npm install                    # bun also works; bun.lock is the committed lockfile
cp .env.example .env.local     # optional: without it the app runs in local-only mode
npm run dev                    # http://localhost:3000
npm run typecheck && npm run lint && npm run test && npm run build
```

- Node **22.18 or newer** is required (`engines` in `package.json`). The tests run TypeScript directly with Node's built-in runner, which needs this version.
- Without `.env.local` the app works fully, stored in the browser only. Cloud sync (Google sign-in + Firestore) needs the four Firebase variables in section 3.
- `npm run build` runs `scripts/check-env.mjs` first. On Vercel or CI it **fails if Firebase variables are missing**. Locally, `ALLOW_LOCAL_ONLY_BUILD=1 npm run build` builds a local-only app on purpose.
- Current state of `main`: typecheck passes, lint passes, **53/53 tests pass (8 suites)**, build passes (one bundle-size warning, see 11).

### Five things to know before changing anything

1. **Local-first.** The UI renders from `localStorage`. Firestore is a mirror that syncs in both directions. Never make the UI depend on a network call.
2. **Static content vs learner state.** Curriculum, resources, flashcards, quizzes and exercises are static TypeScript in `src/data/`. Only the learner's progress is stored and synced. IDs in the static data are the keys of the stored progress, so **never change or reuse an ID casually** (section 5.3).
3. **Adding stored data touches many files.** A new field or collection must be updated in types, defaults, codecs, merge shapes, Firestore rules, tests and docs. Use the checklist in section 7.3.
4. **Design is strict.** The UI follows the "Paper & Signal" design system (section 6). Do not add colours, fonts, dark mode, gradients or heavy shadows.
5. **Firestore rules are not published by deploys.** Pushing code does not update `firestore.rules`. Publish rules separately (section 9).

---

## 2. What the app is

A personal learning tracker anchored to the **DataMites 20-week AI Engineer master track**: weekly plan, official curriculum, weekly study room, supplementary resource library, projects, flashcards/quizzes/exercises (revision), analytics and a journal. It works offline and syncs across devices when the learner signs in with Google.

Status: the Paper & Signal UI redesign is complete and merged. Cloud sign-in and cross-browser sync were verified on a Vercel preview before merge. The app is currently built around **one course** (the 20-week AI Engineer track) and **one learner per account**.

Stack: Vite 8, React 19, TypeScript 7 (non-strict), Tailwind CSS v4, Motion, Lucide icons, Recharts, Firebase (Auth + Firestore on the free Spark plan), hosted on Vercel Hobby.

---

## 3. Local setup and configuration

### 3.1 Environment variables

Copy `.env.example` to `.env.local` (git-ignored). These are public web identifiers, not secrets; data is protected by Firestore rules.

| Variable | Required | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | yes | Firebase Console, Project settings, Your apps, Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | |
| `VITE_FIREBASE_APP_ID` | yes | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | no | Not needed for Auth or Firestore |

Vite inlines these at build time, so **redeploy after changing them** on Vercel. The app uses the **default** Firestore database.

### 3.2 Scripts

| Script | What it does |
|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` (reachable from a phone on the same Wi-Fi at `http://<laptop-IP>:3000`) |
| `build` | `check-env.mjs` then `vite build` to `dist/` |
| `preview` | Serve the built `dist/` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint .` (see 8: this only lints `firestore.rules`) |
| `test` | `node --test "tests/**/*.test.ts"` |
| `check:env` | Validate Firebase variables (never prints values) |
| `check` | typecheck + lint + test, **via `bun run`** (needs Bun; with npm run the three scripts separately) |

### 3.3 Notes for Windows

Development has been done on Windows with npm. `npm install` creates an untracked `package-lock.json`; **do not commit it** (see 10.3).

---

## 4. Repository layout

```
.
├─ index.html                 HTML shell, page meta, (legacy) font links, mounts /src/main.tsx
├─ vercel.json                Security headers only (nosniff, frame DENY, referrer, permissions)
├─ firebase.json              Points the Firebase CLI at firestore.rules
├─ firestore.rules            Security rules (25 KB). Source of truth for allowed writes
├─ scripts/check-env.mjs      Build-time Firebase env validation
├─ docs/
│  ├─ security-spec.md        Rules invariants and the "Dirty Dozen" attack list
│  └─ source-material/        Original course material the data was built from (see 12)
├─ tests/                     Node tests for sync logic and rules/codec parity
└─ src/
   ├─ main.tsx, App.tsx       Entry; App picks the view from activeSection
   ├─ types.ts                All domain + persisted-state types (single source of truth)
   ├─ index.css               Paper & Signal tokens (Tailwind v4 @theme) and base styles
   ├─ context/
   │  ├─ AppStateContext.tsx  Global state, all mutations, auth wiring (1,207 lines)
   │  └─ useCloudSync.ts      Cloud sync controller hook (650 lines)
   ├─ lib/
   │  ├─ firebase.ts          Firebase init, auth helpers, error descriptions
   │  ├─ util.ts              nowIso, makeId, clampInt, clampStr
   │  └─ sync/
   │     ├─ merge.ts          Pure conflict/reconcile logic (no Firebase imports)
   │     ├─ codecs.ts         Record <-> Firestore document converters
   │     ├─ cloud.ts          The only file that calls the Firestore SDK for sync
   │     └─ meta.ts           Sync bookkeeping + safety backups in localStorage
   ├─ data/
   │  ├─ curriculum.ts        Official 20-week curriculum, bonus courses, competencies
   │  ├─ resources.ts         Supplementary resource catalogue and mapping
   │  └─ assessments.ts       Flashcards, quizzes, short answers, exercises, project templates
   ├─ components/
   │  ├─ AppShell.tsx         Sidebar, mobile header + drawer, bottom nav, toasts, sync status
   │  ├─ StatusPrimitives.tsx SectionCard, ProgressBar, tags, status helpers
   │  ├─ OnboardingModal.tsx  First-run setup
   │  └─ ErrorBoundary.tsx
   └─ views/                  One file per screen (10 views)
```

Largest files: `assessments.ts` 2,127 lines, `curriculum.ts` 2,397, `AppStateContext.tsx` 1,207, `RevisionView.tsx` 1,050, `ProjectsView.tsx` 857.

---

## 5. Architecture

### 5.1 Navigation and views

There is **no router**. `activeSection` (a `NavSection` string) lives in `AppStateContext`; `App.tsx` switches on it. Sections: `dashboard`, `plan`, `curriculum`, `study-room`, `resources`, `projects`, `revision`, `analytics`, `journal`, `settings`. URLs and the browser Back button do not change between views.

Consequences: no deep links, and refresh returns to the Dashboard. If deep links are ever needed, adding a router is a contained change in `App.tsx` and `AppShell.tsx`.

To add a view: add the id to `NavSection` in `types.ts`, a `NAV_ITEMS` entry (and optionally `MOBILE_BOTTOM_NAV`, which has 4 slots) in `AppShell.tsx`, a `case` in `App.tsx`, and a file in `src/views/`.

`AppShell` owns the layout: 256px sidebar on desktop, 56px sticky header plus drawer plus fixed bottom nav on mobile, toasts, and the sync status indicator. Views render inside it.

### 5.2 State management

Everything is in `AppStateContext.tsx`, consumed with `useAppState()`. There is no Redux or similar.

- **Persisted learner state** is one object (`AppDataState` in `types.ts`, `version: 1`) kept in React state and written to `localStorage` under key **`aiecc_state_v1`** on every change.
- **UI-only state** (not persisted or synced): `activeSection`, `selectedStudyWeek`, `highlightedTarget`, `showOnboardingModal`, toasts.
- **Mutations** are functions on the context (for example `updateTopicProgress`, `saveProject`, `saveJournalEntry`, `recordQuizAttempt`, `setFlashcardStatus`). Each stamps `updatedAt` and, where relevant, logs an activity entry. Views never write state directly.
- **Derived data:** `computeNextLearningTarget` decides what "Continue learning" opens (in-progress, then needs-revision, then next in sequence, then week complete).
- **Loading:** `loadLocalState` merges the stored JSON over defaults, so missing collections become empty. There is **no version-based migration framework yet**; `version` is fixed at 1.
- **Import/export:** `exportBackupJson` / `importBackupJson` (Settings). Import validates only that a profile exists, clamps `currentWeek` to 1 to 20, and falls back to empty collections. It is lenient, so imported data is not deeply validated.
- **Reset:** `resetAllProgress` clears local data and propagates deletion to the cloud.

Persisted collections (`AppDataState`):

| Collection | Shape | Key | Notes |
|---|---|---|---|
| `profile` | object | uid | name, current week, weekly hours, internship flags |
| `topicProgress` | map | `topicId` (subtopic id) | status, assignment, revision, notes, evidence URL |
| `bonusProgress` | map | `moduleId` | |
| `resourceStates` | map | `resourceId` | watched, pinned week, note |
| `studySessions` | list | `id` | planned/completed sessions |
| `practiceLogs` | map | `exerciseId` | |
| `projects` | list | `id` | three categories (official, internship, supplementary) |
| `weakConcepts` | list | `id` | |
| `flashcardStates` | map | `cardId` | |
| `quizAttempts` | list | `id` | **append-only**, newest 200 |
| `journalEntries` | list | `id` | |
| `activityLogs` | list | `id` | **append-only**, newest 60 |

### 5.3 Static content and the ID contract

`src/data/` holds the course content as typed constants (types in `types.ts`).

- `curriculum.ts`: `OFFICIAL_CURRICULUM` (courses, weeks, modules, subtopics), `BONUS_COURSES`, `OFFICIAL_COMPETENCY_AREAS`, `COMPLETION_CRITERIA_BY_WEEK`, `DATAMITES_PROGRAM_FACTS`, and helpers such as `getCourseForWeek`, `getModulesForWeek`, `getSubtopicsForWeek`, `getAllSubtopics`.
- `resources.ts`: `ALL_RESOURCES` (each has `mappedWeeks`, `defaultClassification` ESSENTIAL/OPTIONAL/SKIP, optional per-week overrides, a `reason`, and a `verified` flag), `getResourcesForWeek`, `getClassificationForWeek`.
- `assessments.ts`: `FLASHCARDS`, `QUIZ_QUESTIONS`, `SHORT_ANSWER_QUESTIONS`, `PRACTICAL_EXERCISES`, `PROJECT_TEMPLATES`, with `get...ForWeek` helpers.

**Provenance.** Content carries a `provenance` label (`DATAMITES_OFFICIAL`, `CODEWITHHARRY_*`, `SSD_AI_ENGINEER_BOOTCAMP`, `SUPPLEMENTARY_PRACTICE_PROPOSED`, `UNVERIFIED`, ...). It is shown in the UI so learners can tell official content from supplementary or proposed content. Keep it accurate when adding content.

**ID contract (important).** Stored progress is keyed by static IDs: `topicProgress` by subtopic id, `bonusProgress` by module id, `resourceStates` by resource id, `flashcardStates` by card id, `practiceLogs` by exercise id. The 20-week value is hard-coded in places (for example `clampInt(..., 1, 20)`).

- Adding content: safe. Add new IDs.
- Editing wording: safe.
- **Renaming, deleting or re-using an ID silently detaches existing learners' progress.** If an ID must change, write a migration that rewrites stored keys, locally and in the cloud, and tell users to back up first.
- Firestore rules require document IDs to match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters. Static IDs must respect this.

### 5.4 Cloud sync

Files: `useCloudSync.ts` (controller), `lib/sync/*` (logic).

Data model in Firestore (default database): `users/{uid}` (profile) and `users/{uid}/{collection}/{id}` for the 11 collections above.

How it works:
- **Local-first mirror.** UI renders from local state; changes are written locally at once and to Firestore in coalesced batches (`WRITE_DELAY_MS = 1000`, so typing in a notes box becomes one write).
- **Real-time listeners** (`subscribeUser` in `cloud.ts`) with Firestore's persistent local cache deliver other devices' changes and queue writes while offline. Quiz attempts and activity logs are loaded as bounded windows.
- **Conflict rule:** the record with the newest `updatedAt` wins (`newestWins` in `merge.ts`). Append-only records are never overwritten. Rules also reject stale overwrites and tolerate up to 1 hour of clock skew.
- **Deletions** are propagated with a persisted set of ids "seen in the cloud" plus pending local deletes, so a stale device does not resurrect deleted records.
- **Reconcile pass** (`planReconcile`) uses in-memory snapshots (no extra reads) to push local-only or newer records. It doubles as the first-login migration and as the retry for failed writes.
- **First sign-in:** existing local data is backed up (downloadable under Settings, "Automatic safety backups") then merged with the cloud copy. Signing in with a **different account** on the same browser backs up and clears the previous account's local data.
- **Sync status** values: `local_only`, `syncing`, `synced`, `error`, `offline`. A focus re-check runs at most every 30 s.
- **Extra localStorage keys:** `aiecc_syncmeta_<uid>` (bookkeeping), `aiecc_owner_uid`, `aiecc_backup_<uid>__<reason>__<time>` (safety backups).
- **Quota:** Spark allows about 50K reads, 20K writes and 20K deletes per day. The design is built to stay well inside that for individual learners; revisit before onboarding many users.

`merge.ts` and `meta.ts` have no Firebase imports and are unit tested. `codecs.ts` is tested in Node against the rules. `cloud.ts` is the only sync file that calls the Firestore SDK and has no automated tests.

### 5.5 Firestore security rules

`firestore.rules` is the authority on what the client may write. Key invariants (full list and attack cases in `docs/security-spec.md`):
- Everything lives under `/users/{userId}`; only the signed-in user whose uid matches **and whose email is verified** can read or write. Everything else is denied by default.
- `ownerId` equals the uid on create and is immutable. Creates use `hasAll`/`hasOnly` key allowlists; updates validate the whole document and `affectedKeys()`.
- Strings and lists have size limits; timestamps must be plausible (not before 2020, at most 1 hour in the future); `updatedAt` cannot go backwards; `createdAt` is immutable.
- `quizAttempts` and `activityLogs` cannot be updated.
- `allow list` on the top-level user document is false; sub-collection lists are scoped to the owner.

**Verification status:** the rules are linted and a test checks that every client write matches the rules' key lists. They have **not** been run against the Firestore emulator or Rules Playground (stated in `docs/security-spec.md`). Do this before any rules change goes to production.

### 5.6 Authentication

Google sign-in via popup (`signInWithGoogle` in `lib/firebase.ts`); auth state flows from `onAuthStateChanged` in `AppStateContext`. Persistence is the Firebase default (survives refresh). Authorized domains must include every origin you sign in from (section 9).

---

## 6. UI and design system: Paper & Signal

The UI was redesigned in stages 1 to 6 (foundation, shell, primitives, then every view, then a final audit). The authority for visual decisions is the design system document (`WEBSITE_THEME_AND_UI_UX_DESIGN_SYSTEM.md`, not in the repo; see section 14). The implementation lives in `src/index.css` and `src/components/*`.

### 6.1 Identity

Light theme only; warm paper background; editorial feel; square corners; hairline borders; restrained pastel surfaces with lime used as punctuation. **Not allowed:** dark mode or a theme toggle, gradients, glassmorphism, glows, heavy shadows, decorative animation, rounded pills, generic SaaS blue.

### 6.2 Tokens (`@theme` in `src/index.css`)

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#f7f4ec` | page background |
| `--color-surface` | `#fdfcf8` | cards, panels, sidebar |
| `--color-sunken` | `#efebdf` | wells, active nav, code, tracks |
| `--color-ink` | `#17191a` | primary text, strong borders |
| `--color-secondary` | `#4a4f4c` | secondary text |
| `--color-line` | `#827d71` | visible borders |
| `--color-line-soft` | `#ddd8cb` | dividers |
| `--color-project` | `#f4d9c6` (peach) | **content type: Projects** |
| `--color-research` | `#d2e0ea` (blue) | **content type: Research** |
| `--color-writing` | `#d5e2d0` (sage) | **content type: Writing** |
| `--color-signal` | `#d3f03c` (lime) | primary action, focus punctuation |

Fonts are system stacks only: display serif (Iowan Old Style, Palatino, Georgia), body (Segoe UI, Helvetica Neue, Arial), mono (Cascadia Code, Consolas). No web fonts.

Backward-compatible aliases (`--color-canvas`, `--color-ink-secondary`, `--color-accent`, and so on) remain in the theme. New code should use the real tokens; the aliases can be removed once no file references them.

Use tokens through `var(--color-*)` in Tailwind classes, for example `bg-[var(--color-surface)] border-[var(--color-line)]`.

### 6.3 Rules that keep the design coherent

1. **Colour meaning.** Peach, blue and sage mean *content type* only. **Status** (complete, in progress, essential, optional, needs revision) is expressed with neutral ink/sunken/border, weight, icon and text, never with those pastels. Lime is for the primary action and focus punctuation only.
2. **Destructive actions:** ink outline, a clear label, and a confirmation.
3. **Focus ring** (global in `index.css`): 3px ink outline, 4px offset, 7px lime shadow. Do not remove outlines.
4. **Type:** headings use the display serif at weight 500; eyebrows use `.ps-eyebrow` (mono, 0.72rem, bold, uppercase).
5. **Mobile first:** touch targets at least 44px where practical; no page-level horizontal overflow. Wide tables and code scroll inside `.ps-table-wrap` / `.ps-code-wrap`.
6. **No animation** on progress bars or for decoration. `prefers-reduced-motion` is respected globally. The flashcard flip utilities (`perspective-1000`, `preserve-3d`, `backface-hidden`, `rotate-y-180`) are the one deliberate exception.
7. **No new abstractions** unless they have at least two real consumers.
8. **No new dependencies or fonts** for visual reasons.

### 6.4 Shared building blocks (`StatusPrimitives.tsx`)

`SectionCard`, `ProgressBar`, `ClassificationTag` (Essential/Optional/Skip), `LanguageTag`, `ProvenanceInline`, `formatProvenance`, `formatTopicStatus`, `topicStatusTone`, and the option lists `TOPIC_STATUS_OPTIONS`, `ASSIGNMENT_STATUS_OPTIONS`, `REVISION_STATUS_OPTIONS`, `BONUS_STATUS_OPTIONS`. Reuse these rather than restyling status inline.

### 6.5 Layout details worth remembering

- Desktop sidebar 256px; active item has a sunken background and a 3px ink left border.
- Mobile: 56px sticky header, drawer with a 40% ink backdrop (no blur), 44px nav targets, fixed bottom nav (Home, Study, Syllabus, Revision) with a 2px lime top border. Page content keeps bottom padding (`pb-24 sm:pb-20 lg:pb-12`) so the bottom nav never covers it.
- **Tailwind v4 gotcha:** an arbitrary value with commas such as `pb-[calc(5rem+env(safe-area-inset-bottom,0px))]` did not compile. Use standard utilities or a named CSS class.
- Checkboxes use `rounded-none` and `accent-[var(--color-ink)]`.

---

## 7. Common tasks (recipes)

### 7.1 Add or edit curriculum, resources or assessments
1. Edit the relevant file in `src/data/`, following the type in `types.ts`. Set an accurate `provenance`.
2. New IDs must match `^[a-zA-Z0-9_\-]+$`, max 128 chars, and be unique within their collection.
3. For resources: set `mappedWeeks`, `defaultClassification`, a short `reason`, and `verified`. Use `weekClassifications` for per-week overrides.
4. Run typecheck and build; check the affected week in Curriculum, Study Room and Resource Library at 360px and 1440px.
5. Do not rename existing IDs (see 5.3).

### 7.2 Add a new view
See 5.1. Build it from `SectionCard`, `ProgressBar` and the tokens in section 6; apply the colour and mobile rules; test at 360x800, 390x844 and 1440x900.

### 7.3 Add a new persisted field or collection (checklist)

Missing any step causes silent sync failures or rejected writes.

1. **`types.ts`:** add the field or record type; add the collection to `AppDataState`.
2. **`AppStateContext.tsx`:** default in `createInitialState`; handling in `loadLocalState` and `importBackupJson`; a mutation that sets `updatedAt`; reset behaviour.
3. **`lib/sync/merge.ts`:** add the name to `CollectionName` and an entry in `SHAPES` (id, stamp, `appendOnly`, optional `limit`/`maxItems`).
4. **`lib/sync/codecs.ts`:** add a codec (to and from the Firestore document, with clamped strings).
5. **`firestore.rules`:** add a validator function and a `match` block with the same allowed keys (`hasAll`/`hasOnly`) and limits. For an added field on an existing collection, update the allowlists and validator.
6. **Tests:** `tests/codecs-rules.test.ts` (key parity with the rules), `tests/merge.test.ts`, fixtures in `tests/fixtures.ts`.
7. **Docs:** update `docs/security-spec.md`.
8. **Publish the rules** (section 9) **before** or together with the client release. Old clients and new rules (or the reverse) must be considered: a client that writes a field the live rules do not allow will fail to sync.
9. **Verify manually** on two browsers (the tests do not touch live Firebase).

### 7.4 Change a design token
Edit the `@theme` block in `src/index.css`. Then search for raw hex in `src/` (there should be none; see 11) and re-run the viewport checks for every view.

### 7.5 Change the number of weeks or support another course
Currently coupled to one course and 20 weeks (clamps in `AppStateContext.tsx` and week-based helpers in the data modules, plus Learning Plan and Dashboard assumptions). This is a larger refactor, covered in section 12.

---

## 8. Testing and quality gates

| Gate | What it covers | What it does not cover |
|---|---|---|
| `typecheck` | Types in `src/`, `tests/`, `vite.config.ts` | `strict` is **off** in `tsconfig.json`, so null/any issues are not caught |
| `lint` | `firestore.rules` via the Firebase rules ESLint plugin | **`src/**` is excluded** in `eslint.config.mjs`, so app code has no linting |
| `test` (53 tests, 8 suites) | merge/reconcile logic, sync metadata and backups, codec output vs `firestore.rules` key lists | Live Firebase, the Firestore emulator, any React component or view, cloud.ts |
| `build` | Compilation, env validation | Runtime behaviour |

Manual regression checklist (run before merging anything that touches state, sync or rules):
1. Sign in with Google; confirm status reaches `synced`.
2. Edit progress on browser A; refresh browser B and confirm it appears.
3. Go offline, edit, go online; confirm it syncs.
4. Delete a record on A; confirm B does not resurrect it.
5. Reset progress; confirm propagation.
6. Sign in with a different account on the same browser; confirm the previous account's data is backed up and cleared.
7. Export, reset, import.
8. UI: every changed view at 360x800, 390x844 and 1440x900, with `document.documentElement.scrollWidth <= window.innerWidth`.

Recommended additions (not done yet): run the rules in the Firestore emulator, a smoke test for views, and enabling ESLint for `src/`.

---

## 9. Deployment and environments

- **Hosting:** Vercel (Hobby). Framework preset Vite, build `npm run build`, output `dist`. Every push to a branch with an open PR creates a preview deployment. Pushing or merging to `main` deploys production.
- **Vercel env vars:** the four required `VITE_FIREBASE_*` variables must exist for **Production** and for **Preview** (otherwise the build fails by design). Redeploy after any change.
- **Firebase Console:** Authentication (enable Google sign-in); **Authorized domains** must list `localhost`, the production domain, and any preview domain you want to sign in from. Wildcards are not supported, so each Vercel preview URL needs adding by hand.
- **Firestore rules:** publish manually (Console, Rules tab, paste, Publish) or `firebase deploy --only firestore:rules`. Deploying the app does not do this. Rules are currently published.
- **API key restriction (recommended):** restrict the browser key to HTTP referrers for localhost, the production domain and `https://<project-id>.firebaseapp.com/*` (the last is needed for the sign-in popup).
- **Stay on Spark.** Do not enable Blaze; nothing requires it.
- **Security headers** are set in `vercel.json` (no content-security-policy is set yet).
- **Rollback:** use Vercel's rollback / promote-a-previous-deployment option in the dashboard. Rules rollbacks are manual in the Firebase Console (rules history).

### Release steps
1. Branch from `main` (`feature/<name>` or `fix/<name>`).
2. Work, run typecheck, lint, test, build; do the manual checks above for the areas touched.
3. Push, open a PR, wait for the Vercel preview. If sync was touched, add the preview domain to Firebase authorized domains and test sign-in and sync on it.
4. Publish rule changes if any.
5. Merge to `main` and check production.

---

## 10. Git workflow and conventions

### 10.1 History
`main` is production. The redesign went through `feature/paper-signal-foundation` in five commits and was merged by PR #1 (`388a904`). The remote branch `origin/feature/paper-signal-foundation` still exists and can be deleted.

### 10.2 Conventions
- Conventional commits: `feat(ui): ...`, `fix(ui): ...`, `chore: ...`.
- One logical change per commit; keep PRs reviewable.
- Never commit `.env*` (except `.env.example`) or any credentials.

### 10.3 Lockfiles
`bun.lock` is the committed lockfile. Using `npm install` produces `package-lock.json`, which is untracked and should stay that way unless you decide to move to npm. **Do not commit both**; check the Vercel install command before changing the package manager. The `check` script and the README assume Bun, while day-to-day development has used npm. Pick one and make the scripts and README consistent.

### 10.4 Dependencies
Versions use caret ranges on very recent majors (Vite 8, TypeScript 7, ESLint 10, Firebase 13, React 19). A prior install reported four high-severity transitive vulnerabilities and two flagged install scripts (`@firebase/util`, `protobufjs`). Handle these in a **separate** dependency PR with its own full test pass; do not run `npm audit fix` inside feature work.

---

## 11. Known issues and technical debt (prioritised)

Verified in `main`:

1. **`index.html` still contains legacy styling.** The `<body>` has classes `bg-[#F8FAFC] text-[#0F172A] selection:bg-[#DBEAFE] selection:text-[#1E3A8A]` (the old slate/blue palette), and the page loads Google Fonts (DM Sans, JetBrains Mono, Plus Jakarta Sans) that no longer match the design system's "no network fonts" rule. Utility classes on `<body>` can override the paper background from `index.css`. Fix: remove the body classes and font links, then check the page background and selection colour on all views. *(Not verified visually: confirm before and after.)*
2. **Lint does not cover app code** (`src/**` is ignored) and **TypeScript `strict` is off.** Enable them gradually.
3. **Single 1.8 MB JavaScript bundle** (about 1.82 MB minified; Vite warns). Static data, Recharts and Firebase are all in one chunk. Options: lazy-load views with `React.lazy`, split Recharts, and move bulk content to lazy-loaded modules.
4. **Firestore rules never run against the emulator** or Rules Playground.
5. **No automated UI or `cloud.ts` tests.**
6. **No state version migration.** `version` is fixed at 1; future schema changes need a migration step in `loadLocalState` and the importer.
7. **Import is lenient** (does not validate record shapes); a malformed file can write odd data locally.
8. **One course and 20 weeks are hard-coded** (section 12).
9. **No router / deep links.**
10. **No content-security-policy header.**
11. **Large files** (`AppStateContext.tsx`, `RevisionView.tsx`, `ProjectsView.tsx`, data modules) would benefit from splitting once changes are needed there; do not refactor for its own sake.
12. **Legacy token aliases** in `index.css` can be removed when unused.
13. **Docs inconsistencies:** README mentions Bun commands; this guide and daily use use npm. `docs/security-spec.md` is titled "Phase 0 TDD", which is just a leftover label.

---

## 12. Direction: from personal tracker to multi-course learning companion

The owner intends to turn this into an **independent (not official DataMites) learning companion** shared first with friends and fellow students. The core ideas:

- Students choose their course; the app holds curriculum structure for different courses; resources are navigated by that structure.
- Students add their own resources, references and notes, attached to curriculum topics.
- A **carefully curated** free resource library. A resource is included only if it meets all four standards: **quality**, **relevance** (current with industry practice), **clarity**, and **practical value**. Free or famous is not enough; weak or outdated resources are excluded deliberately. The goal is better learning, not more material.

Suggested build order (each step small and shippable; do the first as a read-only analysis):
1. **Discovery:** map every place that assumes a single course or 20 weeks (`clampInt(..., 1, 20)`, `OFFICIAL_CURRICULUM`, week-based helpers, Learning Plan, Dashboard, onboarding, nav labels such as "Official Curriculum").
2. **Curriculum as data ("course packs")** with stable topic IDs; AI Engineer becomes pack #1 with **no behaviour change** and a migration test proving existing progress still works.
3. **Course selection** in the profile and navigation filtered by it; add one second course as proof.
4. **Personal resources and notes**, private, attached to topic IDs, synced (follow checklist 7.3, including rules and tests).
5. **Curated library v1:** extend resource records with fields that make the standard visible (why recommended, level, free or paid, topic IDs, verdict against the four standards, last-reviewed date, status), keep a "rejected, with reasons" list, and keep the curated data versioned in the repo so only the owner changes it. Quality judgements belong to the owner or trusted reviewers.
6. **Freshness checks** (flag resources not reviewed for a set period).

**Content, branding and privacy to settle before sharing beyond close friends** (not legal advice):
- `docs/source-material/` contains a **DataMites brochure PDF** and course-derived material, and the app embeds the DataMites official syllabus. Showing other DataMites courses, or distributing the app widely, may need DataMites' permission. Do not use DataMites logos or wording implying it is official; add an "independent, unofficial companion" notice. Consider letting students enter or import their own syllabus structure instead of the app shipping other courses.
- Link to resources, do not copy them; respect each resource's licence.
- Other students' data stays private (rules already isolate per user); add a short privacy notice.
- **The repository was made public temporarily for this documentation.** It contains the brochure PDF, the SSD file tree and other source material. Make the repo private again, or remove `docs/source-material/` from the repo and its history, before leaving it public.

---

## 13. Working with AI coding agents (Antigravity / ChatGPT workflow)

Development so far used ChatGPT to write prompts and review, and Google Antigravity (Gemini Flash with Low/Medium/High effort) to implement. What worked, and what to keep:

- **Batch the work.** One prompt per group of related changes, not one prompt per small fix.
- **Keep a standing rules file** (Appendix A) in the repo root as `AGENTS.md` (or the location your agent tool expects) so prompts stay short. The rules file used during the redesign lived only on the developer's machine and is **not in the repo**; add it.
- **Pick the effort level:** Low for fully specified mechanical edits and git housekeeping; Medium for restyling or feature work within known patterns; High for planning, anything touching data model, sync, security rules or migrations, and for debugging unexplained failures. For High-risk work, ask for a plan first (no code changes), then implement.
- **Short reports.** Ask the agent for: files changed, check results, screens verified, decisions needed, issues not fixed, commit hash. Keep screenshots in a folder and read them yourself.
- **Verify on a real phone** with `npm run dev` and `http://<laptop-IP>:3000`.
- **Protect sensitive areas** in every prompt unless they are the task: `firebase.ts`, `lib/sync/*`, `firestore.rules`, auth, persistence, learning data, dependencies, `.env*`.
- Commit locally at the end of each batch; push and merge only with your approval.

---

## 14. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Build fails with a message about Firebase variables | `check-env.mjs` is strict on Vercel/CI. Add the four `VITE_FIREBASE_*` variables for that environment, or set `ALLOW_LOCAL_ONLY_BUILD=1` deliberately. |
| Sign-in popup fails (`auth/unauthorized-domain`) | The current domain is not in Firebase Authentication, Authorized domains. Vercel preview URLs must be added individually. |
| Sign-in works but data does not sync, or sync status shows `error` | Rules not published, a client write that does not match the rules (new field not in `hasOnly`), or email not verified. Check the browser console for `permission-denied` and compare with `firestore.rules`. |
| After a deploy, sync stopped for new fields | The client and live rules are out of step. Publish matching rules. |
| App shows local-only mode in production | Env vars missing at build time. Add them and redeploy (they are inlined at build). |
| A tab or card overflows on a phone | Check for `break-all` vs `break-words`, missing `min-w-0` in flex children, or a wide table outside `.ps-table-wrap`. |
| Tailwind class has no effect | An arbitrary value with commas or `calc()` and `env()` may not compile in Tailwind v4; use standard utilities or a named class. |
| Tests fail on import of `.ts` files | Node is older than 22.18. Upgrade Node. |
| Progress "disappeared" after content edit | A static ID was renamed or removed (section 5.3). Restore the ID or write a migration. |
| Shared computer shows previous user's data | Data is cached in localStorage and IndexedDB. Use Settings sign out and clear browser data. |

---

## 15. Documents that belong with this guide

These exist outside the repo today. Add them under `docs/` so the next developer has them:

| Document | Why | Where it is now |
|---|---|---|
| `WEBSITE_THEME_AND_UI_UX_DESIGN_SYSTEM.md` | Design authority for Paper & Signal | Owner's machine |
| `PAPER_AND_SIGNAL_IMPLEMENTATION_BLUEPRINT.md` | Component-level redesign plan and per-view decisions | Owner's machine (untracked) |
| `ui_ux_audit_report.md` | Original audit of the old UI and why decisions were made | Antigravity artifacts folder |
| `AGENTS.md` (Appendix A) | Rules for AI agents | Owner's machine (not committed) |
| Handover document | Product vision, decisions log, prompt workflow | Owner's files |
| A private **Accounts and access note** | Who owns GitHub, Vercel and Firebase projects; where env values live; who can publish rules. No secrets in it | Not written yet |

---

## Appendix A: Agent rules file (save as `AGENTS.md` or your tool's rules location)

```markdown
# Project rules (apply to every task)

## Project
AI Engineer Command Center. React 19, TypeScript, Vite 8, Tailwind v4 (tokens in src/index.css @theme), Firebase Auth + Firestore (Spark), local-first state in AppStateContext (localStorage key aiecc_state_v1). Use npm unless the project has switched to Bun.

## Git
- Work on a feature branch. Never modify main.
- Commit locally when checks pass. Never push, merge or deploy unless told.
- Do not commit package-lock.json, .env files, or planning documents unless told.

## Protected (do not change unless the task names them)
src/lib/firebase.ts, src/lib/sync/*, firestore.rules, auth, persistence and sync logic in AppStateContext, learning data and curriculum content (especially IDs), package.json dependencies, .env*, bun.lock. Never run npm audit fix.

## Design: Paper & Signal (light only)
Tokens: paper #f7f4ec, surface #fdfcf8, sunken #efebdf, ink #17191a, secondary #4a4f4c, line #827d71, line-soft #ddd8cb, project (peach) #f4d9c6, research (blue) #d2e0ea, writing (sage) #d5e2d0, signal (lime) #d3f03c. Use var(--color-*) tokens, not raw hex.
Fonts: system stacks only. No new fonts.
Style: square corners, hairline borders, no gradients, glows, heavy shadows, dark mode, or decorative animation.
Colour meaning: peach/blue/sage mean content type only (Projects/Research/Writing). Statuses are neutral (ink, sunken, border, weight, icon, label). Lime only for primary action and focus punctuation. Destructive actions: ink outline, clear label, confirmation.
Focus ring: 3px ink outline, 4px offset, 7px lime shadow.

## Code
- No new dependencies. No new abstraction without 2 or more real consumers.
- Preserve component props, behaviour, labels and data. Never rename or reuse static content IDs.
- Mobile first. Touch targets at least 44px where practical. No page-level horizontal overflow; wide tables and code scroll in their own wrapper.
- Prefer break-words for prose; break-all only for long URLs or paths.
- Tailwind v4: avoid arbitrary values with commas or calc/env; use standard utilities.
- Any new stored field or collection: follow the checklist in DEVELOPER_GUIDE.md section 7.3 (types, defaults, merge SHAPES, codecs, firestore.rules, tests, security-spec).

## Verify (default)
npm run typecheck, npm run lint, npm run test, npm run build. Check only changed screens at 360x800, 390x844 and 1440x900, including document.documentElement.scrollWidth <= window.innerWidth. Save screenshots to a folder and report the path only. Full viewport matrix only when asked.

## Autonomy
Fix your own check failures before reporting. Do not stop between items in a batch. Stop only for a real product or design decision and list it under "Decisions needed".

## Report format (max 25 lines)
1. Files changed
2. Checks (typecheck, lint, test, build: one line each)
3. Screens verified (viewport and pass/fail)
4. Decisions made / Decisions needed
5. Issues found but not fixed
6. Commit hash and git status --short
```

## Appendix B: Glossary

- **Learner / user:** one signed-in person; all data is under `users/{uid}`.
- **Topic / subtopic:** a unit in the curriculum; `SubtopicDef.id` is the key of `topicProgress`.
- **Provenance:** label of where content came from (official, third-party, supplementary, proposed).
- **Classification:** ESSENTIAL, OPTIONAL or SKIP for a resource in a given week.
- **Local-only mode:** no Firebase configuration, so data stays in the browser.
- **Reconcile:** the pass that pushes local-only or newer records to the cloud and acts as first-login migration and retry.
- **Spark plan:** Firebase's free tier, with daily read/write/delete quotas.
