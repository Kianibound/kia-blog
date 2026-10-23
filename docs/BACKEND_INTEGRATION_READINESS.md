# Backend Integration Readiness

Audit date: 2026-10-23. Source baseline: `4e08858b78593fdd52b047d2eb3c9f2d04b3a424`.
Backend code and infrastructure were not changed. Read `backend/README.md`,
`ARCHITECTURE.md`, `GLOSSARY.md`, controllers, request DTOs, workflows,
Prisma schema, guards, bootstrap and existing isolated HTTP contracts.
The deployed API was checked with read-only GET/OPTIONS requests only.
Authenticated writes, email delivery and database integration were not run.

## Capability inventory

API routes are rooted at `/`, not `/api` (which serves Swagger UI).

| Capability | Actual routes | Access / contract |
|---|---|---|
| Health | `GET /`, `GET /health` | Public |
| Identity | `POST /auth/register`, `/auth/login`; `GET /auth/me` | Register/login public; me requires bearer JWT |
| Sessions | `POST /auth/refresh`, `/auth/logout`, `/auth/logout-all` | Refresh/logout take `{refreshToken}`; logout-all takes bearer JWT |
| Verification/recovery | `GET /auth/verify-email?token=...`; `POST /auth/forgot-password`, `/auth/reset-password` | Public, one-time token workflows |
| Public posts | `GET /posts`, `/posts/:slug` | Only PUBLISHED posts; list returns `{data,meta}` |
| Author workspace | `GET /posts/mine`, `/posts/mine/:id`; `POST /posts`; `PATCH/DELETE /posts/:id` | AUTHOR/ADMIN plus ownership policy |
| Admin post lookup | `GET /posts/by-id/:id` | ADMIN; no global private-post listing route |
| Taxonomy | `GET /categories`, `/tags`; `POST` collection, `PATCH/DELETE /:id` | Reads public; writes ADMIN |
| Discussion | `GET/POST /posts/:postId/comments`; `POST /comments/:commentId/replies`; `PATCH/DELETE /comments/:commentId` | Reads public; writes authenticated, edits/deletes owner or ADMIN |
| Likes | `POST/DELETE /posts/:postId/like`; `GET /posts/:postId/likes` | Mutation authenticated; public count `{postId,likes}` |
| Bookmarks | `POST/DELETE /posts/:postId/bookmark`; `GET /bookmarks` | Authenticated; collection belongs to current user |
| Media | `POST /media/images`; `PATCH /media/avatar`; `DELETE /media/:mediaId` | Authenticated; owner/ADMIN delete |
| Administration | `GET /admin/users`, `/admin/users/:id`; `PATCH /admin/users/:id/role` | ADMIN; role body is `{role: USER|AUTHOR|ADMIN}` |

## Findings

| Status | Finding and evidence | Smallest action / implication |
|---|---|---|
| Ready | Production `/api` and `/api-json` returned 200; JSON lists 34 paths. Swagger initializer returned JavaScript; CSS and bundle redirect 307 to pinned jsDelivr 5.33.0. `src/swagger.ts` owns this. | Human browser rendering/CDN availability remains separate from these HTTP checks. |
| Blocking issue | Live OpenAPI `components.schemas` is `{}` and success responses generally have descriptions without typed content. Request bodies are examples, not complete contracts. | Blocks reliable generated clients, not manual integration. Add real request/response schema decorators (or enable/verify Nest Swagger plugin), including pagination/errors, then validate generated JSON. |
| Blocking issue | `PostQueries.findMineById` includes author only; `findMine` includes no relations. Draft category/tag assignments cannot be recovered through the author's read routes. | For a complete post editor, include safe category/tag IDs/projections in `GET /posts/mine/:id`; contract-test draft reload. No need to add a new route. |
| Ready | Public posts have pagination: page >=1, limit 1..50, defaults 1/10; search title/content; newest/oldest; author=username, category/tag=slug. Public and mine lists return `meta:{page,limit,total,totalPages}`. | Preserve exact query names; URL-encode slugs/search. Mine consumes page/limit only despite sharing the larger query DTO. |
| Ready | Login returns `{accessToken,refreshToken,user}`; refresh verifies a stored Argon2 hash and current DB role, returning **only** `{accessToken}`. Logout revokes matching refresh session; password reset revokes all refresh sessions transactionally. | Do not replace an existing refresh token with an absent field. No automatic rotation is implemented. |
| Needs verification | Backend transports tokens in JSON/bearer headers and sets no auth cookies. No frontend session strategy has been approved. | Recommended decision: a Next server boundary with HttpOnly, Secure production, SameSite cookies; keep backend tokens out of browser JS, validate mutation origin/CSRF, mark private fetches `no-store`. This can work with existing Nest endpoints. Do not implement now. |
| Needs verification | Access JWT carries role and is not checked against active sessions on every request. Logout/reset/role changes do not immediately invalidate existing access JWTs. `JWT_ACCESS_EXPIRES_IN` is environment-configured seconds. | Agree expiry/revocation expectations. Short access TTL can fit MVP; immediate revocation needs extra server checks. Unique refresh-session `jti` and rotation are optional hardening. |
| Ready | JWT and RolesGuard enforce USER/AUTHOR/ADMIN; Posts/Comments/Media also enforce ownership. Only PUBLISHED posts permit public interactions. | UI may hide controls but backend remains authority; handle 401,403,404 independently. |
| Needs verification | `main.ts` trims comma-separated `CORS_ORIGINS`; credentials are not enabled. Live feed GET and OPTIONS accepted `Origin: http://localhost:3001`; preflight allowed authorization/content-type. | Development bearer transport works for that origin. Verify exact future production frontend origin; no production settings changed. Cookie-to-Nest transport would require a separate approved CORS/cookie design. Server-to-server Next fetching does not depend on CORS. |
| Needs verification | Validation rejects extra properties, transforms inputs; errors normally use Nest `{message:string|string[],error?,statusCode}`. Business messages are English; some Prisma errors are explicitly mapped in services; global filter only handles P2002 and rethrows others. | Normalize defensively at the frontend boundary, use Persian messages by status/context, preserve field arrays; verify duplicate, missing relation, invalid UUID and unexpected 500 responses in isolated tests before forms ship. Stable machine error codes are optional improvement. |
| Needs verification | DTO passwords minimum 8, email validated; register requires nonempty username/name. Posts require title/content; optional status enum and UUIDv4 category/tag arrays. Comments require nonempty content. | Match backend constraints; input max lengths/content format remain product decisions. Do not infer constraints from Swagger examples. |
| Ready | Upload uses multipart field `file`, JPEG/PNG/WebP, max 5 MiB, invalid file 422. Upload returns Media metadata including id/url/dimensions; avatar returns safe user fields/role. | Let FormData choose multipart boundary; verify hosting request-size ceiling, missing-file behavior and future Next proxy limit with disposable resources. No live uploads were performed. |
| Needs verification | APP_URL builds both `/auth/verify-email?token` and `/auth/reset-password?token` email links. Verification is a GET that consumes a token; login does not require verified email. No resend endpoint. | Decide frontend email landing routes, verification policy, and prevent Next prefetch from consuming tokens. Confirm APP_URL points to intended UI during integration; do not change production now. |
| Needs verification | Posts store content as an unconstrained string; no excerpt, cover image or structured editor format in Post DTO/schema. | Decide plain text/Markdown/sanitized HTML before renderer/editor design. Never render untrusted HTML directly. Cover/excerpt fields need approval only if selected UX requires them. |
| Needs verification | Comments list loads top-level comments plus **direct** replies; reply endpoint accepts any existing comment as parent, so deeper replies may be created but not returned recursively. | Choose one-level threads (enforce reply depth) or add paginated recursive/flat contract. Blocks arbitrary-depth discussion UX only. |
| Optional improvement | No current-user like-state lookup. Bookmarks can be inferred from `/bookmarks`; no per-post bookmark-state endpoint. Comments/bookmarks/admin users/taxonomy are unpaginated arrays. | Add a combined authenticated interaction-state lookup if persistent like buttons are in scope; paginate growing lists as needed. Avoid treating duplicate-like POST as a read. |
| Optional improvement | UsersController exposes no profile edit/public-author routes; no media library list, global draft moderation list, resend verification or account deletion endpoints. | Add only endpoints needed by agreed feature scope. Existing capabilities do not imply these screens exist. |
| Needs verification | Post/category/tag slugs use `slugify` with strict filtering. Read-only checks against installed slugify confirmed `سلام دنیا` → `slam-dnya`, `برنامه‌نویسی فارسی` → `brnamhnwysy-farsy`, and mixed Next.js/Persian output. | Persian transliteration works for these samples. Still verify punctuation-only titles, collisions and rename policy with disposable resources before finalizing URLs. Add a fallback only if those tests expose a gap. |
| Optional improvement | Global rate limiting is 100/minute, with stricter register/login/recovery limits. Public list includes full post content; read/count are separate queries. | Handle 429; agree editor/search debounce and pagination UX; defer payload/transaction optimization until justified. |

## Server fetching and minimum approval set

Public server-rendered reads can use the server-only `API_BASE_URL`; forward bearer
tokens only from a reviewed session boundary. Never cache authenticated responses
across users, expose secrets via `NEXT_PUBLIC_*`, or import Nest/Prisma into UI
components. Decide explicit public cache/revalidation after mutation behavior is
specified. Remote image host configuration must be narrowly scoped to actual media
URLs when images are introduced.

Before a complete author editor, approve the taxonomy projection fix. Before
generated API typing, approve OpenAPI contract completion. Other backend changes
depend on agreed scope; a session boundary in Next does not inherently require
Nest cookie support. No backend patch or feature ticket has been created.
