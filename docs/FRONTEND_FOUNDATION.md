# Frontend foundation and planning handoff

Date: 2026-10-23. Branch: `chore/frontend-foundation`.

Follow-up on the same date: see `PREPARATION_FOLLOWUP.md` for the current
Matt Pocock configuration status, diagnosed sandbox/cache failure, security
reachability assessment and detailed minimal backend proposals. That report
supersedes the initial pending-setup and unknown-cause statements below.

## Results

| Area | Result |
|---|---|
| Repository | Opened original checkout read only, cloned separately, fetched GitHub main; baseline `4e08858` |
| Frontend | Separate `frontend/` npm application; Next 16.4.2 stable from npm, App Router, React 19, strict TS, Tailwind v4, ESLint |
| VibeFarsi | Official CLI 2.0.0 initialized Graphite tokens, Vazirmatn, utilities and frontend-scoped guidance |
| Language | Persian copy/metadata centralized; `fa`/`rtl` config; logical classes; Persian foundation and not-found pages |
| Feature implementation | None; no API client, auth workflow, blog screen or feature tickets |
| Codebase Memory | Official v0.12.1 download checksum verified; CLI failed loading saved runtime settings. No successful index/query/persistence verification |
| VibeFarsi MCP | Manual HTTP initialize, tools/list and registry search succeeded; persistent Work tool registration not verified |
| Matt Pocock | User approved proposal; root AGENTS.md and docs/agents config active. Four remote labels still pending authenticated label-capable access |
| Backend / production | No code, database, deployment or configuration changes |

## Verification

`npm install`, `npm run lint`, `npm run build`, `npm run typecheck` passed.
Production preview (`npm start`) listened on port 3001. Browser checks showed
Persian content, `lang=fa`, `dir=rtl`, computed Vazirmatn font and no horizontal
overflow at 390px and 1280px. No blog API request occurs during the build.
Final HTTP checks returned 200 for `/` and a Persian 404 for a missing path;
both documents had `lang=fa` / `dir=rtl`. `npm ls --all` exited successfully
with no invalid peer dependencies. Staged diff checks passed; backend diff empty.

`npm audit --omit=dev` reported zero vulnerabilities. Full audit reported five
high findings along the **development-only** chain
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
Root advisory: GHSA-vfj7-8cjw-p6xm, braces <=3.0.3 stack exhaustion on deeply
nested patterns. npm's current latest braces is 3.0.3; the suggested forced fix
downgrades Next lint configuration to 14.2.35 and was not applied. Recheck upstream
before accepting arbitrary external lint patterns. This is an unresolved tooling
risk, not a production-runtime finding.

ESLint 10.13.0 was evaluated, but installed Next React/import/a11y plugin peer
ranges reject it. Kept scaffold-compatible ESLint 9.39.5 rather than leaving an
invalid dependency tree. npm reports ESLint 9 as no longer supported; upgrading
lint tooling remains pending compatible upstream releases. No force/legacy-peer
installation policy is committed.

The foundation is committed locally on the dedicated branch. Push is held:
the user's instruction made push conditional on everything being OK, while
the high-severity development dependency findings remain unresolved. No merge,
deployment or production change was performed.

Public backend GET/OPTIONS probes verified health, Swagger, OpenAPI, feed shape,
and localhost:3001 CORS. There are 34 OpenAPI paths / 44 operations, with empty
component schemas. Details and source evidence: `BACKEND_INTEGRATION_READINESS.md`.
Authenticated/live-write integration remains unverified.

## Decisions still needed

1. Scope of the first release: reader experience, account, author workspace,
   admin surface; which vertical slice comes first.
2. Session architecture (recommended Next server boundary / HttpOnly cookies),
   token expiry and revocation expectations.
3. Content format/editor and sanitization; whether cover images/excerpts belong
   in the approved scope.
4. Email verification policy and UI landing routes; one-level vs deeper replies;
   persistent interaction-state UX.
5. Design direction: Graphite is the official initialization default, not a final
   visual choice. Persian launch only; English/LTR later.
6. Approval of narrowly scoped backend changes for draft taxonomy projections
   and complete OpenAPI typing; additional endpoints only as scope requires.
7. Authenticated access to create four missing remote labels (tracker/default
   labels/root AGENTS.md already approved), and a local environment where
   Codebase Memory can index and demonstrate restart persistence.
8. Acceptance or upstream resolution of the documented lint dependency risks.

## Exact next action

Local `/setup-matt-pocock-skills` configuration is now active. Remote labels
need `scripts/setup-triage-labels.ps1` in an authenticated GitHub CLI environment.
Report the follow-up findings before invoking the next skill; the user explicitly
requested this stop. After reviewing them and agreeing to continue, the proposed
next invocation remains:

```text
/wayfinder
Destination: agree the scope, session architecture, content model and UI/UX
direction for Kia Blog's Persian frontend, ending in a reviewable specification.
Use docs/BACKEND_INTEGRATION_READINESS.md and preserve the backend approval gate.
Start by agreeing the destination with me; do not implement features.
```

This is a recommendation, not a skill execution or implicit ticket approval.
Wayfinder fits the multi-session effort. `/grill-with-docs` fits an individual
bounded decision once the effort is narrowed. Continue Discovery → Decisions →
UI/UX → Specification → Tickets → Implementation → Review → Retrospective only
after the applicable approvals.
