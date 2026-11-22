# AGENTS.md — AI Engineer Command Center Entry Point

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS AND DEVELOPERS:**  
> Before making any changes to this codebase, you MUST read the following foundational documents in `developer/`:
> 1. [developer/AGENTS.md](file:///d:/ai-engineer-command-center/developer/AGENTS.md) — Standing operational rules, constraints, protected code paths, design system requirements, and verification protocols.
> 2. [developer/README.md](file:///d:/ai-engineer-command-center/developer/README.md) — Full project architecture, handover documentation, local-first data sync mechanics, and developer guide.
> 3. Context-specific documentation in `developer/`:
>    - [developer/DEVELOPER_GUIDE.md](file:///d:/ai-engineer-command-center/developer/DEVELOPER_GUIDE.md) — Implementation details, state shape, codecs, conflict resolution, and schema extension checklists.
>    - [developer/WEBSITE_THEME_AND_UI_UX_DESIGN_SYSTEM.md](file:///d:/ai-engineer-command-center/developer/WEBSITE_THEME_AND_UI_UX_DESIGN_SYSTEM.md) — Canonical Paper & Signal design tokens, typography scales, and visual rules.
>    - [developer/PAPER_AND_SIGNAL_IMPLEMENTATION_BLUEPRINT.md](file:///d:/ai-engineer-command-center/developer/PAPER_AND_SIGNAL_IMPLEMENTATION_BLUEPRINT.md) — Architectural component blueprint and implementation history.
>    - [developer/ui_ux_audit_report.md](file:///d:/ai-engineer-command-center/developer/ui_ux_audit_report.md) — Baseline UX audit findings, responsive standards, and accessibility requirements.

---

# Project rules (apply to every task)

## Project
AI Engineer Command Center. React 19, TypeScript, Vite 8, Tailwind v4 (tokens in src/index.css @theme), Firebase Auth + Firestore (Spark), local-first state in AppStateContext (localStorage key aiecc_state_v1). Use npm (Bun is not installed).

## Git
- Work on feature/paper-signal-foundation. Never modify main directly.
- Commit locally when a task passes all checks. Never push, merge or deploy unless told.
- Do not commit package-lock.json.

## Protected (do not change unless the task names them)
src/lib/firebase.ts, src/lib/sync/*, firestore.rules, auth, persistence and sync logic in AppStateContext, learning data and curriculum content, package.json dependencies, .env*, bun.lock. Never run npm audit fix.

## Design: Paper & Signal (light only)
Tokens: paper #f7f4ec, surface #fdfcf8, sunken #efebdf, ink #17191a, secondary #4a4f4c, line #827d71, line-soft #ddd8cb, project (peach) #f4d9c6, research (blue) #d2e0ea, writing (sage) #d5e2d0, signal (lime) #d3f03c. Use var(--color-*) tokens, not raw hex.
Fonts: display serif stack, body Segoe UI stack, mono Cascadia Code stack. No new fonts.
Style: square corners, hairline borders, no gradients, glows, heavy shadows, dark mode, or decorative animation.
Colour meaning: peach/blue/sage mean content type only (Projects/Research/Writing). Statuses (complete, in progress, essential, optional, etc.) are neutral: ink, sunken, border, weight, icon, label. Lime only for primary action, active-week/focus punctuation. Destructive actions: ink outline, clear label, confirmation.
Focus ring: 3px ink outline, 4px offset, 7px lime shadow.

## Code
- No new dependencies. No new abstraction unless it has 2 or more real consumers.
- Preserve component props, behaviour, labels and data.
- Mobile first. Touch targets at least 44px where practical. No page-level horizontal overflow; wide tables/code scroll inside their own wrapper.
- Prefer break-words for prose; use break-all only for long URLs or paths.
- Tailwind v4: avoid arbitrary values with commas; use standard utilities.

## Verify (default)
npm run typecheck, npm run lint, npm run test, npm run build. Check only changed screens at 360x800, 390x844 and 1440x900, including document.documentElement.scrollWidth <= window.innerWidth. Save screenshots to a folder; report the folder path only. Do the full viewport matrix only when asked.
If the dev server port is busy, report it; do not kill unrelated processes.

## Autonomy
Fix your own check failures before reporting. Do not stop between items in a batch. Stop only for a real product or design decision, and list it under "Decisions needed".

## Report format (max 25 lines)
1. Files changed
2. Checks (typecheck, lint, test, build: one line each)
3. Screens verified (viewport and pass/fail, one line each)
4. Decisions made / Decisions needed
5. Issues found but not fixed
6. Commit hash and git status --short
