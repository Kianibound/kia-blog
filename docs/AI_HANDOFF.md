# Kia Blog — AI Agent Handoff

**Updated:** 2026-11-07  
**Repository:** https://github.com/Kianibound/kia-blog  
**Working branch:** `chore/frontend-foundation`  
**Audience:** Codex, OpenCode, and any temporary coding agent

> This file is project context, **not** an override of `AGENTS.md`, scoped agent instructions, live code, or the latest approved GitHub Issue. Verify branch, repository state, and Issue text before acting. This handoff reflects user decisions and reported implementation outcomes, not an independent code audit.

## 1. Purpose and current status

Kia Blog is a portfolio-oriented Persian RTL full-stack blogging platform. The frontend MVP was built primarily against an HTTP fixture, while backend gaps are being completed as small, sequential GitHub Issues before real frontend/backend integration.

**Current handoff point:** Backend Issue **#47** (canonical Tiptap JSON persistence) has been committed and **pushed**. Issue **#48** (article body image references and media safety) has been handed to **OpenCode and may be actively running**. Inspect its current working tree and Git history; do **not** launch another implementation of #48 or modify its files in parallel.

Reported latest completed implementation for #47: commit `a6a3831b556232ce9d943ec509f390ad997ae643`. Confirm the latest remote HEAD independently; another agent or this documentation commit may have advanced the branch.

## 2. Stack and architecture

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, JWT access/refresh authentication with session revocation, role-based guards, Swagger/OpenAPI, Cloudinary-based media, existing mail integration.
- **Frontend:** Next.js 16 App Router, strict TypeScript, Tailwind CSS v4, Persian RTL, VibeFarsi / Graphite UI conventions, Vazirmatn typography, Tiptap editor.
- **Roles:** `USER`, `AUTHOR`, `ADMIN`.
- Backend source and contracts are authoritative; read `backend/README.md`, `backend/ARCHITECTURE.md`, `backend/GLOSSARY.md`, root `AGENTS.md`, and `frontend/AGENTS.md` for frontend work.
- The frontend fixture is *not* proof of live backend integration. Do not silently assume every fixture endpoint exists in production.

## 3. Approved MVP behavior

### Public / USER
- Public feed, article details, search, category/tag lists, public author pages, and visible approved discussions.
- Public registration creates `USER` only; email/password login and planned browser-integrated Google/GitHub login.
- Accounts are required for likes, bookmarks, and comments.
- Private account area includes bookmarks and basic profile/settings; own-comment management is included in MVP.

### AUTHOR
- `ADMIN` creates AUTHOR directly using **name, email, and initial password**. No invitation email, domain requirement, activation token/link, mandatory first-login password change, or MVP password-reset flow.
- Existing `USER` accounts **must not** be promoted to `AUTHOR`, including by ADMIN.
- AUTHOR may create, edit, publish, unpublish, and republish **own** posts without approval; may not permanently delete posts.
- Publishing requires at least one ADMIN-managed category; tags optional; draft may have no category.
- Rich article body features include headings, lists, quote, code blocks, inline code, links, and eventually media references. Editor/renderer behavior must match actual backend allowlist.
- AUTHOR has no special moderation permissions.

### ADMIN
- May create/deactivate AUTHOR accounts, manage authors, read all-author article inventory, manage taxonomy and moderation, and edit/publish/unpublish/permanently delete any post.
- Deactivating AUTHOR **must** revoke sessions and prevent protected operations while preserving user record, articles, comments, media, ownership and publication state.
- No automatic hard deletion when an author is removed.

### Comments
- New comments and replies require ADMIN approval.
- Only approved comments whose ancestors are all approved are publicly visible; counts must use the same visibility rules.
- Replies to replies permitted, without fixed backend depth limit.
- Editing an approved comment returns it to `PENDING` and hides it until reapproval; descendants of hidden parents are also hidden.
- Users may edit/delete own `PENDING` or `APPROVED` comments; `REJECTED` comments remain retained and cannot be edited/resubmitted by USER.
- ADMIN may delete any comment; ADMIN may edit only own comments. Deleting a comment permanently removes its descendants.
- USER My Comments is part of the scope; rejected comment administration is reserved for ADMIN.

## 4. Authentication decisions and reported contracts

### Base auth / sessions
- #38 email-based registration: `USER` only; username generated automatically; use existing backend password policy. Registration does not create a login session.
- #39 security: access JWT bound to a session; guards check current DB role, user disabled state, ownership, expiry and revocation. Logout/refresh/session restrictions already exist.
- NestJS remains **cookie-free**. Future **Next.js server adapter** handles browser sessions, HttpOnly cookies, CSRF, and server-side token storage. Never expose access/refresh tokens in redirect URLs or client-visible configuration.

### OAuth (backend implemented, live browser integration not yet proven)
- Google #40: `POST /auth/google` initiation and `POST /auth/google/callback` server exchange; intended Next.js callback `http://localhost:3001/auth/google/callback`.
- GitHub #41: `POST /auth/github` initiation and `POST /auth/github/callback` server exchange; intended Next.js callback `http://localhost:3001/auth/github/callback`.
- Both use short-lived single-use state; PKCE and provider checks as implemented. The initiation API returns authorization URL + flow verifier; **future adapter must keep the verifier and resulting JWTs server-side**, bind flow to browser session and enforce CSRF controls.
- New OAuth identities get `USER`. Existing linked identities retain their DB role. Never automatically link solely on matching email; GitHub new users require a verified primary email.
- OAuth provider tests so far used mocks. Real provider and browser callback interoperability remain deferred.
- Never ask for, print, log, store in repository, or commit OAuth secrets or database credentials.

### AUTHOR administration
- #42: `POST /admin/authors` ADMIN-only; body `{ name, email, password }`; returns safe AUTHOR account, immediate email/password login; duplicate emails rejected; no USER promotion.
- #44: `PATCH /admin/authors/:id/deactivate` ADMIN-only; idempotent, transactional disabled state/session revocation; returns safe account + `disabledAt`; cannot target USER/ADMIN.

## 5. Implemented and pushed backend issues (reported)

| Issue | Summary |
| --- | --- |
| #38 | Email/password registration and login contract |
| #39 | Revocable JWT-bound session and disabled-user foundation |
| #40 | Google OAuth server-side exchange |
| #41 | GitHub OAuth server-side exchange |
| #42 | ADMIN creates AUTHOR with name, email, password |
| #44 | ADMIN deactivates AUTHOR and invalidates sessions |
| #45 | `GET /posts/mine?status=DRAFT|PUBLISHED` optional status filter, otherwise all including DEPRECATED |
| #46 | `GET /posts/admin/inventory` ADMIN-only cross-author paginated summary for all statuses |
| #47 | Tiptap JSON document persistence, validation and plain-text search projection |

**#43** (emailed author activation) was closed **Not Planned** and must not be reintroduced as MVP scope.

### #47 specifics relevant to #48
- Added nullable Prisma/PostgreSQL JSONB `Post.contentDocument`; migration `20261107193000_add_post_content_document` verified on disposable PostgreSQL.
- Existing create/update APIs accept either legacy string `content` or structured `contentDocument`; supplying both is rejected.
- Rich writes derive searchable plain-text `content`; PATCH omission preserves both; string replacement clears rich document.
- Read responses include both, with `contentDocument: null` for legacy records. Legacy content remains literal, even if HTML/JSON-looking.
- Current rich nodes: doc, paragraph, heading levels 2–4, bullet/ordered list, list item, blockquote, code block, text, hard break.
- Marks: bold, italic, code, link. Validation limits attributes, unsafe links (HTTP/S only), payload (~64 KiB), nesting and node/mark counts.
- Image nodes deliberately excluded from #47; handled by **#48**. Cover image separately **#49**.
- #47 reported 93 unit + 236 isolated tests passed, both reviews zero findings; code was reported pushed.
- Frontend editor/renderer configuration may need explicit blockquote and inline-code support when real API integration begins.

## 6. Planned backend issue queue

- **#48 in progress with OpenCode:** Connect existing multipart/Cloudinary media upload to rich-document image nodes through stable server-controlled media references and safe resolved URLs. Validate attachment existence/ownership, MIME and size. Define deletion protection for media used in published posts. No cover feature, new upload provider, media UI or unrelated refactor.
- **#49:** optional article cover.
- **#50:** publication/category invariant and ADMIN-only permanent deletion.
- **#51:** taxonomy validation/conflict handling.
- **#52:** avatar removal.
- **#53:** bookmark mutation consistency.
- **#54:** comment statuses and visibility rules.
- **#55:** ADMIN moderation queue and approve/reject actions.
- **#56:** USER own-comment list/edit/delete.

Read each Issue's **current GitHub body** for the precise scope; this list is a navigation aid. Do not automatically close/update Issues, create labels, or change issue descriptions.

## 7. Agent workflow — required

1. Read root `AGENTS.md`, relevant scoped instructions, this document, and current GitHub Issue.
2. Check `git status`, current branch/HEAD, and whether another agent is actively changing files. Working branch is `chore/frontend-foundation`; **do not create another branch** without explicit user approval.
3. Inspect narrowly scoped source/DTOs/tests and relevant docs. Preserve unrelated staged, unstaged, and untracked work.
4. Handle **one small Issue at a time**. Avoid broad planning loops, optional subagents, unrelated refactors, and redundant full-repo reads.
5. Use installed **Matt Pocock `implement` skill** if actually available; follow mandatory **TDD**, **Standards Review**, and **Spec Review** as defined in that skill/repository. Skill invocation syntax may differ in OpenCode: discover the tool/skill and do not assume Codex's `$implement` syntax works there.
6. Reuse existing approved isolated HTTP/module test seams. No new test harness unless truly necessary.
7. Update accurate Swagger/OpenAPI for changed public backend contracts; add focused regression tests.
8. For migrations, preserve existing rows and verify against disposable development/test PostgreSQL when practical. Never touch production databases.
9. Run focused validation and required reviews; distinguish mocked/isolated tests from real DB/provider end-to-end checks. Report preexisting test typecheck errors or lint warnings honestly.
10. Create **one focused local commit**, **do not push**, and **do not modify GitHub Issues** without explicit permission.
11. Report commit, API/storage contracts, tests and counts, reviews, migration status, unverified live tests, blockers. Stop for user review.
12. **Push is a separate approval and separate request.** Only a normal fast-forward push of the approved commit, no force, reset, rebase, extra modifications, or surprise commits.

## 8. Local environment and safety

- User works on Windows with PowerShell / Windows Terminal, Codex CLI and OpenCode.
- Local PostgreSQL 18 available; disposable database `kia_blog_test` used for migration checks. Do not assume DB service is running or unattended credentials are available.
- Docker unavailable in past workflows; do not require Docker to execute normal development.
- Local OAuth credentials exist but are private; never request that they be pasted into chat, hardcoded or committed.
- Backend-only tasks do not need frontend fixture/preview startup. Frontend tasks requiring visual review should reuse existing HTTP fixture on `127.0.0.1:4101` and Next preview on `127.0.0.1:3102` where appropriate; verify actual scripts before execution.
- Never simultaneously run different agents editing the same working tree.

## 9. Memory / documentation strategy

A new coding agent should read **repository-owned context**, not assume it can inspect Codex conversation memory:
- Root/scoped `AGENTS.md`
- `docs/AI_HANDOFF.md`
- `docs/agents/issue-tracker.md` and other applicable scoped instructions
- Backend README, architecture, glossary, Prisma schema and migration history
- Relevant frontend Tiptap editor/schema only for editor-related issues
- Current GitHub Issue, current Git tree and tests

The **actual code and most recently approved Issue requirements** win over stale notes. Update this handoff after significant decisions or milestone changes, with a separate scoped documentation commit and user approval when needed.

## 10. Prompt template for future implementation tasks

```text
Implement Kia Blog Issue #N: https://github.com/Kianibound/kia-blog/issues/N

Read AGENTS.md, relevant scoped instructions, docs/AI_HANDOFF.md, and the current Issue.
Check current branch, HEAD, git status, and any ongoing agent work before editing.
Remain on chore/frontend-foundation; preserve unrelated changes.
Use available Matt Pocock implement skill and mandatory TDD, Standards Review, Spec Review.
Reuse existing test seams; make only the smallest changes required by the Issue.
Update Swagger/OpenAPI and focused tests as needed.
If schema migration is needed, preserve data and verify on disposable local PostgreSQL when available.
Avoid production, secrets, new branches, incidental refactors, and redundant tool calls.
Create one focused LOCAL commit only. DO NOT PUSH or modify GitHub Issues.
Report commit, contracts, validation counts, reviews, migrations, risks, blockers.
Stop and await separate push approval.
```

## 11. Next agent entry checklist

- Is #48 already in progress or completed in the current working tree? **Avoid overwriting its work.**
- Has OpenCode discovered `AGENTS.md` and Matt Pocock skill installation paths? If not, do read-only onboarding first.
- Is the current HEAD ahead of this handoff due to the documentation commit? Refresh before making implementation changes.
- Never treat a successful mock test as proof of end-to-end Google/GitHub OAuth or Cloudinary behavior.
