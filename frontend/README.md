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
substituting sample articles. The frontend does not handle tokens.

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
- `src/lib/`: official VibeFarsi utilities; no generic API architecture yet.
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
