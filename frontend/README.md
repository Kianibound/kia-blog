# Kia Blog frontend

Next.js App Router, strict TypeScript, Tailwind CSS v4, ESLint, npm, Persian
and RTL. The public homepage reads the first 10 Published Posts from the separate
Nest backend; pagination and dedicated loading/empty/error states are later work.
The shared header links to Home and the public `/about` page. On mobile, its
nonmodal disclosure supports Enter/Space, Escape with focus return, and closes
after link selection. The homepage Hero links directly to the published feed;
article cards remain informational until detail routes are implemented.
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
