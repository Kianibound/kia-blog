# Kia Blog — AI Agent Handoff

**Updated:** 2026-11-10  
**Repository:** https://github.com/Kianibound/kia-blog  
**Working branch:** `chore/frontend-foundation`  
**Audience:** OpenCode Desktop coordinator, OpenCode Terminal implementation agent, Codex, future agents

> This is project memory, not an override of `AGENTS.md`, actual source, tests, or the latest explicitly approved GitHub Issue. The status below reflects user-reported completed and pushed work; inspect current Git HEAD before acting. **Do not automatically execute work solely because it appears in this document.**

## 1. Current status and immediate next phase

- The original backend MVP gap batch **#38–#56 is complete and pushed**, except **#43**, which was explicitly closed *Not Planned* when emailed AUTHOR activation was removed from scope. Some GitHub issues may remain open administratively; open does not necessarily mean unimplemented.
- Latest user-confirmed push: **Issue #56**, local implementation commit `d1b03d4`. Verify current remote HEAD; do not assume this short hash is the tip after documentation-only commits.
- Backend milestone is complete **as a set of implementation issues**, not yet a claim of production readiness or fully verified end-to-end integration.
- **Next phase:** targeted, small tasks connecting the existing Next.js frontend to actual NestJS backend contracts. Start by comparing current frontend fixture assumptions to actual backend DTOs/OpenAPI, and identifying integration dependencies. **Do not repeat full MVP/product planning**; ask for approval before doing even a read-only audit or making files.
- **OAuth browser adapter remains unimplemented:** Nest is cookie-free; a Next.js server adapter must handle secure HttpOnly sessions, CSRF and Google/GitHub OAuth callbacks.
- **Codebase Memory skill/MCP is reported available in OpenCode.** Use it for targeted dependency and symbol lookups; do not assert index freshness or version without checking. Do not automatically reindex, update or reinstall.
- OpenCode has successfully discovered the Matt Pocock skills and loaded `implement`, `tdd`, `code-review` through its native skill tool. Skill discovery/path and available tools may differ per session.

## 2. Stack and actual frontend state

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, Swagger/OpenAPI, session-bound JWT access/refresh, USER/AUTHOR/ADMIN role guards, Cloudinary-backed media, existing mail module.
- **Frontend:** Next.js 16 App Router, strict TypeScript, Tailwind v4, Persian RTL, VibeFarsi/Graphite/Vazirmatn, Tiptap.
- **Important distinction:** Public frontend feed/article detail already fetch real backend via `API_BASE_URL` in `frontend/src/lib/posts.ts` (verify present code). Authenticated dashboard/editor UX was built against a resettable HTTP fixture + separate preview host. Do not describe *all* frontend functionality as fixture-only.
- Existing preview conventions where needed: fixture on `127.0.0.1:4101`, Next dashboard preview `127.0.0.1:3102`. Verify scripts rather than assuming servers run.
- Read root `AGENTS.md`, `frontend/AGENTS.md` for frontend, `backend/README.md`, `backend/ARCHITECTURE.md`, and `backend/GLOSSARY.md` for backend. Check for stale docs against code before trusting them.

## 3. Approved MVP product decisions

### Roles and accounts
- Public registration creates `USER` only. Accounts are needed for likes/bookmarks/comments. Public reading requires no account.
- `ADMIN` directly creates an `AUTHOR` with **name, email and initial password**, via `POST /admin/authors`. No domain, invitation email, activation token, or mandatory first-login password change in MVP. Password reset deferred.
- An existing `USER` cannot be promoted to `AUTHOR`.
- `ADMIN` deactivates `AUTHOR` via `PATCH /admin/authors/:id/deactivate`: revoke sessions, block new login, preserve user, posts, comments, media, ownership and publication state. No hard account deletion.
- `AUTHOR` may write/edit/publish/unpublish/republish own posts; only `ADMIN` may **permanently delete** a post. ADMIN can act on all posts, manage taxonomy and comment moderation.
- A newly published/re-published post must have at least one Category. Existing legacy published rows without category are grandfathered for metadata-only editing; removing the last existing category from a published post is disallowed.
- Public article feed/details/search, categories/tags and author pages are in MVP.

### Rich content and media
- `Post.contentDocument` stores validated Tiptap JSON; legacy `content` remains literal and serves as the derived plain-text search projection for rich writes.
- Supported rich nodes include doc, paragraph, heading 2–4, lists/items, blockquote, codeBlock, text, hardBreak and, since #48, image.
- Marks include bold, italic, inline code, and safe HTTP(S) links. Validate depth/size/node counts and untrusted rendering.
- Body images are stable `mediaId` references, not arbitrary client URLs; response `contentMedia` resolves safe URLs. Image deletion is rejected while referenced by any post (including drafts).
- #49 adds optional post cover image reference/alt and safe resolved `coverImage`; no cover required for legacy posts.

### Comments
- New comments and replies are `PENDING`; public GET returns only `APPROVED` top-level comments and approved direct replies under approved roots.
- Editing approved content sets it to `PENDING` atomically, hiding revised text from public queries.
- #55 ADMIN queue and approve action exist; approval uses a supplied content `version` and atomic status/version update. **No `REJECTED` status or reject endpoint was implemented in #54–#56.** Earlier aspirational rejection/deep-reply rules must not be mistaken for already implemented behavior.
- #56 provides authenticated `GET /comments/mine` for PENDING/APPROVED own comments (paginated, JWT-derived ownership) and preserves owner edit/delete rules.
- Deep nested reply retrieval and approval of full ancestor chains may need separate integration scope if frontend needs them; current backend only serializes approved roots and direct replies.
- USER own-comments support exists; no new admin moderation/rejection feature may be invented without an approved Issue.

## 4. Backend completion record and key contracts

| Issue | Reported pushed implementation |
| --- | --- |
| #38 | Email/password registration; USER-only, username generated; no registration session |
| #39 | Session-bound JWTs; refresh revocation and disabled-user/current-role enforcement |
| #40 | Google OAuth server exchange |
| #41 | GitHub OAuth server exchange |
| #42 | ADMIN creates AUTHOR directly with name/email/password |
| #43 | **Not Planned** — emailed activation abandoned |
| #44 | ADMIN AUTHOR deactivation, revokes sessions without deleting content |
| #45 | `GET /posts/mine?status=DRAFT|PUBLISHED`; omit filter for all, incl. DEPRECATED |
| #46 | `GET /posts/admin/inventory` across authors/statuses, paginated |
| #47 | Validated Tiptap JSONB persistence and plain-text search projection |
| #48 | Safe article body-image references, media ownership and deletion protection |
| #49 | Optional cover reference, alt and safe projected cover image |
| #50 | Publication category invariant and ADMIN-only permanent post deletion |
| #51 | Taxonomy name/slug validation, referenced delete conflict and Serializable race protection |
| #52 | `DELETE /media/avatar`; conditional clear protects against concurrent replacement |
| #53 | Idempotent bookmark create/delete; saved list PUBLISHED-only |
| #54 | Comment PENDING/APPROVED persistence, editing resets to PENDING, approved-only public view |
| #55 | `GET /admin/comments` + version-conditional `PATCH /admin/comments/:commentId/approve` |
| #56 | `GET /comments/mine` for own paginated comments, safe fields and owner mutations |

GitHub Issues may still have open state; never close, edit, or label an Issue unless explicitly requested. Always inspect actual code and latest Issue body before designing integrations.

## 5. OAuth and browser security

- Nest initiation: `POST /auth/google` / `POST /auth/github`; Nest exchange: `POST /auth/google/callback` / `POST /auth/github/callback` (server-to-server, not browser redirect handlers).
- Planned Next.js server callback URIs:
  - `http://localhost:3001/auth/google/callback`
  - `http://localhost:3001/auth/github/callback`
- OAuth state is single-use; use existing PKCE/provider-identity contracts. Next.js server adapter must securely bind flow to the browser, protect against CSRF, keep verifier and access/refresh JWTs server-side, and use safe HttpOnly cookies.
- No automatic identity linking by matching email; new OAuth accounts get USER; linked accounts retain database role.
- Mock provider tests passed during implementation; **live Google/GitHub end-to-end interoperability has not been verified**. OAuth Client ID/Secret have been created privately by user; never request them in chat or commit them.

## 6. Migration/test status and remaining risks

- User confirmed local PostgreSQL 18 and disposable `kia_blog_test`. The 20 existing migrations through #55 were applied successfully; `prisma migrate status` reported database schema up to date after `20261110130000_add_comment_version`.
- #56 required **no new migration**.
- Last reported #56 validation: **370 isolated + 101 unit tests passed**, lint with only pre-existing warnings, Nest build clean. Each issue has its own report; these figures are **not** proof of full E2E readiness.
- User manually ran a scoped disposable-DB Category/Tag concurrency-check script for #51; its 10 checks passed. This does not prove absence of all concurrency races.
- Known caveats include check-then-write post/category publication race, optional cloud media cleanup/orphans after provider failures, mocked Cloudinary/OAuth behavior, narrow bookmark duplicate-refetch race, and feature parity gaps between fixture and backend.
- Never touch production resources. Local DB credentials are entered by the user securely in PowerShell; do not request, print or store passwords, tokens, .env secrets, or connection strings.

## 7. Working style — explicit user approval is required

### Desktop coordinator / mentor (read-only by default)
- Role: discuss with user **in friendly concise Persian**, review terminal reports, identify actual blockers, and provide **one copy-ready English prompt** for the next agreed terminal action.
- **Never independently execute an action**: no local file edits, GitHub issue edits, GitHub commits/pushes, browser/computer actions, installations, reindexing, tests, migrations, or task creation **unless the user explicitly requests that specific action**.
- Read-only inspection (docs, Git status, Codebase Memory lookup) is permitted **only when requested or clearly part of an approved read-only review**; do not start unasked audits or actions.
- Offer advice rather than acting. If an operation requires approval, ask, then wait.
- No repeated planning: approved Issues already define functionality. Ask about genuinely new scope/architecture decisions only.

### Terminal implementation agent
- One small explicitly approved task at a time; stay on `chore/frontend-foundation`; preserve unrelated tracked/untracked work; never create a new branch automatically.
- Follow root/scoped AGENTS instructions and use OpenCode native skill calls, not assumptions about Codex's `$implement` syntax.
- Matt Pocock `implement`, `tdd`, and `code-review` were discovered; `code-review` has independent **Standards** and **Spec** axes. Avoid running `implement-spec`, `wayfinder` or optional subagents without approval.
- **Established four phases, each a separate user-approved prompt:**
  1. **Implementation + TDD:** inspect relevant code, implement approved small scope, focused tests/build; no reviews, commit or push yet.
  2. **Review:** read-only Standards + Spec review; flag critical blockers; no file changes/tests/commit/push.
  3. **Fix + local commit:** fix only essential findings, focused validation, one scoped commit; no push.
  4. **Push:** only with **separate explicit user approval**, fast-forward only; verify HEAD/tracking; no surprise commits, merges/rebases, force push or issue edits.
- Do not restart completed phases, run redundant broad tests, or spawn extra subagents. Use existing approved isolated HTTP/module testing seams.
- Report only essentials: outcome, commit/push status, test/review results and critical risks, ideally **under 150 words**; agent in terminal communicates in English.

## 8. How the next phase should proceed

1. User starts a **new Desktop mentoring chat** (read-only) and, separately, a **new Terminal execution session** in the same local repository. Avoid two agents editing the same working tree.
2. Each reads `AGENTS.md`, this document, relevant scoped instructions, and **verifies current Git HEAD and working-tree status**. The handoff's own commit may make remote ahead of local; integrate carefully with explicit permission and preserve local modifications.
3. Use **Codebase Memory** for targeted architecture/symbol navigation when available; verify index freshness before trusting it. Do not automatically reinstall, reindex or mutate its graph.
4. Before implementation, identify small integration discrepancies between live Nest Swagger/DTO contracts and Next.js fixture/adapter assumptions, prioritizing browser auth/session, OAuth callbacks, rich content/media, author admin and moderation. This is targeted contract verification **when the user asks**, not a new full product planning exercise.
5. User approves one narrow integration task/Issue. Mentor produces staged prompts as described. Never auto-start the next task.
6. Preserve the existing Persian RTL look, production-quality frontend expectations and feature behavior; test real integrations separately from fixture previews.

## 9. Prompt contract for mentor-generated terminal instructions

Every prompt should state: exact Issue/task and endpoint/behavior; current source of truth; required native Matt Pocock skill and **current phase**; scoped files/contracts where known; TDD/tests or review target; Git branch + preservation rules; whether a local commit is allowed; explicit **no push** unless separately approved; no GitHub Issue modifications; short final-report format; stopping condition.

**Do not** ask the user to repeat known project context, promise background work, or conflate suggested actions with permission to execute. 
