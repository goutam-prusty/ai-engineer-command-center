# Repository Cleanup Audit

**Date:** 22 November 2026  
**Repository:** `goutam-prusty/ai-engineer-command-center`  
**Scope:** Portable developer context and low-risk legacy cleanup

## Summary

The repository was reviewed before deleting files or dependencies. The current tracked source tree is compact: the app entry point imports the application shell and its ten views; the context, Firebase, sync, data, configuration, and test files support active application paths.

No application source module, curriculum source file, security rule, test, or dependency was proven obsolete. Those files were retained rather than removed based on guesses about future use.

## Verified cleanup performed

1. **Removed unused external font downloads from `index.html`.** The document preconnected to Google Fonts and downloaded DM Sans, JetBrains Mono, and Plus Jakarta Sans. The actual Paper & Signal CSS in `src/index.css` uses operating-system font stacks (Iowan/Palatino/Georgia, Segoe UI/Arial, Cascadia Code/Consolas), so those downloads were not used by the current theme.
2. **Removed the old blue starter-theme classes from the HTML body.** The old slate/blue background, text, and selection classes conflicted with the Paper & Signal CSS tokens. Global page colors are already defined in `src/index.css`.
3. **Made developer entry-point links portable.** Root `AGENTS.md` now uses repository-relative paths; `developer/README.md` uses same-folder links.
4. **Made audit report references portable.** Source-code references now use paths relative to `developer/`. Screenshot references that pointed into a local Windows/Antigravity workspace are labeled as historical local evidence rather than presented as working repository links.
5. **Added this audit record** and linked it from the developer knowledge-base index.

## Files deliberately retained

| Area | Files / directories | Why they remain |
|---|---|---|
| Application entry and views | `index.html`, `src/main.tsx`, `src/App.tsx`, `src/components/`, `src/views/` | Form the current Vite/React application and its ten active views |
| Application state | `src/context/`, `src/types.ts`, `src/lib/util.ts` | Own persisted state, UI state, IDs, and typed domain models |
| Firebase and sync | `src/lib/firebase.ts`, `src/lib/sync/`, `firestore.rules`, `firebase.json`, `.env.example`, `scripts/check-env.mjs` | Required for Google authentication, Firestore, offline cache, reconciliation, backups, and security |
| Learning content | `src/data/`, `docs/source-material/` | Curriculum, resources and assessments rely on stable IDs and source provenance; deleting or rewriting them can detach learner progress or remove source traceability |
| Quality and hosting | `tests/`, `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `eslint.config.mjs`, `vercel.json` | Build, typecheck, security-rule linting, tests, dependency reproducibility, and Vercel hosting |
| Project continuity | Root `README.md`, `AGENTS.md`, `developer/`, `docs/security-spec.md` | Onboarding, agent rules, implementation history, security invariants, and design decisions |

## Candidates not deleted — require more evidence

- **`docs/source-material/AI_Engineer_AI_Studio_Knowledge_Base_04c40571.md`:** Its name suggests an older AI Studio export, but it may retain curriculum/resource source material or migration context. Keep until each section is mapped to current static data and confirmed unnecessary.
- **Other files under `docs/source-material/`:** Preserve the brochure, lecture indexes, and SSD tree while curriculum/resource records depend on their provenance.
- **Backward-compatible CSS aliases in `src/index.css`:** The file labels these as compatibility tokens from a staged migration. Confirm all static and dynamically composed class references before removing any.
- **Dependencies in `package.json`:** No dependency was removed. Perform a complete import/config/runtime usage analysis and build/test run before considering a package obsolete.
- **Historical audit screenshots:** Their original image files are not present in this repository. The report keeps their filenames, but fresh screenshots should be captured and committed only if they are still useful evidence.

## Safety decisions

- No changes were made to Firebase configuration, Firestore rules, localStorage schemas, sync logic, learner data, curriculum IDs, package dependencies, or hosting configuration.
- No source-material archive was deleted.
- No production deployment or Firebase operation was performed.
- Any further deletion should be proposed with evidence of non-use, checked against the developer guide, and validated with typecheck, lint, tests, and a production build.
