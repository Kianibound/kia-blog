# Kia Blog Backend

Backend API for a blog platform built with **NestJS**, **Prisma**, and **PostgreSQL**.

The project includes authentication, role-based authorization, posts, categories, tags, comments, likes, bookmarks, media uploads, and basic admin functionality.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Neon PostgreSQL for production
- Vercel for deployment
- Cloudinary for media storage
- Resend for email
- Vitest + Supertest for E2E testing
- Swagger / OpenAPI for API documentation

## Main Features

### Authentication

- User registration
- Login
- JWT access tokens
- Refresh tokens
- Logout
- Logout from all sessions
- Email verification
- Forgot password
- Reset password

### Email registration contract

`POST /auth/register` accepts `{ email, password, confirmPassword? }` and always
creates a `USER`. `role` and `roleId` are rejected. Passwords require at least
8 printable ASCII characters (U+0021 through U+007E), including an English
letter, a digit and a symbol. Whitespace and non-ASCII characters are rejected;
passwords are never trimmed. When supplied, `confirmPassword` must match exactly;
it is not stored. Confirmation remains optional for legacy API callers; the
completed frontend requires it.

Existing callers may still supply nonempty `username` and `name` (trimmed before
validation). Otherwise username is `user_` followed by the full SHA-256 hex digest
of the exact validated email, and name defaults to that resolved username.
No email normalization or existing-account migration is performed: subsequent
email login uses the same email. Unique email/username conflicts return HTTP 409;
invalid input returns HTTP 400. Generated usernames are identifiers, not secrets.

Registration returns HTTP 201 with the safe user and a message, **without access
or refresh tokens**. The client must subsequently call `POST /auth/login`.
Existing verification-token creation and optional delivery remain unchanged;
login does not currently require email verification. Login's existing password
validation is unchanged and does not acquire registration complexity rules.
No database migration or new configuration is required for this contract.

### ADMIN author creation (Issue #42)

`POST /admin/authors` requires a valid Bearer session with the current database
Role `ADMIN`. Its JSON body has exactly three required fields:
`{ name, email, password }`. Name is trimmed and must be nonempty. Email and the
initial password reuse registration validation, including the existing printable
ASCII password complexity rules. Passwords are never trimmed. Caller-supplied
username, role, roleId, confirmation or other fields are rejected.

Success is HTTP **201** with `AdminUserResponseDto` directly: safe account fields
(`id`, `email`, generated `username`, `name`, `avatarUrl`, `emailVerified`,
timestamps, `disabledAt: null` and `role: { name: 'AUTHOR' }`). It returns no password, hash or tokens.
Username uses the existing `user_<sha256(exact email)>` convention. The account
gets the seeded AUTHOR Role and an Argon2 password hash; email verification
retains its default false value and does not block login.

The AUTHOR can immediately call existing `POST /auth/login` with the same email
and initial password. Creation does not create a session, send email, generate an
invitation/activation/reset token or require a first-login password change.
Password handoff is an operational responsibility outside the API. Password and
hash are never included in responses, Swagger examples or application logs;
request-body logging must remain disabled for credential endpoints. Unexpected
creation persistence errors are sanitized before reaching exception handling.

Errors: **400** invalid/extra fields; **401** invalid or missing session;
**403** non-ADMIN; **409** existing email (including case variants) or a database
uniqueness conflict; **500** missing seeded AUTHOR role or creation failure.
Existing accounts are never updated or reused during creation. The existing
`PATCH /admin/users/:id/role` also rejects USER-to-AUTHOR promotion with 409,
including a write-time condition to cover concurrent changes to the stored Role.
Other existing role-update behavior remains unchanged.

Swagger documents the request, safe response, and validation/authentication/
authorization/conflict errors; password is write-only and has no example value.
No Prisma migration or new environment variable is required. Focused isolated
HTTP tests cover creation, hashing/persistence, immediate AUTHOR login, access
control, password policy, duplicate handling, safe errors, and promotion rejection.
This updated direct-creation decision supersedes the older invitation language
in local planning documents. No frontend integration is implemented here.

### ADMIN author deactivation (Issue #44)

`PATCH /admin/authors/:id/deactivate` requires a valid Bearer session with the
current database Role `ADMIN`; no request body is needed. Success is **200** with
`AdminUserResponseDto`: safe user fields plus a non-null ISO `disabledAt`
timestamp. It returns no credentials or tokens. Missing/invalid authentication
returns **401**, non-ADMIN **403**, unknown User **404**, and a USER/ADMIN target
or conflicting concurrent account change **409**.

One Prisma transaction conditionally sets `User.disabledAt` only for an enabled
AUTHOR, reads the current account, and revokes every unrevoked RefreshToken for
that User using the existing logout-all revocation semantics. If revocation
fails, deactivation rolls back. Repeating the request succeeds for an already
disabled AUTHOR, preserves its original timestamp, and revokes any lingering
unrevoked sessions without changing previous revocation timestamps.

Existing password/OAuth login and refresh workflows reject disabled accounts.
The existing access-token guard checks current account/session state on every
protected request, so issued JWTs are denied after deactivation even before their
JWT expiry. Requests already past an authorization check are not retroactively
cancelled; authorization retains the existing point-in-time behavior.

Deactivation never deletes the User or content, changes its Role, transfers
ownership, or unpublishes Posts. Posts, Comments, Media and their ownership
relations remain stored; published articles remain publicly readable. No
reactivation, deletion or frontend workflow is introduced.

Existing ADMIN list/detail/create/role-update responses now use
`AdminUserResponseDto`, with `disabledAt: null` for enabled accounts and the stored
timestamp for disabled accounts. The public/auth `UserResponseDto` is unchanged.
Swagger `/api-json` documents the new endpoint, access rules, error responses and
ADMIN disabled-state field. No new migration or environment variable is needed:
the existing `User.disabledAt` column and RefreshToken records are reused.

Focused tests run at the approved isolated HTTP/module seam with substituted
persistence, including transaction rollback, repeated requests, session/login
denial, invalid targets, safe ADMIN reads and content/ownership preservation.
They do not establish live PostgreSQL concurrency or production behavior.

### Server-managed browser session contract

Nest remains a bearer API and does not read or set browser cookies. A Next.js
server adapter calls `POST /auth/login` with email/password and stores the returned
access/refresh credentials server-side, indexed by an opaque, unguessable browser
session ID. The browser receives only that ID in a `Secure`, `HttpOnly`,
`SameSite=Lax`, `Path=/` cookie, without Domain (`__Host-` name on HTTPS).
JWTs must not enter localStorage, client props, URLs or browser-readable cookies.
The adapter/UI itself is outside this issue.

The adapter forwards `Authorization: Bearer <access>` and disables Next.js
fetch/output caching. On access expiry it may call `POST /auth/refresh` with
`{ refreshToken }`, then retry once. Refresh returns only `{ accessToken }` and
retains the existing refresh credential/expiry. `GET /auth/me` returns the current
safe account. `POST /auth/logout` revokes the matching session; authenticated
`POST /auth/logout-all` revokes all of that account's sessions. Clear adapter
credentials and the cookie on logout or terminal authentication failure; expire
adapter storage no later than the backend refresh session.

The adapter must check the exact trusted Origin and use CSRF protection for
cookie-authenticated mutations, including login/logout. Never forward tokens to
client-supplied destinations. Nest gains no authority from a Cookie header: token
exchange requires explicit JSON credentials and protected routes require Bearer.
CORS is not CSRF protection; no credentialed cross-origin cookie mode is added.

Access JWTs include `sid`, the existing RefreshToken record ID. Each protected
request checks its owner, expiry and revocation and loads the account's current
role and `disabledAt`. Deleted/disabled accounts, invalid roles, expired/revoked
sessions and access JWTs without sid return 401. Role changes apply on the next
authorization check. Disabled accounts cannot log in or refresh. Re-enabling an
account does not revoke old records; revoke sessions too for permanent sign-out.
Authorization is a point-in-time check, not a lock over later mutations.

Existing refresh records and Argon2 hashes remain valid. Legacy refresh tokens
can obtain session-bound access tokens; old unbound access tokens must be
refreshed or replaced by login. New refresh JWTs have random `jti` values so two
logins in the same second have distinct credentials. Auth exchanges and requests
carrying Authorization receive `Cache-Control: private, no-store` and
`Pragma: no-cache`, including failures. Proxies must preserve these headers.

Apply migration `20261106180000_add_user_disabled_at` before deployment and
regenerate Prisma. It adds nullable `User.disabledAt`; existing users remain
enabled and refresh rows are preserved. No new environment variables are added:
existing `DATABASE_URL`, migration `DIRECT_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, and `JWT_ACCESS_EXPIRES_IN` remain required. Use independent
strong JWT secrets. Live migration verification needs a disposable local database;
isolated tests use substituted persistence and test-only JWT settings.

### Google OAuth server-adapter contract (Issue #40)

Nest remains cookie-free. These are server-to-server JSON endpoints; they are
not browser redirect handlers and must not be called from frontend JavaScript.
No Next.js adapter is implemented by this issue.

Required backend configuration: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_REDIRECT_URI`. Missing/invalid configuration disables these endpoints
with 503 without disabling existing authentication. Store credentials in local
environment/secret storage only. Existing database and JWT settings still apply.

For local integration, the Next.js adapter must run on port **3001** and own
**`GET /auth/google/callback`**. Configure exactly this Authorized redirect URI
on the Google Cloud OAuth **Web application** client and use the same value for
`GOOGLE_REDIRECT_URI`:

```text
http://localhost:3001/auth/google/callback
```

This is the future Next.js URL, not Nest's port 3000. Deployment requires an
explicit HTTPS adapter origin with this same callback path; query strings,
fragments, userinfo and non-local HTTP are rejected. Do not derive redirect URIs
from request headers or client input.

1. The future adapter starts login only after checking trusted Origin/CSRF and
   binding it to the initiating browser's opaque server session. It calls
   `POST http://localhost:3000/auth/google` with no credentials/body required.
   Response: `{ authorizationUrl, flowVerifier, expiresIn: 600 }`.
2. It stores `flowVerifier` and the URL's `state` **server-side**, bound to that
   browser session, for at most ten minutes, then redirects the browser to
   `authorizationUrl`. The private verifier must never enter browser props,
   cookies, logs, URLs or redirect parameters. State is public and goes to Google;
   neither state alone nor a provider code is enough to exchange credentials.
3. On its callback, the adapter checks exact state/session binding, atomically
   consumes its own pending login, and forwards only `{ code, state,
   flowVerifier }` as JSON to `POST http://localhost:3000/auth/google/callback`.
   For provider denial it sends `{ error, state, flowVerifier }` instead.
   Google may include other redirect parameters; the adapter must not forward
   them. Nest rejects undeclared callback fields, including role/redirect input.
4. Nest atomically consumes the matching, unexpired state before contacting
   Google. It exchanges the code with S256 PKCE and validates the ID token using
   Google's official SDK (signature, issuer, audience, lifetime) plus OIDC nonce
   and verified email. State cannot be replayed, including after provider errors;
   start a new flow to retry. No Google access/refresh token is stored or returned.
5. Success returns the existing `{ accessToken, refreshToken, user }` login
   response. The adapter stores these server-side and issues only its opaque
   browser session cookie as specified above. Redirect to a fixed trusted page;
   never put JWTs or `flowVerifier` in URLs. Use HTTPS between services outside
   local development, no caching, and redact auth request bodies/query values
   in application/proxy logs. Nest auth responses include no-store headers.

Identity is the Google `sub`, persisted in `GoogleIdentity` with one Google
subject per User. New accounts get `USER`, a stable `google_<sha256(sub)>`
username, verified email and no password. Linked accounts retain their stored
email/profile and Role even if Google's email changes. Disabled or unsupported
role accounts cannot log in. Matching email (case-insensitive) **never** links an
existing account: 409 asks the caller to use its existing sign-in method. Unique
constraint races also return 409 without linking or issuing credentials. Manual
linking, invitations, GitHub OAuth and frontend integration are out of scope.

Callback errors: 400 for invalid field formats/extra fields; 401 for invalid,
expired or consumed state, missing code/provider denial, failed provider or
identity verification, disabled account or invalid Role; 409 for account
collisions; 503 for unavailable configuration. Provider details are not returned.

Apply `20261107120000_add_google_oauth` and regenerate Prisma before running the
new endpoints. It adds `GoogleIdentity` and `GoogleOAuthState`, without rewriting
existing Users, passwords, Roles or RefreshTokens. State/verifier are stored only
as SHA-256 hashes. Expired/used state rows are inert; operational retention cleanup
can delete expired rows later (no scheduled job is introduced here).

Reproduce safe checks with `npm run build`, `npm run lint`,
`npm test -- --runInBand`, and `npm run test:isolated`. The existing isolated HTTP
suite uses a mocked Google SDK I/O boundary and substituted persistence, without
live Google credentials. A live Google test additionally needs the future adapter,
the configured redirect URI/consent screen (and permitted test users if applicable),
securely supplied credentials, and a migrated disposable development database.

### GitHub OAuth server-adapter contract (Issue #41)

GitHub follows the same cookie-free, server-to-server contract as Google. The
future Next.js adapter owns **`GET /auth/github/callback`** on port **3001**;
this issue does not implement that adapter. Configure the GitHub OAuth App's
**Authorization callback URL**, and backend `GITHUB_REDIRECT_URI`, to exactly:

```text
http://localhost:3001/auth/github/callback
```

Required backend variables are `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and
`GITHUB_REDIRECT_URI`, alongside existing database/JWT configuration. Empty or
unsafe configuration returns 503 for GitHub endpoints without affecting Google
or password authentication. Production requires an explicit HTTPS adapter URL
with the same callback path; query strings, fragments, userinfo, and non-local
HTTP are rejected. Keep real credentials in secret storage, outside Git.

- `POST http://localhost:3000/auth/github` returns
  `{ authorizationUrl, flowVerifier, expiresIn: 600 }`. The adapter must check
  trusted Origin/CSRF, retain state and verifier in server storage bound to the
  initiating browser session, and redirect only to `authorizationUrl`.
- The future adapter validates exact state and browser-session binding and
  consumes its pending login once. It posts only `{ code, state, flowVerifier }`
  to `POST http://localhost:3000/auth/github/callback`, or
  `{ error, state, flowVerifier }` for denial. Provider redirect parameters such
  as `error_description` must not be forwarded. Callback extra fields, including
  caller roles and redirect overrides, are rejected.
- Success returns the existing `{ accessToken, refreshToken, user }` contract.
  The adapter retains these credentials server-side and sends the browser only
  its opaque session cookie. No JWT, GitHub token or private verifier belongs in
  browser-readable storage, redirect URLs, cookies, props or logs. Redirect to a
  fixed trusted page; use HTTPS between services outside localhost and no caching.

Nest stores only state/verifier hashes in `GithubOAuthState`, expires state after
ten minutes, and consumes matching state atomically before provider I/O. Invalid,
expired, wrong-verifier or reused state cannot exchange a code. Denial and
provider failures consume state too: retry by starting a new flow. GitHub and
Google have separate state tables, so state cannot cross providers.

The provider flow uses S256 PKCE and `user:email` scope. It exchanges the code
server-side, then requests GitHub's authenticated `/user` endpoint on every login.
Identity is its positive, safe-integer `id` converted to a string, never mutable
login or email. Requests use fixed HTTPS provider endpoints, reject redirects,
disable caching and have ten-second timeouts. The temporary GitHub token is not
persisted or returned; only existing Kia Blog session credentials are issued.
See [GitHub's authorization flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

For an unlinked subject, Nest reads authenticated `/user/emails`, including private
addresses, and requires a valid **verified primary email**. Public profile email
is not used as proof. Email pages contain at most 100 entries; reads are bounded
to ten pages and fail closed if no usable primary is found. Missing, unverified,
ambiguous or malformed primary email, missing email permission, and provider
failures return 401 without creating an account or session. See
[GitHub's email API](https://docs.github.com/en/rest/users/emails).

New accounts get `USER`, verified email, a stable `github_<sha256(id)>` username,
no password, and an atomically created `GithubIdentity`. Matching existing email,
including case variants or accounts using Google/password login, returns 409;
it never links or modifies the existing account. Unique-constraint races also
return a safe 409. Linking/account-management endpoints are out of scope.

Already linked accounts use their stored identity and Role even if GitHub login
or email changes or public email is absent; email retrieval is unnecessary for
these logins. Disabled accounts and missing/invalid Roles return 401. An unlinked
GitHub subject cannot gain AUTHOR by claiming an existing author's email.

Swagger `/api-json` documents both endpoints and DTOs. Errors are 400 for invalid
or extra callback fields, 401 for state/provider/identity/email/account rejection,
409 for collisions, and 503 for invalid configuration. Provider errors are
sanitized; auth responses remain `private, no-store` and set no cookies.

Apply `20261107130000_add_github_oauth` and regenerate Prisma. This additive
migration creates `GithubIdentity` (unique subject, unique User relation) and
`GithubOAuthState`, preserving existing Users, Google mappings/state, passwords,
Roles and sessions. Expired/used state is inert; no retention job is added.

Validation uses the existing isolated HTTP/module seam, substituted persistence,
and mocked GitHub HTTP responses. No live credentials or provider calls are
needed. Live testing is deferred until the Next.js adapter exists and requires
the registered callback, securely supplied OAuth App credentials, required user
consent, and a migrated disposable development database. No production resources
are needed for that verification.

### Authorization

Three application roles are supported:

- `USER`
- `AUTHOR`
- `ADMIN`

Examples:

- Users can interact with published posts.
- Authors can create and manage their own posts.
- Admins can manage users, roles, categories, and tags.

### Posts

- Create posts
- Draft and published states
- Update owned posts, including publishing, unpublishing and republishing
- Public published post listing
- Pagination
- Search
- Sort by newest or oldest
- Filter by author
- Filter by category
- Filter by tag
- Permanent deletion is ADMIN-only (authors unpublish instead)

### Canonical rich article content (Issue #47)

Article create/update accepts either legacy string `content` or validated Tiptap
JSON in `contentDocument`, never both. Rich writes derive the existing `content`
search string on the server. Responses return both fields; legacy rows have null
`contentDocument` and are never parsed or backfilled. Metadata-only edits preserve
content; a string replacement clears the JSON. Apply the additive
`20261107193000_add_post_content_document` migration and regenerate Prisma first.
See the [rich-content contract](src/posts/docs/RICH_CONTENT.md) for the node/mark
allowlist, limits, round-trip rules, safe rendering and pending frontend adapter.
Issue #48 adds body-image references using existing upload/Cloudinary infrastructure.
See [body image contracts and deletion safety](src/media/BODY_IMAGES.md).
Cover images and frontend integration remain excluded.

### Optional article cover (Issue #49)

Article create/update accepts an optional cover image reference plus alt text.
Supply `coverMediaId` (an existing Media id, never a URL) together with a
required nonblank `coverAlt` (at most 500 UTF-16 units). Omit both fields to
create or keep a coverless post; on PATCH, sending `coverMediaId: null` removes
the cover, and omitting the field preserves it. The chosen Media must exist, be
an eligible `jpg`/`jpeg`/`png`/`webp` image below 5 MiB with a credential-free
Cloudinary delivery URL, and be owned by the Post author unless the caller is an
ADMIN. A coverMediaId without alt, alt without a coverMediaId, or an invalid
combination is rejected with 400; foreign-owned Media yields 403.

Responses resolve the cover server-side into `coverImage`
(`{ id, url, width, height, alt }`, `null` when absent) on create, update,
detail, feed, own-list and embedded bookmark article responses. The resolved URL
is returned instead of the Cloudinary public id. Legacy posts without a cover
return a null `coverImage`. Deleting Media still referenced as a cover returns
409 without remote deletion, mirroring the body-image rule, via the restrictive
foreign key added by migration `20261109120000_add_post_cover_media` (additive,
preserves existing rows; regenerate Prisma first).

### Publication category invariant and ADMIN-only deletion (Issue #50)

A PUBLISHED article always carries at least one ADMIN-managed Category; Tags stay
optional. Creating a post as `PUBLISHED` requires a non-empty `categoryIds` list.
Every update is checked against its **resulting** state: publishing or
republishing (`DRAFT`/`DEPRECATED` → `PUBLISHED`) without a category is rejected
with 400, as is explicitly removing the last category while staying `PUBLISHED`.
Unpublishing first (`status: DRAFT`) and then clearing categories is allowed, and
replacing categories with another non-empty set is allowed. The error body is the
standard Nest 400 shape with message
`A published article requires at least one category.`; no write occurs.

Existing data is preserved. A legacy post that was already `PUBLISHED` without
categories before this rule existed remains editable: a metadata-only update, or
sending its unchanged empty category list, is accepted so operators can repair it.
Any real publication transition on such a post (for example republishing a
categoryless `DEPRECATED` post) still requires a category. Nothing backfills or
auto-assigns a category.

Permanent `DELETE /posts/:id` is **ADMIN-only** (401 unauthenticated, 403 for
USER/AUTHOR, 404 missing). AUTHORS keep publishing, editing and unpublishing their
own posts but cannot permanently delete them. Public visibility remains
PUBLISHED-only. This invariant is a check-then-write rule, not a database
constraint; concurrent publication/category changes are not serialized, matching
the existing point-in-time authorization model. Category deletion conflicts and
taxonomy reference validation are handled separately.

### Taxonomy validation and reference-conflict deletion (Issue #51)

ADMIN category and tag names are trimmed before validation and persistence;
blank or whitespace-only names are rejected with 400, and non-string names are
rejected the same way. The generated slug is derived from the trimmed name. A
duplicate name or generated slug — including two distinct names that slugify to
the same value — is reported as 409 Conflict. The database unique index remains
the final arbiter, so concurrent creates or renames fail safely instead of
producing duplicates.

Deleting a category or tag that is referenced by any article (draft, published
or deprecated) returns 409 and never detaches the relation. The reference count
and the delete run in one serializable transaction, so a concurrent article
attach cannot slip between them and be silently cascade-detached by the implicit
join table; an aborted serialization also returns 409 so the caller can retry.
This protects published posts and the Issue #50 last-category invariant. Deleting
posts and replacing a post's categories or tags are unaffected, and unreferenced
taxonomy records still delete normally with the existing `{ message }` shape.

### Bookmark mutation consistency (Issue #53)

Bookmark mutations are idempotent and scoped to the authenticated user. Creating
a bookmark for an already-bookmarked published post returns the existing row
(with the usual 201 response); a concurrent duplicate is resolved by the
`(userId, postId)` unique index, and the request returns the winning row instead
of failing. Creating a bookmark for a missing or non-published post still returns
404 and requires a PUBLISHED Post.

Removing a bookmark always returns 200 with
`{ message: 'Bookmark removed successfully.' }`, including when the bookmark was
already removed or removed concurrently. This intentionally differs from
`PostLikes`, whose removal still returns 404 for a missing like; the idempotent
bookmark contract lets the frontend treat the toggle as fire-and-forget. The
saved list (`GET /bookmarks`) remains user-scoped, newest first, and includes only
bookmarks whose post is currently PUBLISHED; unpublished posts disappear from the
list while their bookmark stays removable. Each entry keeps the existing
`BookmarkDetailResponseDto` shape, including the resolved `post` projection with
`contentMedia`, `coverImage`, safe author identity, categories and tags.

### Owned Post status filtering (Issue #45)

`GET /posts/mine` remains restricted to authenticated AUTHOR/ADMIN accounts and
returns only Posts owned by the current User, including for ADMIN callers.
Optional `status=DRAFT` or `status=PUBLISHED` filters use the existing PostStatus
values. Omit `status` to return all owned statuses, including DEPRECATED. An
explicit DEPRECATED, empty, lowercase, repeated or unknown status returns 400.

The owner/status predicate is applied to both the database page query and count,
before pagination. Existing `createdAt` descending ordering and the response
`{ data, meta: { page, limit, total, totalPages } }` are preserved. Defaults remain
page 1 and limit 10; page must be a positive integer and limit an integer from
1 to 50. No matches yields total/totalPages 0. A page beyond the filtered range
returns empty data while retaining the requested page and filtered totals.

For example: `/posts/mine?status=DRAFT&page=2&limit=10`. Caller-supplied author
filters cannot change the authenticated ownership scope. The public feed's query
contract is unchanged. Swagger documents the optional status enum and 400 error.
No migration, new environment variable, frontend or CRUD subsystem is required.
The page and count remain separate concurrent reads, as before; this does not add
a snapshot guarantee against concurrent Post changes.

### ADMIN all-author Post inventory (Issue #46)

`GET /posts/admin/inventory` requires an authenticated, enabled ADMIN with a valid
session. It lists every stored Post across all authors, including disabled
authors, and all publication statuses: DRAFT, PUBLISHED and DEPRECATED. It has
only `page` and `limit` query parameters, reusing the existing defaults (1/10) and
validation (positive integer page, integer limit 1–50). Additional filters are
rejected; no search, status, author or sort filter is introduced.

HTTP **200** returns `{ data, meta: { page, limit, total, totalPages } }`. Each
summary contains `id`, `title`, `slug`, `status`, `authorId`, `publishedAt`,
`createdAt`, `updatedAt`, and `author: { id, username, name, avatarUrl }`.
`id` identifies the existing administrative read/mutation targets; no invented
action URLs or new mutations are returned. Article bodies, taxonomy relations,
author email, credentials, session data and account status are not selected.

Ordering is `createdAt` descending, then `id` descending for deterministic ties.
Count covers the complete inventory. Empty inventories have total/totalPages 0;
out-of-range pages return empty data and retain the requested page and totals.
Page/count remain separate concurrent reads without a snapshot guarantee.

Errors are **400** for invalid pagination/extra query fields, **401** for missing
or invalid sessions, and **403** for USER/AUTHOR callers. Swagger `/api-json`
documents the pagination, access rules, summary and envelope schemas. The static
two-segment route does not reserve the existing public Post slug `admin`.
Existing edit, publish, unpublish and delete behavior is unchanged. No migration,
environment variable, frontend change or new infrastructure is required.

### Categories and Tags

- Public listing
- Admin-only create, update, and delete operations

### Comments

- Comment on published posts
- Reply to comments
- Nested replies
- Update own comments
- Delete own comments
- Admin moderation

### Likes

- Like a published post
- Remove a like
- Prevent duplicate likes
- Public like count

### Bookmarks

- Bookmark published posts
- Remove bookmarks
- List the authenticated user's bookmarks

### Media

- Image upload
- Image deletion
- Avatar upload and replacement
- JPEG, PNG, and WebP support
- Maximum upload size: 5 MB
- Cloudinary storage

## API Documentation

Swagger UI is available at:

```text
/api
```

Local example:

```text
http://localhost:3000/api
```

Production:

```text
https://kia-blog-pi.vercel.app/api
```

Swagger can also be used to test authenticated endpoints using a JWT access token through the **Authorize** button.

Swagger UI assets are redirected to a pinned jsDelivr release so documentation
works on Vercel even when local static assets are omitted. The initializer and
OpenAPI JSON stay on the application origin. `src/swagger.ts` keeps the asset
version and the matching Content Security Policy together; update the pinned
version when upgrading `swagger-ui-dist`.

The generated OpenAPI JSON is available at:

```text
/api-json
```

## Requirements

Install the following before running the project locally:

- Node.js
- npm
- PostgreSQL

## Installation

Clone the repository and enter the backend directory:

```bash
git clone https://github.com/Kianibound/kia-blog.git
cd kia-blog/backend
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3001

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# JWT
JWT_ACCESS_SECRET=replace_with_a_strong_secret
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_SECRET=replace_with_another_strong_secret

# Email
EMAIL_ENABLED=false
RESEND_API_KEY=replace_with_resend_api_key
EMAIL_FROM=no-reply@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=replace_with_cloud_name
CLOUDINARY_API_KEY=replace_with_api_key
CLOUDINARY_API_SECRET=replace_with_api_secret
```

Never commit real secrets to Git.

## Database Connections

The project uses two database connection variables:

```text
DATABASE_URL
```

Used by the running NestJS application.

In production this should normally use the pooled PostgreSQL connection.

```text
DIRECT_URL
```

Used by Prisma CLI operations such as migrations and production seeding.

In production this should use the direct PostgreSQL connection.

For local development, both variables can point to the same local PostgreSQL database.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/blog_db
DIRECT_URL=postgresql://postgres:password@localhost:5432/blog_db
```

## Prisma Setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run development migrations:

```bash
npx prisma migrate dev
```

Seed the development database:

```bash
npm run prisma:seed
```

## Development

Start the application in watch mode:

```bash
npm run start:dev
```

The API runs by default at:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-10-03T10:00:00.000Z"
}
```

## Testing

Run safe, isolated verification (no PostgreSQL, Resend, or Cloudinary connection):

```bash
npm test -- --runInBand
npm run test:isolated
```

Jest checks workflow behavior. The isolated Vitest suite checks each feature's
explicit database imports, shared adapter lifecycle, and real application HTTP
contracts with substituted I/O. It uses the installed TypeScript compiler for Nest
decorator metadata and does not require SWC's platform-native addon.

Run the separate live E2E suite only with disposable development resources:

```bash
npm run test:e2e
```

The E2E suite covers critical flows including:

- Registration and login
- JWT authentication
- Refresh tokens
- Logout
- Role-based authorization
- Posts
- Ownership rules
- Comments and replies
- Likes
- Bookmarks
- Media uploads
- Avatar replacement

### Important

E2E tests create and modify data.

Always run them against a development/local database.

Do **not** run the E2E suite against the production Neon database.

## Build

Build the application:

```bash
npm run build
```

Run the compiled production build locally:

```bash
npm run start:prod
```

## Database Migration Workflow

### Development

Change the Prisma schema and create a migration using:

```bash
npx prisma migrate dev --name migration_name
```

If you only want to create the migration file without applying it:

```bash
npx prisma migrate dev --name migration_name --create-only
```

Test the migration locally before deploying it.

### Production

Production migrations should only apply already-created and committed migration files:

```bash
npm run prisma:migrate:deploy
```

Avoid using these commands against the production database:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push --accept-data-loss
```

## Production Seeding

Production seeding only creates the required application roles:

```text
USER
AUTHOR
ADMIN
```

Development-only test posts are not created when:

```env
NODE_ENV=production
```

Run the seed using:

```bash
npm run prisma:seed
```

## Deployment

The backend is deployed using:

```text
Vercel
```

Production database:

```text
Neon PostgreSQL
```

Production API:

```text
https://kia-blog-pi.vercel.app
```

The Vercel project requires the application environment variables to be configured in the Vercel dashboard.

Because the project uses NestJS 12 with its current module setup, Vercel also uses:

```env
NODE_OPTIONS=--experimental-require-module
```

## Production Architecture

```text
Client
  |
  v
Vercel
  |
  v
NestJS API
  |
  +--> Neon PostgreSQL
  |
  +--> Cloudinary
  |
  +--> Resend
```

## Useful Commands

```bash
# Development server
npm run start:dev

# Build
npm run build

# Production start
npm run start:prod

# Prisma client generation
npm run prisma:generate

# Development migration
npx prisma migrate dev

# Production migration
npm run prisma:migrate:deploy

# Seed
npm run prisma:seed

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

## Project Status

The backend MVP currently includes:

- Authentication
- JWT and refresh tokens
- Roles and authorization
- Posts
- Categories
- Tags
- Comments and replies
- Likes
- Bookmarks
- Media and avatars
- Admin endpoints
- Security headers
- CORS
- Rate limiting
- Critical E2E tests
- Swagger API documentation
- Production deployment
- Production PostgreSQL database

Google OAuth's backend exchange is implemented; its browser adapter is pending.
GitHub OAuth's backend exchange is also implemented; its browser adapter is
pending. Following authors, newsletters and advanced analytics are not implemented
here.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams of the modules, database, auth flow and request lifecycle.
