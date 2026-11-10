# Kia Blog frontend

Next.js App Router, strict TypeScript, Tailwind CSS v4, ESLint, npm, Persian
and RTL. The public homepage reads the first 10 Published Posts from the separate
Nest backend; pagination and dedicated loading/empty/error states are later work.
The shared header links to Home and the public `/about` page. On mobile, its
nonmodal disclosure supports Enter/Space, Escape with focus return, and closes
after link selection. The homepage Hero links directly to the published feed;
article cards remain informational until detail routes are implemented.
The header reads public categories on the server; unavailable or empty category
responses are shown only in the disclosure. Category names are informational.
Footer brand icons remain decorative unless their optional `SOCIAL_GITHUB_URL`,
`SOCIAL_LINKEDIN_URL`, or `SOCIAL_TWITTER_URL` HTTPS values are explicitly set.
The header offers a light-mode toggle. Without a saved choice it follows the
system color scheme; an explicit light/dark choice persists in browser storage.
If storage is unavailable, switching still works for the current page session.

Use Node.js 24 LTS (`.nvmrc`). From this directory:

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run typecheck
npm start
```

Development and production preview use http://localhost:3001; Nest uses 3000.
Run the build before standalone type checking on a clean checkout so Next's
generated route types exist. Copy `.env.example` to `.env.local` and set
`API_BASE_URL` to your approved backend origin before running the site. The
homepage fetches public `GET /posts?page=1&limit=10&sort=newest` on the server,
without authentication or persistent caching. Builds do not require a running
backend; a missing/invalid origin or response fails the request rather than
substituting sample articles.

The server-only session foundation (Issue #58) keeps access/refresh JWTs out of
the browser. The browser receives only an opaque `HttpOnly` session ID
(`__Host-kia_session` in production) whose SHA-256 hash keys an encrypted record
in Upstash Redis. Configure `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `SESSION_ENCRYPTION_KEY` and `APP_ORIGIN`; missing
values fail closed. Access-token refresh uses an atomic conditional Redis write,
so a concurrent logout/invalidation cannot resurrect the session or extend its
refresh deadline. Route handlers must enter through
`src/lib/session/server.ts`; authenticated mutations and logout use
`handleAuthenticatedMutation`/`handleLogoutMutation`, which require the trusted
Origin and the per-session CSRF token. Login/register UI and OAuth flows remain
inactive, and Nest does not rotate refresh tokens.

Follow-ups for Issue #59: login and registration mutations must enforce
Origin/CSRF protections; authenticated read paths must clear invalid cookies on
terminal authentication failure; do not reintroduce session-ID rotation without
an approved atomic design; Nest refresh returns only a new `accessToken`.

## Focused verification

```sh
npx playwright install chromium --only-shell
npm run test:home
npm run test:contract
npm test
```

The focused Playwright tests build and start Next on port 3101 and a minimal,
clearly labeled test-only posts HTTP fixture on port 4101. Both ports must be
free. It verifies server-rendered data, metadata fallbacks, escaped titles, basic
keyboard/RTL semantics, Hero and Home/About navigation, mobile disclosure, theme
switching, preference persistence, and unavailable storage,
and 360px/390px/desktop layouts. Screenshots and traces
go to ignored `test-results/`. The contract checks use Node's built-in runner
and native TypeScript stripping (Node 24 as specified above). These checks do
not connect to a real database or prove live Nest deployment interoperability.

## Conventions

### Bookmarks preview (Issue #15)

Published article pages on the test-only host (3102) provide a USER bookmark
toggle. `/dashboard/bookmarks` reuses public article cards and the same toggle
to remove saved articles. The USER sidebar links directly to this list and no
longer includes «فضای خواندن»; the existing dashboard and other role menus stay
available. No production bookmark adapter, authentication or database is added.

Bookmarks are stored per fixture USER id and survive reload. Select
`POST /__test/dashboard?role=USER&user=narges` (default) or `user=mina`, then reload
to inspect isolation. Comment ownership also follows the selected USER.
`bookmarksMode=slow|empty|error|invalid|foreign|slow-error` and the existing
`saveMode` options exercise pending/failure feedback. `hidePost=test-post-2`
temporarily unpublishes that public fixture article for feed/detail/bookmark
visibility checks; `hidePost=` restores visibility without clearing bookmarks.
`reset=1` restores public article statuses and clears every USER's bookmarks.

### My Comments preview (Issue #37)

The USER-only sidebar entry «کامنت‌های من» opens `/dashboard/my-comments` on
the existing test host (3102). Its fixture read validates ownership before
showing text and PENDING/APPROVED status; article associations are omitted.
Edits and confirmed deletions use the same comment records as article reading
and ADMIN moderation. Every edit returns to PENDING and hides the revised text
publicly until ADMIN approval. Failed writes preserve input; uncertain writes
block repeat actions until reload. Nothing is activated in production.

The existing `commentsMode` and `saveMode` controls exercise loading, empty,
error and uncertain states; `commentsMode=foreign` tests rejected ownership.
To prepare both owned statuses, approve the initial USER comment through ADMIN
moderation, then submit another comment as USER on `/posts/test-post-2`.

### Article comments preview (Issue #36)

The test-only host now composes the existing public `/posts/[slug]` page, fixing
article cards that previously opened a missing preview route. The article list
and production detail route remain unchanged. Missing, draft and deprecated
fixture article URLs retain real HTTP 404 responses.

On port 3102, `/posts/test-post-2` shows sample approved comments and allows the
USER fixture identity to submit text. The loopback fixture assigns the article,
USER and PENDING status; these fields cannot be supplied by the form. Pending
comments survive reload but remain hidden from public article comments until
the existing ADMIN `/dashboard/comments` flow approves them. That flow also
removes public visibility when an ADMIN deletes a comment. Other roles and
signed-out visitors can read approved comments but cannot submit in this preview.
The shared resettable fixture owns all comment state; no real accounts,
sessions, production comment adapter or database changes are involved.

Use the existing `/__test/dashboard?role=USER` or `role=ADMIN` controls and refresh.
`commentsMode=slow|empty|error|slow-error|invalid` and `saveMode=slow|error|uncertain` exercise
loading and failure feedback. `reset=1` restores the sample approved/pending pair.

### Authentication screen preview (Issue #35)

The public header links to `/login` and `/register`. Production forms stay
disabled until secure authentication integration is implemented. Only the
existing test host on port 3102 injects email, Google and GitHub simulations.
Email registration sends dummy password/confirmation values to the test-only
fixture for transient validation using the same validator as the form; values
are discarded and never stored. Use no real credentials. No external provider
is contacted, and no tokens, cookies or browser account storage are created.
Registration always selects USER, including social-provider simulations.
Email passwords require at least eight printable ASCII characters, including
an English letter, digit and symbol, with no whitespace and exact confirmation.
USER and AUTHOR dashboard sidebars reuse the header's fixture logout action
and return to the signed-out homepage; failed logout preserves the identity.

The fixture identity is process-wide, shared by preview tabs, and retained on
reload until logout, fixture reset or process restart. Login choices select
USER or AUTHOR test data; they do not enforce permissions. ADMIN remains a
separate fixture control. To select a manual scenario in PowerShell:

```powershell
Invoke-WebRequest -Method Post 'http://127.0.0.1:4101/__test/dashboard?role=SIGNED_OUT'
Invoke-WebRequest -Method Post 'http://127.0.0.1:4101/__test/dashboard?role=USER'
Invoke-WebRequest -Method Post 'http://127.0.0.1:4101/__test/dashboard?role=AUTHOR'
```

Refresh the preview after changing a scenario. Add `&saveMode=slow` or
`&saveMode=error` to exercise pending or failed simulation feedback.

### Dashboard shell preview (Issue #14)

`npm run test:dashboard` builds a separate test-only Next application on port
3102 against the resettable loopback HTTP fixture on 4101. Its pages compose the
real shared dashboard modules for USER, AUTHOR and ADMIN; identity selection is
only available through fixture setup. Every preview page identifies the data as
test doubles. The workspace links demonstrate shell navigation, not future
article/account features or permission enforcement.

The production application has no dashboard or preview routes, role switches,
authentication bypass or fixture fallback. The preview reuses the root theme,
Vazirmatn, Graphite stylesheet and public homepage. Dashboard checks cover role
presentation, responsive keyboard navigation, loading/error/retry and both
themes. `npm test` runs existing public checks and then the dashboard suite.
Real sessions, authorization and private dashboard activation remain later work.

Issue #18 adds `/dashboard/posts` in this same test-only host. Select AUTHOR in
fixture setup; `author=sara` (default) or `author=nima` selects the test author.
The reset endpoint also accepts `postsMode=empty|error|invalid|foreign|slow`;
omitting it resets to success. The list follows Nest's scalar own-Post envelope
and fixed ten-record pages, without create/edit/publish/delete actions. These
scenarios demonstrate presentation and failure handling, not real authorization.

- `src/app/`: routes and layouts. Keep Server Components as the default.
- `src/i18n/config.ts`: current document language/direction.
- `src/i18n/messages/fa.ts`: app copy and metadata. No language switch or
  multilingual routing yet. English support can later add a dictionary and
  locale selection without moving business logic.
- `src/lib/`: official VibeFarsi utilities and the server-only session
  foundation (enter through `src/lib/session/server.ts`).
- `src/app/globals.css`: official Graphite theme and Tailwind token mapping.
- Use logical classes (`ps-*`, `me-*`, `text-start`); scope LTR to email/code.

VibeFarsi 2.0.0 was initialized with the official CLI. The homepage uses the
official Card and Button primitives copied from their registries. The mobile
control uses the 48px Button size; no icon dependency is needed. Before each
feature, query its MCP/registry, inspect the actual
component API and install only the required slugs:

```sh
npx vibefarsi@2.0.0 list
npx vibefarsi@2.0.0 add <verified-slug>
```

The homepage preserves the approved existing Graphite theme.
Vazirmatn uses `next/font/google`, which downloads font assets at build time
and self-hosts them in the output. A network-restricted build may need a
reviewed local-font alternative.

Read `../docs/BACKEND_INTEGRATION_READINESS.md` and
`../docs/FRONTEND_FOUNDATION.md` before implementing features.
