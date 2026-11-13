# Local integration smoke tests (Issue #71)

Manual, **disposable-environment** verification of the critical Nest + Next
journeys. Nothing here is production-ready evidence: it is a checklist for a
local PostgreSQL database, a local Nest server, and (optionally) the Next app.

> **Safety**
> - Use a throwaway PostgreSQL database. The script creates accounts, a category,
>   a published post, a comment, a bookmark, and deactivates an AUTHOR.
> - Never run these steps against production Neon, real Cloudinary assets, or
>   real OAuth apps. Never commit `.env` files or paste secrets into chat/logs.
> - This repository does not have a seed ADMIN user. Create one only in the
>   disposable database (see below).

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 24 LTS + npm | `.nvmrc` in `frontend/` |
| PostgreSQL 18 (local) | disposable database, e.g. `kia_blog_smoke` |
| PowerShell 7 (`pwsh`) | Windows script; bash equivalents are listed inline |
| Upstash Redis (or test double) | needed only for the Next session/CSRF flows |
| Cloudinary account | optional; only for real image/avatar uploads |
| Google/GitHub OAuth apps | optional; browser OAuth needs registered callbacks |

## 2. Environment variables (actual repo contract)

### Nest (`backend/.env`)

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3001
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/kia_blog_smoke
DIRECT_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/kia_blog_smoke
JWT_ACCESS_SECRET=<strong-local-secret>
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_SECRET=<different-strong-local-secret>

# Optional external providers (leave empty to disable those endpoints)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3001/auth/github/callback
```

`EMAIL_ENABLED=false` keeps mail local. The backend has **no `REDIS_URL`** and no
Redis dependency; do not add one.

### Frontend (`frontend/.env.local`)

```env
API_BASE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=<local/test Upstash REST URL>
UPSTASH_REDIS_REST_TOKEN=<local/test token>
SESSION_ENCRYPTION_KEY=<openssl rand -base64 32>
APP_ORIGIN=http://localhost:3001
```

`NEXT_PUBLIC_API_BASE_URL` is **not used**. All API access is server-only through
`API_BASE_URL`; adding a public API origin is out of scope.

## 3. Start the stack

```powershell
# Backend
cd backend
npm ci
npm run prisma:generate
npx prisma migrate status          # must report "Database schema is up to date!"
npx prisma migrate dev             # only if the disposable DB is empty
npm run prisma:seed                # seeds USER/AUTHOR/ADMIN roles (+ dev data)
npm run start:dev                  # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm ci
npm run dev                        # http://localhost:3001
```

### Create a local ADMIN (disposable DB only)

Register any account through `POST /auth/register` or the UI, then promote it:

```sql
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = 'ADMIN')
WHERE email = 'admin@example.test';
```

Prefer Prisma Studio (`npx prisma studio`) if you do not want to run SQL. Never
copy this against a shared or production database.

## 4. Automated API smoke script

```powershell
$env:SMOKE_BASE_URL = 'http://localhost:3000'
$env:SMOKE_ADMIN_EMAIL = 'admin@example.test'
$env:SMOKE_ADMIN_PASSWORD = '<from your secret store>'

pwsh -File backend/scripts/smoke-tests.ps1 `
  -BaseUrl $env:SMOKE_BASE_URL `
  -AdminEmail $env:SMOKE_ADMIN_EMAIL `
  -AdminPassword $env:SMOKE_ADMIN_PASSWORD
```

Add `-IncludeExternal` (and optionally `-ImagePath <file>`) to exercise
Cloudinary uploads. External provider browser flows are **not** called by the
script.

The script prints only PASS/FAIL lines and HTTP status codes; it never prints
tokens, passwords, or response bodies. Failure diagnostics report the expected vs.
actual status only, never the body, so an unexpected auth success cannot echo
credentials to the console. Exit code is non-zero when any check fails.

If `SMOKE_ADMIN_*` is absent, the script runs only health + email auth/session
checks and stops.

### What the script verifies

1. `GET /health` → 200; migration prerequisite reminder.
2. `POST /auth/register` → 201 **without tokens**; `POST /auth/login` → 200 USER;
   `GET /auth/me`; `POST /auth/refresh`; `POST /auth/logout` then refresh → 401.
3. ADMIN login; `POST /categories` 201, duplicate 409, blank 400; delete
   unreferenced 200, missing 404.
4. `POST /admin/authors` 201 and AUTHOR login.
5. Optional `POST /media/images` 201 (Cloudinary required).
6. `POST /posts` PUBLISHED with a category 201; public `GET /posts/:slug` 200;
   public feed search finds it.
7. `POST /posts/:id/comments` 201 PENDING, absent from public list; ADMIN
   inventory exposes `version`; approve 200; **stale re-approve 409**; public list
   then contains the text.
8. Bookmark create 201, `GET /bookmarks` contains it, delete 200, repeat delete
   **200** (idempotent).
9. `PATCH /admin/authors/:id/deactivate` 200; AUTHOR login 401; old access token
   401; published article still public 200.
10. `DELETE` referenced category → **409**.

## 5. Scenario matrix and expected Persian UI copy

The backend returns English API messages; the Next UI maps statuses to
centralized Persian copy. Expect these user-facing strings:

| Journey | API calls | Expected | Persian UI copy |
| --- | --- | --- | --- |
| Session expired | any authenticated call → 401 | 401 | «نشست شما معتبر نیست؛ دوباره وارد شوید.» |
| Duplicate category/tag | `POST /categories` or `/tags` → 409 | 409 | «این نام یا نشانی آن قبلاً ثبت شده است.» |
| Taxonomy in use | `DELETE /categories/:id` → 409 | 409 | «این مورد در مقاله‌ای استفاده شده است و حذف نمی‌شود.» |
| Stale approval | `PATCH /admin/comments/:id/approve` old `version` → 409 | 409 | «این دیدگاه تغییر کرده است؛ فهرست را دوباره بارگذاری کنید.» |
| Bookmark conflict/unknown post | `POST /posts/:id/bookmark` unpublished → 404 | 404 | «این مقاله پیدا نشد یا دیگر منتشر نشده است.» |
| Avatar concurrent change | `DELETE /media/avatar` → 409 | 409 | «عکس پروفایل همزمان تغییر کرده است. صفحه را دوباره بارگذاری کنید…» |
| Invalid credentials / disabled | `POST /auth/login` → 401 | 401 | «ایمیل یا گذرواژه نادرست است.» |
| Rate limit | repeated auth calls → 429 | 429 | «تلاش‌های بیش از حد. کمی بعد دوباره امتحان کنید.» |

## 6. Manual Next walkthrough (optional)

Use two browser profiles: one ADMIN, one AUTHOR/USER. This is the only way to
verify session cookies, CSRF and the role-aware UI.

1. **Email auth**: `/register` creates a USER and redirects to `/login`; login
   lands on `/dashboard`; logout returns to a signed-out header.
2. **Role matrix**: USER sees bookmarks/comments; AUTHOR sees posts/avatar;
   ADMIN sees taxonomy/comments/posts/authors. Deep links outside the role 404.
3. **Editor**: AUTHOR creates a post, uploads a body image (Cloudinary), saves,
   publishes with a category, then opens `/posts/<slug>` publicly.
4. **Comments**: USER submits on the article (hidden, PENDING); ADMIN approves in
   `/dashboard/comments`; USER edits the approved comment; it returns to PENDING
   and disappears publicly until re-approved.
5. **Stale approval**: open `/dashboard/comments` in two tabs, approve in tab A,
   then approve in tab B → Persian stale message + reload control; ensure tab B
   did **not** report success.
6. **Bookmarks**: save from an article, confirm `/dashboard/bookmarks`, remove;
   removing twice stays successful.
7. **Avatar**: AUTHOR uploads, reloads, removes; conflict requires a reload.
8. **Author deactivation**: ADMIN disables an AUTHOR; that AUTHOR cannot log in,
   but their published article remains readable.
9. **Taxonomy**: ADMIN creates a category/tag, sees duplicate 409; deleting a
   referenced category shows the in-use message.

### External providers (explicit user setup)

- **Cloudinary**: set `CLOUDINARY_*`; otherwise uploads return a safe 5xx/422 in
  the UI. No live upload is required for the core smoke script.
- **Google/GitHub OAuth**: register `http://localhost:3001/auth/google/callback`
  and `.../github/callback`, provide `GOOGLE_*`/`GITHUB_*`, and keep
  `APP_ORIGIN=http://localhost:3001`. The script does not exercise these; use the
  login page buttons manually. Missing credentials disable the endpoints (503).
- **Upstash**: Next login/CSRF requires the REST URL/token and encryption key.
  Missing values make protected forms unavailable rather than degrading silently.

## 7. Troubleshooting

| Symptom | Likely cause / action |
| --- | --- |
| `prisma migrate status` reports drift | Reset the **disposable** DB (`npx prisma migrate reset`), re-run migrations/seed, never use this on production |
| Login 401 immediately after seeding | Registration does not create a session; log in separately |
| Every authenticated call 403 | Wrong role for the endpoint; re-check the seeded role / ADMIN promotion |
| 429 responses | Auth throttling; wait ~60s and rerun with a fresh unique suffix |
| Next login says the secure form is unavailable | Missing/invalid `SESSION_ENCRYPTION_KEY`, Upstash values, or `APP_ORIGIN` |
| CSRF/Origin rejection | `APP_ORIGIN` must exactly match the browser origin (scheme/host/port, no path) |
| Image upload fails | Cloudinary credentials not set, file not JPG/PNG/WebP, or ≥5 MiB |
| Category delete 409 unexpectedly | Some post (draft or published) still references it; detach first |
| Smoke rerun conflicts | Emails/names include a UTC timestamp suffix; deactivated AUTHORs cannot be reused |
| Script cannot parse JSON | Endpoint returned HTML (wrong `BaseUrl` or a proxy error page) |

## 8. Known limitations

- The smoke script mutates data and performs no automatic cleanup.
- Deactivation is irreversible for that AUTHOR; use a disposable database.
- No public author-profile endpoint exists; author pages rely on
  `GET /posts?author=<username>`.
- Post likes expose only a public count plus like/unlike; there is no per-user
  like-status endpoint, so the UI intentionally shows no like toggle.
- Isolated Jest/Vitest suites remain the fast regression gate; this checklist
  complements, and never replaces, them.
